// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { convertLocationToUrl } from '@paraspell/xcm-analyser';

// toHuman() renders integers as grouped digit strings ("1,984"); the
// analyser's schema takes numbers, so those are turned back before parsing.
const GROUPED_INTEGER = /^\d{1,3}(,\d{3})*$/;

function fromHuman (value: unknown): unknown {
  if (typeof value === 'string') {
    return GROUPED_INTEGER.test(value)
      ? Number(value.replace(/,/g, ''))
      : value;
  } else if (Array.isArray(value)) {
    return value.map(fromHuman);
  } else if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fromHuman(v)]));
  }

  return value;
}

/** The asset location of a signing payload, from its toHuman() form, as an XCM path. */
export function assetIdUrl (assetId: unknown): string | undefined {
  try {
    return convertLocationToUrl(fromHuman(assetId));
  } catch {
    return undefined;
  }
}
