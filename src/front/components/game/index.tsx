import { useEffect, useRef } from 'react';
import { bindRender } from './render';
import type { Frontend } from './frontend';
import cn from './game.module.less';

const GameCanvas = ({ frontend }: { frontend: Frontend }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const render = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null || render.current !== null) {
      return;
    }
    render.current = bindRender(ref, frontend);
    frontend.update = render.current;

    window.addEventListener('resize', render.current, true);

    canvas.addEventListener('blur', () => {
      frontend.onPause();
    });
    canvas.contentEditable = 'true';
    canvas.focus();
    canvas.addEventListener('keydown', ({ key }) => {
      switch (key.toLowerCase()) {
        case 'arrowleft':
        case 'd':
          frontend.onLeft();
          return;
        case 'arrowright':
        case 'a':
          frontend.onRight();
          return;
        case 'arrowup':
        case 'w':
          frontend.onUp();
          return;
        case 'arrowdown':
        case 's':
          frontend.onDown();
          return;
        case 'enter':
        case ' ':
          if (frontend.page !== 'game') {
            frontend.onNextPage();
            return;
          }
          if (frontend.isPaused()) {
            frontend.onResume();
          } else {
            frontend.onPause();
          }
          return;
        case 'p':
          if (frontend.isPaused()) {
            frontend.onResume();
          } else {
            frontend.onPause();
          }
          return;
        case 'backspace':
        case 'escape':
          frontend.onBackPage();
          return;
        default:
          return;
      }
    });
    render.current();
    return () => {
      if (render.current) {
        window.removeEventListener('resize', render.current, true);
      }
    };
  }, [frontend]);

  return (
    <canvas
      className={cn.scene}
      ref={ref}
      contentEditable
      width={100}
      height={100}
    />
  );
};

export { GameCanvas };
