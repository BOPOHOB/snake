import type { MenuProps } from 'antd';
import { Button, Menu } from 'antd';
import type { MenuClickEventHandler } from 'rc-menu/lib/interface';
import { useCallback, useMemo, type FC, type PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession, useSessionState } from '../model/session';

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

  const onResults = pathname === '/result' || pathname.startsWith('/result/');

  const onClick: MenuClickEventHandler = useCallback(({ key }) => {
    navigate(key === '' ? '/' : `/${key}`);
  }, [navigate]);

  const selectedKeys = useMemo(() => {
    if (pathname === '/') return [''];
    if (onResults) return ['result'];
    return [];
  }, [pathname, onResults]);

  return (
    <main className={onResults ? cn.mainResults : undefined}>
      <header className={cn.header}>
        <h1>Nokia 3310 Snake 2</h1>
        <nav>
          <Menu onClick={onClick} selectedKeys={selectedKeys} mode="horizontal" items={ITEMS} />
        </nav>
        <AuthPanel />
      </header>
      {children}
    </main>
  );
};

export { Outline };
