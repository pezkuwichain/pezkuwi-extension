// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { styled } from 'styled-components';
import type { IStyledComponent, RuleSet } from 'styled-components';

// Re-export styled with proper types to avoid TS2742 errors in declaration files
export { styled };

// Helper type for styled component exports - ensures TypeScript can emit declarations
// without referencing internal styled-components paths
export type StyledComponentType<Props extends object = object> = IStyledComponent<'web', Props>;

// Type for the css template literal result
export type StyledCSS<Props extends object = object> = RuleSet<Props>;
