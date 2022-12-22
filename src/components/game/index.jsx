import React, { useEffect, useRef } from 'react';
import { bindRender } from './render';

import cn from './game.module.less';

const Game = ({ frontend }) => {
  const ref = useRef(null);
  const render = useRef(null);
  useEffect(() => {
    if (ref.current === null || render.current !== null) {
      return;
    }
    render.current = bindRender(ref, frontend);
    frontend.update = render.current;
    
    window.addEventListener('resize', render.current, true);

    ref.current.addEventListener('blur', () => {
      if (ref.current) {
        frontend.onPause();
      }
    });
    ref.current.contentEditable = 'true';
    ref.current.focus();
    ref.current.addEventListener('keydown', ({ key }) => {
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
      // eslint-disable-next-line no-fallthrough
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
  }, [frontend]);
  return <canvas className={cn.scene} ref={ref} contentEditable width="100" height="100"></canvas>;
};

export { Game };
