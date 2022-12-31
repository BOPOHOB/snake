import React from 'react';
import { achivements } from 'services/achivements';
import { BitScene } from 'elements/bitscene';
import classNames from 'classnames';

import cn from './achivements.module.less';

const Achivement = ({ achivement }) => {
  const resurrected = achivement.isResurrected && achivement.isFinished;
  return (
    <li className={classNames({ [cn.resurrected]: resurrected, [cn.finished]: achivement.isFinished })}>
      <BitScene width={70} height={70} bg={resurrected ? 'white' : undefined } data={achivement.icon} />
      <h3>{achivement.name}{!achivement.isFinished && achivement.progress && ` (${achivement.progress.now} / ${achivement.progress.all})`}</h3>
      <p>{achivement.details}</p>
    </li>
  );
};

const Achivements = () => (
  <ul className={cn.wrap}>
    { [...achivements.results()].map((achivement, id) => <Achivement key={id} achivement={achivement} />) }
  </ul>
);

export { Achivements };
