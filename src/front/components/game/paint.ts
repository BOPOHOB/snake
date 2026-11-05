import { Game } from './game';
import { assets } from './assets';
import { bgColor, fgColor } from './colors';
import { keepTorus, objectPoint, pointObject, type Point, type PointObject } from '../../types/stamp';

const headHeight = 7;
const borderWidth = 3;

type Transform = [(r: number, c: number) => number, (r: number, c: number) => number];

const inferTransformGenerator = (fieldSize: PointObject) => ([x1, y1]: PointObject, [x2, y2]: PointObject): Transform => {
  if (Math.abs(x1 - x2) > 1) {
    console.assert(x1 === 0 || x2 === 0, x1, x2);
    if (x1 === 0) {
      x1 = fieldSize[0];
    } else {
      x2 = fieldSize[0];
    }
  }
  if (Math.abs(y1 - y2) > 1) {
    console.assert(y1 === 0 || y2 === 0, y1, y2);
    if (y1 === 0) {
      y1 = fieldSize[1];
    } else {
      y2 = fieldSize[1];
    }
  }
  if (x1 === x2) {
    if (y1 > y2) {
      return [(r) => r, (_r, c) => c];
    }
    return [(r) => r, (_r, c) => 3 - c];
  }
  if (x1 < x2) {
    return [(_r, c) => 3 - c, (r) => r];
  }
  return [(_r, c) => c, (r) => r];
};

const inferBandTransform = (
  [x1, y1]: number[],
  [x0, y0]: number[],
  [x2, y2]: number[],
): Transform => {
  let x: (r: number, c: number) => number = (_r, c) => c;
  let y: (r: number, c: number) => number = (r) => r;
  const isTop = y0 - y2 === 1 || y0 - y1 === 1 || (y0 === 0 && (y1 > 1 || y2 > 1));
  const isRight = x0 - x2 === -1 || x0 - x1 === -1 || ((x1 === 0 || x2 === 0) && x0 > 1);
  if (isTop) {
    y = (r) => 3 - r;
  }
  if (isRight) {
    x = (_r, c) => 3 - c;
  }
  return [x, y];
};

export type RenderFrontend = {
  page: string;
  game: Game | null;
  level: number;
  labyrinth: number;
  demoHead: number;
  unpausing: number;
  isPaused: () => boolean;
  update?: () => void;
};

export type PaintContext = {
  fillStyle: string;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  save: () => void;
  restore: () => void;
  translate: (x: number, y: number) => void;
  scale: (x: number, y: number) => void;
};

const drawRect = (ctx: PaintContext, [w, h]: PointObject, paintRect: PointObject) => {
  const scale = Math.min(w / paintRect[0], h / paintRect[1]);
  ctx.translate(
    (w - paintRect[0] * scale) / 2,
    (h - paintRect[1] * scale) / 2,
  );
  ctx.scale(scale, scale);
};

/**
 * Чистая рисовка игрового кадра в любой 2D-контекст (браузерный canvas
 * или серверный @napi-rs/canvas). Не зависит от DOM — изоморфна.
 */
function paint(
  ctx: PaintContext,
  w: number,
  h: number,
  frontend: RenderFrontend,
): void {

  const paintAsset = (
    pos: PointObject,
    fragment: number[][],
    transform: Transform = [(_r, c) => c, (r) => r],
  ): void => {
    ctx.save();
    ctx.translate(pos[0] * 4, pos[1] * 4);
    for (const [row, rowData] of fragment.entries()) {
      for (const [col, needFill] of rowData.entries()) {
        if (needFill) {
          ctx.fillRect(transform[0](row, col), transform[1](row, col), 1, 1);
        }
      }
    }
    ctx.restore();
  };

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fgColor;

  if (frontend.page !== 'game') {
    const fieldSize = pointObject(assets.labyrinthSizes.at(0)!);
    const inferTransform = inferTransformGenerator(fieldSize);
    const paintRect: PointObject = [
      fieldSize[0] * 4 + borderWidth * 2,
      fieldSize[1] * 4 + borderWidth * 2 + headHeight,
    ];
    drawRect(ctx, [w, h], paintRect);
    for (const [id, s] of `select ${frontend.page}`.split('').entries()) {
      if (s in assets.symbols) {
        paintAsset([0.25 + id, 0], assets.symbols[s]);
      }
    }
    ctx.translate(0, headHeight);
    ctx.fillRect(1, 1, 1, fieldSize[1] * 4 + borderWidth);
    ctx.fillRect(1 + fieldSize[0] * 4 + borderWidth, 1, 1, fieldSize[1] * 4 + borderWidth + 1);
    ctx.fillRect(1, 1 + fieldSize[1] * 4 + borderWidth, fieldSize[0] * 4 + borderWidth, 1);
    ctx.fillRect(1, 1, fieldSize[0] * 4 + borderWidth, 1);
    ctx.fillRect(1, -1, fieldSize[0] * 4 + borderWidth + 1, 1);
    ctx.translate(borderWidth, borderWidth);
    if (frontend.page === 'level') {
      ctx.translate(0, 4);
      ctx.save();
      ctx.translate(paintRect[0] / 2.0, 0);
      ctx.scale(4, 4);
      paintAsset([-1, 0], assets.numbers[Math.floor(frontend.level / 10)]);
      paintAsset([0, 0], assets.numbers[frontend.level - 10 * Math.floor(frontend.level / 10)]);
      ctx.restore();
      const demoLength = 9;
      for (let i = 0; i !== demoLength; ++i) {
        const pos = pointObject(keepTorus(frontend.demoHead - i, objectPoint(fieldSize)));
        let fragment: keyof typeof assets = 'body';
        if (i === 0) {
          fragment = 'head';
        } else if (i === demoLength - 1) {
          fragment = 'tail';
        }
        paintAsset(pos, assets[fragment], inferTransform(pos, [pos[0] + 1, pos[1]]));
      }
    } else if (frontend.page === 'labyrinth') {
      for (let lab = 0; lab !== assets.labyrinth.length; ++lab) {
        const l = assets.labyrinth[lab];
        ctx.save();
        const column = lab % 3;
        const row = Math.floor(lab / 3);
        const padding = [fieldSize[0] / 6, fieldSize[1] / 6];
        ctx.translate((fieldSize[0] * 4) / 3 * column, (fieldSize[1] * 4) / 3 * row);
        if (frontend.labyrinth === lab) {
          ctx.fillRect(0, 0, fieldSize[0] + padding[0] * 2, fieldSize[1] + padding[1] * 2);
          ctx.fillStyle = bgColor;
        }
        ctx.translate(padding[0], padding[1]);
        for (let r = 0; r !== fieldSize[1]; ++r) {
          for (let c = 0; c !== fieldSize[0]; ++c) {
            if (l[r][c]) {
              ctx.fillRect(c, r, 1, 1);
            }
          }
        }
        ctx.restore();
      }
    }
    return;
  }
  const game = frontend.game;
  if (!game) {
    return;
  }

  const fieldSize = pointObject(assets.labyrinthSizes.at(0)!);
  const inferTransform = inferTransformGenerator(fieldSize);
  const paintRect: PointObject = [
    fieldSize[0] * 4 + borderWidth * 2,
    fieldSize[1] * 4 + borderWidth * 2 + headHeight,
  ];
  drawRect(ctx, [w, h], paintRect);


  ctx.save();
  ctx.translate(2, 0);
  for (const [id, num] of ('0000' + game.stamp.score).slice(-4).split('').entries()) {
    paintAsset([id, 0], assets.numbers[Number(num)]);
  }
  if (frontend.isPaused()) {
    for (const [id, s] of 'pause'.split('').entries()) {
      paintAsset([id + 7, 0], assets.symbols[s]);
    }
  }
  ctx.restore();
  if (game.isBugInGame) {
    ctx.save();
    ctx.translate(fieldSize[0] * 4 + borderWidth * 2, 0);
    for (const [id, num] of ('0' + game.bugRemind).slice(-2).split('').entries()) {
      paintAsset([-2 + id, 0], assets.numbers[Number(num)]);
    }
    paintAsset([-4.5, 0], assets.bugs[game.bugType!]);
    ctx.restore();
  }

  ctx.translate(0, headHeight);

  ctx.fillRect(1, 1, 1, fieldSize[1] * 4 + borderWidth);
  ctx.fillRect(1 + fieldSize[0] * 4 + borderWidth, 1, 1, fieldSize[1] * 4 + borderWidth + 1);
  ctx.fillRect(1, 1 + fieldSize[1] * 4 + borderWidth, fieldSize[0] * 4 + borderWidth, 1);
  ctx.fillRect(1, 1, fieldSize[0] * 4 + borderWidth, 1);
  ctx.fillRect(1, -1, fieldSize[0] * 4 + borderWidth + 1, 1);

  ctx.translate(borderWidth, borderWidth);

  const paintBodyFragment = (
    ctxt: [Point | null, Point | null, Point | null, boolean?],
  ): void => {
    const [prw, cur, nxt, eaten] = ctxt.map(v => typeof v === 'number' ? pointObject(v) : v) as [
      PointObject | null, PointObject | null, PointObject | null, boolean?
    ];
    if (prw === null) {
      if (cur) paintAsset(cur, assets[game.eatenPredict() ? 'headOpen' : 'head'], inferTransform(nxt!, cur));
    } else if (nxt === null) {
      if (cur) paintAsset(cur, assets.tail, inferTransform(cur, prw));
    } else if (nxt[0] === prw[0] || nxt[1] === prw[1]) {
      if (cur) paintAsset(cur, assets[eaten ? 'eaten' : 'body'], inferTransform(nxt, cur));
    } else {
      if (cur) paintAsset(cur, assets[eaten ? 'eatenBand' : 'band'], inferBandTransform(prw, cur, nxt));
    }
  };

  for (const ctxt of game.body()) {
    paintBodyFragment(ctxt);
  }
  if (game.apple !== null) {
    paintAsset(pointObject(game.apple), assets.apple);
  }

  if (game.isBugInGame) {
    paintAsset(pointObject(game.bug!), assets.bugs[game.bugType!]);
  }

  const labyrinth = assets.labyrinth[game.stamp.labyrinth];
  for (const point of game.fields()) {
    const [col, row] = pointObject(point);
    if (labyrinth[row][col]) {
      ctx.fillRect(col * 4 + 1, row * 4 + 1, 2, labyrinth[row + 1]?.[col] ? 4 : 2);
      if (labyrinth[row][col + 1]) {
        ctx.fillRect(col * 4 + 3, row * 4 + 1, 2, 2);
      }
    }
  }
  if (frontend.unpausing && !frontend.isPaused()) {
    ctx.save();
    ctx.translate((fieldSize[0] / 2) * 4 - 1.5, (fieldSize[1] / 2) * 4 - 2.5);
    ctx.fillStyle = fgColor;
    ctx.fillRect(-2, -2, 7, 9);
    ctx.fillStyle = bgColor;
    ctx.fillRect(-1, -1, 5, 7);
    ctx.fillStyle = fgColor;
    paintAsset([0, 0], assets.numbers[frontend.unpausing]);
    ctx.restore();
  }
}

export { paint };
