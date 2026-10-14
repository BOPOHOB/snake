import type { MenuProps } from 'antd';
import { Button, Menu } from 'antd';
import type { MenuClickEventHandler } from 'rc-menu/lib/interface';
import { useCallback, useMemo, type FC, type PropsWithChildren } from 'react';
import { useLocation, useNavigate, useParams, useRouteLoaderData } from 'react-router-dom';
import { Results } from '../components/results/Results';
import { useSession, useSessionState } from '../model/session';
import type { ResultDump } from '../types/result';

import cn from './outline.module.less';

type MenuItem = Required<MenuProps>['items'][number];

const ITEMS: MenuItem[] = [
  {
    label: 'Game',
    key: '',
  },
  {
    label: 'Results',
    key: 'result',
  },
];

const AuthPanel: FC = () => {
  const session = useSession();
  const { user, isLoading } = useSessionState();

  if (isLoading) return null;

  if (user) {
    return (
      <div className={cn.auth}>
        <span className={cn.userName}>{user.name}</span>
        <Button className={cn.loginBtn} onClick={() => void session.logout()}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className={cn.auth}>
      <Button className={cn.loginBtn} onClick={() => void session.login('yandex')}>
        Yandex
      </Button>
      <Button className={cn.loginBtn} onClick={() => void session.login('google')}>
        Google
      </Button>
    </div>
  );
};

const Outline: FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id } = useParams();
  const resultsData = useRouteLoaderData('results') as { results: ResultDump[] } | undefined;

  const onResults = pathname === '/result' || pathname.startsWith('/result/');
  const selectedId = id && /^\d+$/.test(id) ? Number(id) : undefined;

  const onClick: MenuClickEventHandler = useCallback(({ key }) => {
    navigate(key === '' ? '/' : `/${key}`);
  }, [navigate]);

  const selectedKeys = useMemo(() => {
    if (pathname === '/') return [''];
    if (onResults) return ['result'];
    return [];
  }, [pathname, onResults]);

  return (
    <main>
      <header className={cn.header}>
        <h1>Nokia 3310 Snake 2</h1>
        <nav>
          <Menu onClick={onClick} selectedKeys={selectedKeys} mode="horizontal" items={ITEMS} />
        </nav>
        <AuthPanel />
      </header>
      {onResults && resultsData && (
        <Results results={resultsData.results} selectedId={selectedId} />
      )}
      {children}
    </main>
  );
};

export { Outline };
