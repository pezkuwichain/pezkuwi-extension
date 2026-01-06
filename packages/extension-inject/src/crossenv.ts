// Copyright 2019-2025 @pezkuwi/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { exposeGlobal, xglobal } from '@pezkuwi/x-global';

exposeGlobal('chrome', xglobal.browser);
