
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import type { MenuClickEventHandler } from 'rc-menu/lib/interface';
import { useCallback, useMemo, type FC, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

type MenuItem = Required<MenuProps>['items'][number];

const ITEMS: MenuItem[] = [
  {
    label: 'Game',
    key: 'play',
  },
  {
    label: 'Results',
    key: 'leaderboard',
  },
];

const Outline: FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onClick: MenuClickEventHandler = useCallback(({ key }) => { navigate(`/${key}`); }, []);
  const selectedKeys = useMemo(() => {
    if (pathname === '/' || pathname.startsWith('/play')) return ['play'];
    if (pathname.startsWith('/leaderboard') || pathname.startsWith('/result')) {
      return ['leaderboard'];
    }
    return [];
  }, [pathname]);
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <header>
        <h1>Nokia 3310 Snake 2</h1>
        <nav>
          <Menu onClick={onClick} selectedKeys={selectedKeys} mode="horizontal" items={ITEMS} />
        </nav>
      </header>
      {children}
    </main>
  );
};

export { Outline };
