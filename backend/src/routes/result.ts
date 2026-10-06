import { Hono } from 'hono';
import type { Db } from '../db.ts';
import type { AuthConfig } from '../auth/config.ts';
import { resolveAuthUser } from '../auth/session.ts';
import {
  computePosition,
  encodeBlob,
  encodeText,
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

    const info = db.prepare(`
      INSERT INTO result (
        user_id, score, bands, eatens, tick_id, level, labyrinth,
        apple, bug, retryCounter, isWin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      parsed.score,
      encodeBlob(parsed.bands),
      encodeBlob(parsed.eatens),
      parsed.tick_id,
      parsed.level,
      parsed.labyrinth,
      encodeText(parsed.apple),
      encodeText(parsed.bug),
      parsed.retryCounter,
      parsed.isWin ? 1 : 0,
    );

    const id = Number(info.lastInsertRowid);
    return c.json(computePosition(db, parsed.level, parsed.labyrinth, parsed.score, id));
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
