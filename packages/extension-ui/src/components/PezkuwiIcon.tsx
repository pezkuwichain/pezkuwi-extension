// Copyright 2019-2025 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

interface Props {
  address: string;
  className?: string;
  size: number;
}

// Pezkuwi branded icon component
// Uses green (#86e62a) background with white 'P' letter
function PezkuwiIcon ({ className = '', size }: Props): React.ReactElement<Props> {
  return (
    <div className={`container ${className}`}>
      <svg
        height={size}
        viewBox="0 0 64 64"
        width={size}
      >
        <circle
          cx="32"
          cy="32"
          fill="#86e62a"
          r="32"
        />
        <text
          dominantBaseline="central"
          fill="#ffffff"
          fontFamily="Arial, sans-serif"
          fontSize="32"
          fontWeight="bold"
          textAnchor="middle"
          x="32"
          y="32"
        >
          P
        </text>
      </svg>
    </div>
  );
}

export default React.memo(PezkuwiIcon);
