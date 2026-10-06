/** Конфиг OAuth / cookies из env. Поддерживает Yandex и Google. */

export type Vendor = 'yandex' | 'google';

export type VendorConfig = {
  clientId: string;
  clientSecret: string;
};

export type AuthConfig = {
  yandex: VendorConfig | null;
  google: VendorConfig | null;
  /** Redirect URI на фронте (одна callback-страница на оба вендора). */
  redirectUri: string;
  /** Origin фронта — CORS. */
  frontendOrigin: string;
  cookieSecure: boolean;
};

function optional(name: string): string | null {
  const value = Deno.env.get(name)?.trim();
  return value || null;
}

function required(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export function loadAuthConfig(): AuthConfig {
  const frontendOrigin = (
    Deno.env.get('FRONTEND_ORIGIN') ?? 'http://localhost:3000'
  ).replace(/\/$/, '');

  const redirectUri =
    Deno.env.get('OAUTH_REDIRECT_URI') ?? `${frontendOrigin}/auth/callback`;

  const cookieSecure =
    Deno.env.get('COOKIE_SECURE') === '1' ||
    Deno.env.get('COOKIE_SECURE') === 'true' ||
    frontendOrigin.startsWith('https://') ||
    redirectUri.startsWith('https://');

  const yandexId = optional('YANDEX_CLIENT_ID');
  const yandexSecret = optional('YANDEX_CLIENT_SECRET');
  const googleId = optional('GOOGLE_CLIENT_ID');
  const googleSecret = optional('GOOGLE_CLIENT_SECRET');

  return {
    yandex: yandexId && yandexSecret
      ? { clientId: yandexId, clientSecret: yandexSecret }
      : null,
    google: googleId && googleSecret
      ? { clientId: googleId, clientSecret: googleSecret }
      : null,
    redirectUri,
    frontendOrigin,
    cookieSecure,
  };
}

/** Без env сервер поднимается; auth-ручки вернут 503 / user: null. */
export function tryLoadAuthConfig(): AuthConfig | null {
  try {
    const cfg = loadAuthConfig();
    if (!cfg.yandex && !cfg.google) {
      return null;
    }
    return cfg;
  } catch {
    return null;
  }
}

export function getVendorConfig(
  config: AuthConfig,
  vendor: string,
): VendorConfig | null {
  if (vendor === 'yandex') return config.yandex;
  if (vendor === 'google') return config.google;
  return null;
}
