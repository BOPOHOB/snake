import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { SessionProvider, useSessionState } from './model/session';
import { StampsProvider, useStamps, useStampsState } from './model/stamps';
import { achievements } from './services/achievements';
import { achieveMessage } from './components/achieveMessage/achieveMessage';

/** Связывает sync-очередь stamps с состоянием авторизации и появлением unsent. */
function StampsSync() {
  const stamps = useStamps();
  const { isAuthenticated } = useSessionState();
  const { unsent } = useStampsState();
  useEffect(() => {
    void stamps.sync(isAuthenticated);
  }, [stamps, isAuthenticated, unsent]);
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

  return (
    <ConfigProvider locale={ruRU}>
      <SessionProvider>
        <StampsProvider>
          {children}
          <StampsSync />
          <AchievementsWiring />
        </StampsProvider>
      </SessionProvider>
    </ConfigProvider>
  );
};

export { AppProviders };
