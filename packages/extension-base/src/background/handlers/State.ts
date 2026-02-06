// Copyright 2019-2026 @pezkuwi/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */

import type { MetadataDef, ProviderMeta } from '@pezkuwi/extension-inject/types';
import type { JsonRpcResponse, ProviderInterface, ProviderInterfaceCallback } from '@pezkuwi/rpc-provider/types';
import type { AccountJson, AuthorizeRequest, AuthUrlInfo, AuthUrls, MetadataRequest, RequestAuthorizeTab, RequestRpcSend, RequestRpcSubscribe, RequestRpcUnsubscribe, RequestSign, ResponseRpcListProviders, ResponseSigning, SigningRequest } from '../types.js';

import { BehaviorSubject } from 'rxjs';

import { addMetadata, knownMetadata } from '@pezkuwi/extension-chains';
import { knownGenesis } from '@pezkuwi/networks/defaults';
import { settings } from '@pezkuwi/ui-settings';
import { assert } from '@pezkuwi/util';

import { MetadataStore } from '../../stores/index.js';
import { getId } from '../../utils/getId.js';
import { withErrorLog } from './helpers.js';

interface Resolver<T> {
  reject: (error: Error) => void;
  resolve: (result: T) => void;
}

interface AuthRequest extends Resolver<AuthResponse> {
  id: string;
  idStr: string;
  request: RequestAuthorizeTab;
  url: string;
}

export type AuthorizedAccountsDiff = [url: string, authorizedAccounts: AuthUrlInfo['authorizedAccounts']][]

interface MetaRequest extends Resolver<boolean> {
  id: string;
  request: MetadataDef;
  url: string;
}

export interface AuthResponse {
  result: boolean;
  authorizedAccounts: string[];
}

// List of providers passed into constructor. This is the list of providers
// exposed by the extension.
type Providers = Record<string, {
  meta: ProviderMeta;
  // The provider is not running at init, calling this will instantiate the
  // provider.
  start: () => ProviderInterface;
}>

interface SignRequest extends Resolver<ResponseSigning> {
  account: AccountJson;
  id: string;
  request: RequestSign;
  url: string;
}

const NOTIFICATION_URL = chrome.runtime.getURL('notification.html');

const POPUP_WINDOW_OPTS: chrome.windows.CreateData = {
  focused: true,
  height: 621,
  left: 150,
  top: 150,
  type: 'popup',
  url: NOTIFICATION_URL,
  width: 560
};

const NORMAL_WINDOW_OPTS: chrome.windows.CreateData = {
  focused: true,
  type: 'normal',
  url: NOTIFICATION_URL
};

export enum NotificationOptions {
  None,
  Normal,
  PopUp,
}

const AUTH_URLS_KEY = 'authUrls';
const DEFAULT_AUTH_ACCOUNTS = 'defaultAuthAccounts';
const SECURITY_LOG_KEY = 'securityLog';
const MAX_SECURITY_LOG_ENTRIES = 100;

interface SecurityLogEntry {
  timestamp: number;
  event: 'auth_granted' | 'auth_denied' | 'auth_cancelled' | 'sign_approved' | 'sign_rejected' | 'rate_limit_hit';
  origin: string;
  details?: string;
}

async function extractMetadata (store: MetadataStore): Promise<void> {
  await store.allMap(async (map): Promise<void> => {
    const knownEntries = Object.entries(knownGenesis);
    const defs: Record<string, { def: MetadataDef, index: number, key: string }> = {};
    const removals: string[] = [];

    Object
      .entries(map)
      .forEach(([key, def]): void => {
        const entry = knownEntries.find(([, hashes]) => hashes.includes(def.genesisHash));

        if (entry) {
          const [name, hashes] = entry;
          const index = hashes.indexOf(def.genesisHash);

          // flatten the known metadata based on the genesis index
          // (lower is better/newer)
          if (!defs[name] || (defs[name].index > index)) {
            if (defs[name]) {
              // remove the old version of the metadata
              removals.push(defs[name].key);
            }

            defs[name] = { def, index, key };
          }
        } else {
          // this is not a known entry, so we will just apply it
          defs[key] = { def, index: 0, key };
        }
      });

    for (const key of removals) {
      await store.remove(key);
    }

    Object.values(defs).forEach(({ def }) => addMetadata(def));
  });
}

export default class State {
  #authUrls = new Map<string, AuthUrlInfo>();

  #lastRequestTimestamps = new Map<string, number>();
  #lastAuthTimestamps = new Map<string, number>(); // Rate limit for authorization requests
  #maxEntries = 10;
  #rateLimitInterval = 3000; // 3 seconds for signing
  #authRateLimitInterval = 5000; // 5 seconds for authorization (prevent spam)

  // Track pending authorization URLs to prevent race conditions
  readonly #pendingAuthUrls = new Set<string>();

  readonly #authRequests: Record<string, AuthRequest> = {};

  readonly #metaStore = new MetadataStore();

  // Map of providers currently injected in tabs
  readonly #injectedProviders = new Map<chrome.runtime.Port, ProviderInterface>();

  readonly #metaRequests: Record<string, MetaRequest> = {};

  #notification = settings.notification;

  // Map of all providers exposed by the extension, they are retrievable by key
  readonly #providers: Providers;

  readonly #signRequests: Record<string, SignRequest> = {};

  #windows: number[] = [];

  #connectedTabsUrl: string[] = [];

  public readonly authSubject: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  public readonly metaSubject: BehaviorSubject<MetadataRequest[]> = new BehaviorSubject<MetadataRequest[]>([]);

  public readonly signSubject: BehaviorSubject<SigningRequest[]> = new BehaviorSubject<SigningRequest[]>([]);

  public readonly authUrlSubjects: Record<string, BehaviorSubject<AuthUrlInfo>> = {};

  public defaultAuthAccountSelection: string[] = [];

  constructor (providers: Providers = {}, rateLimitInterval = 3000) {
    assert(rateLimitInterval >= 0, 'Expects non-negative number for rateLimitInterval');
    this.#providers = providers;
    this.#rateLimitInterval = rateLimitInterval;
  }

  public async init () {
    await extractMetadata(this.#metaStore);
    // retrieve previously set authorizations
    const storageAuthUrls: Record<string, string> = await chrome.storage.local.get(AUTH_URLS_KEY);
    const authString = storageAuthUrls?.[AUTH_URLS_KEY] || '{}';
    const previousAuth = JSON.parse(authString) as AuthUrls;

    this.#authUrls = new Map(Object.entries(previousAuth));

    // Initialize authUrlSubjects for each URL
    this.#authUrls.forEach((authInfo, url) => {
      this.authUrlSubjects[url] = new BehaviorSubject<AuthUrlInfo>(authInfo);
    });

    // retrieve previously set default auth accounts
    const storageDefaultAuthAccounts: Record<string, string> = await chrome.storage.local.get(DEFAULT_AUTH_ACCOUNTS);
    const defaultAuthString: string = storageDefaultAuthAccounts?.[DEFAULT_AUTH_ACCOUNTS] || '[]';
    const previousDefaultAuth = JSON.parse(defaultAuthString) as string[];

    this.defaultAuthAccountSelection = previousDefaultAuth;
  }

  // Security event logging for audit trail
  private async logSecurityEvent (event: SecurityLogEntry['event'], origin: string, details?: string): Promise<void> {
    try {
      const storageData = await chrome.storage.local.get(SECURITY_LOG_KEY);
      const logs: SecurityLogEntry[] = JSON.parse(storageData[SECURITY_LOG_KEY] || '[]');

      logs.push({
        timestamp: Date.now(),
        event,
        origin,
        details
      });

      // Keep only the last MAX_SECURITY_LOG_ENTRIES entries
      const trimmedLogs = logs.slice(-MAX_SECURITY_LOG_ENTRIES);

      await chrome.storage.local.set({ [SECURITY_LOG_KEY]: JSON.stringify(trimmedLogs) });
    } catch (e) {
      // Don't let logging failures affect normal operation
      console.error('Failed to log security event:', e);
    }
  }

  // Public method to retrieve security logs (for UI display)
  public async getSecurityLogs (): Promise<SecurityLogEntry[]> {
    try {
      const storageData = await chrome.storage.local.get(SECURITY_LOG_KEY);

      return JSON.parse(storageData[SECURITY_LOG_KEY] || '[]');
    } catch {
      return [];
    }
  }

  public get knownMetadata (): MetadataDef[] {
    return knownMetadata();
  }

  public get numAuthRequests (): number {
    return Object.keys(this.#authRequests).length;
  }

  public get numMetaRequests (): number {
    return Object.keys(this.#metaRequests).length;
  }

  public get numSignRequests (): number {
    return Object.keys(this.#signRequests).length;
  }

  public get allAuthRequests (): AuthorizeRequest[] {
    return Object
      .values(this.#authRequests)
      .map(({ id, request, url }): AuthorizeRequest => ({ id, request, url }));
  }

  public get allMetaRequests (): MetadataRequest[] {
    return Object
      .values(this.#metaRequests)
      .map(({ id, request, url }): MetadataRequest => ({ id, request, url }));
  }

  public get allSignRequests (): SigningRequest[] {
    return Object
      .values(this.#signRequests)
      .map(({ account, id, request, url }): SigningRequest => ({ account, id, request, url }));
  }

  public get authUrls (): AuthUrls {
    return Object.fromEntries(this.#authUrls);
  }

  private popupClose (): void {
    this.#windows.forEach((id: number) =>
      withErrorLog(() => chrome.windows.remove(id))
    );
    this.#windows = [];
  }

  private popupOpen (): void {
    this.#notification !== 'extension' &&
      chrome.windows.create(
        this.#notification === 'window'
          ? NORMAL_WINDOW_OPTS
          : POPUP_WINDOW_OPTS,
        (window): void => {
          if (window) {
            this.#windows.push(window.id || 0);
          }
        });
  }

  private authComplete = (id: string, resolve: (resValue: AuthResponse) => void, reject: (error: Error) => void, pendingIdStr?: string): Resolver<AuthResponse> => {
    const complete = async (authorizedAccounts: string[] = []) => {
      const { idStr, request: { origin }, url } = this.#authRequests[id];

      const strippedUrl = this.stripUrl(url);

      const authInfo: AuthUrlInfo = {
        authorizedAccounts,
        count: 0,
        id: idStr,
        origin,
        url
      };

      this.#authUrls.set(strippedUrl, authInfo);

      if (!this.authUrlSubjects[strippedUrl]) {
        this.authUrlSubjects[strippedUrl] = new BehaviorSubject<AuthUrlInfo>(authInfo);
      } else {
        this.authUrlSubjects[strippedUrl].next(authInfo);
      }

      await this.saveCurrentAuthList();
      await this.updateDefaultAuthAccounts(authorizedAccounts);
      delete this.#authRequests[id];

      // Remove from pending set to allow future requests
      if (pendingIdStr) {
        this.#pendingAuthUrls.delete(pendingIdStr);
      }

      this.updateIconAuth(true);
    };

    return {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      reject: async (error: Error): Promise<void> => {
        const { url } = this.#authRequests[id] || {};

        // Always remove from pending set on rejection
        if (pendingIdStr) {
          this.#pendingAuthUrls.delete(pendingIdStr);
        }

        if (error.message === 'Cancelled') {
          delete this.#authRequests[id];
          this.updateIconAuth(true);
          await this.logSecurityEvent('auth_cancelled', url || 'unknown');
          reject(new Error('Connection request was cancelled by the user.'));
        } else {
          await complete();
          await this.logSecurityEvent('auth_denied', url || 'unknown');
          reject(new Error('Connection request was rejected by the user.'));
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      resolve: async ({ authorizedAccounts, result }: AuthResponse): Promise<void> => {
        const { url } = this.#authRequests[id] || {};

        await complete(authorizedAccounts);
        await this.logSecurityEvent('auth_granted', url || 'unknown', `Accounts: ${authorizedAccounts.length}`);
        resolve({ authorizedAccounts, result });
      }
    };
  };

  /**
 * @deprecated This method is deprecated in favor of {@link updateCurrentTabs} and will be removed in a future release.
 */
  public udateCurrentTabsUrl (urls: string[]) {
    this.updateCurrentTabsUrl(urls);
  }

  public updateCurrentTabsUrl (urls: string[]) {
    const connectedTabs = urls.map((url) => {
      let strippedUrl = '';

      // the assert in stripUrl may throw for new tabs with "chrome://newtab/"
      try {
        strippedUrl = this.stripUrl(url);
      } catch (e) {
        console.error(e);
      }

      // return the stripped url only if this website is known
      return !!strippedUrl && this.authUrls[strippedUrl]
        ? strippedUrl
        : undefined;
    })
      .filter((value) => !!value) as string[];

    this.#connectedTabsUrl = connectedTabs;
  }

  public getConnectedTabsUrl () {
    return this.#connectedTabsUrl;
  }

  public deleteAuthRequest (requestId: string) {
    // Remove from pending set before deleting
    const request = this.#authRequests[requestId];

    if (request?.idStr) {
      this.#pendingAuthUrls.delete(request.idStr);
    }

    delete this.#authRequests[requestId];
    this.updateIconAuth(true);
  }

  private async saveCurrentAuthList () {
    await chrome.storage.local.set({ [AUTH_URLS_KEY]: JSON.stringify(Object.fromEntries(this.#authUrls)) });
  }

  private async saveDefaultAuthAccounts () {
    await chrome.storage.local.set({ [DEFAULT_AUTH_ACCOUNTS]: JSON.stringify(this.defaultAuthAccountSelection) });
  }

  public async updateDefaultAuthAccounts (newList: string[]) {
    this.defaultAuthAccountSelection = newList;
    await this.saveDefaultAuthAccounts();
  }

  private metaComplete = (id: string, resolve: (result: boolean) => void, reject: (error: Error) => void): Resolver<boolean> => {
    const complete = (): void => {
      delete this.#metaRequests[id];
      this.updateIconMeta(true);
    };

    return {
      reject: (error: Error): void => {
        complete();
        reject(error);
      },
      resolve: (result: boolean): void => {
        complete();
        resolve(result);
      }
    };
  };

  private signComplete = (id: string, resolve: (result: ResponseSigning) => void, reject: (error: Error) => void): Resolver<ResponseSigning> => {
    const { url } = this.#signRequests[id] || {};

    const complete = (): void => {
      delete this.#signRequests[id];
      this.updateIconSign(true);
    };

    return {
      reject: (error: Error): void => {
        complete();
        // Fire-and-forget logging (don't block user)
        void this.logSecurityEvent('sign_rejected', url || 'unknown', error.message);
        reject(error);
      },
      resolve: (result: ResponseSigning): void => {
        complete();
        // Fire-and-forget logging (don't block user)
        void this.logSecurityEvent('sign_approved', url || 'unknown');
        resolve(result);
      }
    };
  };

  // Validate IPFS/IPNS CID format
  private isValidCid (cid: string): boolean {
    // CIDv0: starts with Qm, 46 chars total (base58btc)
    const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    // CIDv1: starts with b (base32) or z (base58btc), variable length but typically 50+ chars
    const cidV1Base32Regex = /^b[a-z2-7]{50,}$/i;
    const cidV1Base58Regex = /^z[1-9A-HJ-NP-Za-km-z]{48,}$/;
    // IPNS keys: typically start with k (libp2p-key) or 12D3 (peer ID)
    const ipnsKeyRegex = /^(k[1-9A-HJ-NP-Za-km-z]{50,}|12D3[1-9A-HJ-NP-Za-km-z]{40,})$/;

    return cidV0Regex.test(cid) ||
           cidV1Base32Regex.test(cid) ||
           cidV1Base58Regex.test(cid) ||
           ipnsKeyRegex.test(cid);
  }

  public stripUrl (url: string): string {
    try {
      const parsedUrl = new URL(url);

      if (!['http:', 'https:', 'ipfs:', 'ipns:'].includes(parsedUrl.protocol)) {
        throw new Error(`Invalid protocol ${parsedUrl.protocol}`);
      }

      // For ipfs/ipns which don't have a standard origin, we handle it differently.
      if (parsedUrl.protocol === 'ipfs:' || parsedUrl.protocol === 'ipns:') {
        const cid = parsedUrl.hostname;

        // Validate CID/IPNS key format to prevent spoofing
        if (!this.isValidCid(cid)) {
          throw new Error(`Invalid ${parsedUrl.protocol.slice(0, -1).toUpperCase()} identifier format`);
        }

        // ipfs://<hash> | ipns://<hash>
        return `${parsedUrl.protocol}//${cid}`;
      }

      return parsedUrl.origin;
    } catch (e) {
      console.error(e);
      throw new Error('Invalid URL');
    }
  }

  private updateIcon (shouldClose?: boolean): void {
    const authCount = this.numAuthRequests;
    const metaCount = this.numMetaRequests;
    const signCount = this.numSignRequests;
    const text = (
      authCount
        ? 'Auth'
        : metaCount
          ? 'Meta'
          : (signCount ? `${signCount}` : '')
    );

    withErrorLog(() => chrome.action.setBadgeText({ text }));

    if (shouldClose && text === '') {
      this.popupClose();
    }
  }

  public async removeAuthorization (url: string): Promise<AuthUrls> {
    const entry = this.#authUrls.get(url);

    assert(entry, `The source ${url} is not known`);

    this.#authUrls.delete(url);
    await this.saveCurrentAuthList();

    if (this.authUrlSubjects[url]) {
      entry.authorizedAccounts = [];
      this.authUrlSubjects[url].next(entry);
    }

    return this.authUrls;
  }

  private updateIconAuth (shouldClose?: boolean): void {
    this.authSubject.next(this.allAuthRequests);
    this.updateIcon(shouldClose);
  }

  private updateIconMeta (shouldClose?: boolean): void {
    this.metaSubject.next(this.allMetaRequests);
    this.updateIcon(shouldClose);
  }

  private updateIconSign (shouldClose?: boolean): void {
    this.signSubject.next(this.allSignRequests);
    this.updateIcon(shouldClose);
  }

  public async updateAuthorizedAccounts (authorizedAccountsDiff: AuthorizedAccountsDiff): Promise<void> {
    authorizedAccountsDiff.forEach(([url, authorizedAccountDiff]) => {
      const authInfo = this.#authUrls.get(url);

      if (authInfo) {
        authInfo.authorizedAccounts = authorizedAccountDiff;
        this.#authUrls.set(url, authInfo);
        this.authUrlSubjects[url].next(authInfo);
      }
    });

    await this.saveCurrentAuthList();
  }

  public async authorizeUrl (url: string, request: RequestAuthorizeTab): Promise<AuthResponse> {
    const idStr = this.stripUrl(url);

    // Rate limiting to prevent authorization request spam
    this.handleAuthRateLimit(idStr);

    // Synchronous check to prevent race conditions - check pending Set first
    assert(!this.#pendingAuthUrls.has(idStr), `The source ${url} has a pending authorization request`);

    // Do not enqueue duplicate authorization requests (secondary check for existing requests).
    const isDuplicate = Object
      .values(this.#authRequests)
      .some((request) => request.idStr === idStr);

    assert(!isDuplicate, `The source ${url} has a pending authorization request`);

    if (this.#authUrls.has(idStr)) {
      // this url was seen in the past
      const authInfo = this.#authUrls.get(idStr);

      assert(authInfo?.authorizedAccounts || authInfo?.isAllowed, `The source ${url} is not allowed to interact with this extension`);

      return {
        authorizedAccounts: [],
        result: false
      };
    }

    // Add to pending set immediately (synchronous) to prevent race conditions
    this.#pendingAuthUrls.add(idStr);

    return new Promise((resolve, reject): void => {
      const id = getId();

      this.#authRequests[id] = {
        ...this.authComplete(id, resolve, reject, idStr),
        id,
        idStr,
        request,
        url
      };

      this.updateIconAuth();
      this.popupOpen();
    });
  }

  public ensureUrlAuthorized (url: string): boolean {
    const entry = this.#authUrls.get(this.stripUrl(url));

    assert(entry, `The source ${url} has not been enabled yet`);

    return true;
  }

  public injectMetadata (url: string, request: MetadataDef): Promise<boolean> {
    return new Promise((resolve, reject): void => {
      const id = getId();

      this.#metaRequests[id] = {
        ...this.metaComplete(id, resolve, reject),
        id,
        request,
        url
      };

      this.updateIconMeta();
      this.popupOpen();
    });
  }

  public getAuthRequest (id: string): AuthRequest {
    return this.#authRequests[id];
  }

  public getMetaRequest (id: string): MetaRequest {
    return this.#metaRequests[id];
  }

  public getSignRequest (id: string): SignRequest {
    return this.#signRequests[id];
  }

  // List all providers the extension is exposing
  public rpcListProviders (): Promise<ResponseRpcListProviders> {
    return Promise.resolve(Object.keys(this.#providers).reduce((acc, key) => {
      acc[key] = this.#providers[key].meta;

      return acc;
    }, {} as ResponseRpcListProviders));
  }

  public rpcSend (request: RequestRpcSend, port: chrome.runtime.Port): Promise<JsonRpcResponse<unknown>> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribe) before provider is set');

    return provider.send(request.method, request.params);
  }

  // Start a provider, return its meta
  public rpcStartProvider (key: string, port: chrome.runtime.Port): Promise<ProviderMeta> {
    assert(Object.keys(this.#providers).includes(key), `Provider ${key} is not exposed by extension`);

    if (this.#injectedProviders.get(port)) {
      return Promise.resolve(this.#providers[key].meta);
    }

    // Instantiate the provider
    this.#injectedProviders.set(port, this.#providers[key].start());

    // Close provider connection when page is closed
    port.onDisconnect.addListener((): void => {
      const provider = this.#injectedProviders.get(port);

      if (provider) {
        withErrorLog(() => provider.disconnect());
      }

      this.#injectedProviders.delete(port);
    });

    return Promise.resolve(this.#providers[key].meta);
  }

  public rpcSubscribe ({ method, params, type }: RequestRpcSubscribe, cb: ProviderInterfaceCallback, port: chrome.runtime.Port): Promise<number | string> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribe) before provider is set');

    return provider.subscribe(type, method, params, cb);
  }

  public rpcSubscribeConnected (_request: null, cb: ProviderInterfaceCallback, port: chrome.runtime.Port): void {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribeConnected) before provider is set');

    cb(null, provider.isConnected); // Immediately send back current isConnected
    provider.on('connected', () => cb(null, true));
    provider.on('disconnected', () => cb(null, false));
  }

  public rpcUnsubscribe (request: RequestRpcUnsubscribe, port: chrome.runtime.Port): Promise<boolean> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.unsubscribe) before provider is set');

    return provider.unsubscribe(request.type, request.method, request.subscriptionId);
  }

  public async saveMetadata (meta: MetadataDef): Promise<void> {
    await this.#metaStore.set(meta.genesisHash, meta);

    addMetadata(meta);
  }

  public setNotification (notification: string): boolean {
    this.#notification = notification;

    return true;
  }

  private handleSignRequest (origin: string) {
    const now = Date.now();
    const lastTime = this.#lastRequestTimestamps.get(origin) || 0;

    if (now - lastTime < this.#rateLimitInterval) {
      // Log rate limit hit (fire-and-forget)
      void this.logSecurityEvent('rate_limit_hit', origin, 'Signing request rate limited');
      throw new Error('Rate limit exceeded. Try again later.');
    }

    // If we're about to exceed max entries, evict the oldest
    if (!this.#lastRequestTimestamps.has(origin) && this.#lastRequestTimestamps.size >= this.#maxEntries) {
      const oldestKey = this.#lastRequestTimestamps.keys().next().value;

      oldestKey && this.#lastRequestTimestamps.delete(oldestKey);
    }

    this.#lastRequestTimestamps.set(origin, now);
  }

  // Rate limiting for authorization requests to prevent spam
  private handleAuthRateLimit (origin: string) {
    const now = Date.now();
    const lastTime = this.#lastAuthTimestamps.get(origin) || 0;

    if (now - lastTime < this.#authRateLimitInterval) {
      // Log rate limit hit (fire-and-forget)
      void this.logSecurityEvent('rate_limit_hit', origin, 'Authorization request rate limited');
      throw new Error('Too many authorization requests. Please wait a few seconds.');
    }

    // If we're about to exceed max entries, evict the oldest
    if (!this.#lastAuthTimestamps.has(origin) && this.#lastAuthTimestamps.size >= this.#maxEntries) {
      const oldestKey = this.#lastAuthTimestamps.keys().next().value;

      oldestKey && this.#lastAuthTimestamps.delete(oldestKey);
    }

    this.#lastAuthTimestamps.set(origin, now);
  }

  public sign (url: string, request: RequestSign, account: AccountJson): Promise<ResponseSigning> {
    const id = getId();

    try {
      this.handleSignRequest(url);
    } catch (error) {
      return Promise.reject(error);
    }

    return new Promise((resolve, reject): void => {
      this.#signRequests[id] = {
        ...this.signComplete(id, resolve, reject),
        account,
        id,
        request,
        url
      };

      this.updateIconSign();
      this.popupOpen();
    });
  }
}
