// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type * as _ from '@pezkuwi/dev-test/globals.d.ts';

import { sanitizeOrigin, validateOrigin } from './sanitizeOrigin.js';

describe('sanitizeOrigin', () => {
  it('keeps a normal origin as it is', () => {
    expect(sanitizeOrigin('Pezkuwi Apps')).toEqual('Pezkuwi Apps');
  });

  // One pass of tag removal turns `<scr<script>ipt>` into `<script`; the
  // origin a site claims for itself is attacker-chosen text.
  it.each([
    '<scr<script>ipt>alert(1)</script>',
    '<<b>img src=x onerror=alert(1)>',
    'a<b',
    'x>y'
  ])('leaves no angle bracket in %s', (origin) => {
    const out = sanitizeOrigin(origin);

    expect(out).not.toMatch(/[<>]/);
  });

  // validateOrigin used to look for markup in the sanitized string, after the
  // tags it was looking for had been removed: `<b>x</b>` passed as valid.
  it.each(['<scr<script>ipt>evil', '<b>x</b>'])('flags %s, which carried markup', (origin) => {
    expect(validateOrigin(origin)).toBe(false);
  });

  it.each(['https://app.pezkuwichain.io', 'http://localhost:3000', 'Pezkuwi Apps'])('accepts %s', (origin) => {
    expect(validateOrigin(origin)).toBe(true);
  });
});
