import type { VendorConfig } from './config.ts';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Scope: openid email profile — достаточно для id + name.
const SCOPE = 'openid email profile';

export type GoogleTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
};

export type GoogleUserInfo = {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export type VendorUser = {
  vendor: 'google';
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
    scope: SCOPE,
    state,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export async function exchangeCode(
  config: VendorConfig,
  redirectUri: string,
  code: string,
): Promise<GoogleTokens> {
  return requestToken(config, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
}

export async function refreshAccessToken(
  config: VendorConfig,
  refreshToken: string,
): Promise<GoogleTokens> {
  return requestToken(config, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}

async function requestToken(
  config: VendorConfig,
  params: Record<string, string>,
): Promise<GoogleTokens> {
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
    throw new Error(`Google token error: ${msg}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function fetchGoogleUser(accessToken: string): Promise<VendorUser> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google userinfo HTTP ${res.status}`);
  }

  const info = await res.json() as GoogleUserInfo;
  const displayName = info.name || info.given_name || info.email || info.sub;
  const login = info.email || info.sub;

  return {
    vendor: 'google',
    vendorUserId: info.sub,
    login,
    displayName,
  };
}
