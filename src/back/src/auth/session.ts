import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { Db } from '../db.ts';
import type { AuthConfig, Vendor, VendorConfig } from './config.ts';
import { getVendorConfig } from './config.ts';
import { upsertUser } from './userLink.ts';
import {
  exchangeCode as exchangeYandex,
  fetchYandexUser,
  refreshAccessToken as refreshYandex,
} from './yandex.ts';
import {
  exchangeCode as exchangeGoogle,
  fetchGoogleUser,
  refreshAccessToken as refreshGoogle,
} from './google.ts';

export const COOKIE_ACCESS = 'access';
export const COOKIE_REFRESH = 'refresh';
export const COOKIE_VENDOR = 'vendor';

/** Лимит браузеров: Max-Age ≤ 400 дней. */
const REFRESH_MAX_AGE_SEC = 400 * 24 * 3600;

function baseCookieOpts(config: AuthConfig) {
  return {
    path: '/',
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'Lax' as const,
  };
}

function setTokenCookies(
  c: Context,
  config: AuthConfig,
  vendor: Vendor,
  tokens: { accessToken: string; refreshToken?: string; expiresIn: number },
) {
  const base = baseCookieOpts(config);
  setCookie(c, COOKIE_ACCESS, tokens.accessToken, {
    ...base,
    maxAge: tokens.expiresIn,
  });
  if (tokens.refreshToken) {
    setCookie(c, COOKIE_REFRESH, tokens.refreshToken, {
      ...base,
      maxAge: REFRESH_MAX_AGE_SEC,
    });
  }
  setCookie(c, COOKIE_VENDOR, vendor, { ...base, maxAge: REFRESH_MAX_AGE_SEC });
}

export function clearAuthCookies(c: Context, config: AuthConfig) {
  const base = baseCookieOpts(config);
  deleteCookie(c, COOKIE_ACCESS, base);
  deleteCookie(c, COOKIE_REFRESH, base);
  deleteCookie(c, COOKIE_VENDOR, base);
}

async function doExchange(
  vendor: Vendor,
  vcfg: VendorConfig,
  redirectUri: string,
  code: string,
) {
  if (vendor === 'yandex') {
    return exchangeYandex(vcfg, redirectUri, code);
  }
  return exchangeGoogle(vcfg, redirectUri, code);
}

async function doRefresh(
  vendor: Vendor,
  vcfg: VendorConfig,
  refreshToken: string,
) {
  if (vendor === 'yandex') {
    return refreshYandex(vcfg, refreshToken);
  }
  return refreshGoogle(vcfg, refreshToken);
}

async function doFetchUser(vendor: Vendor, accessToken: string) {
  if (vendor === 'yandex') {
    return fetchYandexUser(accessToken);
  }
  return fetchGoogleUser(accessToken);
}

/**
 * Достаёт access token: из cookie, либо refresh.
 * Не редиректит. При провале refresh чистит cookies.
 */
async function resolveAccessToken(
  c: Context,
  config: AuthConfig,
): Promise<{ vendor: Vendor; token: string } | null> {
  const vendorCookie = getCookie(c, COOKIE_VENDOR) as Vendor | undefined;
  if (!vendorCookie || (vendorCookie !== 'yandex' && vendorCookie !== 'google')) {
    return null;
  }
  const vcfg = getVendorConfig(config, vendorCookie);
  if (!vcfg) return null;

  const access = getCookie(c, COOKIE_ACCESS);
  if (access) return { vendor: vendorCookie, token: access };

  const refresh = getCookie(c, COOKIE_REFRESH);
  if (!refresh) return null;

  try {
    const tokens = await doRefresh(vendorCookie, vcfg, refresh);
    setTokenCookies(c, config, vendorCookie, tokens);
    return { vendor: vendorCookie, token: tokens.accessToken };
  } catch {
    clearAuthCookies(c, config);
    return null;
  }
}

export async function resolveAuthUser(
  c: Context,
  config: AuthConfig,
  db: Db,
): Promise<AppUserFromSession | null> {
  const resolved = await resolveAccessToken(c, config);
  if (!resolved) return null;

  const { vendor, token } = resolved;
  const vcfg = getVendorConfig(config, vendor);
  if (!vcfg) return null;

  try {
    const vendorUser = await doFetchUser(vendor, token);
    const user = upsertUser(db, vendorUser);
    return user;
  } catch {
    const refresh = getCookie(c, COOKIE_REFRESH);
    if (!refresh) {
      clearAuthCookies(c, config);
      return null;
    }
    try {
      const tokens = await doRefresh(vendor, vcfg, refresh);
      setTokenCookies(c, config, vendor, tokens);
      const vendorUser = await doFetchUser(vendor, tokens.accessToken);
      return upsertUser(db, vendorUser);
    } catch {
      clearAuthCookies(c, config);
      return null;
    }
  }
}

export async function completeAuthWithCode(
  c: Context,
  config: AuthConfig,
  db: Db,
  vendor: Vendor,
  code: string,
) {
  const vcfg = getVendorConfig(config, vendor);
  if (!vcfg) {
    throw new Error(`Vendor ${vendor} is not configured`);
  }
  const tokens = await doExchange(vendor, vcfg, config.redirectUri, code);
  setTokenCookies(c, config, vendor, tokens);
  const vendorUser = await doFetchUser(vendor, tokens.accessToken);
  return upsertUser(db, vendorUser);
}

export type AppUserFromSession = {
  id: number;
  name: string;
  authVendor: Vendor;
};
