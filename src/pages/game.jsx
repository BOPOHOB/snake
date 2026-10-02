import React from 'react';

import { Game as Gameplay } from 'components/game';
import { Results } from 'components/results/results';
import { Frontend } from 'components/game/frontend';

const storageStampKey = 'stamp';

class Game extends React.Component
{
  frontend = new Frontend();
  lastGame = null;

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

  componentDidMount() {
    this.frontend.setLevel(parseInt(localStorage.getItem('level') ?? 3));
  }

  render() {
    if (this.frontend.game?.gameover) {
      return <Results frontend={this.frontend} onResurect={this.onResurect} onRestart={this.onRestart} current={this.lastGame} />;
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
