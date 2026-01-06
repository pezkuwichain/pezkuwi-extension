// Copyright 2019-2025 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { selectableNetworks } from '@pezkuwi/networks';

export default selectableNetworks.filter((network) => network.hasLedgerSupport);
