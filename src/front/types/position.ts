export type PositionResponse = {
  level: number;
  labyrinth: number;
  score: number;
  position: number;
  total: number;
  before: number;
  after: number;
};

/** Ответ POST /api/result/add — позиция + id созданной записи. */
export type AddResultResponse = PositionResponse & { id: number };
