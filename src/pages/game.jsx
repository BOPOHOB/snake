import React from 'react';

import { Game as Gameplay } from 'components/game';
import { Results } from 'components/results/results';
import { Frontend } from 'components/game/frontend';
import { Game as GameLogic } from 'components/game/game';

const storageStampKey = 'stamp';

class Game extends React.Component
{
  frontend = new Frontend();
  lastGame = null;
  stampText = [];

  constructor(props) {
    super(props);
    
    this.frontend.onGameOver = [ this.onGameOver ];
  }

  onGameOver = (lastGame) => {
    this.lastGame = lastGame.stamp();
    const lader = [...JSON.parse(localStorage.getItem(storageStampKey)) ?? [], this.lastGame];
    localStorage.setItem(storageStampKey, JSON.stringify(lader));

    this.updateStampText();

    this.forceUpdate();
  };

  updateStampText() {
    this.stampText = [];
    for (let row = 0; row !== GameLogic.fieldSize[0]; ++row) {
      let r = '';
      for (let col = 0; col !== GameLogic.fieldSize[1]; ++col) {
        const point = [row, col];
        if (Array.isArray(this.frontend.game.apple) && GameLogic.eqPoints(this.frontend.game.apple, point)) {
          r += '🍏';
        } else if (this.frontend.game.isBug(point)) {
          r += '🐞';
        } else if (this.frontend.game.isLabyrinth(point)) {
          r += '⏹';
        } else if (this.frontend.game.isBody(point)) {
          r += '🔷';
        } else {
          r += '⚪️';
        }
      }
      this.stampText.push(r);
    }
  }

  componentDidMount() {
    this.frontend.setLevel(3);
  }

  render() {
    if (this.frontend.game?.gameover) {
      return <Results onResurect={this.onResurect} onRestart={this.onRestart} current={this.lastGame} emoji={this.stampText} />;
    } else {
      return <Gameplay frontend={this.frontend} />;
    }
  }

  componentWillUnmount() {
    clearInterval(this.frontend.interval);
  }

  onRestart = () => {
    this.frontend = new Frontend();
    this.frontend.setLevel(3);
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
