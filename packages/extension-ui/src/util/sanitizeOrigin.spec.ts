// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type * as _ from '@pezkuwi/dev-test/globals.d.ts';

import { sanitizeOrigin, validateOrigin } from './sanitizeOrigin.js';

// The origin a site claims for itself is attacker-chosen text.
const WITH_MARKUP: string[] = [
  '<scr<script>ipt>alert(1)</script>',
  '<<b>img src=x onerror=alert(1)>',
  'a<b',
  'x>y'
];

// validateOrigin used to look for markup in the sanitized string, after the
// tags it was looking for had been removed: `<b>x</b>` passed as valid.
const FLAGGED: string[] = ['<scr<script>ipt>evil', '<b>x</b>'];

const ACCEPTED: string[] = ['https://app.pezkuwichain.io', 'http://localhost:3000', 'Pezkuwi Apps'];

describe('sanitizeOrigin', () => {
  it('keeps a normal origin as it is', () => {
    expect(sanitizeOrigin('Pezkuwi Apps')).toEqual('Pezkuwi Apps');
  });

  // One pass of tag removal turns `<scr<script>ipt>` into `<script`.
  it('leaves no angle bracket behind', () => {
    for (const origin of WITH_MARKUP) {
      expect(/[<>]/.test(sanitizeOrigin(origin))).toBe(false);
    }
  });

  it('flags an origin that carried markup', () => {
    for (const origin of FLAGGED) {
      expect(validateOrigin(origin)).toBe(false);
    }
  });

  it('accepts ordinary origins', () => {
    for (const origin of ACCEPTED) {
      expect(validateOrigin(origin)).toBe(true);
    }
  });
});
