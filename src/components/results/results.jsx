import React, { useState } from 'react';
import { Button, Dropdown } from 'antd';
import { Clipboard } from 'elements/clipboard/clipboard';
import { BitScene } from 'elements/bitscene';

import cn from './results.module.less';
import { assets } from 'components/game/assets';
import { Achivements } from 'components/achivements/achivements';

const orderSelector = [
  {
    key: 'score',
    label: 'Score',
  },
  {
    key: 'length',
    label: 'Length',
  },
];

const Row = ({ resultPos, lavels, currentObject }) => (
  <tr>
    <td>{resultPos + 1}</td>
    {
      lavels.map((lvl, labyrinth) => {
        if (lvl.length <= resultPos) {
          return <td className={cn.empty} colSpan={4} key={labyrinth}></td>;
        }
        const {length, score, lavel, retry, stamp} = lvl[resultPos];
        const cnn = currentObject === stamp ? cn.current : '';
        return (
          <React.Fragment key={labyrinth}>
            <td className={cnn}>{score}</td>
            <td className={cnn}>{length}</td>
            <td className={cnn}>{retry}</td>
            <td className={cnn}>{lavel}</td>
          </React.Fragment>
        );
      })
    }
  </tr>
);

const Results = ({ onResurect, onRestart, emoji }) => {
  const results = JSON.parse(localStorage.getItem('stamp'));
  const currentObject = results[results.length - 1];
  const lavels = new Array(6).fill(null).map(() => []);
  for (const stamp of results) {
    const { eatens, labyrinth, score, lavel, retry } = stamp;
    lavels[labyrinth].push({
      length: eatens?.length ?? 0,
      score,
      lavel,
      retry: retry ?? 0,
      stamp
    });
  }
  const [orderBy, setOrderBy] = useState(localStorage.getItem('order') ?? orderSelector[0].key);
  const onDropdownClick = ({ key }) => {
    setOrderBy(key);
    localStorage.setItem('order', key);
  };
  let currentIdx = -1;
  for (const lvl of lavels) {
    lvl.sort((a, b) => b[orderBy] - a[orderBy] );
    const cur = lvl.find(({ stamp }) => stamp === currentObject);
    if (cur) {
      currentIdx = lvl.indexOf(cur);
    }
  }
  console.assert(currentIdx >= 0);
  const maxPlayed = Math.max(...lavels.map((a) => a.length));
  return (
    <div className={cn.wrap}>
      <h2>{currentObject.isWin ? 'Congratulation! You win!' : 'Game over'}</h2>
      <div>
        Order by:
        <Dropdown menu={{ items: orderSelector, onClick: onDropdownClick, selectedKeys: [orderBy] }} placement="bottom">
          <Button tabIndex={3} className={cn.order}>{orderSelector.find(({ key }) => key === orderBy).label}</Button>
        </Dropdown>
      </div>
      <table className={cn.table}>
        <thead>
          <tr>
            <th></th>
            {
              lavels.map((_, labyrinth) => <th colSpan={4} key={labyrinth}><BitScene data={assets.labyrinth[labyrinth]} /></th>) }
          </tr>
          <tr>
            <th>#</th>
            {
              lavels.map((_, labyrinth) => (
                <React.Fragment key={labyrinth}>
                  <th>score</th>
                  <th>len</th>
                  <th>rtry</th>
                  <th>lvl</th>
                </React.Fragment>
              ))
            }
          </tr>
        </thead>
        <tbody>
          {
            new Array(Math.min(maxPlayed, Math.max(10, currentIdx <= 11 ? currentIdx + 1 : 0))).fill(null).map((_, resultPos) => 
              <Row key={resultPos} resultPos={resultPos} lavels={lavels} currentObject={currentObject} />
            )
          }
          {
            currentIdx > 11 && (
              <React.Fragment>
                <tr className={cn.elapse}>
                  <td>...</td><td colSpan={4 * lavels.length}></td>
                </tr>
                <Row resultPos={currentIdx} lavels={lavels} currentObject={currentObject} />
              </React.Fragment>
            )
          }
        </tbody>
      </table>
      <div className={cn.other}>
        <Clipboard content={emoji.join('\n')}>Game frame copied to clipboard</Clipboard>
        <div className={cn.buttons}>
          <Button tabIndex={1} onClick={onRestart} autoFocus>Restart</Button>
          {currentObject.eatens.length >= 10 && <Button tabIndex={2} onClick={onResurect}>Resurect</Button>}
        </div>
        <Achivements />
      </div>
    </div>
  );
};

export { Results };
