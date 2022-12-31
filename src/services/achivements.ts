import { assets } from 'components/game/assets';

type AchivementType = 'finished' | 'score' | 'no bug' | 'win' | 'ate bug' | 'started';

abstract class Achivement {
  isFinished: boolean = false;
  isResurrected: boolean = false;
  abstract name: string;
  abstract icon: Array<Array<number>>;
  abstract details: string;
  progress: null | { all: number, now: number } = null;
  
  finish():void {
    this.accept = () => {};
    this.isFinished = true;
    achivements?.onAchived?.(this);
  };

  abstract accept(type: AchivementType, context: any): void;
}

class DemoAchive extends Achivement {
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
  
  accept(type: AchivementType, game: any) {
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

class ScoreThousand extends Achivement {
  name = '1000';
  details = 'Collect 1000 points in any game';

  icon = [
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ];
  
  accept(type: AchivementType, game: any) {
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

class ScoreThousandForAll extends Achivement {
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

  accept(type: AchivementType, game: any) {
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

class Achivements
{
  achivements: Achivement[] = [];
  resurrected: Achivement[] = [];

  ahivements = [
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

  onAchived?: (a: Achivement) => void;

  accept(eventType: AchivementType, context: any)
  {
    if (context.retryCounter === 0) {
      for (const achivement of this.achivements) {
        achivement.accept(eventType, context);
      }
    }
    for (const achivement of this.resurrected) {
      achivement.accept(eventType, context);
    }
  }

  *results() {
    for (let i = 0; i < this.achivements.length; ++i) {
      if (this.achivements[i].isFinished) {
        yield this.achivements[i];
      } else {
        yield this.resurrected[i];
      }
    }
  }

  constructor() {
    for (const achivements of [this.achivements, this.resurrected]) {
      achivements.push(new ScoreThousand());
      achivements.push(new ScoreThousandForAll());
      achivements.push(new DemoAchive());
    }
    for (const achivement of this.resurrected) {
      achivement.isResurrected = true;
    }
    for (const stamp of JSON.parse(localStorage.getItem('stamp') ?? '[]')) {
      this.accept('finished', stamp);
    }
  }
}

var achivements = new Achivements();

export { achivements };
