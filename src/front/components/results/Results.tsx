import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BitScene } from '../elements/BitScene';
import { assets } from '../game/assets';
import type { ResultDump } from '../../types/result';
import cn from './results.module.less';

const LABYRINTH_COUNT = assets.labyrinth.length;

const orderSelector = [
  { key: 'score', label: 'Score' },
  { key: 'length', label: 'Length' },
] as const;

type OrderKey = (typeof orderSelector)[number]['key'];

type Entry = {
  length: number;
  score: number;
  level: number;
  retry: number;
  result: ResultDump;
};

const Row = ({
  resultPos,
  levels,
  selectedId,
}: {
  resultPos: number;
  levels: Entry[][];
  selectedId?: number;
}) => (
  <tr>
    <td>{resultPos + 1}</td>
    {levels.map((lvl, labyrinth) => {
      if (lvl.length <= resultPos) {
        return <td className={cn.empty} colSpan={4} key={labyrinth} />;
      }
      const { length, score, level, retry, result } = lvl[resultPos];
      const current = selectedId === result.id ? cn.current : '';
      return (
        <Fragment key={labyrinth}>
          <td className={current}>
            <Link to={`/result/${result.id}`} title={result.user_name || 'Аноним'}>
              {score}
            </Link>
          </td>
          <td className={current}>{length}</td>
          <td className={current}>{retry}</td>
          <td className={current}>{level}</td>
        </Fragment>
      );
    })}
  </tr>
);

type ResultsProps = {
  results: ResultDump[];
  selectedId?: number;
};

/** Таблица результатов по лабиринтам (страница /result и /result/:id). */
const Results = ({ results, selectedId }: ResultsProps) => {
  const [orderBy, setOrderBy] = useState<OrderKey>(
    () => (localStorage.getItem('order') as OrderKey) || 'score',
  );

  const levels = useMemo(() => {
    const buckets: Entry[][] = Array.from({ length: LABYRINTH_COUNT }, () => []);
    for (const result of results) {
      if (result.labyrinth < 0 || result.labyrinth >= LABYRINTH_COUNT) continue;
      buckets[result.labyrinth].push({
        length: result.eatens?.length ?? 0,
        score: result.score,
        level: result.level,
        retry: result.retryCounter,
        result,
      });
    }
    for (const lvl of buckets) {
      lvl.sort((a, b) => b[orderBy] - a[orderBy]);
    }
    return buckets;
  }, [results, orderBy]);

  const maxPlayed = Math.max(0, ...levels.map((a) => a.length));

  return (
    <div className={cn.wrap}>
      <h1>Results</h1>
      <div>
        Order by:{' '}
        <select
          className={cn.order}
          value={orderBy}
          onChange={(e) => {
            const key = e.target.value as OrderKey;
            setOrderBy(key);
            localStorage.setItem('order', key);
          }}
        >
          {orderSelector.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <table className={cn.table}>
        <thead>
          <tr>
            <th />
            {levels.map((_, labyrinth) => (
              <th colSpan={4} key={labyrinth}>
                <BitScene data={assets.labyrinth[labyrinth]} />
              </th>
            ))}
          </tr>
          <tr>
            <th>#</th>
            {levels.map((_, labyrinth) => (
              <Fragment key={labyrinth}>
                <th>score</th>
                <th>len</th>
                <th>rtry</th>
                <th>lvl</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {maxPlayed === 0 ? (
            <tr>
              <td colSpan={1 + 4 * LABYRINTH_COUNT}>No results yet</td>
            </tr>
          ) : (
            new Array(maxPlayed).fill(null).map((_, resultPos) => (
              <Row
                key={resultPos}
                resultPos={resultPos}
                levels={levels}
                selectedId={selectedId}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export { Results };
