type Point = number;
type PointObject = [number, number];

const objectPoint = ([x, y]: PointObject): number => (y << 10) + x;
// Распаковка с детекцией перекрёстного заёма: при p-1 с x=0 упаковка даёт x=1023, y-1.
// Если x > 512 — это заём, восстанавливаем: x -= 1024 (→ -1), y += 1 (вернуть заём из y).
// Для валидных точек (x < W <= 512) восстановление не срабатывает.
const pointObject = (p: number): PointObject => {
  let x = p & ((1 << 10) - 1);
  let y = p >> 10;
  if (x > (1 << 9)) {
    x -= 1 << 10;
    y += 1;
  }
  return [x, y];
};

// top, right, bottom, top всё как в css, но массив выдавать слишком расточительно. Теперь enum
type Direction = 0 | 1 | 2 | 3;

// Положительный модуль без веток: работает для отрицательных n.
const pmod = (n: number, m: number): number => ((n % m) + m) % m;

const directionObject = (d: Direction): PointObject => ([
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0]
] as PointObject[])[d];

// Заворачивает упакованную точку p по тору size. Шаг направления уже прибавлен снаружи
// (через directionPoint), поэтому здесь только распаковка, двойной pmod и упаковка обратно.
const keepTorus = (p: Point, size: Point): Point => {
  const [w, h] = pointObject(size);
  const [x, y] = pointObject(p);
  return (pmod(y, h) << 10) + pmod(x, w);
};

const neighbors = (p: Point): [Point, Point, Point, Point] => [
  p - (1 << 10),
  p + 1,
  p + (1 << 10),
  p - 1
];

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
  keepTorus,
  type Stamp
};
