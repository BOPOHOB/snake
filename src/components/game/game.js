import { assets } from './assets';
import { achivements } from 'services/achivements';

class Game {
  static fieldSize = [20, 9];
  static defaultDirection = [1, 0];
  static bugFrequency = 5;
  static bugDuration = 20;
  static tickDurations = [10000, 1000, 500, 350, 250, 150, 100, 75, 60, 45, 35, 30, 25, 20, 15, 13];
  static eqPoints = ([x1, y1], [x2, y2]) => x1 === x2 && y1 === y2;
  static *fields() {
    for (let row = 0; row < Game.fieldSize[1]; ++row) {
      for (let col = 0; col < Game.fieldSize[0]; ++col) {
        yield [col, row];
      }
    }
  }
  static pointHash = ([x, y]) => (y << 10) + x;
  static hashPoint = (h) => [h % (1 << 10), h >> 10];

  static keepTorus = (p) => {
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
  bands = [];
  head;
  eatens = new Set(new Array(7).fill(null).map((_, id) => -100 - id));
  tickId = 0;
  apple;
  lavel;
  labyrinth;
  bug = 5;
  gameover = false;
  isWin = false;
  onGameOver = [];
  retryCounter = 0;

  stamp() {
    return {
      score: this.score,
      bands: this.bands,
      head: this.head,
      eatens: [...this.eatens],
      tickId: this.tickId,
      lavel: this.lavel,
      labyrinth: this.labyrinth,
      apple: this.apple,
      bug: this.bug,
      retry: this.retryCounter,
      isWin: this.isWin,
    };
  }

  constructor(lavel, labyrinth) {
    this.labyrinth = labyrinth ?? 1;
    this.lavel = lavel ?? 1;
    this.head = assets.labyrinthHeads[this.labyrinth];
    this.allocateApple();
  }

  *emptyFields() {
    const result = new Set([...Game.fields()].filter((p) => !this.isLabyrinth(p)).map(Game.pointHash));
    // eslint-disable-next-line no-unused-vars
    for (const [_, point] of this.body()) {
      result.delete(Game.pointHash(point));
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

  allocateApple() {
    let result = [...this.emptyFields()];
    if (result.length === 0) {
      this.apple = null;
      this.completeGame(true);
      achivements.accept('win', this);
      return;
    }
    this.apple = result[Math.floor(Math.random() * result.length)];
  }

  randomBugPosition() {
    let empty = new Set([...this.emptyFields()].map(Game.pointHash));
    let points = [...empty.values()].filter((v) => empty.has(v + 1));
    if (points.length === 0) {
      achivements.accept('no bug');
      return null;
    }
    const result = points[Math.floor(Math.random() * points.length)];
    return Game.hashPoint(result);
  }

  isBug(point) {
    if (typeof this.bug !== 'object') {
      return false;
    }
    return Game.eqPoints(this.bug.pos, point) || Game.eqPoints([this.bug.pos[0] + 1, this.bug.pos[1]], point);
  }

  isEmpty(point) {
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

  isLabyrinth(p) {
    return assets.labyrinth[this.labyrinth]?.[p[1]]?.[p[0]];
  }

  *body() {
    let prewPos = null;
    let prewPos2 = null;
    let pos = [...this.head];
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
      Game.keepTorus(pos);
      ++idx;
    }
    yield [prewPos2, prewPos, null];
  }

  isBody(point, pos = 1) {
    for (const v of this.body()) {
      if (v[pos] && Game.eqPoints(point, v[pos])) {
        return true;
      }
    }
    return false;
  }

  direction() {
    let actual = this.bands.length - 1;
    while (actual >= 0 && this.bands[actual].tickId > this.tickId) {
      --actual;
    }
    if (actual < 0) {
      return Game.defaultDirection;
    }
    return this.bands[actual].direction;
  }

  retry(stepsBack) {
    this.head = [...this.body()][stepsBack][1];
    this.tickId = Math.max(0, this.tickId - 10);
    this.bands = this.bands.filter(({ tickId }) => tickId <= this.tickId);
    this.eatens = new Set([...this.eatens].filter((v) => v < this.tickId));
    this.gameover = false;
    this.retryCounter += 1;
  }

  directinOfLastStep() {
    return this.bands[this.bands.length - 1]?.direction ?? Game.defaultDirection;
  }

  band(direction) {
    if (Game.eqPoints(this.directinOfLastStep(), [-direction[0], -direction[1]])) {
      return;
    }
    this.bands.push({
      direction,
      tickId: Math.max(this.tickId, (this.bands[this.bands.length - 1]?.tickId ?? 0) + 1)
    });
  }

  right() {
    this.band([1, 0]);
  }

  left() {
    this.band([-1, 0]);
  }

  bottom() {
    this.band([0, 1]);
  }

  top() {
    this.band([0, -1]);
  }

  eatenPredict() {
    if (this.apple === null) {
      return false;
    }
    const d = this.direction();
    const predictPos = Game.keepTorus([this.head[0] + d[0], this.head[1] + d[1]]);
    return Game.eqPoints(this.apple, predictPos) || this.isBug(predictPos);
  }

  tickDuration() {
    return Game.tickDurations[this.lavel];
  }

  completeGame(isWin) {
    this.isWin = isWin;
    this.gameover = true;
    for (const callback of this.onGameOver) {
      callback();
    }
  }

  tick() {
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
    if (Game.eqPoints(this.apple, this.head)) {
      this.eatens.add(this.tickId);
      this.allocateApple();
      this.score += this.lavel + this.labyrinth;
      achivements.accept('score', this);
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
        this.score += (this.lavel + this.labyrinth) * (10 + this.bug.remind);
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
