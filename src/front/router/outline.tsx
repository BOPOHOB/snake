import type { MenuProps } from 'antd';
import { Button, Menu } from 'antd';
import type { MenuClickEventHandler } from 'rc-menu/lib/interface';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FC, type PropsWithChildren } from 'react';
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

/** Child reports immersive intent; Outline decides whether chrome hides (mobile only). */
const SetImmersiveContext = createContext<(v: boolean) => void>(() => {});

const useSetImmersive = () => useContext(SetImmersiveContext);

const Outline: FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useMobile();
  const [immersive, setImmersive] = useState(false);

  const onHome = pathname === '/';
  const onResults = pathname === '/result' || pathname.startsWith('/result/');
  // Never keep chrome hidden off the game route (stale immersive after game-over on real devices).
  const hideNav = immersive && isMobile && onHome;

  useEffect(() => {
    if (!onHome) setImmersive(false);
    window.scrollTo(0, 0);
  }, [onHome, pathname]);

  const onClick: MenuClickEventHandler = useCallback(({ key }) => {
    navigate(key === '' ? '/' : `/${key}`);
  }, [navigate]);

  const selectedKeys = useMemo(() => {
    if (onHome) return [''];
    if (onResults) return ['result'];
    return [];
  }, [onHome, onResults]);

  const items = useItems(selectedKeys.at(0) ?? '');

  return (
    <main className={cn.root}>
      <header className={clsx(cn.header, hideNav && cn.hide)}>
        <h1><span className={cn.version}><span className={cn.nokia}>Nokia</span> 3310</span> Snake <span className={cn.version}>2</span></h1>
        <nav>
          <Menu onClick={onClick} selectedKeys={selectedKeys} mode="horizontal" items={items} disabledOverflow />
        </nav>
        <AuthPanel />
      </header>
      {/* Explicit flex slot below header — Provider/fragments don't create a box. */}
      <div className={cn.body}>
        <SetImmersiveContext.Provider value={setImmersive}>
          {children}
        </SetImmersiveContext.Provider>
      </div>
    </main>
  );
};

export { Outline, useSetImmersive };
