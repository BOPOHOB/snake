import { createCanvas } from 'npm:@napi-rs/canvas@0.1.55';
import { paint } from '../../../front/components/game/paint.ts';
import type { PaintContext, RenderFrontend } from '../../../front/components/game/paint.ts';
import { restoreGameFromStamp } from '../../../front/components/game/restore.ts';
import { toStamp } from '../../../front/model/resultToStamp.ts';
import { assets } from '../../../front/components/game/assets.ts';
import { bgColor, fgColor } from '../../../front/components/game/colors.ts';
import type { ResultDump } from '../../../front/types/result.ts';
import type { Stamp } from '../../../front/types/stamp.ts';

/**
 * Серверный рендер результата в PNG для og:image.
 *
 * Слева — итоговое игровое поле (изоморфная paint() из фронтового render.ts,
 * DOM не нужен). Справа, в столбик — метаданные пиксельным шрифтом Nokia:
 *   • время постановки результата (DD.MM.YY HH:MM)
 *   • число воскрешений (только если retryCounter > 0)
 *   • итоговая длина змеи
 */

// Нативный размер кадра Nokia: fieldSize[20,9]×4 + border 3×2 + head 7 = 86×49.
const NATIVE_W = 86;
const NATIVE_H = 49;
const GAME_SCALE = 14; // игровое поле → 1204×686

// Текстовый столбец справа.
const TEXT_GAP = 40; // отступ от игрового поля
const TEXT_W = 420; // ширина столбца
const TEXT_SCALE = 8; // px на один «пиксель» глифа

const OG_W = NATIVE_W * GAME_SCALE + TEXT_GAP + TEXT_W; // 1204 + 40 + 420 = 1664
const OG_H = NATIVE_H * GAME_SCALE; // 686

// Доп. глифы (5×3), которых нет в assets.symbols (только a-z) и numbers (0-9).
const EXTRA_GLYPHS: Record<string, number[][]> = {
  ' ': [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
  ':': [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
  '.': [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 1, 0],
  ],
};

function getGlyph(ch: string): number[][] | null {
  if (ch in EXTRA_GLYPHS) return EXTRA_GLYPHS[ch];
  if (ch in assets.symbols) return assets.symbols[ch];
  if (ch >= '0' && ch <= '9') return assets.numbers[Number(ch)];
  return null;
}

/** Рисует строку пиксельным шрифтом Nokia. Возвращает ширину строки в px. */
function paintText(
  ctx: PaintContext,
  text: string,
  x: number,
  y: number,
  scale: number,
): number {
  const glyphH = 5;
  const glyphW = 3;
  const pitch = (glyphW + 1) * scale; // 4*scale на символ
  let cx = x;
  for (const ch of text) {
    const g = getGlyph(ch);
    if (g) {
      for (let r = 0; r < glyphH; r++) {
        for (let c = 0; c < glyphW; c++) {
          if (g[r][c]) {
            ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
          }
        }
      }
    }
    cx += pitch;
  }
  return cx - x;
}

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

/** Формат unix-секунд → ["DD.MM.YY", "HH:MM"] (локальное время, двумя строками). */
function formatTime(unix: number): [string, string] {
  const d = new Date(unix * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return [
    `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${yy}`,
    `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  ];
}

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
  const length = frontend.game ? [...frontend.game.body()].length : 0;

  // 1. Игровое поле в нативный canvas 86×49 (paint() заполняет его целиком).
  const gameCanvas = createCanvas(NATIVE_W, NATIVE_H);
  const gctx = gameCanvas.getContext('2d') as unknown as PaintContext;
  paint(gctx, NATIVE_W, NATIVE_H, frontend);

  // 2. Финальный canvas: зелёный фон, поле слева, текст справа.
  const canvas = createCanvas(OG_W, OG_H);
  const ctx = canvas.getContext('2d') as unknown as PaintContext &
    { imageSmoothingEnabled: boolean; drawImage: (...a: unknown[]) => void };
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, OG_W, OG_H);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    gameCanvas,
    0,
    0,
    NATIVE_W,
    NATIVE_H,
    0,
    0,
    NATIVE_W * GAME_SCALE,
    NATIVE_H * GAME_SCALE,
  );

  // 3. Текстовый столбец.
  const [dateLine, timeLine] = formatTime(result.created_at ?? 0);
  const lines: string[] = [dateLine, timeLine];
  if (result.retryCounter > 0) {
    lines.push(`retry ${result.retryCounter}`);
  }
  lines.push(`len ${length}`);

  const lineH = (5 + 2) * TEXT_SCALE; // 7*scale высота строки + отступ
  const totalH = lines.length * lineH;
  let y = Math.floor((OG_H - totalH) / 2);
  const x = NATIVE_W * GAME_SCALE + TEXT_GAP;

  ctx.fillStyle = fgColor;
  for (const line of lines) {
    paintText(ctx, line, x, y, TEXT_SCALE);
    y += lineH;
  }

  const png = canvas.toBuffer('image/png') as Uint8Array;
  cache.set(key, png);
  return png;
}

/** Текущий размер кеша (для метрик/диагностики). */
export function ogCacheSize(): number {
  return cache.size;
}
