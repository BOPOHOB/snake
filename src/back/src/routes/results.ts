import { Hono } from 'hono';
import type { Db } from '../db.ts';
import { mapResult, selectResultColumns, type ResultRow } from '../mappers.ts';

export function resultsRoutes(db: Db) {
  const app = new Hono();

  /**
   * GET /api/results?limit=1000
   * Топ-N результатов по всем лабиринтам. Полный дамп + user_name.
   * Сортировка: score DESC, id DESC (новее выше при равном счёте).
   */
  app.get('/', (c) => {
    const limitRaw = Number(c.req.query('limit') ?? 1000);
    const limit = Number.isInteger(limitRaw) && limitRaw > 0
      ? Math.min(limitRaw, 1000)
      : 1000;

    const rows = db
      .prepare(
        `SELECT ${selectResultColumns()} FROM result
         ORDER BY score DESC, id DESC
         LIMIT ?`,
      )
      .all(limit) as ResultRow[];

    // Один проход за именами пользователей (N мало, индекса достаточно).
    const dumps = rows.map((row) => mapResult(db, row));
    return c.json({ results: dumps });
  });

  return app;
}
