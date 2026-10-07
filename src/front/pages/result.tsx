import { Link, useLoaderData } from 'react-router-dom';
import { Descriptions } from 'antd';
import type { ResultDump } from '../types/result';
import type { PositionResponse } from '../types/position';
import type { Stamp } from '../types/stamp';
import { MiniField } from '../components/results/MiniField';

type LoaderData = {
  result: ResultDump | null;
  position: PositionResponse | null;
};

function toStamp(r: ResultDump): Stamp {
  return {
    score: r.score,
    bands: (r.bands as Stamp['bands']) ?? [],
    head: r.head,
    eatens: (r.eatens as Stamp['eatens']) ?? [],
    tickId: r.tick_id,
    level: r.level,
    labyrinth: r.labyrinth,
    apple: (r.apple as Stamp['apple']) ?? null,
    bug: (r.bug as Stamp['bug']) ?? 5,
    retryCounter: r.retryCounter,
    isWin: r.isWin,
  };
}

export const Result = () => {
  const { result, position } = useLoaderData() as LoaderData;

  if (!result) {
    return (
      <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <h1>Результат не найден</h1>
        <p>Возможно, результат был удалён или ссылка неверна.</p>
        <Link to="/leaderboard">Таблица лидеров</Link>
      </main>
    );
  }

  const stamp = toStamp(result);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>{result.isWin ? 'Победа!' : 'Game over'}</h1>
      <MiniField stamp={stamp} />
      <Descriptions
        column={1}
        size="small"
        style={{ marginTop: 16 }}
        items={[
          { key: 'user', label: 'Игрок', children: result.user_name || 'Аноним' },
          { key: 'score', label: 'Счёт', children: String(result.score) },
          { key: 'level', label: 'Уровень', children: String(result.level) },
          { key: 'labyrinth', label: 'Лабиринт', children: String(result.labyrinth) },
          {
            key: 'position',
            label: 'Позиция',
            children: position ? `#${position.position} из ${position.total}` : '—',
          },
          { key: 'retry', label: 'Попытки', children: String(result.retryCounter) },
        ]}
      />
      <p style={{ marginTop: 16 }}>
        <Link to="/leaderboard">← Таблица лидеров</Link>
      </p>
    </main>
  );
};
