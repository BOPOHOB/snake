import { useEffect, useMemo } from 'react';
import { Frontend } from '../components/game/frontend';
import { GameCanvas } from '../components/game/index';
import { restoreGameFromStamp } from '../components/game/restore';
import { useStamps } from '../model/stamps';
import { useSession } from '../model/session';
import { handleOAuthCallback } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export const Play = () => {
  const frontend = useMemo(() => new Frontend(), []);
  const stamps = useStamps();
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    // Семантика старого pages/game.jsx: уровень по умолчанию = 3.
    frontend.setLevel(Number(localStorage.getItem('level') ?? 3));

    frontend.onGameOver((game) => {
      stamps.add(game.stamp());
      navigate('/leaderboard');
    });

    // Возврат с OAuth: ?code=&state= в URL.
    void (async () => {
      const callback = await handleOAuthCallback();
      if (callback) {
        const lastStamp = stamps.last();
        if (lastStamp && !frontend.game) {
          frontend.game = restoreGameFromStamp(lastStamp);
          frontend.page = 'game';
        }
        if (callback.ok) {
          session.setUser(callback.user, false);
        }
        navigate('leaderboard');
      }
    })();
  }, [frontend, stamps, session]);

  return <GameCanvas frontend={frontend} />;
};
