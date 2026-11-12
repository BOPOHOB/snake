import type { MenuProps } from 'antd';
import { Button, Menu } from 'antd';
import type { MenuClickEventHandler } from 'rc-menu/lib/interface';
import { createContext, useCallback, useContext, useMemo, useState, type FC, type PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession, useSessionState } from '../model/session';
import clsx from 'clsx';

import cn from './outline.module.less';
import { useMobile } from '../utils/useMobile';

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

const useItems = (key: string) => {
  const isMobile = useMobile();
  if (!isMobile) {
    return ITEMS;
  }
  return ITEMS.filter((i) => i!.key !== key);
};

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

const MENU_CONTEXT = createContext<null | { showNav: ((v: boolean) => void) }>(null);

const useMenuContext = () => useContext(MENU_CONTEXT);

const Outline: FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showNav, setShowNav] = useState(true);

  const menuContext = useMemo(() => ({
    showNav: setShowNav
  }), [])

  const onResults = pathname === '/result' || pathname.startsWith('/result/');

  const onClick: MenuClickEventHandler = useCallback(({ key }) => {
    navigate(key === '' ? '/' : `/${key}`);
  }, [navigate]);

  const selectedKeys = useMemo(() => {
    if (pathname === '/') return [''];
    if (onResults) return ['result'];
    return [];
  }, [pathname, onResults]);

  const items = useItems(selectedKeys.at(0) ?? '');

  return (
    <main className={onResults ? cn.mainResults : undefined}>
      <header className={clsx(cn.header, !showNav && cn.hide)}>
        <h1><span className={cn.version}><span className={cn.nokia}>Nokia</span> 3310</span> Snake <span className={cn.version}>2</span></h1>
        <nav>
          <Menu onClick={onClick} selectedKeys={selectedKeys} mode="horizontal" items={items} disabledOverflow />
        </nav>
        <AuthPanel />
      </header>
      <MENU_CONTEXT.Provider value={menuContext}>
        {children}
      </MENU_CONTEXT.Provider>
    </main>
  );
};

export { Outline, useMenuContext };
