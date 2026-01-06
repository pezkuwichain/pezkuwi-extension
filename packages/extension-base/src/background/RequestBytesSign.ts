// Copyright 2019-2025 @pezkuwi/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from '@pezkuwi/keyring/types';
import type { TypeRegistry } from '@pezkuwi/types';
import type { SignerPayloadRaw } from '@pezkuwi/types/types';
import type { HexString } from '@pezkuwi/util/types';
import type { RequestSign } from './types.js';

import { u8aToHex, u8aWrapBytes } from '@pezkuwi/util';

export default class RequestBytesSign implements RequestSign {
  public readonly payload: SignerPayloadRaw;

  constructor (payload: SignerPayloadRaw) {
    this.payload = payload;
  }

  sign (_registry: TypeRegistry, pair: KeyringPair): { signature: HexString } {
    return {
      signature: u8aToHex(
        pair.sign(
          u8aWrapBytes(this.payload.data)
        )
      )
    };
  }
}
