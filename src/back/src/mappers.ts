import type { Db } from './db.ts';
import type { Stamp, Direction, Point } from '../../front/types/stamp.ts';

/** Строка result из БД (сырая). Массивы — JSON-строки, скаляры — числа. */
export type ResultRow = {
  id: number;
  user_id: number;
  score: number;
  head: number;
  tick: number;
  level: number;
  labyrinth: number;
  retry_counter: number;
  is_win: number;
  bands: string;
  band_ticks: string;
  apples: string;
  apple_ticks: string;
  bugs: string;
  bug_ticks: string;
  bug_types: string;
  bug_eaten: string;
  bug_countdown: number;
  created_at: number;
};

/** Полный дамп результата (для /api/results и /api/result/:id). Расширяет Stamp
 *  серверными полями — без вложенности и дублирования. */
export type ResultDump = Stamp & {
  id: number;
  user_id: number;
  user_name: string;
  created_at: number;
};

const RESULT_COLUMNS = `
  id, user_id, score, head, tick, level, labyrinth, retry_counter, is_win,
  bands, band_ticks, apples, apple_ticks, bugs, bug_ticks, bug_types, bug_eaten, bug_countdown,
  created_at
`;

export function selectResultColumns(): string {
  return RESULT_COLUMNS;
}

function decodeArray<T>(text: string): T[] {
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v as T[] : [];
  } catch {
    return [];
  }
}

export function mapResult(
  db: Db,
  row: ResultRow,
): ResultDump {
  const u = db
    .prepare(`SELECT name FROM "user" WHERE id = ?`)
    .get(row.user_id) as { name: string } | undefined;
  const stamp: Stamp = {
    score: row.score,
    head: row.head as Point,
    tick: row.tick,
    level: row.level,
    labyrinth: row.labyrinth,
    retryCounter: row.retry_counter,
    isWin: Boolean(row.is_win),
    bands: decodeArray<Direction>(row.bands),
    bandTicks: decodeArray<number>(row.band_ticks),
    apples: decodeArray<Point>(row.apples),
    appleTicks: decodeArray<number>(row.apple_ticks),
    bugs: decodeArray<Point>(row.bugs),
    bugTicks: decodeArray<number>(row.bug_ticks),
    bugTypes: decodeArray<number>(row.bug_types),
    bugEaten: decodeArray<number>(row.bug_eaten),
    bugCountdown: row.bug_countdown,
  };
  return {
    ...stamp,
    id: row.id,
    user_id: row.user_id,
    user_name: u?.name ?? '',
    created_at: row.created_at,
  };
}

/** Валидирует Stamp-объект и возвращает его либо строку ошибки. */
export function parseAddBody(body: unknown): Stamp | string {
  if (typeof body !== 'object' || body === null) {
    return 'Invalid JSON body';
  }
  const s = body as Record<string, unknown>;

  const score = Number(s.score);
  if (!Number.isInteger(score) || score < 0) return 'Invalid stamp.score';

  const head = Number(s.head);
  if (!Number.isInteger(head) || head < 0) return 'Invalid stamp.head';

  const tick = Number(s.tick);
  if (!Number.isInteger(tick) || tick < 0) return 'Invalid stamp.tick';

  const level = Number(s.level);
  if (!Number.isInteger(level) || level < 0 || level > 15) return 'Invalid stamp.level';

  const labyrinth = Number(s.labyrinth);
  if (!Number.isInteger(labyrinth) || labyrinth < 0 || labyrinth > 5) {
    return 'Invalid stamp.labyrinth';
  }

  const retryCounter = Number(s.retryCounter);
  if (!Number.isInteger(retryCounter) || retryCounter < 0) {
    return 'Invalid stamp.retryCounter';
  }

  if (typeof s.isWin !== 'boolean') return 'Invalid stamp.isWin';

  const bugCountdown = Number(s.bugCountdown);
  if (!Number.isInteger(bugCountdown) || bugCountdown < 0) return 'Invalid stamp.bugCountdown';

  if (!Array.isArray(s.bands) || !Array.isArray(s.bandTicks)) return 'Invalid stamp.bands';
  if (!Array.isArray(s.apples) || !Array.isArray(s.appleTicks)) return 'Invalid stamp.apples';
  if (!Array.isArray(s.bugs) || !Array.isArray(s.bugTicks)) return 'Invalid stamp.bugs';
  if (!Array.isArray(s.bugTypes) || !Array.isArray(s.bugEaten)) return 'Invalid stamp.bugs';

  return body as Stamp;
}

/** Кодирование массива в JSON-строку (TEXT в SQLite, массив в Postgres). */
export function encodeArray(value: unknown): string {
  return JSON.stringify(value);
}

/** Ответ позиционного расчёта. */
export type PositionResponse = {
  level: number;
  labyrinth: number;
  score: number;
  position: number;
  total: number;
  before: number;
  after: number;
};

export function computePosition(
  db: Db,
  level: number,
  labyrinth: number,
  score: number,
  excludeId?: number,
): PositionResponse {
  const baseWhere = 'WHERE level = ? AND labyrinth = ?';
  const baseParams: Array<number | string> = [level, labyrinth];

  const beforeRow = db.prepare(
    `SELECT COUNT(*) AS c FROM result ${baseWhere} AND score > ?${
      excludeId !== undefined ? ' AND id <> ?' : ''
    }`,
  ).get(
    ...baseParams,
    score,
    ...(excludeId !== undefined ? [excludeId] : []),
  ) as { c: number };

  const afterRow = db.prepare(
    `SELECT COUNT(*) AS c FROM result ${baseWhere} AND score <= ?${
      excludeId !== undefined ? ' AND id <> ?' : ''
    }`,
  ).get(
    ...baseParams,
    score,
    ...(excludeId !== undefined ? [excludeId] : []),
  ) as { c: number };

  const totalRow = db.prepare(
    `SELECT COUNT(*) AS c FROM result ${baseWhere}${
      excludeId !== undefined ? ' AND id <> ?' : ''
    }`,
  ).get(
    ...baseParams,
    ...(excludeId !== undefined ? [excludeId] : []),
  ) as { c: number };

  const before = beforeRow.c;
  const after = afterRow.c;
  return {
    level,
    labyrinth,
    score,
    position: before + 1,
    total: totalRow.c + 1,
    before,
    after,
  };
}
