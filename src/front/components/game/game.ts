import type { Band, Bug, Direction, Point, Stamp } from '../../types/stamp';
import { assets } from './assets';

export type GameAchievementEvent = 'win' | 'no bug' | 'score';

class Game {
  static fieldSize: [number, number] = [20, 9];
  static defaultDirection: Direction = [1, 0];
  static bugFrequency = 5;
  static bugDuration = 20;
  static tickDurations = [
    10000, 1000, 500, 350, 310, 280, 250, 225, 200, 175, 150, 130, 110, 100,
    80, 65,
  ];

  static eqPoints = ([x1, y1]: Point, [x2, y2]: Point): boolean =>
    x1 === x2 && y1 === y2;

  static *fields(): Generator<Point> {
    for (let row = 0; row < Game.fieldSize[1]; ++row) {
      for (let col = 0; col < Game.fieldSize[0]; ++col) {
        yield [col, row];
      }
    }
  }

  static pointHash = ([x, y]: Point): number => (y << 10) + x;
  static hashPoint = (h: number): Point => [h % (1 << 10), h >> 10];

  static keepTorus = (p: Point): Point => {
    if (p[0] < 0) {
      p[0] += Game.fieldSize[0];
    }
    if (p[1] < 0) {
      p[1] += Game.fieldSize[1];
    }
    if (p[0] === Game.fieldSize[0]) {
      p[0] = 0;
    }
    if (p[1] === Game.fieldSize[1]) {
      p[1] = 0;
    }
    return p;
  };

  score = 0;
  bands: Band[] = [];
  head: Point;
  eatens = new Set<number>(
    new Array(7).fill(null).map((_, id) => -100 - id),
  );
  tickId = 0;
  apple: Point | null = null;
  level: number;
  labyrinth: number;
  bug: Bug = 5;
  gameover = false;
  isWin = false;
  onGameOver: Array<() => void> = [];
  retryCounter = 0;
  onAchievement?: (type: GameAchievementEvent, game: Game) => void;

  stamp(): Stamp {
    return {
      score: this.score,
      bands: this.bands,
      head: this.head,
      eatens: [...this.eatens],
      tickId: this.tickId,
      level: this.level,
      labyrinth: this.labyrinth,
      apple: this.apple,
      bug: this.bug,
      retryCounter: this.retryCounter,
      isWin: this.isWin,
    };
  }

  constructor(level?: number, labyrinth?: number) {
    this.labyrinth = labyrinth ?? 1;
    this.level = level ?? 1;
    this.head = assets.labyrinthHeads[this.labyrinth] as Point;
    this.allocateApple();
  }

  *emptyFields(): Generator<Point> {
    const result = new Set(
      [...Game.fields()]
        .filter((p) => !this.isLabyrinth(p))
        .map((p) => Game.pointHash(p)),
    );
    for (const [, point] of this.body()) {
      if (point) result.delete(Game.pointHash(point as Point));
    }
    if (Array.isArray(this.apple)) {
      result.delete(Game.pointHash(this.apple));
    }
    if (typeof this.bug === 'object') {
      result.delete(Game.pointHash(this.bug.pos));
      result.delete(Game.pointHash([this.bug.pos[0] + 1, this.bug.pos[1]]));
    }
    for (const point of result.values()) {
      yield Game.hashPoint(point);
    }
  }

  allocateApple(): void {
    const result = [...this.emptyFields()];
    if (result.length === 0) {
      this.apple = null;
      this.completeGame(true);
      this.onAchievement?.('win', this);
      return;
    }
    this.apple = result[Math.floor(Math.random() * result.length)];
  }

  randomBugPosition(): Point | null {
    const empty = new Set([...this.emptyFields()].map((p) => Game.pointHash(p)));
    const points = [...empty.values()].filter((v) => empty.has(v + 1));
    if (points.length === 0) {
      this.onAchievement?.('no bug', this);
      return null;
    }
    const result = points[Math.floor(Math.random() * points.length)];
    return Game.hashPoint(result);
  }

  isBug(point: Point): boolean {
    if (typeof this.bug !== 'object') {
      return false;
    }
    return (
      Game.eqPoints(this.bug.pos, point) ||
      Game.eqPoints([this.bug.pos[0] + 1, this.bug.pos[1]], point)
    );
  }

  isEmpty(point: Point): boolean {
    if (Array.isArray(this.apple) && Game.eqPoints(this.apple, point)) {
      return false;
    }
    if (this.isBug(point)) {
      return false;
    }
    if (this.isLabyrinth(point)) {
      return false;
    }
    return !this.isBody(point);
  }

  isLabyrinth(p: Point): boolean {
    return Boolean(assets.labyrinth[this.labyrinth]?.[p[1]]?.[p[0]]);
  }

  *body(): Generator<[number[] | null, number[] | null, number[] | null, boolean?]> {
    let prewPos: number[] | null = null;
    let prewPos2: number[] | null = null;
    const pos: number[] = [...this.head];
    let idx = 0;
    let bandIdx = this.bands.length - 1;
    while (idx < this.eatens.size) {
      while (bandIdx >= 0 && this.bands[bandIdx].tickId >= this.tickId - idx) {
        --bandIdx;
      }
      const direction = this.bands[bandIdx]?.direction ?? Game.defaultDirection;
      if (prewPos !== null) {
        yield [prewPos2, prewPos, [...pos], this.eatens.has(this.tickId - idx + 1)];
      }
      prewPos2 = prewPos ? [...prewPos] : null;
      prewPos = [...pos];
      pos[0] -= direction[0];
      pos[1] -= direction[1];
      Game.keepTorus(pos as Point);
      ++idx;
    }
    yield [prewPos2, prewPos, null];
  }

  isBody(point: Point, pos = 1): boolean {
    for (const v of this.body()) {
      if (v[pos] && Game.eqPoints(point, v[pos] as Point)) {
        return true;
      }
    }
    return false;
  }

  direction(): Direction {
    let actual = this.bands.length - 1;
    while (actual >= 0 && this.bands[actual].tickId > this.tickId) {
      --actual;
    }
    if (actual < 0) {
      return Game.defaultDirection;
    }
    return this.bands[actual].direction;
  }

  retry(stepsBack: number): void {
    const bodyArr = [...this.body()];
    const step = bodyArr[stepsBack]?.[1];
    if (step) this.head = [...step] as Point;
    this.tickId = Math.max(0, this.tickId - stepsBack);
    this.bands = this.bands.filter(({ tickId }) => tickId <= this.tickId);
    this.eatens = new Set([...this.eatens].filter((v) => v < this.tickId));
    this.gameover = false;
    this.retryCounter += 1;
  }

  directionOfLastStep(): Direction {
    return this.bands.at(-1)?.direction ?? Game.defaultDirection;
  }

  band(direction: Direction): void {
    if (Game.eqPoints(this.directionOfLastStep(), [-direction[0], -direction[1]] as Direction)) {
      return;
    }
    this.bands.push({
      direction,
      tickId: Math.max(
        this.tickId,
        (this.bands[this.bands.length - 1]?.tickId ?? 0) + 1,
      ),
    });
  }

  right(): void {
    this.band([1, 0]);
  }
  left(): void {
    this.band([-1, 0]);
  }
  bottom(): void {
    this.band([0, 1]);
  }
  top(): void {
    this.band([0, -1]);
  }

  eatenPredict(): boolean {
    if (this.apple === null) {
      return false;
    }
    const d = this.direction();
    const predictPos = Game.keepTorus([this.head[0] + d[0], this.head[1] + d[1]]);
    return Game.eqPoints(this.apple, predictPos) || this.isBug(predictPos);
  }

  tickDuration(): number {
    return Game.tickDurations[this.level];
  }

  completeGame(isWin: boolean): void {
    this.isWin = isWin;
    this.gameover = true;
    for (const callback of this.onGameOver) {
      callback();
    }
  }

  tick(): void {
    if (this.gameover) {
      return;
    }
    const d = this.direction();
    const headCandidate = Game.keepTorus([this.head[0] + d[0], this.head[1] + d[1]]);
    if (this.isBody(headCandidate, 0) || this.isLabyrinth(headCandidate)) {
      this.completeGame(false);
      return;
    }
    this.head = headCandidate;
    ++this.tickId;
    if (this.apple !== null && Game.eqPoints(this.apple, this.head)) {
      this.eatens.add(this.tickId);
      this.allocateApple();
      this.score += this.level + this.labyrinth * 3;
      this.onAchievement?.('score', this);
      if (typeof this.bug === 'number') {
        --this.bug;
        if (this.bug === 0) {
          const pos = this.randomBugPosition();
          if (pos === null) {
            this.bug = 1;
          } else {
            this.bug = {
              type: Math.floor(Math.random() * assets.bugs.length),
              remind: Game.bugDuration,
              pos,
            };
          }
        }
      }
    }
    if (typeof this.bug === 'object') {
      if (this.isBug(this.head)) {
        this.eatens.add(this.tickId);
        this.score += (this.level + this.labyrinth * 3) * (10 + this.bug.remind);
        this.bug = Game.bugFrequency;
      } else {
        --this.bug.remind;
        if (this.bug.remind === 0) {
          this.bug = Game.bugFrequency;
        }
      }
    }
  }
}

export { Game };
