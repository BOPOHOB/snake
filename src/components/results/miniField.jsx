import React, { useEffect, useRef } from 'react';
import { Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { bindRender } from 'components/game/render';
import cn from './miniField.module.less';

const MiniField = ({ frontend }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !frontend?.game) {
      return;
    }
    bindRender(ref, frontend)();
  }, [frontend]);

  const onCopy = () => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }
    canvas.toBlob(async (blob) => {
      if (!blob) {
        return;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        message.success('Game frame copied to clipboard');
      } catch {
        message.error('Failed to copy frame');
      }
    }, 'image/png');
  };

  return (
    <div className={cn.wrap}>
      <canvas className={cn.field} ref={ref} />
      <Button icon={<CopyOutlined />} onClick={onCopy} />
    </div>
  );
};

export { MiniField };
