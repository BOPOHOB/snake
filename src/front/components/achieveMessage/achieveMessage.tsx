import { message } from 'antd';
import { BitScene } from '../elements/BitScene';
import cn from './achieveMessage.module.less';

type AchievementLike = {
  isResurrected: boolean;
  name: string;
  icon: number[][];
  details: string;
};

const achieveMessage = (achive: AchievementLike) => {
  message.open({
    icon: (
      <BitScene
        bg={achive.isResurrected ? 'white' : undefined}
        data={achive.icon}
        width={70}
        height={70}
      />
    ),
    content: (
      <div className={cn.wrap}>
        <h3>Achievement locked{achive.isResurrected ? ' with resurrection' : ''}!</h3>
        <p>
          <b>{achive.name}</b>
          {achive.details ? `: ${achive.details}` : ''}
        </p>
      </div>
    ),
    className: achive.isResurrected ? cn.resurrected : cn.pure,
  });
};

export { achieveMessage };
