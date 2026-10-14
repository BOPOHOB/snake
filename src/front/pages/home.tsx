import { useEffect, useMemo } from 'react';
import { Frontend } from '../components/game/frontend';
import { GameCanvas } from '../components/game/index';
import { restoreGameFromStamp } from '../components/game/restore';
import { useStamps } from '../model/stamps';
import { useSession } from '../model/session';
import { handleOAuthCallback } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { useRefClosure } from '../utils/useRefClosure';

/** Индексная страница — сама игра. */
export const Home = () => {
  const frontend = useMemo(() => new Frontend(), []);
  const stampsRef = useRefClosure(useStamps());
  const sessionRef = useRefClosure(useSession());
  const navigateRef = useRefClosure(useNavigate());

  useEffect(() => {
    // Семантика старого pages/game.jsx: уровень по умолчанию = 3.
    frontend.setLevel(Number(localStorage.getItem('level') ?? 3));

    return frontend.onGameOver((game) => {
      stampsRef.current.add(game.stamp());
      navigateRef.current('/leaderboard');
    });
  }, [frontend]);

  useEffect(() => {
    // Возврат с OAuth: ?code=&state= в URL.
    void (async () => {
      const callback = await handleOAuthCallback();
      if (callback) {
        const lastStamp = stampsRef.current.last();
        if (lastStamp && !frontend.game) {
          frontend.game = restoreGameFromStamp(lastStamp);
          frontend.page = 'game';
        }
        if (callback.ok) {
          sessionRef.current.setUser(callback.user, false);
        }
        navigateRef.current('/leaderboard');
      }
    })();
  }, [frontend]);

  return <GameCanvas frontend={frontend} />;
};
