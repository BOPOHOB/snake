import { Game } from './game';
import { assets } from './assets';
import { achievements } from '../../services/achivements/achivements.ts';
import { keepTorus, objectPoint, type Point } from '../../types/stamp';

class Frontend {
  game: Game | null = null;
  level: number;
  labyrinth: number;
  page: 'level' | 'labyrinth' | 'game' = 'level';
  interval: ReturnType<typeof setInterval> | null = null;
  demoHead: Point = objectPoint([13, 6]);
  unpausing = 0;
  update?: () => void;
  #onGameOver: Array<(game: Game) => void> = [];

  constructor() {
    // Дефолты без localStorage — иначе SSR (level=1) ≠ гидрация (level из LS) → #418.
    this.level = 1;
    this.labyrinth = 1;
  }

  setLevel(value: number): void {
    this.level = value;
    localStorage.setItem('level', String(value));
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.demoHead = keepTorus(this.demoHead + 1, assets.labyrinthSizes[0]);
      this.update?.();
    }, Game.tickDurations[this.level]);
  }

  startGame(): void {
    this.attachGame(new Game(this.level, this.labyrinth));
    achievements.accept('started', this.game!.stamp);
    this.onResume(0);
  }

  /** Привязывает готовую игру (новую или восстановленную из дампа) к фронту: */
  /** onAchievement, onGameOver → #onGameOver, очистка interval по game over. */
  attachGame(game: Game): void {
    this.game = game;
    game.onAchievement = (type) => achievements.accept(type, game.stamp);
    game.onGameOver.push(() => {
      this.#onGameOver.forEach((callback) => callback(this.game!));
      if (this.interval) clearInterval(this.interval);
    });
  }

  onGameOver(callback: (game: Game) => void): () => void {
    this.#onGameOver.push(callback);
    return () => {
      const i = this.#onGameOver.indexOf(callback);
      if (i >= 0) this.#onGameOver.splice(i, 1);
    };
  }

  onNextPage = (): void => {
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

  onPause = (): void => {
    if (this.page !== 'game') {
      return;
    }
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.update?.();
  }

  onResume = (delay = 3): void => {
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

  onBackPage = (): void => {
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

  onUp = (): void => {
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

  onDown = (): void => {
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

  onLeft = (): void => {
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

  onRight = (): void => {
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

  onLT = () => {
    console.log(this.game?.direction);
    (this.game!.direction() % 2 === 1 ? this.onUp : this.onLeft)();
  }
  onLB = () => {
    (this.game!.direction() % 2 === 1 ? this.onDown : this.onLeft)();
  }
  onRT = () => {
    (this.game!.direction() % 2 === 1 ? this.onUp : this.onRight)();
  }
  onRB = () => {
    (this.game!.direction() % 2 === 1 ? this.onDown : this.onRight)();
  }
}

export { Frontend };
