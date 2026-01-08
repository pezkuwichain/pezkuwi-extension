// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair$Json } from '@pezkuwi/keyring/types';
import type { KeyringPairs$Json } from '@pezkuwi/ui-keyring/types';

export function isKeyringPairs$Json (json: KeyringPair$Json | KeyringPairs$Json): json is KeyringPairs$Json {
  return (json.encoding.content).includes('batch-pkcs8');
}
