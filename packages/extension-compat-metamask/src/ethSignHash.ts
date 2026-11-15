// Copyright 2019-2026 @pezkuwi/extension-compat-metamask authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from '@pezkuwi/util/types';

import { assert } from '@pezkuwi/util';
import { keccakAsHex } from '@pezkuwi/util-crypto';

/**
 * The digest handed to MetaMask's eth_sign: keccak-256 of the data, read as
 * bytes when it is hex and as UTF-8 otherwise (what web3's utils.sha3 did).
 * web3 returned nothing for empty data and the request failed in MetaMask;
 * this refuses it here instead of signing the empty-input hash.
 */
export function ethSignHash (data: string): HexString {
  assert(data !== '' && data !== '0x', 'Cannot sign empty data');

  return keccakAsHex(data);
}
