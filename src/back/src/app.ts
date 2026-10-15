import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { toFileUrl } from 'jsr:@std/path';
import type { Db } from './db.ts';
import { tryLoadAuthConfig } from './auth/config.ts';
import { authRoutes } from './auth/routes.ts';
import { resultsRoutes } from './routes/results.ts';
import { resultRoutes } from './routes/result.ts';
import { serveStaticFile } from './static.ts';
import { mapResult, selectResultColumns, type ResultRow } from './mappers.ts';
import { renderResultImage } from './og/image.ts';

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

  // og:image для карточки результата: /og/result/<id>.png
  app.get('/og/result/:id', (c) => {
    const id = Number(c.req.param('id').replace(/\.png$/, ''));
    if (!Number.isInteger(id) || id < 1) {
      return c.json({ error: 'Invalid id' }, 400);
    }
    const row = db
      .prepare(`SELECT ${selectResultColumns()} FROM result WHERE id = ?`)
      .get(id) as ResultRow | undefined;
    if (!row) {
      return c.text('Not found', 404);
    }
    const png = renderResultImage(
      mapResult(db, row) as unknown as Parameters<typeof renderResultImage>[0],
    );
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  });

  const { clientDir, serverEntry } = options;

  if (clientDir) {
    // Раздаём статику из clientDir (assets, шрифты, favicon-варианты, manifest,
    // og-картинки и т.д.) с корректным Content-Length и поддержкой HEAD. '/' и app-роуты
    // без расширения идут в SSR; реальные файлы (со расширением) и /assets/* — статика.
    app.use('/*', async (c, next) => {
      const p = c.req.path;
      if (p === '/' || (!p.startsWith('/assets/') && !/\.[A-Za-z0-9]+$/.test(p))) {
        return next();
      }
      const res = await serveStaticFile(clientDir, p, c.req.method);
      if (res) return res;
      return next();
    });
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
