// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Network } from '@pezkuwi/networks/types';

// Pezkuwi networks - Ledger support will be added in future versions
// For now, return empty array as Pezkuwi doesn't have Ledger app yet
const ledgerChains: Network[] = [];

export default ledgerChains;
