import type { RouteObject } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import { DocumentMeta } from '../router/meta';
import { loadResults, loadResult } from '../router/loaders';
import type { MetaContext, RouteMeta } from '../router/meta';
import type { ResultDump } from '../types/result';
import { Home } from '../pages/home';
import { Results } from '../pages/results';
import { AuthCallback } from '../pages/authCallback';
import { NotFound } from '../pages/notFound';
import { Outline } from './outline';

const RootLayout = () => (
  <DocumentMeta>
    <Outline>
      <Outlet />
    </Outline>
  </DocumentMeta>
);

const DESCRIPTION = 'Змейка с лабиринтами, яблоками, багами и уровнями скорости — ода Nokia 3310.';

const HOME_TITLE = 'Snake 2';
const HOME_DESCRIPTION =
  'All 6 levels are the same as in the original game, with the same overall rating and attention to detail';

const routes: RouteObject[] = [
  {
    id: 'root',
    Component: RootLayout,
    handle: {
      meta: {
        title: 'Nokia 3310 Snake 2',
        description: DESCRIPTION,
      } satisfies RouteMeta,
    },
    children: [
      {
        id: 'home',
        index: true,
        Component: Home,
        handle: {
          meta: {
            title: HOME_TITLE,
            description: HOME_DESCRIPTION,
            ogUrl: 'https://snake3310.io/',
            ogImage: 'https://snake3310.io/og-home.png',
            ogImageWidth: 1200,
            ogImageHeight: 630,
            ogImageAlt: 'Snake 2 — logo Nokia 3310',
            jsonLd: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'VideoGame',
              name: HOME_TITLE,
              description: HOME_DESCRIPTION,
              genre: ['Arcade', 'Retro'],
              gamePlatform: 'Web',
              applicationCategory: 'GameApplication',
              url: 'https://snake3310.io/',
              playMode: 'SinglePlayer',
            }),
          } satisfies RouteMeta,
        },
      },
      {
        id: 'results',
        path: 'result',
        Component: Results,
        loader: (args) => loadResults(args),
        handle: {
          meta: {
            title: 'Results — Nokia 3310 Snake 2',
            description: 'Results table',
          } satisfies RouteMeta,
        },
        children: [
          {
            index: true,
          },
          {
            id: 'result',
            path: ':id',
            Component: () => null,
            loader: (args) => loadResult(args),
            handle: {
              meta: ({ data, params }: MetaContext): RouteMeta => {
                const r = (data as { result: ResultDump | null } | null)?.result;
                const id = params.id;
                const base: RouteMeta = {
                  title: 'Result — Nokia 3310 Snake 2',
                  description: 'Result card.',
                };
                if (!r) return base;
                return {
                  title: `${r.user_name} — ${r.score} — Nokia 3310 Snake 2`,
                  description: `Result: score ${r.score}, level ${r.level}, length ${r.eatens}${r.isWin ? ' — победа' : ''}.`,
                  ogUrl: id ? `https://snake3310.io/result/${id}` : undefined,
                  ogImage: id ? `https://snake3310.io/og/result/${id}.png` : undefined,
                  ogImageWidth: 1664,
                  ogImageHeight: 686,
                  ogImageAlt: `${r.user_name} result: score ${r.score}`,
                };
              },
            },
          },
        ],
      },
      {
        path: 'leaderboard',
        element: <Navigate to="/result" replace />,
      },
      {
        id: 'auth-callback',
        path: 'auth/callback',
        Component: AuthCallback,
        handle: {
          meta: { title: 'Вход — Nokia 3310 Snake 2' } satisfies RouteMeta,
        },
      },
      {
        id: 'not-found',
        path: '*',
        Component: NotFound,
        handle: {
          meta: { title: '404 — Nokia 3310 Snake 2' } satisfies RouteMeta,
        },
      },
    ],
  },
];

export { routes };
