import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/deno';
import { toFileUrl } from 'jsr:@std/path';
import type { Db } from './db.ts';
import { tryLoadAuthConfig } from './auth/config.ts';
import { authRoutes } from './auth/routes.ts';
import { resultsRoutes } from './routes/results.ts';
import { resultRoutes } from './routes/result.ts';

type SsrModule = {
  renderToHtml: (request: Request, template: string) => Promise<Response>;
};

type CreateAppOptions = {
  clientDir?: string;
  serverEntry?: string;
};

export function createApp(db: Db, options: CreateAppOptions = {}) {
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

  const { clientDir, serverEntry } = options;

  if (clientDir) {
    app.use('/assets/*', serveStatic({ root: clientDir }));
    app.get('/favicon.ico', serveStatic({ root: clientDir }));
    app.get('/robots.txt', serveStatic({ root: clientDir }));
    app.get('/sitemap.xml', serveStatic({ root: clientDir }));
    app.get('/manifest.json', serveStatic({ root: clientDir }));
  }

  let ssrPromise: Promise<SsrModule | null> | null = null;
  let templatePromise: Promise<string | null> | null = null;

  const loadSsr = () => {
    if (!serverEntry) return Promise.resolve(null);
    if (!ssrPromise) {
      const href = toFileUrl(serverEntry).href;
      ssrPromise = import(href)
        .then((mod) => mod as SsrModule)
        .catch((err) => {
          console.error('Failed to load SSR entry:', err);
          return null;
        });
    }
    return ssrPromise;
  };

  const loadTemplate = () => {
    if (!clientDir) return Promise.resolve(null);
    if (!templatePromise) {
      templatePromise = Deno.readTextFile(`${clientDir}/index.html`).catch((err) => {
        console.error('Failed to read client index.html:', err);
        return null;
      });
    }
    return templatePromise;
  };

  app.get('*', async (c) => {
    if (c.req.path.startsWith('/api/')) {
      return c.json({ error: 'Not found' }, 404);
    }

    const [ssr, template] = await Promise.all([loadSsr(), loadTemplate()]);
    if (!ssr || !template) {
      return c.text('SSR bundle missing. Run: npm run build', 503);
    }

    const url = new URL(c.req.url);
    const request = new Request(url.href, {
      method: c.req.method,
      headers: c.req.raw.headers,
    });

    return ssr.renderToHtml(request, template).catch((err) => {
      console.error('SSR render failed:', err);
      return new Response('SSR render failed', { status: 500 });
    });
  });

  return app;
}
