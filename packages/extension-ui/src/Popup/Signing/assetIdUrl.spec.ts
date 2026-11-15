// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="@pezkuwi/dev-test/globals.d.ts" />

import { assetIdUrl } from './assetIdUrl.js';

// Inputs are in the shape SignerPayload.toHuman() gives the signing popup.
describe('assetIdUrl', (): void => {
  it('reads grouped digit strings as numbers', (): void => {
    expect(assetIdUrl({ interior: { X2: [{ PalletInstance: '50' }, { GeneralIndex: '1,984' }] }, parents: '0' })).toBe('./PalletInstance(50)/GeneralIndex(1984)');
    expect(assetIdUrl({ interior: { X1: { Parachain: '1,000' } }, parents: '1' })).toBe('../Parachain(1000)');
    expect(assetIdUrl({ interior: { X1: [{ Parachain: '2,034' }] }, parents: '1' })).toBe('../Parachain(2034)');
  });

  it('leaves hex and names alone', (): void => {
    expect(assetIdUrl({ interior: { X2: [{ Parachain: '2,004' }, { AccountKey20: { key: '0x931715fee2d06333043d11f658c8ce934ac61d0c', network: null } }] }, parents: '1' })).toBe('../Parachain(2004)/AccountKey20(null, 0x931715fee2d06333043d11f658c8ce934ac61d0c)');
    expect(assetIdUrl({ interior: { X1: { GlobalConsensus: 'Polkadot' } }, parents: '2' })).toBe('../../GlobalConsensus(Polkadot)');
  });

  it('gives nothing for what is not a location', (): void => {
    expect(assetIdUrl(undefined)).toBeUndefined();
    expect(assetIdUrl(null)).toBeUndefined();
    expect(assetIdUrl('1,984')).toBeUndefined();
    expect(assetIdUrl({})).toBeUndefined();
  });
});
