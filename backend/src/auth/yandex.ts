import type { VendorConfig } from './config.ts';

const AUTHORIZE_URL = 'https://oauth.yandex.ru/authorize';
const TOKEN_URL = 'https://oauth.yandex.ru/token';
const INFO_URL = 'https://login.yandex.ru/info';

export type YandexTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
};

export type YandexUserInfo = {
  id: string;
  login: string;
  display_name?: string;
  real_name?: string;
  default_email?: string;
  emails?: string[];
  default_avatar_id?: string;
  is_avatar_empty?: boolean;
};

export type VendorUser = {
  vendor: 'yandex';
  vendorUserId: string;
  login: string;
  displayName: string;
};

export function buildAuthorizeUrl(
  config: VendorConfig,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export async function exchangeCode(
  config: VendorConfig,
  redirectUri: string,
  code: string,
): Promise<YandexTokens> {
  return requestToken(config, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
}

export async function refreshAccessToken(
  config: VendorConfig,
  refreshToken: string,
): Promise<YandexTokens> {
  return requestToken(config, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}

async function requestToken(
  config: VendorConfig,
  params: Record<string, string>,
): Promise<YandexTokens> {
  const body = new URLSearchParams({
    ...params,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token || data.expires_in == null) {
    const msg = data.error_description ?? data.error ?? `token HTTP ${res.status}`;
    throw new Error(`Yandex token error: ${msg}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function fetchYandexUser(accessToken: string): Promise<VendorUser> {
  const res = await fetch(`${INFO_URL}?format=json`, {
    headers: { Authorization: `OAuth ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Yandex info HTTP ${res.status}`);
  }

  const info = await res.json() as YandexUserInfo;
  const displayName = info.display_name || info.real_name || info.login;

  return {
    vendor: 'yandex',
    vendorUserId: info.id,
    login: info.login,
    displayName,
  };
}
