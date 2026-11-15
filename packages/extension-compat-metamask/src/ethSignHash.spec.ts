// Copyright 2019-2026 @pezkuwi/extension-compat-metamask authors & contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="@pezkuwi/dev-test/globals.d.ts" />

import { ethSignHash } from './ethSignHash.js';

// Expected values were produced by web3 4.16 Web3.utils.sha3, which this replaces.
describe('ethSignHash', (): void => {
  it('hashes hex data as bytes', (): void => {
    expect(ethSignHash('0x1234abcd')).toBe('0xfb89609961b35c222ceb5dacad207b44f9e09c11fa5f5f02a7cf958c030b7261');
    expect(ethSignHash('0xABCDEF')).toBe('0x800d501693feda2226878e1ec7869eef8919dbc5bd10c2bcd031b94d73492860');
  });

  it('hashes other data as UTF-8', (): void => {
    expect(ethSignHash('hello')).toBe('0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8');
    expect(ethSignHash('<Bytes>0x1234</Bytes>')).toBe('0xf844540359c03c3ff02fb9afa4fca69333774af89989dd1f18a555e30414d27e');
  });

  it('refuses empty data', (): void => {
    expect(() => ethSignHash('')).toThrow('Cannot sign empty data');
    expect(() => ethSignHash('0x')).toThrow('Cannot sign empty data');
  });
});
