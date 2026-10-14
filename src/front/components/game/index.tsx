import { useEffect, useRef } from 'react';
import { bindRender } from './render';
import type { Frontend } from './frontend';
import cn from './game.module.less';

const GameCanvas = ({ frontend }: { frontend: Frontend }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const render = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null) {
      return;
    }
    render.current = bindRender(ref, frontend);
    frontend.update = render.current;

    const onResize = () => render.current?.();
    const onBlur = () => {
      frontend.onPause();
    };
    const onKeyDown = ({ key }: KeyboardEvent) => {
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
    };

    window.addEventListener('resize', onResize, true);
    canvas.addEventListener('blur', onBlur);
    canvas.contentEditable = 'true';
    canvas.focus();
    canvas.addEventListener('keydown', onKeyDown);
    render.current();

    return () => {
      window.removeEventListener('resize', onResize, true);
      canvas.removeEventListener('blur', onBlur);
      canvas.removeEventListener('keydown', onKeyDown);
      if (frontend.update === render.current) {
        frontend.update = undefined;
      }
      render.current = null;
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
