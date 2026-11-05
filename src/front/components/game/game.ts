import { directionPoint, isOppositeDirection, keepTorus, neighbors, objectPoint, pointObject, type Direction, type Point, type Stamp } from '../../types/stamp';
import { assets } from './assets';

export type GameAchievementEvent = 'win' | 'no bug' | 'score';

class Game {
  static readonly defaultDirection: Direction = 1;
  static readonly initialSnakeLength = 6;
  static readonly bugFrequency = 5;
  static readonly bugDuration = 20;
  static readonly tickDurations = [
    10000, 1000, 500, 350, 310, 280, 250, 225, 200, 175, 150, 130, 110, 100,
    80, 65,
  ];

  *fields(): Generator<Point> {
    const [w, h] = pointObject(this.fieldSize);
    for (let row = 0; row < h; ++row) {
      const r = objectPoint([0, row]);
      for (let col = 0; col < w; ++col) {
        yield r + col;
      }
    }
  }

  get fieldSize() {
    return assets.labyrinthSizes[this.stamp.labyrinth];
  }

  keepTorus = (p: Point): Point => {
    return keepTorus(p, this.fieldSize);
  };

  gameOver = false;
  onGameOver: Array<() => void> = [];
  onAchievement?: (type: GameAchievementEvent, game: Game) => void;

  stamp: Stamp;

  constructor(level?: number, labyrinth?: number) {
    this.stamp = {
      score: 0,
      head: assets.labyrinthHeads[labyrinth ?? 1],
      tick: 0,
      level: level ?? 1,
      labyrinth: labyrinth ?? 1,
      retryCounter: 0,
      isWin: false,
      
      bands: [],
      bandTicks: [],
    
      apples: [],
      appleTicks: [],
    
      bugs: [],
      bugTicks: [],
      bugTypes: [],
      bugEaten: [],
      bugCountdown: Game.bugFrequency,
    }
    this.allocateApple();
  }

  get apple(): Point | null {
    return this.stamp.apples.at(-1) ?? null;
  }

  get isBugInGame(): boolean {
    return this.stamp.bugCountdown === 0;
  }

  get bug(): Point | null {
    if (this.isBugInGame) {
      return this.stamp.bugs.at(-1)!;
    }
    return null;
  }

  get bugRemind(): number | null {
    if (this.isBugInGame) {
      return this.stamp.bugTicks.at(-1)! + Game.bugDuration - this.stamp.tick;
    }
    return null;
  }

  get bugType(): number | null {
    if (this.isBugInGame) {
      return this.stamp.bugTypes.at(-1)!;
    }
    return null;
  }

  *emptyFields(): Generator<Point> {
    const body = new Set(Array.from(this.body(), ([_, point]) => point));
    const { apple, bug } = this;
    for (const point of this.fields()) {
      if (
        this.isLabyrinth(point)
        || point === apple
        || point === bug
        || bug !== null && point === bug + 1
        || body.has(point)
      ) {} else {
        yield point;
      }
    }
  }

  allocateApple(): void {
    const result = [...this.emptyFields()];
    if (result.length === 0) {
      this.completeGame(true);
      this.onAchievement?.('win', this);
      return;
    }
    const { stamp } = this;
    stamp.apples.push(result[Math.floor(Math.random() * result.length)]);
    stamp.appleTicks.push(stamp.tick);
  }

  randomBugPosition(): Point | null {
    const empty = new Set([...this.emptyFields()]);
    const reachable = new Set<Point>();
    let front = new Set<Point>([this.stamp.head]);
    let waves = Game.bugDuration;
    while (front.size && waves) {
      const nextFront = new Set<Point>();
      waves -= 1;
      for (const point of front) {
        reachable.add(point);
        for (const neighbor of neighbors(point).map(this.keepTorus)) {
          if (!reachable.has(neighbor) && !front.has(neighbor) && empty.has(neighbor)) {
            nextFront.add(neighbor);
          }
        }
      }
      front = nextFront;
    }
    const points = [...reachable.values()].filter((v) => empty.has(v + 1));
    if (points.length === 0) {
      this.onAchievement?.('no bug', this);
      return null;
    }
    return points[Math.floor(Math.random() * points.length)];
  }

  isBug(point: Point): boolean {
    const { bug } = this;
    if (bug === null) {
      return false;
    }
    return bug === point || bug + 1 === point;
  }

  isEmpty(point: Point): boolean {
    if (this.apple === point) {
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
    return Boolean(assets.labyrinth[this.stamp.labyrinth]?.[p >> 10]?.[p % (1 << 10)]);
  }

  *body(): Generator<[Point | null, Point | null, Point | null, boolean?]> {
    let prwPos: Point | null = null;
    let prwPos2: Point| null = null;
    const { stamp } = this;
    let pos: Point = stamp.head;
    let idx = 0;
    let bandIdx = stamp.bands.length - 1;
    let appleCur = stamp.apples.length - 2;
    let bugCur = stamp.bugEaten.length - 1;
    const snakeLength = stamp.apples.length + Game.initialSnakeLength;
    while (idx < snakeLength) {
      const backwardTick = stamp.tick - idx;
      while (bandIdx >= 0 && stamp.bandTicks[bandIdx] >= backwardTick) {
        --bandIdx;
      }
      if (stamp.appleTicks[appleCur] === backwardTick) {
        appleCur -= 1;
      }
      const direction = stamp.bands[bandIdx] ?? Game.defaultDirection;
      if (prwPos !== null) {
        yield [prwPos2, prwPos, pos, stamp.apples[appleCur] === prwPos || stamp.bugEaten[bugCur] === backwardTick];
      }
      if (stamp.bugEaten[bugCur] === backwardTick) {
        bugCur -= 1;
      }
      prwPos2 = prwPos;
      prwPos = pos;
      pos = this.keepTorus(pos - directionPoint(direction));
      ++idx;
    }
    yield [prwPos2, prwPos, null];
  }

  isBody(point: Point, pos = 1): boolean {
    for (const v of this.body()) {
      if (point === v[pos]) {
        return true;
      }
    }
    return false;
  }

  direction(): Direction {
    let actual = this.stamp.bands.length - 1;
    while (actual >= 0 && this.stamp.bandTicks[actual] > this.stamp.tick) {
      --actual;
    }
    if (actual < 0) {
      return Game.defaultDirection;
    }
    return this.stamp.bands[actual];
  }

  retry(stepsBack: number): void {
    const bodyArr = [...this.body()];
    const step = bodyArr[stepsBack]?.[1];
    const { stamp } = this;
    if (step) stamp.head = step;
    stamp.tick = Math.max(0, stamp.tick - stepsBack);

    const bandsLimit = stamp.bandTicks.findIndex(tick => tick > stamp.tick);
    if (bandsLimit >= 0) {
      stamp.bands.length = bandsLimit;
      stamp.bandTicks.length = bandsLimit;
    }

    const appleLimit = stamp.appleTicks.findIndex(tick => tick > stamp.tick);
    if (appleLimit >= 0) {
      stamp.apples.length = appleLimit;
      stamp.appleTicks.length = appleLimit;
    }
    
    const bugsLimit = stamp.bugTicks.findIndex(tick => tick > stamp.tick);
    if (bugsLimit >= 0) {
      stamp.bugs.length = bugsLimit;
      stamp.bugTicks.length = bugsLimit;
      stamp.bugTypes.length = bugsLimit;
    }

    const eatenLimit = stamp.bugEaten.findIndex(tick => tick > stamp.tick);
    if (eatenLimit >= 0) {
      stamp.bugEaten.length = eatenLimit;
    }

    // при воскрешении пока сжегаем муху, потом отладим
    stamp.bugCountdown = Game.bugFrequency;

    this.gameOver = false;
    stamp.retryCounter += 1;
  }

  directionOfLastStep(): Direction {
    return this.stamp.bands.at(-1) ?? Game.defaultDirection;
  }

  band(direction: Direction): void {
    if (isOppositeDirection(this.directionOfLastStep(), direction)) {
      return;
    }
    this.stamp.bands.push(direction);
    this.stamp.bandTicks.push(
      Math.max(
        this.stamp.tick,
        (this.stamp.bandTicks.at(-1) ?? 0) + 1,
      ),
    );
  }

  top(): void {
    this.band(0);
  }
  right(): void {
    this.band(1);
  }
  bottom(): void {
    this.band(2);
  }
  left(): void {
    this.band(3);
  }

  eatenPredict(): boolean {
    if (this.apple === null) {
      return false;
    }
    const d = this.direction();
    const predictPos = this.keepTorus(this.stamp.head + directionPoint(d));
    return this.apple === predictPos || this.isBug(predictPos);
  }

  tickDuration(): number {
    return Game.tickDurations[this.stamp.level];
  }

  completeGame(isWin: boolean): void {
    this.stamp.isWin = isWin;
    this.gameOver = true;
    for (const callback of this.onGameOver) {
      callback();
    }
  }

  tick(): void {
    if (this.gameOver) {
      return;
    }
    const d = this.direction();
    const { stamp } = this;
    const headCandidate = this.keepTorus(stamp.head + directionPoint(d));
    if (this.isBody(headCandidate, 0) || this.isLabyrinth(headCandidate)) {
      this.completeGame(false);
      return;
    }
    stamp.head = headCandidate;
    ++stamp.tick;
    if (this.apple === stamp.head) {
      this.allocateApple();
      stamp.score += stamp.level + stamp.labyrinth * 3;
      this.onAchievement?.('score', this);
      if (!this.isBugInGame) {
        --stamp.bugCountdown;
        if (stamp.bugCountdown === 0) {
          const pos = this.randomBugPosition();
          if (pos === null) {
            stamp.bugCountdown = 1;
          } else {
            stamp.bugs.push(pos);
            stamp.bugTypes.push(Math.floor(Math.random() * assets.bugs.length));
            stamp.bugTicks.push(stamp.tick);
          }
        }
      }
    }
    if (this.isBugInGame) {
      const remind = this.bugRemind!;
      if (this.isBug(stamp.head)) {
        stamp.score += (stamp.level + stamp.labyrinth * 3) * (10 + remind);
        stamp.bugEaten.push(stamp.tick - 1);
        stamp.bugCountdown = Game.bugFrequency;
      } else {
        if (remind === 0) {
          stamp.bugCountdown = Game.bugFrequency;
        }
      }
    }
  }
}

export { Game };
