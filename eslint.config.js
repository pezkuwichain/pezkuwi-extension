// Copyright 2017-2026 @pezkuwi/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import baseConfig from '@pezkuwi/dev/config/eslint';

export default [
  ...baseConfig,
  {
    rules: {
      'import/extensions': 'off'
    }
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'deprecation/deprecation': 'off'
    }
  }
];
