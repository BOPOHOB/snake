import type { Stamp } from './stamp';

/** Дамп результата (wire-формат). Расширяет Stamp серверными полями — без вложенности и дублирования. */
export type ResultDump = Stamp & {
  id: number;
  user_id: number;
  created_at: number;
};

/** Тело POST /api/result/add — сам Stamp. */
export type AddResultBody = Stamp;
