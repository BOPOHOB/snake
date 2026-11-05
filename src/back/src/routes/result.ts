import { Hono } from 'hono';
import type { Db } from '../db.ts';
import type { AuthConfig } from '../auth/config.ts';
import { resolveAuthUser } from '../auth/session.ts';
import {
  computePosition,
  encodeArray,
  mapResult,
  parseAddBody,
  selectResultColumns,
  type ResultRow,
} from '../mappers.ts';

export function resultRoutes(db: Db, authConfig: AuthConfig | null) {
  const app = new Hono();

  /**
   * GET /api/result/position?level=&labyrinth=&score=
   * Публичная. Гипотетический расчёт позиции.
   */
  app.get('/position', (c) => {
    const level = Number(c.req.query('level'));
    const labyrinth = Number(c.req.query('labyrinth'));
    const score = Number(c.req.query('score'));

    if (!Number.isInteger(level) || level < 0 || level > 15) {
      return c.json({ error: 'Invalid level' }, 400);
    }
    if (!Number.isInteger(labyrinth) || labyrinth < 0 || labyrinth > 5) {
      return c.json({ error: 'Invalid labyrinth' }, 400);
    }
    if (!Number.isInteger(score) || score < 0) {
      return c.json({ error: 'Invalid score' }, 400);
    }

    return c.json(computePosition(db, level, labyrinth, score));
  });

  /**
   * POST /api/result/add
   * Авторизованная. Body = полный дамп. Сохраняет, отвечает как position
   * (исключая саму добавленную запись).
   */
  app.post('/add', async (c) => {
    if (!authConfig) {
      return c.json({ error: 'Auth is not configured' }, 503);
    }
    const user = await resolveAuthUser(c, authConfig, db);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = parseAddBody(body);
    if (typeof parsed === 'string') {
      return c.json({ error: parsed }, 400);
    }

    const info = (() => {
      try {
        return db.prepare(`
          INSERT INTO result (
            user_id, score, head, tick, level, labyrinth, retry_counter, is_win,
            bands, band_ticks, apples, apple_ticks, bugs, bug_ticks, bug_types, bug_eaten, bug_countdown,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          user.id,
          parsed.score,
          parsed.head,
          parsed.tick,
          parsed.level,
          parsed.labyrinth,
          parsed.retryCounter,
          parsed.isWin ? 1 : 0,
          encodeArray(parsed.bands),
          encodeArray(parsed.bandTicks),
          encodeArray(parsed.apples),
          encodeArray(parsed.appleTicks),
          encodeArray(parsed.bugs),
          encodeArray(parsed.bugTicks),
          encodeArray(parsed.bugTypes),
          encodeArray(parsed.bugEaten),
          parsed.bugCountdown,
          Math.floor(Date.now() / 1000),
        );
      } catch (err) {
        console.error('INSERT result failed:', err);
        throw err;
      }
    })();

    const id = Number(info.lastInsertRowid);
    return c.json({ ...computePosition(db, parsed.level, parsed.labyrinth, parsed.score, id), id });
  });

  /**
   * GET /api/result/:id
   * Публичная. Полный дамп одной записи. 404 если нет.
   */
  app.get('/:id', (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id < 1) {
      return c.json({ error: 'Invalid id' }, 400);
    }
    const row = db
      .prepare(`SELECT ${selectResultColumns()} FROM result WHERE id = ?`)
      .get(id) as ResultRow | undefined;
    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json(mapResult(db, row));
  });

  return app;
}
