import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { dirname, fromFileUrl } from '@std/path';

const __dirname = dirname(fromFileUrl(import.meta.url));

/** Корень проекта snake/ (src/back/src/ -> ../../..) */
export const PROJECT_ROOT = path.resolve(__dirname, '../../..');

/**
 * Путь к SQLite. По умолчанию — `db.db` в корне проекта.
 * Переопределение: DB_PATH (относительные пути разрешаются от PROJECT_ROOT).
 */
export function resolveDbPath(): string {
  const env = Deno.env.get('DB_PATH');
  if (env) return path.isAbsolute(env) ? env : path.resolve(PROJECT_ROOT, env);
  return path.resolve(PROJECT_ROOT, 'db.db');
}

export type Db = DatabaseSync;

/** Открывает базу. Схему не создаёт — изменения вносятся полной очисткой базы (удалением файла). */
export function openDb(dbPath = resolveDbPath()): Db {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}
