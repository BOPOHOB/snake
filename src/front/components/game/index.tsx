import { useCallback, useEffect, useRef, useState } from 'react';
import { bindRender } from './render';
import type { Frontend } from './frontend';
import cn from './index.module.less';
import mobile from 'is-mobile';
import { Button } from 'antd';
import { BitScene } from '../elements/BitScene';

const rotate = (rect: number[][]) => {
  const r = rect.length;
  const result = new Array(r).fill(null).map(() => new Array(r));
  for (let i = 0; i !== r; ++i) {
    for (let j = 0; j !== r; ++j) {
      result[j][r - 1 - i] = rect[i][j];
    }
  }
  return result;
};

const RB = [
  [0,0,0,0,0,0,0,0],
  [0,1,0,0,0,0,0,0],
  [0,0,1,0,0,0,0,0],
  [0,0,0,1,0,0,1,0],
  [0,0,0,0,1,0,1,0],
  [0,0,0,0,0,1,1,0],
  [0,0,0,1,1,1,1,0],
  [0,0,0,0,0,0,0,0],
];
const LB = rotate(RB);
const LT = rotate(LB);
const RT = rotate(LT);

const SIZE = 50;

const R = [
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,0,0],
  [0,0,0,0,0,0,1,0,0],
  [0,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,1,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
];
const B = rotate(R);
const L = rotate(B);
const T = rotate(L);

const useUpdate = () => {
  const [_, s] = useState(0);
  return useCallback(() => s((v => v + 1)), []);
};


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
    canvas.addEventListener('keydown', onKeyDown);
    canvas.focus();
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

  const isMobile = mobile();

  const canvas = (
    <canvas
      className={cn.scene}
      ref={ref}
      tabIndex={0}
      role="img"
      aria-label="Snake 2 game field"
      onClick={() => ref.current?.focus()}
    />
  );

  const update = useUpdate();

  const nxt = () => {
    frontend.onNextPage();
    update();
  };

  const prw = () => {
    frontend.onBackPage();
    update();
  };

  const pause = () => {
    (frontend.isPaused() ? frontend.onResume as (() => void) : frontend.onPause)();
    update();
  }

  if (!isMobile) {
    return canvas;
  }

  frontend.page !== 'game';

  return (
    <div className={cn.layout}>
      {
        frontend.page !== 'game' ? (
          <Button className={cn.lt} onClick={frontend.page === 'level' ? frontend.onDown : frontend.onLeft}><BitScene width={SIZE} height={SIZE} data={B} /></Button>
        ) : (
          <Button className={cn.lt} onClick={frontend.onLT}><BitScene width={SIZE} height={SIZE} data={LT} /></Button>
        )
      }
      {
        frontend.page !== 'game' ? (
          <Button className={cn.lb} onClick={prw} disabled={frontend.page === 'level'}><BitScene width={SIZE} height={SIZE} data={L} /></Button>
        ) : (
          <Button className={cn.lb} onClick={frontend.onLB}><BitScene width={SIZE} height={SIZE} data={LB} /></Button>
        )
      }
      {canvas}
      <Button disabled={frontend.page !== 'game'} className={cn.pause} onClick={pause}>{frontend.isPaused() ? 'Resume' : 'Pause'}</Button>
      {
        frontend.page !== 'game' ? (
          <Button className={cn.rt} onClick={frontend.page === 'level' ? frontend.onUp : frontend.onRight}><BitScene width={SIZE} height={SIZE} data={T} /></Button>
        ) : (
          <Button className={cn.rt} onClick={frontend.onRT}><BitScene width={SIZE} height={SIZE} data={RT} /></Button>
        )
      }
      {
        frontend.page !== 'game' ? (
          <Button className={cn.rb} onClick={nxt}><BitScene width={SIZE} height={SIZE} data={R} /></Button>
        ) : (
          <Button className={cn.rb} onClick={frontend.onRB}><BitScene width={SIZE} height={SIZE} data={RB} /></Button>
        )
      }
    </div>
  );
};

export { GameCanvas };
