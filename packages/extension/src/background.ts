// Copyright 2019-2026 @pezkuwi/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension background, handling all keyring access

/* global chrome */

import '@pezkuwi/extension-inject/crossenv';

import type { RequestSignatures, TransportRequestMessage } from '@pezkuwi/extension-base/background/types';

import { handlers, withErrorLog } from '@pezkuwi/extension-base/background';
import { PORT_CONTENT, PORT_EXTENSION } from '@pezkuwi/extension-base/defaults';
import { AccountsStore } from '@pezkuwi/extension-base/stores';
import { keyring } from '@pezkuwi/ui-keyring';
import { assert } from '@pezkuwi/util';
import { cryptoWaitReady } from '@pezkuwi/util-crypto';

// setup the notification (same a FF default background, white text)
withErrorLog(() => chrome.action.setBadgeBackgroundColor({ color: '#d90000' }));

// Initialization promise - handlers must wait for this
let initPromise: Promise<void> | null = null;

function initializeExtension (): Promise<void> {
  if (!initPromise) {
    initPromise = cryptoWaitReady()
      .then((): void => {
        console.log('crypto initialized');
        keyring.loadAll({ store: new AccountsStore(), type: 'sr25519' });
        console.log('initialization completed');
      });
  }

  return initPromise;
}

// Start initialization immediately
initializeExtension().catch((error): void => {
  console.error('initialization failed', error);
});

// listen to all messages and handle appropriately
chrome.runtime.onConnect.addListener((port): void => {
  // shouldn't happen, however... only listen to what we know about
  assert([PORT_CONTENT, PORT_EXTENSION].includes(port.name), `Unknown connection from ${port.name}`);

  // message and disconnect handlers - wait for init before handling
  port.onMessage.addListener((data: TransportRequestMessage<keyof RequestSignatures>) => {
    initializeExtension()
      .then(() => handlers(data, port))
      .catch((error) => console.error('Handler error:', error));
  });
  port.onDisconnect.addListener(() => console.log(`Disconnected from ${port.name}`));
});

function isValidUrl (url: string) {
  try {
    const urlObj = new URL(url);

    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (_e) {
    return false;
  }
}

function getActiveTabs () {
  // queriing the current active tab in the current window should only ever return 1 tab
  // although an array is specified here
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // get the urls of the active tabs. Only http or https urls are supported. Other urls will be filtered out.
    // e.g. browser tabs like chrome://newtab/, chrome://extensions/, about:addons etc will be filtered out
    // we filter these out
    const urls: string[] = tabs
      .map(({ url }) => url)
      .filter((url) => !!url && isValidUrl(url)) as string[];

    const request: TransportRequestMessage<'pri(activeTabsUrl.update)'> = {
      id: 'background',
      message: 'pri(activeTabsUrl.update)',
      origin: 'background',
      request: { urls }
    };

    // Wait for initialization before handling
    initializeExtension()
      .then(() => handlers(request))
      .catch((error) => console.error('Handler error:', error));
  });
}

chrome.runtime.onMessage.addListener((message: { type: string }, _, sendResponse) => {
  if (message.type === 'wakeup') {
    sendResponse({ status: 'awake' });
  }
});

// listen to tab updates this is fired on url change
chrome.tabs.onUpdated.addListener((_, changeInfo) => {
  // we are only interested in url change
  if (!changeInfo.url) {
    return;
  }

  getActiveTabs();
});

// the list of active tab changes when switching window
// in a mutli window setup
chrome.windows.onFocusChanged.addListener(() =>
  getActiveTabs()
);

// when clicking on an existing tab or opening a new tab this will be fired
// before the url is entered by users
chrome.tabs.onActivated.addListener(() => {
  getActiveTabs();
});

// when deleting a tab this will be fired
chrome.tabs.onRemoved.addListener(() => {
  getActiveTabs();
});

// Note: initialization is handled by initializeExtension() above
