import { achievements } from "./achivements";
import { ICONS } from "./achivementsIcon";

type AchievementType = 'finished' | 'score' | 'no bug' | 'win' | 'ate bug' | 'started';

const DETAILS: Record<keyof typeof ICONS, string> = {
  "Not a beginner": 'Collect 1000 points',
  "1000 for all": 'Collect 1000 points in each labyrinth',
  'Explorer': "сыграть во всех лабиринтах",
  'All is mine': "съесть пять букашек подряд",
  'Broccoli again': "съесть три одинаковых букашки подряд",
  'This is my favorite': "съесть пять букашек в одной игре",
  'Snake reaction': "съесть букашку со счётчиком больше 15ти",
  'Double swallow': "съесть два яблока за два тика",
  'Triple swallow': "съесть три яблока за три тика",
  'Grow': "иметь на теле более трёх съеденных элементов",
  'Grow faster': "иметь на теле более шести съеденных элементов",
  'I miss you': "не успеть съесть букашку",
  'Greenpeace': "набрать 300 очков не съев букашек",
  'World is mine': "выиграть",
  'I’m not full': "Воскресить змею",
  'Wall was not open': "врезаться в лабиринт",
  'Nice to see you': "проползти за своим хвостом десять тиков",
  'Endless': "Проползти на другую сторону тора",
  'Simple world': "набрать 1000 очков не выползая на другую сторону тора",
  'Big boss': "Набрать 12000 очков",
  'Faster then light': "Сыграть на уровне выше 12го",
  'How it happened': "набрать 500 очков на уровне выше 12го",
  'Deep dungeon': "Выиграть на 5ом уровне или выше",
  'Advanced': "выиграть на третьем уровне или выше",
  'Sonic super hedgehog': "выиграть на третьем лабиринте или выше",
};

abstract class Achievement {
  isFinished: boolean = false;
  isResurrected: boolean = false;
  abstract name: keyof typeof ICONS;
  get icon() { return ICONS[this.name]; };
  get details() { return DETAILS[this.name] }
  progress: null | { all: number, now: number } = null;
  
  finish():void {
    this.accept = () => {};
    this.isFinished = true;
    achievements?.onAchieved?.(this);
  };

  abstract accept(type: AchievementType, context: any): void;
}

export { Achievement, type AchievementType };
