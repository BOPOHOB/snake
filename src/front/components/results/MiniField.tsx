import { useEffect, useRef } from 'react';
import { Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { bindRender } from '../game/render';
import type { RenderFrontend } from '../game/render';
import { restoreGameFromStamp } from '../game/restore';
import type { Stamp } from '../../types/stamp';
import cn from './miniField.module.less';

const buildFrontend = (stamp: Stamp): RenderFrontend => {
  const game = restoreGameFromStamp(stamp);
  return {
    page: 'game',
    game,
    level: stamp.level,
    labyrinth: stamp.labyrinth,
    demoHead: [13, 6],
    unpausing: 0,
    isPaused: () => true,
  };
};

const MiniField = ({ stamp }: { stamp: Stamp }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current || !stamp) {
      return;
    }
    bindRender(ref, buildFrontend(stamp))();
  }, [stamp]);

  const onCopy = () => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          message.success('Game frame copied to clipboard');
        } catch {
          message.error('Failed to copy frame');
        }
      },
      'image/png',
    );
  };

  return (
    <div className={cn.wrap}>
      <canvas className={cn.field} ref={ref} />
      <Button icon={<CopyOutlined />} onClick={onCopy} />
    </div>
  );
};

export { MiniField };
