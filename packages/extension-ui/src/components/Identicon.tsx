// Copyright 2019-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IconTheme } from '@pezkuwi/react-identicon/types';

import React from 'react';

import { Identicon as Icon } from '@pezkuwi/react-identicon';

import { styled } from '../styled.js';

interface Props {
  className?: string;
  iconTheme?: IconTheme;
  isExternal?: boolean | null;
  onCopy?: () => void;
  prefix?: number;
  value?: string | null;
}

function Identicon ({ className, iconTheme, onCopy, prefix, value }: Props): React.ReactElement<Props> {
  // Map themes: pezkuwi circle identicon, bizinikiwi uses jdenticon
  const theme = iconTheme === 'bizinikiwi' || !iconTheme
    ? 'jdenticon'
    : iconTheme === 'pezkuwi'
      ? 'pezkuwi'
      : iconTheme;

  return (
    <div className={className}>
      <Icon
        className='icon'
        onCopy={onCopy}
        prefix={prefix}
        size={64}
        theme={theme}
        value={value}
      />
    </div>
  );
}

export default styled(Identicon)<Props>`
  background: rgba(192, 192, 292, 0.25);
  border-radius: 50%;
  display: flex;
  justify-content: center;

  .container:before {
    box-shadow: none;
    background: var(--identiconBackground);
  }

  svg {
    circle:first-of-type {
      display: none;
    }
  }
`;
