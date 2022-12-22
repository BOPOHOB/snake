import { Game } from './game';
import { assets } from './assets';

class Frontend {
  game = null;
  lavel;
  labyrinth = 1;
  page = 'lavel';
  interval;
  demoHead = [13, 6];
  unpausing = 0;
  update;
  onGameOver = [];

  setLavel(value) {
    this.lavel = value;
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.demoHead[0] += 1;
      Game.keepTorus(this.demoHead);
      this.update();
    }, Game.tickDurations[this.lavel]);
  }

  startGame() {
    this.game = new Game(this.lavel, this.labyrinth);
    this.game.onGameOver.push(() => {
      this.onGameOver.forEach((callback) => callback(this.game));
      clearInterval(this.interval);
    });
    this.onResume(0);
  }

  onNextPage() {
    switch (this.page) {
    case 'lavel':
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
      this.page = 'lavel';
      this.setLavel(this.lavel);
      this.update();
      return;
    default: return;
    }
  }
  
  onUp() {
    switch(this.page) {
    case 'lavel':
      if (this.lavel < Game.tickDurations.length - 1) {
        this.setLavel(this.lavel + 1);
      }
      this.update();
      return;
    case 'labyrinth':
      if (this.labyrinth > 2) {
        this.labyrinth -= 3;
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
    case 'lavel':
      if (this.lavel > 1) {
        this.setLavel(this.lavel - 1);
      }
      this.update();
      return;
    case 'labyrinth':
      if (this.labyrinth < assets.labyrinth.length - 3) {
        this.labyrinth += 3;
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
    case 'lavel':
      if (this.lavel > 1) {
        this.setLavel(this.lavel - 1);
      }
      this.update();
      return;
    case 'labyrinth':
      if (this.labyrinth > 0) {
        this.labyrinth -= 1;
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
    case 'lavel':
      if (this.lavel < Game.tickDurations.length - 1) {
        this.setLavel(this.lavel + 1);
      }
      this.update();
      return;
    case 'labyrinth':
      if (this.labyrinth < assets.labyrinth.length - 1) {
        this.labyrinth += 1;
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
