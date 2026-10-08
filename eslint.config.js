// Copyright 2017-2026 @pezkuwi/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import baseConfig from '@pezkuwi/dev/config/eslint';

export default [
  {
    // output of `yarn diff` (scripts/diff.sh)
    ignores: ['ff-diff/**']
  },
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
