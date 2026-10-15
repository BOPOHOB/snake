import type { ResultDump } from '../types/result';
import type { Stamp } from '../types/stamp';

/** ResultDump (из БД/апи) → Stamp (для restoreGameFromStamp / paint). Изоморфно. */
const toStamp = (r: ResultDump): Stamp => ({
  score: r.score,
  bands: (r.bands as Stamp['bands']) ?? [],
  head: r.head,
  eatens: (r.eatens as Stamp['eatens']) ?? [],
  tickId: r.tick_id,
  level: r.level,
  labyrinth: r.labyrinth,
  apple: (r.apple as Stamp['apple']) ?? null,
  bug: (r.bug as Stamp['bug']) ?? 5,
  retryCounter: r.retryCounter,
  isWin: r.isWin,
});

export { toStamp };
