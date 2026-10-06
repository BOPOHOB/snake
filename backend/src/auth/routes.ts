import { Hono } from 'hono';
import type { Db } from '../db.ts';
import type { AuthConfig, Vendor } from './config.ts';
import { getVendorConfig } from './config.ts';
import {
  clearAuthCookies,
  completeAuthWithCode,
  resolveAuthUser,
} from './session.ts';
import { buildAuthorizeUrl as buildYandexUrl } from './yandex.ts';
import { buildAuthorizeUrl as buildGoogleUrl } from './google.ts';

function buildAuthorizeUrl(
  config: AuthConfig,
  vendor: Vendor,
  state: string,
): string {
  const vcfg = getVendorConfig(config, vendor);
  if (!vcfg) throw new Error(`Vendor ${vendor} is not configured`);
  if (vendor === 'yandex') {
    return buildYandexUrl(vcfg, config.redirectUri, state);
  }
  return buildGoogleUrl(vcfg, config.redirectUri, state);
}

export function authRoutes(config: AuthConfig | null, db: Db) {
  const app = new Hono();

  /** Старт логина: фронт кладёт state в sessionStorage и делает location = authorizeUrl. */
  app.get('/login', (c) => {
    if (!config) return c.json({ error: 'Auth is not configured' }, 503);

    const vendor = c.req.query('vendor') as Vendor | undefined;
    if (vendor !== 'yandex' && vendor !== 'google') {
      return c.json({ error: 'vendor must be yandex or google' }, 400);
    }
    if (!getVendorConfig(config, vendor)) {
      return c.json({ error: `Vendor ${vendor} is not configured` }, 503);
    }

    const state = `${vendor}:${crypto.randomUUID()}`;
    return c.json({
      authorizeUrl: buildAuthorizeUrl(config, vendor, state),
      state,
      vendor,
      redirectUri: config.redirectUri,
    });
  });

  /** Фронт после своего callback шлёт {vendor, code, state}; бэк меняет на tokens и ставит cookies. */
  app.post('/exchange', async (c) => {
    if (!config) return c.json({ error: 'Auth is not configured' }, 503);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const raw = (body ?? null) as Record<string, unknown> | null;
    const vendor = raw?.vendor as Vendor | undefined;
    const code =
      typeof raw?.code === 'string' ? raw.code.trim() : '';

    if (vendor !== 'yandex' && vendor !== 'google') {
      return c.json({ error: 'vendor must be yandex or google' }, 400);
    }
    if (!code) return c.json({ error: 'code is required' }, 400);
    if (!getVendorConfig(config, vendor)) {
      return c.json({ error: `Vendor ${vendor} is not configured` }, 503);
    }

    try {
      const user = await completeAuthWithCode(c, config, db, vendor, code);
      return c.json({ ok: true, user: { id: user.id, name: user.name, authVendor: user.authVendor } });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'token_exchange_failed';
      return c.json({ error: message }, 401);
    }
  });

  app.post('/logout', (c) => {
    if (!config) return c.json({ error: 'Auth is not configured' }, 503);
    clearAuthCookies(c, config);
    return c.json({ ok: true });
  });

  app.get('/me', async (c) => {
    if (!config) {
      return c.json({ user: null, error: 'Auth is not configured' });
    }
    try {
      const user = await resolveAuthUser(c, config, db);
      return c.json({ user });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'auth_error';
      return c.json({ user: null, error: message });
    }
  });

  return app;
}

/** Экспортируем для auth-guard в роутах. */
export { resolveAuthUser } from './session.ts';
