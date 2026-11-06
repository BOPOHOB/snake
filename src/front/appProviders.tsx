import type { ReactNode } from 'react';
import { useCallback, useEffect } from 'react';
import { ConfigProvider, notification } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { SessionProvider, useSessionState } from './model/session';
import { StampsProvider, useStamps, useStampsState } from './model/stamps';
import { bgColor, fgColor } from './components/game/colors';
import { achievements } from './services/achivements/achivements';
import type { Achievement } from './services/achivements/achivement';
import { notify } from './components/achievements/notify';

// Глобальная тема antd: пиксельный шрифт Nokia + ретро-кнопки (толстая чёрная рамка,
// зелёный фон как везде на сайте, hover-инверсия в чёрный) на всех antd-кнопках проекта.
const theme = {
  token: {
    fontFamily: "'nokia', Verdana, Tahoma",
    borderRadius: 0,
    colorBgElevated: bgColor,
    colorText: fgColor,
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
    Notification: {
      borderRadiusLG: 0,
      colorBgElevated: bgColor,
      colorText: fgColor,
      colorIcon: fgColor,
      colorInfo: fgColor,
    },
  },
};

/** Sync unsent → бекенд; после авторизации — подтянуть историю пользователя в ачивки. */
function StampsSync() {
  const stamps = useStamps();
  const { isAuthenticated, user } = useSessionState();
  const { unsent } = useStampsState();
  useEffect(() => {
    void stamps.sync(isAuthenticated);
  }, [stamps, isAuthenticated, unsent]);
  useEffect(() => {
    if (!isAuthenticated || user == null) return;
    void stamps.loadRemoteForUser(user.id);
  }, [stamps, isAuthenticated, user]);
  return null;
}

/** Глобально вешает обработчик достижения (только в браузере). */
function AchievementsWiring() {
  const [api, contextHolder] = notification.useNotification();

  const achieveMessage = useCallback((a: Achievement) => {
    api.open(notify(a));
  }, [api]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    achievements.onAchieved = achieveMessage;
  }, [achieveMessage]);
  return contextHolder;
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
