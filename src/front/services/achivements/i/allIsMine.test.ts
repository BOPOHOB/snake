import '../achivements';
import { describe, it, expect } from 'vitest';
import { AllIsMineAchieve } from './allIsMine';

/** Проверяем, что упаковка направления через объектную форму совпадает с прямой упаковкой. */
describe('AllIsMineAchieve finished', () => {
  it('Проверка обхода съедения', () => {
    const b = new AllIsMineAchieve();
    b.accept('finished', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24,     56, 78],
      bugTypes: [],
    });
    expect(b.progress.now).toBe(3);
    expect(b.isFinished).toBe(false);
  });
  it('Проверка захвата ачивки', () => {
    const b = new AllIsMineAchieve();
    b.accept('finished', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24, 34, 56, 78],
      bugTypes: [],
    });
    expect(b.progress.now).toBe(b.progress.all);
    expect(b.isFinished).toBe(true);
  });
});

describe('AllIsMineAchieve ate bug', () => {
  it('Проверка обхода съедения', () => {
    const b = new AllIsMineAchieve();
    b.accept('ate bug', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24,     56, 78],
      bugTypes: [],
    });
    expect(b.progress.now).toBe(2);
    expect(b.isFinished).toBe(false);
  });
  it('Проверка захвата ачивки', () => {
    const b = new AllIsMineAchieve();
    b.accept('ate bug', {
      bugTicks: [1, 5, 10, 15, 22, 33, 55, 77],
      bugEaten: [1,    11, 19, 24, 34, 56, 78],
      bugTypes: [],
    });
    expect(b.progress.now).toBe(b.progress.all);
    expect(b.isFinished).toBe(true);
  });
});
