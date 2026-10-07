/** Координата на поле [x, y]. */
export type Point = [number, number];

/** Вектор направления [dx, dy]. */
export type Direction = [number, number];

/** Полоса тела змейки: тик старта и направление. */
export type Band = {
  tickId: number;
  direction: Direction;
};

/** Баг: либо обратный отсчёт до спавна, либо активный баг на поле. */
export type Bug = number | { type: number; remind: number; pos: Point };

/** Полный слепок состояния игры (результат сериализации Game.stamp()). */
export type Stamp = {
  score: number;
  bands: Band[];
  head: Point;
  eatens: number[];
  tickId: number;
  level: number;
  labyrinth: number;
  apple: Point | null;
  bug: Bug;
  retryCounter: number;
  isWin: boolean;
};
