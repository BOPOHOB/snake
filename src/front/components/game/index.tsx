import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { bindRender } from './render';
import { hitLabyrinthAt } from './paint';
import type { Frontend } from './frontend';
import cn from './index.module.less';
import { Button } from 'antd';
import { BitScene } from '../elements/BitScene';
import { useMobile } from '../../utils/useMobile';
import { useMenuContext } from '../../router/outline';

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
    const onKeyDown = (e: KeyboardEvent) => {
      // `code` = physical key (layout-independent); `key` follows layout (p→з on RU).
      if (e.repeat) return;

      const togglePause = () => {
        if (frontend.isPaused()) frontend.onResume();
        else frontend.onPause();
      };

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          frontend.onLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          frontend.onRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
          frontend.onUp();
          break;
        case 'ArrowDown':
        case 'KeyS':
          frontend.onDown();
          break;
        case 'Enter':
        case 'Space':
          if (frontend.page !== 'game') frontend.onNextPage();
          else togglePause();
          break;
        case 'KeyP':
          togglePause();
          break;
        case 'Backspace':
        case 'Escape':
          frontend.onBackPage();
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    window.addEventListener('resize', onResize, true);
    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('blur', onBlur);
    canvas.focus();
    render.current();

    return () => {
      window.removeEventListener('resize', onResize, true);
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('blur', onBlur);
      if (frontend.update === render.current) {
        frontend.update = undefined;
      }
      render.current = null;
    };
  }, [frontend]);

  const isMobile = useMobile();

  const menuContext =  useMenuContext();

  const onCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    canvas?.focus();
    if (!canvas || frontend.page !== 'labyrinth') return;
    const lab = hitLabyrinthAt(
      canvas.width,
      canvas.height,
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY,
    );
    if (lab != null) frontend.setLabyrinth(lab);
  };

  const canvas = (
    <canvas
      className={cn.scene}
      ref={ref}
      tabIndex={0}
      role="img"
      aria-label="Snake 2 game field"
      onClick={onCanvasClick}
    />
  );

  const update = useUpdate();

  useEffect(() => {
    if (isMobile) {
      menuContext?.showNav(frontend.page !== 'game');
    }
    return () => menuContext?.showNav(true);
  }, [frontend.page]);

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
