// Copyright 2019-2025 @pezkuwi/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { extractGlobal, xglobal } from '@pezkuwi/x-global';

export const chrome = extractGlobal('chrome', xglobal.browser);
