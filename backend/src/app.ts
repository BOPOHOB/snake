import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Db } from './db.ts';
import { tryLoadAuthConfig } from './auth/config.ts';
import { authRoutes } from './auth/routes.ts';
import { resultsRoutes } from './routes/results.ts';
import { resultRoutes } from './routes/result.ts';

export function createApp(db: Db) {
  const app = new Hono();
  const authConfig = tryLoadAuthConfig();

  const frontendOrigin = authConfig?.frontendOrigin ??
    (Deno.env.get('FRONTEND_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');

  app.use(
    '*',
    cors({
      origin: frontendOrigin,
      credentials: true,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    }),
  );

  app.get('/api/health', (c) =>
    c.json({
      ok: true,
      authConfigured: Boolean(authConfig),
      vendors: {
        yandex: Boolean(authConfig?.yandex),
        google: Boolean(authConfig?.google),
      },
    }),
  );

  app.route('/api/auth', authRoutes(authConfig, db));
  app.route('/api/results', resultsRoutes(db));
  app.route('/api/result', resultRoutes(db, authConfig));

  return app;
}
