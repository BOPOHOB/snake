import { message } from 'antd';
import { API_BASE, authExchange, authLogin, type AppUser, type Vendor } from './api';

const OAUTH_STATE_KEY = 'oauth_state';

function saveOauthState(state: string): void {
  window.sessionStorage.setItem(OAUTH_STATE_KEY, state);
}

function takeOauthState(): string | null {
  const value = window.sessionStorage.getItem(OAUTH_STATE_KEY);
  window.sessionStorage.removeItem(OAUTH_STATE_KEY);
  return value;
}

/** Старт OAuth: сохраняет state и уводит браузер на вендора. */
export async function startLogin(vendor: Vendor): Promise<void> {
  try {
    const { authorizeUrl, state } = await authLogin(vendor);
    saveOauthState(state);
    window.location.assign(authorizeUrl);
  } catch (e) {
    const reason = e instanceof Error ? e.message : 'network error';
    console.error('auth login failed', reason, e);
    message.error(`Login failed: ${reason}. Is the backend running on ${API_BASE}?`);
  }
}

export type OAuthCallbackResult =
  | { ok: true; user: AppUser }
  | { ok: false; error: string };

/**
 * Обработка возврата с OAuth: читает ?code=&state= из URL, сверяет state,
 * обменивает code на cookies. Чистит query в URL.
 */
export async function handleOAuthCallback(): Promise<OAuthCallbackResult | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return null;
  }

  // Чистим URL сразу, чтобы при refresh не было повторного обмена.
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);

  const savedState = takeOauthState();
  if (savedState !== state) {
    return { ok: false, error: 'state mismatch' };
  }

  const vendor = state.split(':')[0] as Vendor;
  if (vendor !== 'yandex' && vendor !== 'google') {
    return { ok: false, error: 'unknown vendor' };
  }

  try {
    const { user } = await authExchange(vendor, code, state);
    return { ok: true, user };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'exchange failed' };
  }
}
