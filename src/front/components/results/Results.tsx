import { Fragment, useState } from 'react';
import { Button, Dropdown } from 'antd';
import { BitScene } from '../elements/BitScene';
import { Achievements } from '../achievements/Achievements';
import { MiniField } from './MiniField';
import { assets } from '../game/assets';
import { useStamps } from '../../model/stamps';
import { useSession, useSessionState } from '../../model/session';
import type { Stamp } from '../../types/stamp';
import cn from './results.module.less';

const orderSelector = [
  { key: 'score', label: 'Score' },
  { key: 'length', label: 'Length' },
];

type LevelEntry = {
  length: number;
  score: number;
  level: number;
  retry: number;
  stamp: Stamp;
};

const Row = ({
  resultPos,
  levels,
  currentObject,
}: {
  resultPos: number;
  levels: LevelEntry[][];
  currentObject: Stamp;
}) => (
  <tr>
    <td>{resultPos + 1}</td>
    {levels.map((lvl, labyrinth) => {
      if (lvl.length <= resultPos) {
        return <td className={cn.empty} colSpan={4} key={labyrinth} />;
      }
      const { length, score, level, retry, stamp } = lvl[resultPos];
      const cnn = currentObject === stamp ? cn.current : '';
      return (
        <Fragment key={labyrinth}>
          <td className={cnn}>{score}</td>
          <td className={cnn}>{length}</td>
          <td className={cnn}>{retry}</td>
          <td className={cnn}>{level}</td>
        </Fragment>
      );
    })}
  </tr>
);

const AuthPanel = () => {
  const session = useSession();
  const { user } = useSessionState();
  if (user) {
    return (
      <div className={cn.auth}>
        <span className={cn.userName}>{user.name}</span>
        <Button onClick={() => void session.logout()}>Logout</Button>
      </div>
    );
  }
  return (
    <div className={cn.auth}>
      <span className={cn.authHint}>Login to submit your result:</span>
      <Button className={cn.loginBtn} onClick={() => void session.login('yandex')}>
        Yandex
      </Button>
      <Button className={cn.loginBtn} onClick={() => void session.login('google')}>
        Google
      </Button>
    </div>
  );
};

type ResultsProps = {
  onRestart: () => void;
  onResurrect: () => void;
};

const Results = ({ onRestart, onResurrect }: ResultsProps) => {
  const stamps = useStamps();
  const results = stamps.all();
  const currentObject = results[results.length - 1];

  const levels: LevelEntry[][] = new Array(6).fill(null).map(() => []);
  for (const stamp of results) {
    const { eatens, labyrinth, score, level, retryCounter } = stamp;
    levels[labyrinth].push({
      length: eatens?.length ?? 0,
      score,
      level,
      retry: retryCounter ?? 0,
      stamp,
    });
  }

  const [orderBy, setOrderBy] = useState(
    () => localStorage.getItem('order') ?? orderSelector[0].key,
  );
  const onDropdownClick = ({ key }: { key: string }) => {
    setOrderBy(key);
    localStorage.setItem('order', key);
  };

  let currentIdx = -1;
  for (const lvl of levels) {
    lvl.sort((a, b) => b[orderBy as 'score'] - a[orderBy as 'score']);
    const cur = lvl.find(({ stamp }) => stamp === currentObject);
    if (cur) {
      currentIdx = lvl.indexOf(cur);
    }
  }

  if (!currentObject) {
    return null;
  }

  const maxPlayed = Math.max(...levels.map((a) => a.length));

  return (
    <div className={cn.wrap}>
      <h2>{currentObject.isWin ? 'Congratulation! You win!' : 'Game over'}</h2>
      <AuthPanel />
      <div>
        Order by:
        <Dropdown
          menu={{
            items: orderSelector,
            onClick: onDropdownClick,
            selectedKeys: [orderBy],
          }}
          placement="bottom"
        >
          <Button tabIndex={3} className={cn.order}>
            {orderSelector.find(({ key }) => key === orderBy)?.label}
          </Button>
        </Dropdown>
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
          {new Array(Math.min(maxPlayed, Math.max(10, currentIdx <= 11 ? currentIdx + 1 : 0)))
            .fill(null)
            .map((_, resultPos) => (
              <Row
                key={resultPos}
                resultPos={resultPos}
                levels={levels}
                currentObject={currentObject}
              />
            ))}
          {currentIdx > 11 && (
            <Fragment>
              <tr className={cn.elapse}>
                <td>...</td>
                <td colSpan={4 * levels.length} />
              </tr>
              <Row
                resultPos={currentIdx}
                levels={levels}
                currentObject={currentObject}
              />
            </Fragment>
          )}
        </tbody>
      </table>
      <div className={cn.other}>
        <MiniField stamp={currentObject} />
        <div className={cn.buttons}>
          <Button tabIndex={1} onClick={onRestart} autoFocus>
            Restart
          </Button>
          {currentObject.eatens.length >= 10 && (
            <Button tabIndex={2} onClick={onResurrect}>
              Resurect
            </Button>
          )}
        </div>
        <Achievements />
      </div>
    </div>
  );
};

export { Results };
