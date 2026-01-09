// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDefBase } from '@pezkuwi/extension-inject/types';

// Pezkuwi ecosystem networks
const pezkuwiNetworks: MetadataDefBase[] = [
  {
    chain: 'Pezkuwi',
    genesisHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'Dicle',
    genesisHash: '0x0000000000000000000000000000000000000000000000000000000000000002',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'Zagros',
    genesisHash: '0x0000000000000000000000000000000000000000000000000000000000000003',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'TeyrChain',
    genesisHash: '0x0000000000000000000000000000000000000000000000000000000000000004',
    icon: 'pezkuwi',
    ss58Format: 42
  }
];

export default pezkuwiNetworks;
