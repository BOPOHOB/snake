import type { RouteObject } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { DocumentMeta } from '../router/meta';
import { loadResults, loadResult } from '../router/loaders';
import type { MetaContext, RouteMeta } from '../router/meta';
import type { ResultDump } from '../types/result';
import { Home } from '../pages/home';
import { Leaderboard } from '../pages/leaderboard';
import { Result } from '../pages/result';
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
            title: 'Nokia 3310 Snake 2',
            description: DESCRIPTION,
            ogUrl: 'https://snake3310.io/',
            jsonLd: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'VideoGame',
              name: 'Nokia 3310 Snake 2',
              description: DESCRIPTION,
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
        id: 'leaderboard',
        path: 'leaderboard',
        Component: Leaderboard,
        loader: (args) => loadResults(args),
        handle: {
          meta: {
            title: 'Таблица рекордов — Nokia 3310 Snake 2',
            description: 'Авторизуйтесь, чтобы добавить свои результаты в общую таблицу',
          } satisfies RouteMeta,
        },
      },
      {
        id: 'result',
        path: 'result/:id',
        Component: Result,
        loader: (args) => loadResult(args),
        handle: {
          meta: ({ data, params }: MetaContext): RouteMeta => {
            const r = (data as { result: ResultDump | null } | null)?.result;
            const id = params.id;
            const base: RouteMeta = {
              title: 'Результат — Nokia 3310 Snake 2',
              description: 'Карточка результата игры.',
            };
            if (!r) return base;
            return {
              title: `${r.user_name || 'Аноним'} — ${r.score} — Nokia 3310 Snake 2`,
              description: `Результат: счёт ${r.score}, уровень ${r.level}, лабиринт ${r.labyrinth}${r.isWin ? ' — победа' : ''}.`,
              ogUrl: id ? `https://snake3310.io/result/${id}` : undefined,
            };
          },
        },
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
