import { Game } from './game';
import { assets } from './assets';
import { achievements } from '../../services/achievements';
import type { Point } from '../../types/stamp';

class Frontend {
  game: Game | null = null;
  level: number;
  labyrinth: number;
  page: 'level' | 'labyrinth' | 'game' = 'level';
  interval: ReturnType<typeof setInterval> | null = null;
  demoHead: Point = [13, 6];
  unpausing = 0;
  update?: () => void;
  onGameOver: Array<(game: Game) => void> = [];

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.level = Number(localStorage.getItem('level') ?? 1);
      this.labyrinth = Number(localStorage.getItem('labyrinth') ?? 1);
    } else {
      this.level = 1;
      this.labyrinth = 1;
    }
  }

  setLevel(value: number): void {
    this.level = value;
    localStorage.setItem('level', String(value));
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.demoHead[0] += 1;
      Game.keepTorus(this.demoHead);
      this.update?.();
    }, Game.tickDurations[this.level]);
  }

  startGame(): void {
    this.game = new Game(this.level, this.labyrinth);
    this.game.onAchievement = (type, g) => achievements.accept(type, g);
    achievements.accept('started', this.game);
    this.game.onGameOver.push(() => {
      this.onGameOver.forEach((callback) => callback(this.game!));
      if (this.interval) clearInterval(this.interval);
    });
    this.onResume(0);
  }

  onNextPage(): void {
    switch (this.page) {
      case 'level':
        if (this.interval) clearInterval(this.interval);
        this.page = 'labyrinth';
        this.update?.();
        return;
      case 'labyrinth':
        this.page = 'game';
        this.startGame();
        this.update?.();
        return;
      default:
        return;
    }
  }

  isPaused(): boolean {
    if (this.page !== 'game') {
      return false;
    }
    return this.interval === null;
  }

  onPause(): void {
    if (this.page !== 'game') {
      return;
    }
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.update?.();
  }

  onResume(delay = 3): void {
    if (this.page !== 'game' || this.game === null) {
      return;
    }
    this.unpausing = delay;
    this.interval = setInterval(() => {
      if (this.unpausing > 0) {
        --this.unpausing;
      } else {
        this.game!.tick();
      }
      this.update?.();
    }, this.game.tickDuration());
    this.update?.();
  }

  onBackPage(): void {
    switch (this.page) {
      case 'labyrinth':
        this.page = 'level';
        this.setLevel(this.level);
        this.update?.();
        return;
      default:
        return;
    }
  }

  onUp(): void {
    switch (this.page) {
      case 'level':
        if (this.level < Game.tickDurations.length - 1) {
          this.setLevel(this.level + 1);
        }
        this.update?.();
        return;
      case 'labyrinth':
        if (this.labyrinth > 2) {
          this.labyrinth -= 3;
          localStorage.setItem('labyrinth', String(this.labyrinth));
        }
        this.update?.();
        return;
      case 'game':
        this.game?.top();
        return;
      default:
        console.error('unknown page', this.page);
    }
  }

  onDown(): void {
    switch (this.page) {
      case 'level':
        if (this.level > 1) {
          this.setLevel(this.level - 1);
        }
        this.update?.();
        return;
      case 'labyrinth':
        if (this.labyrinth < assets.labyrinth.length - 3) {
          this.labyrinth += 3;
          localStorage.setItem('labyrinth', String(this.labyrinth));
        }
        this.update?.();
        return;
      case 'game':
        this.game?.bottom();
        return;
      default:
        console.error('unknown page', this.page);
    }
  }

  onLeft(): void {
    switch (this.page) {
      case 'level':
        if (this.level > 1) {
          this.setLevel(this.level - 1);
        }
        this.update?.();
        return;
      case 'labyrinth':
        if (this.labyrinth > 0) {
          this.labyrinth -= 1;
          localStorage.setItem('labyrinth', String(this.labyrinth));
        }
        this.update?.();
        return;
      case 'game':
        this.game?.left();
        return;
      default:
        console.error('unknown page', this.page);
    }
  }

  onRight(): void {
    switch (this.page) {
      case 'level':
        if (this.level < Game.tickDurations.length - 1) {
          this.setLevel(this.level + 1);
        }
        this.update?.();
        return;
      case 'labyrinth':
        if (this.labyrinth < assets.labyrinth.length - 1) {
          this.labyrinth += 1;
          localStorage.setItem('labyrinth', String(this.labyrinth));
        }
        this.update?.();
        return;
      case 'game':
        this.game?.right();
        return;
      default:
        console.error('unknown page', this.page);
    }
  }
}

export { Frontend };
