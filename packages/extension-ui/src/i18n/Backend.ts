// Copyright 2017-2026 @pezkuwi/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import languageCache from './cache.js';

type Callback = (error: string | null, data: unknown) => void;

type LoadResult = [string | null, Record<string, string> | boolean];

const loaders: Record<string, Promise<LoadResult>> = {};

export default class Backend {
  type = 'backend' as const;

  static type = 'backend' as const;

  // Map 'default' language to 'en' since there's no 'default' locale folder
  private normalizeLanguage (lng: string): string {
    return lng === 'default' ? 'en' : lng;
  }

  async read (lng: string, _namespace: string, responder: Callback): Promise<void> {
    const normalizedLng = this.normalizeLanguage(lng);

    if (languageCache[normalizedLng]) {
      return responder(null, languageCache[normalizedLng]);
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (!loaders[normalizedLng]) {
      loaders[normalizedLng] = this.createLoader(normalizedLng);
    }

    const [error, data] = await loaders[normalizedLng];

    return responder(error, data);
  }

  async createLoader (lng: string): Promise<LoadResult> {
    try {
      const response = await fetch(`locales/${lng}/translation.json`, {});

      if (!response.ok) {
        return [`i18n: failed loading ${lng}`, response.status >= 500 && response.status < 600];
      } else {
        languageCache[lng] = await response.json() as Record<string, string>;

        return [null, languageCache[lng]];
      }
    } catch (error) {
      return [(error as Error).message, false];
    }
  }
}
