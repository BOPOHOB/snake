import { paint } from './paint';
import type { PaintContext, RenderFrontend } from './paint';

/** DOM-обвязка над изоморфной paint(): браузерный canvas. */
function update(
  target: { current: HTMLCanvasElement | null },
  frontend: RenderFrontend,
): void {
  const canvas = target.current;
  if (canvas === null) {
    return;
  }
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  paint(ctx as unknown as PaintContext, canvas.width, canvas.height, frontend);
}

const bindRender = (
  target: { current: HTMLCanvasElement | null },
  frontend: RenderFrontend,
): (() => void) => () => update(target, frontend);

// Реэкспорт для существующих потребителей (MiniField, game/index).
export { bindRender, paint };
export type { RenderFrontend, PaintContext } from './paint';
