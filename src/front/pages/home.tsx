import { Link, useLoaderData } from 'react-router-dom';
import type { ResultDump } from '../types/result';

export const Home = () => {
  const data = useLoaderData() as { results: ResultDump[] } | null;
  const top = data?.results?.slice(0, 5) ?? [];
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Nokia 3310 Snake 2</h1>
      <p>
        Змейка с лабиринтами, яблоками, багами и уровнями скорости — ода Nokia
        3310.
      </p>
      <p>
        <Link to="/play">Играть</Link> ·{' '}
        <Link to="/leaderboard">Таблица лидеров</Link>
      </p>
      {top.length > 0 && (
        <section>
          <h2>Топ-5</h2>
          <ol>
            {top.map((r) => (
              <li key={r.id}>
                <Link to={`/result/${r.id}`}>
                  {r.user_name || 'Аноним'} — {r.score}
                </Link>{' '}
                <span style={{ color: '#888' }}>
                  (уровень {r.level}, лабиринт {r.labyrinth})
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
};
