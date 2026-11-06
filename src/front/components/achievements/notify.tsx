import type { FC } from "react";
import type { Achievement } from "../../services/achivements/achivement";
import { BitScene } from "../elements/BitScene";

import cn from './notify.module.less';
import type { ArgsProps } from "antd/es/notification";

const Notify: FC<{ achievement: Achievement }> = ({ achievement: a }) => {
  return (
    <div className={cn.layout}>
      <div className={cn.icon}>
        <BitScene
          data={a.icon}
          width={50 / a.icon.length * a.icon.at(0)!.length}
          height={50}
          bg={a.isResurrected ? 'white' : undefined}
        />
      </div>
      <div className={cn.text}>
        <h3>{a.name}</h3>
        <p>{a.details}</p>
      </div>
    </div>
  );
};

const notify = (a: Achievement): ArgsProps => ({
  className: cn.container,
  placement: 'topRight',
  message: <Notify achievement={a} />
})

export { notify };
