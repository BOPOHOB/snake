import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { SessionProvider, useSessionState } from './model/session';
import { StampsProvider, useStamps, useStampsState } from './model/stamps';
import { achievements } from './services/achievements';
import { achieveMessage } from './components/achieveMessage/achieveMessage';
import { bgColor, fgColor } from './components/game/colors';

// Глобальная тема antd: пиксельный шрифт Nokia + ретро-кнопки (толстая чёрная рамка,
// зелёный фон как везде на сайте, hover-инверсия в чёрный) на всех antd-кнопках проекта.
const theme = {
  token: {
    fontFamily: "'nokia', Verdana, Tahoma",
  },
  components: {
    Button: {
      borderRadius: 0,
      fontWeight: 400,
      defaultBg: bgColor,
      defaultColor: fgColor,
      defaultBorderColor: fgColor,
      defaultHoverBg: fgColor,
      defaultHoverColor: bgColor,
      defaultHoverBorderColor: fgColor,
      defaultActiveBg: fgColor,
      defaultActiveColor: bgColor,
      defaultActiveBorderColor: fgColor,
    },
  },
};

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
    <ConfigProvider locale={ruRU} theme={theme}>
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
