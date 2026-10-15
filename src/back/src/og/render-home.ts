// Единоразовый генератор og-картинки главной страницы:
// рендерит assets.splash (84x48, 1=черный) на зелёном фоне 1200x630, по центру.
// Запуск: cd src/back && deno run -A --sloppy-imports src/og/render-home.ts
import { createCanvas } from 'npm:@napi-rs/canvas@0.1.55';
import { assets } from '../../../front/components/game/assets.ts';
import { join } from 'jsr:@std/path';

const OG_W = 1200;
const OG_H = 630;
const BG = '#73a582'; // зелёный фон игры
const FG = '#000000'; // чёрные пиксели сплэша

const splash = assets.splash as number[][];
const SH = splash.length;
const SW = splash[0].length;

// Вписать с сохранением пропорций, центрировать. S — размер одного пикселя сплэша.
const S = Math.floor(Math.min(OG_W / SW, OG_H / SH)); // 13
const drawW = SW * S;
const drawH = SH * S;
const padX = Math.floor((OG_W - drawW) / 2);
const padY = Math.floor((OG_H - drawH) / 2);

const canvas = createCanvas(OG_W, OG_H);
const ctx = canvas.getContext('2d');

ctx.fillStyle = BG;
ctx.fillRect(0, 0, OG_W, OG_H);

ctx.fillStyle = FG;
for (let y = 0; y < SH; y++) {
  for (let x = 0; x < SW; x++) {
    if (splash[y][x]) {
      ctx.fillRect(padX + x * S, padY + y * S, S, S);
    }
  }
}

const out = join(import.meta.dirname!, '..', '..', '..', '..', 'public', 'og-home.png');
Deno.writeFileSync(out, canvas.toBuffer('image/png'));
console.log(`splash ${SW}x${SH} -> ${drawW}x${drawH} (S=${S}) centered in ${OG_W}x${OG_H} (pad ${padX},${padY})`);
console.log('wrote', out);
