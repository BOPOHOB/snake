import { useEffect, useState } from 'react';
import { Frontend } from '../components/game/frontend';
import { GameCanvas } from '../components/game/index';
import { Results } from '../components/results/Results';
import { restoreGameFromStamp } from '../components/game/restore';
import { useStamps } from '../model/stamps';
import { useSession } from '../model/session';
import { handleOAuthCallback } from '../services/auth';

export const Play = () => {
  const [frontend, setFrontend] = useState(() => new Frontend());
  const [showResults, setShowResults] = useState(false);
  const stamps = useStamps();
  const session = useSession();

  useEffect(() => {
    // Семантика старого pages/game.jsx: уровень по умолчанию = 3.
    frontend.setLevel(Number(localStorage.getItem('level') ?? 3));

    frontend.onGameOver = [
      (game) => {
        stamps.add(game.stamp());
        setShowResults(true);
      },
    ];

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
        setShowResults(true);
      }
    })();
  }, [frontend, stamps, session]);

  if (showResults) {
    return (
      <Results
        onRestart={() => {
          const f = new Frontend();
          f.setLevel(Number(localStorage.getItem('level') ?? 3));
          f.onGameOver = [
            (game) => {
              stamps.add(game.stamp());
              setShowResults(true);
            },
          ];
          setFrontend(f);
          setShowResults(false);
        }}
        onResurrect={() => {
          frontend.game?.retry(10);
          setShowResults(false);
          frontend.onResume();
        }}
      />
    );
  }

  return <GameCanvas frontend={frontend} />;
};
