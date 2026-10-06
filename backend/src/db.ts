import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { dirname, fromFileUrl } from '@std/path';

const __dirname = dirname(fromFileUrl(import.meta.url));

/** Корень проекта snake/ (backend/ -> ..) */
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Путь к SQLite. По умолчанию — `db.db` в корне проекта.
 * Переопределение: DB_PATH.
 */
export function resolveDbPath(): string {
  const env = Deno.env.get('DB_PATH');
  if (env) return path.resolve(env);
  return path.resolve(PROJECT_ROOT, 'db.db');
}

export type Db = DatabaseSync;

export function openDb(dbPath = resolveDbPath()): Db {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

/**
 * Неразрушающие миграции: индексы и UNIQUE-ограничение на user.
 * Сама схема (таблицы user/result) уже создана в db.db вручную.
 */
function migrate(db: Db): void {
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_vendor_code
      ON "user" (auth_vendor, auth_code);
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_result_score
      ON result (score DESC);
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_result_lab_level_score
      ON result (labyrinth, level, score DESC);
  `);
}
