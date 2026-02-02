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
    genesisHash: '0x00d0e1d0581c3cd5c5768652d52f4520184018b44f56a2ae1e0dc9d65c00c948',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'People Chain',
    genesisHash: '0x58269e9c184f721e0309332d90cafc410df1519a5dc27a5fd9b3bf5fd2d129f8',
    icon: 'pezkuwi',
    ss58Format: 42
  },
  {
    chain: 'Zagros Testnet',
    genesisHash: '0x96eb58af1bb7288115b5e4ff1590422533e749293f231974536dc6672417d06f',
    icon: 'pezkuwi',
    ss58Format: 42
  }
];

export default pezkuwiNetworks;
