import React from 'react';
import { achivements } from 'services/achivements';

import cn from './achivements.module.less';

const Achivements = () => {
  console.log(achivements.achivements, achivements.resurrected);
  return (
    <div className={cn.wrap}>
      <h2>Achivements</h2>
    </div>
  );
};

export { Achivements };
