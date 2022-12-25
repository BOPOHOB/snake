import { Game } from './game';
import { assets } from './assets';
import { bgColor, fgColor } from 'theme/global';

const headHeight = 7;
const borderWidth = 3;
const fieldSize = Game.fieldSize;

const inferTransform = ([x1, y1], [x2, y2]) => {
  if (Math.abs(x1 - x2) > 1) {
    console.assert(x1 === 0 || x2 === 0, x1, x2);
    if (x1 === 0) {
      x1 = Game.fieldSize[0];
    } else {
      x2 = Game.fieldSize[0];
    }
  }
  if (Math.abs(y1 - y2) > 1) {
    console.assert(y1 === 0 || y2 === 0, y1, y2);
    if (y1 === 0) {
      y1 = Game.fieldSize[1];
    } else {
      y2 = Game.fieldSize[1];
    }
  }
  if (x1 === x2) {
    if (y1 > y2) {
      return [
        (r, c) => r,
        (r, c) => c
      ];
    } else {
      return [
        (r, c) => r,
        (r, c) => 3 - c,
      ];
    }
  } else {
    if (x1 < x2) {
      return [
        (r, c) => 3 - c,
        (r, c) => r
      ];
    }
  }
  return [
    (r, c) => c,
    (r, c) => r
  ];
};
    
const inferBandTransform = ([x1, y1], [x0, y0], [x2, y2]) => {
  let x = (r, c) => c;
  let y = (r, c) => r;
  const isTop = y0 - y2 === 1 || y0 - y1 === 1 || (y0 === 0 && (y1 > 1 || y2 > 1));
  const isRight = x0 - x2 === -1 || x0 - x1 === -1 || ((x1 === 0 || x2 === 0) && x0 > 1);
  if (isTop) {
    y = (r, c) => 3 - r;
  }
  if (isRight) {
    x = (r, c) => 3 - c;
  }
  return [x, y];
};

function update({current: canvas }, frontend) {
  if (canvas === null) {
    return;
  }
  const paintRect = [fieldSize[0] * 4 + borderWidth * 2, fieldSize[1] * 4 + borderWidth * 2 + headHeight];

  const paintAsset = (pos, fragment, transform = [(_, a) => a, (a) => a]) => {
    ctx.save();
    ctx.translate(pos[0] * 4, pos[1] * 4);
    for (const [row, rowData] of fragment.entries()) {
      for (const [col, needFill] of rowData.entries()) if (needFill) {
        ctx.fillRect(transform[0](row, col), transform[1](row, col), 1, 1);
      }
    }
    ctx.restore();
  };

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fgColor;
  const scale = Math.min(canvas.width / paintRect[0], canvas.height / paintRect[1]);
  ctx.translate((canvas.width - paintRect[0] * scale) / 2,(canvas.height - paintRect[1] * scale) / 2);
  ctx.scale(scale, scale);

  if (frontend.page !== 'game') {
    for (const [id,s] of `select ${frontend.page}`.split('').entries()) if (s in assets.symbols) {
      paintAsset([0.25 + id, 0], assets.symbols[s]);
    }
    ctx.translate(0, headHeight);
    ctx.fillRect(1, 1, 1, fieldSize[1] * 4 + borderWidth);
    ctx.fillRect(1 + fieldSize[0] * 4 + borderWidth, 1, 1, fieldSize[1] * 4 + borderWidth + 1);
    ctx.fillRect(1, 1 + fieldSize[1] * 4 + borderWidth, fieldSize[0] * 4 + borderWidth, 1);
    ctx.fillRect(1, 1, fieldSize[0] * 4 + borderWidth, 1);
    ctx.fillRect(1, -1, fieldSize[0] * 4 + borderWidth + 1, 1);
    ctx.translate(borderWidth, borderWidth);
    if (frontend.page === 'lavel') {
      ctx.translate(0, 4);
      ctx.save();
      ctx.translate(paintRect[0] / 2.0, 0);
      ctx.scale(4,4);
      paintAsset([-1,0], assets.numbers[Math.floor(frontend.lavel / 10)]);
      paintAsset([0,0], assets.numbers[frontend.lavel - 10 * Math.floor(frontend.lavel / 10)]);
      ctx.restore();
      const demoLength = 9;
      for (let i = 0; i !== demoLength; ++i) {
        const pos = Game.keepTorus([frontend.demoHead[0] - i, frontend.demoHead[1]]);
        let fragment = 'body';
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
        const padding = [Game.fieldSize[0] / 6, Game.fieldSize[1] / 6];
        ctx.translate(Game.fieldSize[0] * 4 / 3 * column, Game.fieldSize[1] * 4 / 3 * row);
        if (frontend.labyrinth === lab) {
          ctx.fillRect(0, 0, Game.fieldSize[0] + padding[0] * 2, Game.fieldSize[1] + padding[1] * 2);
          ctx.fillStyle = bgColor;
        }
        ctx.translate(padding[0], padding[1]);
        for (let row = 0; row !== Game.fieldSize[1]; ++row) {
          for (let col = 0; col !== Game.fieldSize[0]; ++col) if (l[row][col]) {
            ctx.fillRect(col, row, 1, 1);
          }
        }
        ctx.restore();
      }
    }
    return;
        
  }
  const game = frontend.game;

  ctx.save();
  ctx.translate(2, 0);
  for (const [id, num] of ('0000' + game.score).slice(-4).split('').entries()) {
    paintAsset([id, 0], assets.numbers[num - '0']);
  }
  if (frontend.isPaused()) {
    for (const [id, s] of ('pause').split('').entries()) {
      paintAsset([id + 7, 0], assets.symbols[s]);
    }
  }
  ctx.restore();
  if (typeof game.bug === 'object') {
    ctx.save();
    ctx.translate(fieldSize[0] * 4 + borderWidth * 2, 0);
    for (const [id, num] of ('0' + game.bug.remind).slice(-2).split('').entries()) {
      paintAsset([-2 + id, 0], assets.numbers[num - '0']);
    }
    paintAsset([-4.5, 0], assets.bugs[game.bug.type]);
    ctx.restore();
  }

  ctx.translate(0, headHeight);

  ctx.fillRect(1, 1, 1, fieldSize[1] * 4 + borderWidth);
  ctx.fillRect(1 + fieldSize[0] * 4 + borderWidth, 1, 1, fieldSize[1] * 4 + borderWidth + 1);
  ctx.fillRect(1, 1 + fieldSize[1] * 4 + borderWidth, fieldSize[0] * 4 + borderWidth, 1);
  ctx.fillRect(1, 1, fieldSize[0] * 4 + borderWidth, 1);
  ctx.fillRect(1, -1, fieldSize[0] * 4 + borderWidth + 1, 1);
    
  ctx.translate(borderWidth, borderWidth);

  const paintBodyFragment = ([prw, cur, nxt, eaten]) => {
    if (prw === null) {
      paintAsset(cur, assets[game.eatenPredict() ? 'headOpen' : 'head'], inferTransform(nxt, cur));
    } else if (nxt === null) {
      paintAsset(cur, assets.tail, inferTransform(cur, prw));
    } else if (nxt[0] === prw[0] || nxt[1] === prw[1]) {
      paintAsset(cur, assets[eaten ? 'eaten' : 'body'], inferTransform(nxt, cur));
    } else {
      paintAsset(cur, assets[eaten ? 'eatenBand' : 'band'], inferBandTransform(prw, cur, nxt));
    }
  };

  for (const ctxt of game.body()) {
    paintBodyFragment(ctxt);
  }
  if (Array.isArray(game.apple)) {
    paintAsset(game.apple, assets.apple);
  } 

  if (typeof game.bug === 'object') {
    paintAsset([game.bug.pos[0], game.bug.pos[1]], assets.bugs[game.bug.type]);
  }

  const labyrinth = assets.labyrinth[game.labyrinth];
  for (let [col, row] of Game.fields()) if (labyrinth[row][col]) {
    ctx.fillRect(col * 4 + 1, row * 4 + 1, 2, labyrinth[row + 1]?.[col] ? 4 : 2);
    if (labyrinth[row][col + 1]) {
      ctx.fillRect(col * 4 + 3, row * 4 + 1, 2, 2);
    }
  }
  if (frontend.unpausing && !frontend.isPaused()) {
    ctx.save();
    ctx.translate(Game.fieldSize[0] / 2 * 4 - 1.5, Game.fieldSize[1] / 2 * 4 - 2.5);
    ctx.fillStyle = fgColor;
    ctx.fillRect(-2, -2, 7, 9);
    ctx.fillStyle = bgColor;
    ctx.fillRect(-1, -1, 5, 7);
    ctx.fillStyle = fgColor;
    paintAsset([0, 0], assets.numbers[frontend.unpausing]);
    ctx.restore();
  }
};

const bindRender = (target, frontend) => () => update(target, frontend);

export { bindRender };
