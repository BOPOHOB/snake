type Point = number;
type PointObject = [number, number];

const objectPoint = ([x, y]: PointObject): number => (y << 10) + x;
const pointObject = (h: number): PointObject => [h % (1 << 10), h >> 10];

// top, right, bottom, top всё как в css, но массив выдавать слишком расточительно. Теперь enum
type Direction = 0 | 1 | 2 | 3;

const neighbors = (p: Point): [Point, Point, Point, Point] => [
  p - (1 << 10),
  p + 1,
  p + (1 << 10),
  p - 1
];

const directionObject = (d: Direction): PointObject => ([
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0]
] as PointObject[])[d];

const directionPoint = (d: Direction): number => [
  -1 << 10,
  1,
  1 << 10,
  -1
][d];

const isOppositeDirection = (a: Direction, b: Direction) => b === a - 2 || b === a + 2;

/** Полный слепок состояния игры (результат сериализации Game.stamp()). */
type Stamp = {
  // Счет теперь выводим из остальной совокупности данных но алгоритм сложный, кеширование нужно
  score: number;
  // куда приползла голова. Двигаясь назад по яблокам и жукам можно понять и длину змеи и всю историю игры
  head: Point;
  tick: number;
  level: number;
  labyrinth: number;
  retryCounter: number;
  isWin: boolean;
  
  // Есть ассоциированные данные, которые удобно бы было хранить в виде массива объектов но для экономии памяти создаётся 2 массива из примитивных данных
  bands: Direction[];
  bandTicks: number[];

  // Теперь хранятся все координаты яблок появившихся за игру
  apples: Point[];
  appleTicks: number[];

  // и все времена появления жуков, если 
  bugs: Point[];
  bugTicks: number[];
  bugTypes: number[];
  bugEaten: number[];
  bugCountdown: number;
};

export {
  type Point,
  type PointObject,
  type Direction,
  objectPoint,
  pointObject,
  directionObject,
  directionPoint,
  isOppositeDirection,
  neighbors,
  type Stamp
};
