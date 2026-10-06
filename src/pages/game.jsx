import React from 'react';

import { Game as Gameplay } from 'components/game';
import { Results } from 'components/results/results';
import { Frontend } from 'components/game/frontend';
import { restoreGameFromStamp } from 'components/game/restore';
import { authMe, authLogout } from 'services/api';
import { handleOAuthCallback, startLogin } from 'services/auth';
import type { AppUser, Vendor } from 'services/api';

const storageStampKey = 'stamp';

class Game extends React.Component
{
  frontend = new Frontend();
  lastGame = null;
  user: AppUser | null = null;

  constructor(props) {
    super(props);

    this.frontend.onGameOver = [ this.onGameOver ];
  }

  onGameOver = (lastGame) => {
    this.lastGame = lastGame.stamp();
    const lader = [...JSON.parse(localStorage.getItem(storageStampKey)) ?? [], this.lastGame];
    localStorage.setItem(storageStampKey, JSON.stringify(lader));

    this.forceUpdate();
  };

  async componentDidMount() {
    this.frontend.setLevel(parseInt(localStorage.getItem('level') ?? 3));

    // Возврат с OAuth: ?code=&state= в URL.
    const callback = await handleOAuthCallback();
    if (callback) {
      // Мы вернулись из логина. Восстановим results-экран из последнего stamp,
      // чтобы пользователь остался на нём, а не улетел на level-select.
      const stamps = JSON.parse(localStorage.getItem(storageStampKey) ?? '[]');
      const lastStamp = stamps[stamps.length - 1];
      if (lastStamp && !this.frontend.game) {
        this.frontend.game = restoreGameFromStamp(lastStamp);
        this.frontend.page = 'game';
      }
      if (callback.ok) {
        this.user = callback.user;
      }
      this.forceUpdate();
      return;
    }

    // Обычный старт: проверим, не залогинен ли уже (cookies).
    try {
      const { user } = await authMe();
      this.user = user;
      this.forceUpdate();
    } catch {
      // бекенд недоступен — молча работаем как неавторизованный
    }
  }

  onLogin = (vendor: Vendor) => {
    startLogin(vendor);
  };

  onLogout = async () => {
    try {
      await authLogout();
    } catch {
      // ignore
    }
    this.user = null;
    this.forceUpdate();
  };

  render() {
    if (this.frontend.game?.gameover) {
      return (
        <Results
          frontend={this.frontend}
          user={this.user}
          onLogin={this.onLogin}
          onLogout={this.onLogout}
          onResurect={this.onResurect}
          onRestart={this.onRestart}
          current={this.lastGame}
        />
      );
    } else {
      return <Gameplay frontend={this.frontend} />;
    }
  }

  componentWillUnmount() {
    clearInterval(this.frontend.interval);
  }

  onRestart = () => {
    this.frontend = new Frontend();
    this.frontend.setLevel(parseInt(localStorage.getItem('level') ?? 3));
    this.frontend.onGameOver = [ this.onGameOver ];
    this.forceUpdate();
  };

  onResurect = () => {
    this.frontend.game.retry(10);
    this.forceUpdate();
    this.frontend.onResume();
  };
};

export { Game };
