// Copyright 2019-2026 @pezkuwi/extension-chains authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef } from '@pezkuwi/extension-inject/types';
import type { Registry } from '@pezkuwi/types/types';

export interface Chain {
  definition: MetadataDef;
  genesisHash?: string;
  hasMetadata: boolean;
  icon: string;
  isEthereum?: boolean;
  isUnknown?: boolean;
  name: string;
  registry: Registry;
  specVersion: number;
  ss58Format: number;
  tokenDecimals: number;
  tokenSymbol: string;
}
