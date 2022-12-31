import React from 'react';
import { bgColor, fgColor } from 'theme/global';

const BitScene: React.FC<{ size?: [number, number], width?: number, height?: number, bg: string, data: Array<Array<number>>}> = ({ data, size, width, height, bg }) => {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (data.length === 0 || canvas === null) {
      return;
    }
    let s = size ?? [data[0].length, data.length];
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientWidth * s[1] / s[0];
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bg ?? bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = fgColor;
    const scale = Math.min(canvas.width / s[0], canvas.height / s[1]);
    ctx.translate((canvas.width - s[0] * scale) / 2,(canvas.height - s[1] * scale) / 2);
    ctx.scale(scale, scale);

    for (const [rowId, row] of data.entries()) {
      for (const [columnId, cell] of row.entries()) {
        if (cell) {
          ctx.fillRect(columnId, rowId, 1, 1);
        }
      }
    }
  }, [data, size, bg]);
  return <canvas width={width ?? 300} height={height ?? 300} ref={ref}></canvas>;
};

export { BitScene };
