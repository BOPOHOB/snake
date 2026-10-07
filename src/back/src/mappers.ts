import type { Db } from './db.ts';

/** Строка result из БД (сырая). */
export type ResultRow = {
  id: number;
  user_id: number;
  score: number;
  bands: Uint8Array;
  eatens: Uint8Array;
  tick_id: number;
  level: number;
  labyrinth: number;
  apple: string;
  bug: string;
  retryCounter: number;
  isWin: number;
};

/** Полный дамп результата (для /api/results и /api/result/:id). */
export type ResultDump = {
  id: number;
  user_id: number;
  user_name: string;
  score: number;
  bands: unknown;
  eatens: unknown;
  tick_id: number;
  level: number;
  labyrinth: number;
  apple: unknown;
  bug: unknown;
  retryCounter: number;
  isWin: boolean;
  head: number[];
};

const FIELD_W = 20;
const FIELD_H = 9;
const LABYRINTH_HEADS: number[][] = [
  [6, 4],
  [12, 4],
  [6, 4],
  [6, 5],
  [10, 7],
  [6, 4],
];

type Band = { tickId: number; direction: [number, number] };

/** Вычисляет head из bands + стартовой позиции лабиринта (без хранения в БД). */
function computeHead(bandsRaw: unknown, labyrinth: number, tickId: number): number[] {
  const bands = (Array.isArray(bandsRaw) ? bandsRaw : []) as Band[];
  let head = [...LABYRINTH_HEADS[labyrinth] ?? [0, 0]];
  for (let t = 1; t <= tickId; t++) {
    let dir: [number, number] = [1, 0];
    for (let b = bands.length - 1; b >= 0; b--) {
      if (bands[b].tickId <= t) {
        dir = bands[b].direction;
        break;
      }
    }
    head = [head[0] + dir[0], head[1] + dir[1]];
    if (head[0] < 0) head[0] += FIELD_W;
    if (head[1] < 0) head[1] += FIELD_H;
    if (head[0] === FIELD_W) head[0] = 0;
    if (head[1] === FIELD_H) head[1] = 0;
  }
  return head;
}

const RESULT_COLUMNS = `
  id, user_id, score, bands, eatens, tick_id, level, labyrinth, apple, bug, retryCounter, isWin
`;

export function selectResultColumns(): string {
  return RESULT_COLUMNS;
}

function decodeBlob(blob: Uint8Array): unknown {
  const text = new TextDecoder().decode(blob);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function decodeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function mapResult(
  db: Db,
  row: ResultRow,
  userName?: string,
): ResultDump {
  let name = userName;
  if (name === undefined) {
    const u = db
      .prepare(`SELECT name FROM "user" WHERE id = ?`)
      .get(row.user_id) as { name: string } | undefined;
    name = u?.name ?? '';
  }
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: name,
    score: row.score,
    bands: decodeBlob(row.bands),
    eatens: decodeBlob(row.eatens),
    tick_id: row.tick_id,
    level: row.level,
    labyrinth: row.labyrinth,
    apple: decodeJson(row.apple),
    bug: decodeJson(row.bug),
    retryCounter: row.retryCounter,
    isWin: Boolean(row.isWin),
    head: computeHead(decodeBlob(row.bands), row.labyrinth, row.tick_id),
  };
}

/** Тело POST /api/result/add — полный дамп результата без id. */
export type AddResultBody = {
  score: number;
  bands: unknown;
  eatens: unknown;
  tick_id: number;
  level: number;
  labyrinth: number;
  apple: unknown;
  bug: unknown;
  retryCounter: number;
  isWin: boolean;
};

export function parseAddBody(body: unknown): AddResultBody | string {
  if (typeof body !== 'object' || body === null) {
    return 'Invalid JSON body';
  }
  const raw = body as Record<string, unknown>;

  const score = Number(raw.score);
  if (!Number.isInteger(score) || score < 0) return 'Invalid score';

  const tick_id = Number(raw.tick_id);
  if (!Number.isInteger(tick_id) || tick_id < 0) return 'Invalid tick_id';

  const level = Number(raw.level);
  if (!Number.isInteger(level) || level < 0 || level > 15) return 'Invalid level';

  const labyrinth = Number(raw.labyrinth);
  if (!Number.isInteger(labyrinth) || labyrinth < 0 || labyrinth > 5) {
    return 'Invalid labyrinth';
  }

  const retryCounter = Number(raw.retryCounter);
  if (!Number.isInteger(retryCounter) || retryCounter < 0) {
    return 'Invalid retryCounter';
  }

  if (typeof raw.isWin !== 'boolean') return 'Invalid isWin';

  // bands/eatens/apple/bug — сериализуем в JSON; валидируем только что они есть.
  if (raw.bands === undefined || raw.bands === null) return 'Invalid bands';
  if (raw.eatens === undefined || raw.eatens === null) return 'Invalid eatens';
  if (raw.apple === undefined || raw.apple === null) {
    // apple может быть null (выигрыш) — ок, но должен быть передан явно
  }
  if (raw.bug === undefined || raw.bug === null) return 'Invalid bug';

  return {
    score,
    bands: raw.bands,
    eatens: raw.eatens,
    tick_id,
    level,
    labyrinth,
    apple: raw.apple ?? null,
    bug: raw.bug,
    retryCounter,
    isWin: raw.isWin,
  };
}

/** Кодирование JSON-значений в BLOB (UTF-8 байты) и TEXT. */
export function encodeBlob(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

export function encodeText(value: unknown): string {
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
    total: totalRow.c,
    before,
    after,
  };
}
