// Copyright 2019-2026 @pezkuwi/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringJson, KeyringStore } from '@pezkuwi/ui-keyring/types';

import { EXTENSION_PREFIX } from '../defaults.js';
import BaseStore from './Base.js';

export default class AccountsStore extends BaseStore<KeyringJson> implements KeyringStore {
  constructor () {
    super(
      EXTENSION_PREFIX && EXTENSION_PREFIX !== 'polkadot{.js}'
        ? `${EXTENSION_PREFIX}accounts`
        : null
    );
  }

  // KeyringStore.set returns void and the keyring does not wait on it;
  // BaseStore.set handles its own failure, so this promise never rejects.
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  public override async set (key: string, value: KeyringJson, update?: () => void): Promise<void> {
    // shortcut, don't save testing accounts in extension storage
    if (key.startsWith('account:') && value.meta?.isTesting) {
      update?.();

      return;
    }

    await super.set(key, value, update);
  }
}
