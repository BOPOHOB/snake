import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { Session, SessionProvider, useSessionState } from './model/session';
import { Stamps, StampsProvider, useStamps } from './model/stamps';
import { achievements } from './services/achievements';
import { achieveMessage } from './components/achieveMessage/achieveMessage';
import { useModel } from './utils/useModel';

/** Связывает sync-очередь stamps с состоянием авторизации. */
function StampsSync() {
  const stamps = useStamps();
  const { isAuthenticated } = useSessionState();
  useEffect(() => {
    void stamps.sync(isAuthenticated);
  }, [stamps, isAuthenticated]);
  return null;
}

/** Глобально вешает обработчик достижения (только в браузере). */
function AchievementsWiring() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    achievements.onAchieved = achieveMessage;
  }, []);
  return null;
}

const AppProviders = ({ children }: { children: ReactNode }) => {
  const session = useModel(() => new Session(), []);
  const stamps = useModel(() => new Stamps(), []);

  return (
    <ConfigProvider locale={ruRU}>
      <SessionProvider value={session}>
        <StampsProvider value={stamps}>
          {children}
          <StampsSync />
          <AchievementsWiring />
        </StampsProvider>
      </SessionProvider>
    </ConfigProvider>
  );
};

export { AppProviders };
