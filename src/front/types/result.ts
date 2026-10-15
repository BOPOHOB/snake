import type { Bug, Point, Stamp } from './stamp';

/** Дамп результата (wire-формат, snake_case как в бекенде). */
export type ResultDump = {
  id: number;
  user_id: number;
  user_name: string;
  score: number;
  bands: Stamp['bands'] | null;
  eatens: Stamp['eatens'] | null;
  tick_id: number;
  level: number;
  labyrinth: number;
  apple: Point | null;
  bug: Bug | null;
  retryCounter: number;
  isWin: boolean;
  head: Point;
  created_at: number;
};

/** Тело POST /api/result/add — дамп без id, user-полей, head и created_at (считает бекенд). */
export type AddResultBody = Omit<ResultDump, 'id' | 'user_id' | 'user_name' | 'head' | 'created_at'>;
