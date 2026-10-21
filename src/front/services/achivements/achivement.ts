import { achievements } from "./achivements";
import { ICONS } from "./achivementsIcon";

type AchievementType = 'finished' | 'score' | 'no bug' | 'win' | 'ate bug' | 'started';

abstract class Achievement {
  isFinished: boolean = false;
  isResurrected: boolean = false;
  abstract name: keyof typeof ICONS;
  get icon() { return ICONS[this.name]; };
  abstract details: string;
  progress: null | { all: number, now: number } = null;
  
  finish():void {
    this.accept = () => {};
    this.isFinished = true;
    achievements.onAchieved?.(this);
  };

  abstract accept(type: AchievementType, context: any): void;
}

export { Achievement, type AchievementType };
