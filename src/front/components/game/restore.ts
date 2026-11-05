import { Game } from './game';
import type { Stamp } from '../../types/stamp';

/**
 * Восстанавливает объект Game из stamp (как Game.stamp()).
 * Нужно, чтобы показать results-экран после перезагрузки (OAuth-редирект).
 */
function restoreGameFromStamp(stamp: Stamp): Game {
  const game = new Game(stamp.level, stamp.labyrinth);
  game.stamp = stamp;
  return game;
}

export { restoreGameFromStamp };
