import React from 'react';
import { achievements } from 'services/achievements';
import { BitScene } from 'elements/bitscene';
import classNames from 'classnames';

import cn from './achievements.module.less';

const Achievement = ({ achivement }) => {
  const resurrected = achivement.isResurrected && achivement.isFinished;
  return (
    <li className={classNames({ [cn.resurrected]: resurrected, [cn.finished]: achivement.isFinished })}>
      <BitScene width={70} height={70} bg={resurrected ? 'white' : undefined } data={achivement.icon} />
      <h3>{achivement.name}{!achivement.isFinished && achivement.progress && ` (${achivement.progress.now} / ${achivement.progress.all})`}</h3>
      <p>{achivement.details}</p>
    </li>
  );
};

const Achievements = () => (
  <ul className={cn.wrap}>
    { [...achievements.results()].map((achivement, id) => <Achievement key={id} achivement={achivement} />) }
  </ul>
);

export { Achievements };
