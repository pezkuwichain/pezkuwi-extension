// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDefBase } from '@pezkuwi/extension-inject/types';

// Pezkuwi ecosystem networks
const pezkuwiNetworks: MetadataDefBase[] = [
  {
    chain: 'PezkuwiChain',
    genesisHash: '0xbb4a61ab0c4b8c12f5eab71d0c86c482e03a275ecdafee678dea712474d33d75',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'Asset Hub',
    genesisHash: '0x0000000000000000000000000000000000000000000000000000000000001000',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'People Chain',
    genesisHash: '0x0000000000000000000000000000000000000000000000000000000000001004',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'Zagros Testnet',
    genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    icon: 'pezkuwi',
    ss58Format: 42
  }
];

export default pezkuwiNetworks;
