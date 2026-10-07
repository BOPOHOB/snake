import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom/server';
import { AppProviders } from './appProviders';
import { routes } from './router/routes';
import { metaFromMatches, renderHeadTags } from './router/meta';

const { query, dataRoutes } = createStaticHandler(routes);

async function renderToHtml(request: Request, template: string): Promise<Response> {
  const context = await query(request);
  if (context instanceof Response) {
    return context;
  }

  const router = createStaticRouter(dataRoutes, context);
  const appHtml = renderToString(
    <StrictMode>
      <AppProviders>
        <StaticRouterProvider router={router} context={context} />
      </AppProviders>
    </StrictMode>,
  );

  const headTags = renderHeadTags(
    metaFromMatches(
      context.matches.map((match) => ({
        handle: match.route.handle,
        data: context.loaderData[match.route.id],
        params: match.params,
      })),
    ),
  );
  let html = template.replace('<!--ssr-head-->', headTags);
  html = html.replace('<!--ssr-outlet-->', () => appHtml);

  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
  const leaf = context.matches[context.matches.length - 1];
  if (leaf) {
    const loaderHeaders = context.loaderHeaders[leaf.route.id];
    if (loaderHeaders) {
      for (const [key, value] of loaderHeaders.entries()) {
        headers.append(key, value);
      }
    }
  }

  return new Response(html, {
    status: context.statusCode,
    headers,
  });
}

export { renderToHtml };
