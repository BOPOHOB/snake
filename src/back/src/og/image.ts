import { createCanvas } from 'npm:@napi-rs/canvas@0.1.55';
import { paint } from '../../../front/components/game/paint.ts';
import type { PaintContext, RenderFrontend } from '../../../front/components/game/paint.ts';
import { restoreGameFromStamp } from '../../../front/components/game/restore.ts';
import { toStamp } from '../../../front/model/resultToStamp.ts';
import type { ResultDump } from '../../../front/types/result.ts';
import type { Stamp } from '../../../front/types/stamp.ts';

/**
 * Серверный рендер игрового кадра в PNG для og:image.
 * Переиспользует изоморфную paint() из фронтового render.ts —
 * React/DOM для отрисовки не нужен.
 *
 * Нативный размер кадра: fieldSize[20,9] × 4px + border 3×2 + head 7 = 86×49.
 * OG_SCALE × 14 → 1204×686 (~1.75:1, норм для соц-превью).
 */

const NATIVE_W = 86;
const NATIVE_H = 49;
const OG_SCALE = 14;

const buildFrontend = (stamp: Stamp): RenderFrontend => {
  const game = restoreGameFromStamp(stamp);
  return {
    page: 'game',
    game,
    level: stamp.level,
    labyrinth: stamp.labyrinth,
    demoHead: [13, 6],
    unpausing: 0,
    isPaused: () => true,
  };
};

const cache = new Map<string, Uint8Array>();

/** Рендер результата в PNG (с кешем по id — результаты иммутабельны). */
export function renderResultImage(result: ResultDump): Uint8Array {
  const key = String(result.id);
  const hit = cache.get(key);
  if (hit) {
    return hit;
  }

  const stamp = toStamp(result);
  const frontend = buildFrontend(stamp);

  const W = NATIVE_W * OG_SCALE;
  const H = NATIVE_H * OG_SCALE;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d') as unknown as PaintContext;
  paint(ctx, W, H, frontend);

  const png = canvas.toBuffer('image/png') as Uint8Array;
  cache.set(key, png);
  return png;
}

/** Текущий размер кеша (для метрик/диагностики). */
export function ogCacheSize(): number {
  return cache.size;
}
