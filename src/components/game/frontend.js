import { Game } from './game';
import { assets } from './assets';
import { achievements } from 'services/achievements';

class Frontend {
  game = null;
  level;
  labyrinth = parseInt(localStorage.getItem('labyrinth') ?? 1, 10);
  page = 'level';
  interval;
  demoHead = [13, 6];
  unpausing = 0;
  update;
  onGameOver = [];

  setLevel(value) {
    this.level = value;
    localStorage.setItem('level', value);
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.demoHead[0] += 1;
      Game.keepTorus(this.demoHead);
      this.update();
    }, Game.tickDurations[this.level]);
  }

  startGame() {
    this.game = new Game(this.level, this.labyrinth);
    achievements.accept('started', this.game);
    this.game.onGameOver.push(() => {
      this.onGameOver.forEach((callback) => callback(this.game));
      clearInterval(this.interval);
    });
    this.onResume(0);
  }

  onNextPage() {
    switch (this.page) {
    case 'level':
      clearInterval(this.interval);
      this.page = 'labyrinth';
      this.update();
      return;
    case 'labyrinth':
      this.page = 'game';
      this.startGame();
      this.update();
      return;
    default: return;
    }
  }
  
  isPaused() {
    if (this.page !== 'game') {
      return false;
    }
    return this.interval === null;
  }

  onPause() {
    if (this.page !== 'game') {
      return;
    }
    clearInterval(this.interval);
    this.interval = null;
    this.update();
  }

  onResume(delay = 3) {
    if (this.page !== 'game') {
      return;
    }
    this.unpausing = delay;
    this.interval = setInterval(() => {
      if (this.unpausing > 0) {
        --this.unpausing;
      } else {
        this.game.tick();
      }
      this.update();
    }, this.game.tickDuration());
    this.update();
  }

  onBackPage() {
    switch (this.page) {
    case 'labyrinth':
      this.page = 'level';
      this.setLevel(this.level);
      this.update();
      return;
    default: return;
    }
  }
  
  onUp() {
    switch(this.page) {
    case 'level':
      if (this.level < Game.tickDurations.length - 1) {
        this.setLevel(this.level + 1);
      }
      this.update();
      return;
    case 'labyrinth':
      if (this.labyrinth > 2) {
        this.labyrinth -= 3;
        localStorage.setItem('labyrinth', this.labyrinth);
      }
      this.update();
      return;
    case 'game':
      this.game.top();
      return;
    default:
      console.error('unknown page', this.page);
    }
  }

  onDown() {
    switch(this.page) {
    case 'level':
      if (this.level > 1) {
        this.setLevel(this.level - 1);
      }
      this.update();
      return;
    case 'labyrinth':
      if (this.labyrinth < assets.labyrinth.length - 3) {
        this.labyrinth += 3;
        localStorage.setItem('labyrinth', this.labyrinth);
      }
      this.update();
      return;
    case 'game':
      this.game.bottom();
      return;
    default:
      console.error('unknown page', this.page);
    }
  }

  onLeft() {
    switch(this.page) {
    case 'level':
      if (this.level > 1) {
        this.setLevel(this.level - 1);
      }
      this.update();
      return;
    case 'labyrinth':
      if (this.labyrinth > 0) {
        this.labyrinth -= 1;
        localStorage.setItem('labyrinth', this.labyrinth);
      }
      this.update();
      return;
    case 'game':
      this.game.left();
      return;
    default:
      console.error('unknown page', this.page);
    }
  }

  onRight() {
    switch(this.page) {
    case 'level':
      if (this.level < Game.tickDurations.length - 1) {
        this.setLevel(this.level + 1);
      }
      this.update();
      return;
    case 'labyrinth':
      if (this.labyrinth < assets.labyrinth.length - 1) {
        this.labyrinth += 1;
        localStorage.setItem('labyrinth', this.labyrinth);
      }
      this.update();
      return;
    case 'game':
      this.game.right();
      return;
    default:
      console.error('unknown page', this.page);
    }
  }
}

export { Frontend };
