import { Hono } from 'hono';
import type { Db } from '../db.ts';
import type { AuthConfig } from '../auth/config.ts';
import { resolveAuthUser } from '../auth/session.ts';
import { mapResult, selectResultColumns, type ResultRow } from '../mappers.ts';

/** Топ-N в каждой корзине (labyrinth × level × resurrected). */
const TOP_PER_BUCKET = 10;

/**
 * GET /api/results
 * «Лучшие»: ∪ топ-10 по score в каждой корзине
 *   (labyrinth 0..5, level 1..15, resurrected retry_counter=0 / >0).
 * Если запрос авторизован — плюс все результаты этого user_id.
 * Без query limit: размер ограничен корзинами (~1800) + играми пользователя.
 */
export function resultsRoutes(db: Db, authConfig: AuthConfig | null) {
  const app = new Hono();

  app.get('/', async (c) => {
    const bestRows = db
      .prepare(
        `
        WITH ranked AS (
          SELECT
            ${selectResultColumns()},
            ROW_NUMBER() OVER (
              PARTITION BY labyrinth, level,
                CASE WHEN retry_counter = 0 THEN 0 ELSE 1 END
              ORDER BY score DESC, id DESC
            ) AS rn
          FROM result
          WHERE level BETWEEN 1 AND 15
        )
        SELECT ${selectResultColumns()}
        FROM ranked
        WHERE rn <= ?
        `,
      )
      .all(TOP_PER_BUCKET) as ResultRow[];

    const byId = new Map<number, ResultRow>();
    for (const row of bestRows) {
      byId.set(row.id, row);
    }

    if (authConfig) {
      const user = await resolveAuthUser(c, authConfig, db);
      if (user) {
        const mine = db
          .prepare(
            `SELECT ${selectResultColumns()} FROM result WHERE user_id = ?`,
          )
          .all(user.id) as ResultRow[];
        for (const row of mine) {
          byId.set(row.id, row);
        }
      }
    }

    const dumps = [...byId.values()].map((row) => mapResult(db, row));
    return c.json({ results: dumps });
  });

  return app;
}
