// Copyright 2019-2025 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type React from 'react';

interface Option {
  info?: string;
  isDisabled?: boolean;
  isHeader?: boolean;
  text: React.ReactNode;
  value: string | number;
}

export default function getLanguageOptions (): Option[] {
  return [
    // default/native
    {
      text: 'English',
      value: 'en'
    },
    {
      text: 'Kurmancî',
      value: 'ku'
    },
    {
      text: 'سۆرانی',
      value: 'ckb'
    },
    {
      text: 'Türkçe',
      value: 'tr'
    },
    {
      text: 'العربية',
      value: 'ar'
    },
    {
      text: 'فارسی',
      value: 'fa'
    },
    {
      text: '汉语',
      value: 'zh'
    },
    {
      text: 'Français',
      value: 'fr'
    },
    {
      text: 'Polski',
      value: 'pl'
    },
    {
      text: 'ภาษาไทย',
      value: 'th'
    },
    {
      text: 'اردو',
      value: 'ur'
    }
  ];
}
