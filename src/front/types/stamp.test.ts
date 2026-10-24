import { describe, it, expect } from 'vitest';
import { objectPoint, directionObject, directionPoint, type Direction } from './stamp';

/** Проверяем, что упаковка направления через объектную форму совпадает с прямой упаковкой. */
describe('directionPoint', () => {
  const check = (d: Direction) =>
    expect(objectPoint(directionObject(d))).toBe(directionPoint(d));

  it('d=0 (top): objectPoint(directionObject(d)) === directionPoint(d)', () => check(0));
  it('d=1 (right): objectPoint(directionObject(d)) === directionPoint(d)', () => check(1));
  it('d=2 (bottom): objectPoint(directionObject(d)) === directionPoint(d)', () => check(2));
  it('d=3 (left): objectPoint(directionObject(d)) === directionPoint(d)', () => check(3));

  it('все 4 направления дают ожидаемые упакованные дельты', () => {
    // top=-1<<10, right=1, bottom=1<<10, left=-1
    expect(directionPoint(0)).toBe(-1 << 10);
    expect(directionPoint(1)).toBe(1);
    expect(directionPoint(2)).toBe(1 << 10);
    expect(directionPoint(3)).toBe(-1);
  });
});
