// Copyright 2019-2026 @pezkuwi/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@pezkuwi/util-crypto/types';

export function canDerive (type?: KeypairType): boolean {
  return !!type && ['ed25519', 'sr25519', 'ecdsa', 'ethereum'].includes(type);
}
