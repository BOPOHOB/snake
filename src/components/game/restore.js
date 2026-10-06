import { Game } from './game';

/**
 * Восстанавливает объект Game из stamp (как Game.stamp()).
 * Нужно, чтобы показать results-экран после перезагрузки (OAuth-редирект).
 */
function restoreGameFromStamp(stamp) {
  const game = new Game(stamp.level, stamp.labyrinth);
  game.score = stamp.score;
  game.bands = stamp.bands;
  game.head = stamp.head;
  game.eatens = new Set(stamp.eatens);
  game.tickId = stamp.tickId;
  game.apple = stamp.apple;
  game.bug = stamp.bug;
  game.retryCounter = stamp.retryCounter ?? 0;
  game.isWin = stamp.isWin;
  game.gameover = true;
  return game;
}

export { restoreGameFromStamp };
