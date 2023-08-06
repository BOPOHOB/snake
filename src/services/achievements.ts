import { assets } from 'components/game/assets';

type AchievementType = 'finished' | 'score' | 'no bug' | 'win' | 'ate bug' | 'started';

abstract class Achievement {
  isFinished: boolean = false;
  isResurrected: boolean = false;
  abstract name: string;
  abstract icon: Array<Array<number>>;
  abstract details: string;
  progress: null | { all: number, now: number } = null;
  
  finish():void {
    this.accept = () => {};
    this.isFinished = true;
    achievements?.onAchieved?.(this);
  };

  abstract accept(type: AchievementType, context: any): void;
}

class DemoAchieve extends Achievement {
  name = 'Explorer';
  details = 'Visit all labyrinths';

  icon = [
    [0,1,1,1,1,1,0],
    [1,1,0,0,0,1,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0],
    [1,1,0,0,0,0,1],
    [0,1,1,1,1,1,0],
  ];

  progress = {
    all: assets.labyrinth.length,
    now: 0,
  };

  state: Array<boolean> = new Array(assets.labyrinth.length).fill(false);
  
  accept(type: AchievementType, game: any) {
    switch (type) {
    case 'finished':
    case 'started':
      this.state[game.labyrinth] = true;
      this.progress.now = this.state.reduce((sum: number, cur: boolean) => cur ? sum + 1 : sum, 0);
      if (this.state.indexOf(false) < 0) {
        this.finish();
      }
      return;
    default:
      return;
    }
  }
}

class ScoreThousand extends Achievement {
  name = '1000';
  details = 'Collect 1000 points in any game';

  icon = [
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ];
  
  accept(type: AchievementType, game: any) {
    switch (type) {
    case 'finished':
    case 'score':
      if (game.score >= 1000) {
        this.finish();
      }
      return;
    default:
      return;
    }
  }
}

class ScoreThousandForAll extends Achievement {
  name = '1000 for all';
  details = 'Collect 1000 points in each labyrinth';
  progressComplete = 6;
  progress = {
    all: assets.labyrinth.length,
    now: 0
  };

  icon = [
    [0,1,1,1,0],
    [0,1,0,0,0],
    [0,1,1,1,0],
    [0,1,0,1,0],
    [0,1,1,1,0],
  ];

  state: Array<boolean> = new Array(assets.labyrinth.length).fill(false);

  accept(type: AchievementType, game: any) {
    switch (type) {
    case 'finished':
    case 'score':
      if (game.score >= 1000) {
        this.state[game.labyrinth] = true;
        this.progress.now = this.state.reduce((sum, cur) => cur ? sum + 1 : sum, 0);
        if (this.state.indexOf(false) < 0) {
          this.finish();
        }
      }
      return;
    default:
      return;
    }
  }
}

class Achievements
{
  achievements: Achievement[] = [];
  resurrected: Achievement[] = [];

  zzzzzz = [
    /*
сыграть во всех лабиринтах
съесть пять букашек подряд
съесть три одинаковых букашки подряд
съесть пять букашек в одной игре
съесть букашку со счётчиком больше 15ти
съесть два яблока за два тика
съесть три яблока за три тика
иметь на теле более трёх съеденных элементов
иметь на теле более шести съеденных элементов
не успеть съесть букашку
набрать 300 очков не съев букашек
выиграть
Воскресить змею
врезаться в лабиринт
проползти за своим хвостом десять тиков
Проползти на другую сторону тора
набрать 1000 очков не выползая на другую сторону тора
Набрать 2000 очков
Сыграть на уровне выше 10го
набрать 500 очков на уровне выше 10го
Выиграть на 5ом уровне или выше
выиграть на третьем уровне или выше
выиграть на третьем лабиринте или выше*/
  ];

  onAchieved?: (a: Achievement) => void;

  accept(eventType: AchievementType, context: any)
  {
    if (context.retryCounter === 0) {
      for (const achievement of this.achievements) {
        achievement.accept(eventType, context);
      }
    }
    for (const achievement of this.resurrected) {
      achievement.accept(eventType, context);
    }
  }

  *results() {
    for (let i = 0; i < this.achievements.length; ++i) {
      console.log(this.achievements[i].name, this.achievements[i].isFinished, this.resurrected[i].isFinished);
      if (this.achievements[i].isFinished) {
        yield this.achievements[i];
      } else {
        yield this.resurrected[i];
      }
    }
  }

  constructor() {
    for (const achievements of [this.achievements, this.resurrected]) {
      achievements.push(new ScoreThousand());
      achievements.push(new ScoreThousandForAll());
      achievements.push(new DemoAchieve());
    }
    for (const achievement of this.resurrected) {
      achievement.isResurrected = true;
    }
    for (const stamp of JSON.parse(localStorage.getItem('stamp') ?? '[]')) {
      this.accept('finished', stamp);
    }
  }
}

var achievements = new Achievements();

export { achievements };
