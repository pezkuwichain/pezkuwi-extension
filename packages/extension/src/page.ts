// Copyright 2019-2026 @pezkuwi/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestSignatures, TransportRequestMessage } from '@pezkuwi/extension-base/background/types';
import type { Message } from '@pezkuwi/extension-base/types';

import { MESSAGE_ORIGIN_CONTENT } from '@pezkuwi/extension-base/defaults';
import { enable, handleResponse, redirectIfPhishing } from '@pezkuwi/extension-base/page';
import { injectExtension } from '@pezkuwi/extension-inject';

import { packageInfo } from './packageInfo.js';

function inject () {
  injectExtension(enable, {
    name: 'pezkuwi',
    version: packageInfo.version
  });
}

// setup a response listener (events created by the loader for extension responses)
window.addEventListener('message', ({ data, source }: Message): void => {
  // only allow messages from our window, by the loader
  if (source !== window || data.origin !== MESSAGE_ORIGIN_CONTENT) {
    return;
  }

  if (data.id) {
    handleResponse(data as TransportRequestMessage<keyof RequestSignatures>);
  } else {
    console.error('Missing id for response.');
  }
});

inject();
redirectIfPhishing().catch((e) => console.warn(`Unable to determine if the site is in the phishing list: ${(e as Error).message}`));
