
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import type { MenuClickEventHandler } from 'rc-menu/lib/interface';
import { useCallback, useMemo, type FC, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

import cn from './outline.module.less';

type MenuItem = Required<MenuProps>['items'][number];

const ITEMS: MenuItem[] = [
  {
    label: 'Game',
    key: '',
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
    if (pathname === '/') return [''];
    return ['leaderboard'];
  }, [pathname]);
  return (
    <main>
      <header className={cn.header}>
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
