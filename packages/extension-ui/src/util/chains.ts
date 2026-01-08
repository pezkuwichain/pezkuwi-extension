// Copyright 2019-2025 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDefBase } from '@pezkuwi/extension-inject/types';

// Pezkuwi networks only - clean and focused
const pezkuwiNetworks: MetadataDefBase[] = [
  {
    chain: 'Pezkuwi Relay Chain',
    genesisHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'Zagros Relay Chain',
    genesisHash: '0x0000000000000000000000000000000000000000000000000000000000000003',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'Pezkuwi Beta Testnet',
    genesisHash: '0x0000000000000000000000000000000000000000000000000000000000000002',
    icon: 'pezkuwi',
    ss58Format: 42
  }
];

export default pezkuwiNetworks;
