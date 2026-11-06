import '../achivements';
import { describe, it, expect } from 'vitest';
import { BroccoliAgainAchieve } from './broccoliAgain';

/** Проверяем, что упаковка направления через объектную форму совпадает с прямой упаковкой. */
describe('BroccoliAgainAchieve finish', () => {
  it('Проверка обхода съедения', () => {
    const b = new BroccoliAgainAchieve();
    b.accept('finished', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24,     56, 78],
      bugTypes: [1, 1,  1,  2,  2,  2,  3,  3]
    });
    expect(b.progress.now).toBe(2);
  });
  it('Проверка пропуска несъеденных', () => {
    const b = new BroccoliAgainAchieve();
    b.accept('finished', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24,     56, 78],
      bugTypes: [1, 1,  1,  2,  2,  3,  2,  3]
    });
    expect(b.isFinished).toBe(true);
  });
  it('Проверка пропуска несъеденных', () => {
    const b = new BroccoliAgainAchieve();
    b.accept('finished', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24,     56, 78],
      bugTypes: [1, 1,  3,  2,  1,  3,  2,  2]
    });
    expect(b.progress.now).toBe(2);
  });
});
describe('BroccoliAgainAchieve ate', () => {
  it('Проверка обхода съедения', () => {
    const b = new BroccoliAgainAchieve();
    b.accept('ate bug', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24,     56, 78],
      bugTypes: [1, 1,  1,  2,  2,  2,  3,  3]
    });
    expect(b.progress.now).toBe(2);
  });
  //@todo если алгоритм оптимизирован то ачивка не будет захвачена а результат будет 1
  it('Проверка пропуска несъеденных', () => {
    const b = new BroccoliAgainAchieve();
    b.accept('ate bug', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24,     56, 78],
      bugTypes: [1, 1,  1,  2,  2,  3,  2,  3]
    });
    expect(b.isFinished).toBe(true);
  });
  it('Проверка пропуска несъеденных', () => {
    const b = new BroccoliAgainAchieve();
    b.accept('ate bug', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24,     56, 78],
      bugTypes: [1, 1,  3,  2,  1,  3,  2,  2]
    });
    expect(b.progress.now).toBe(2);
  });
});
