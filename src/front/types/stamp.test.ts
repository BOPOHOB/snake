import { describe, it, expect } from 'vitest';
import { objectPoint, directionObject, directionPoint, keepTorus, pointObject, type Direction } from './stamp';

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

/** Перекрёстный заём при p-1 с x=0: упаковка (y<<10)+x даёт x=1023, y-1.
 *  pointObject должен это детектить (x > 512) и восстанавливать: x=-1, y+=1. */
describe('pointObject — детекция перекрёстного заёма', () => {
  it('валидная точка распаковывается как есть', () => {
    expect(pointObject(objectPoint([5, 3]))).toEqual([5, 3]);
    expect(pointObject(objectPoint([19, 8]))).toEqual([19, 8]);
  });

  it('заём при p-1 с x=0 восстанавливается', () => {
    const p = objectPoint([0, 4]); // = 4096
    expect(pointObject(p - 1)).toEqual([-1, 4]); // 4095 → x=1023,y=3 → восстановление → [-1,4]
  });

  it('заём из нулевой строки не уходит в отрицательный y', () => {
    const p = objectPoint([0, 0]); // = 0
    expect(pointObject(p - 1)).toEqual([-1, 0]); // -1 → x=1023,y=-1 → восстановление → [-1,0]
  });
});

/** keepTorus заворачивает точку по тору после прибавления directionPoint.
 *  Заворот влево при x=0 должен давать x=W-1, y unchanged. */
describe('keepTorus — заворот по тору', () => {
  const size = objectPoint([20, 8]);

  it('заворот влево при x=0 → x=W-1, y сохранён', () => {
    const p = objectPoint([0, 4]); // = 4096
    expect(keepTorus(p - 1, size)).toBe(objectPoint([19, 4])); // p + directionPoint(3) = p - 1
  });

  it('заворот влево из нулевой строки', () => {
    const p = objectPoint([0, 0]);
    expect(keepTorus(p - 1, size)).toBe(objectPoint([19, 0]));
  });

  it('заворот вправо при x=W-1 → x=0', () => {
    const p = objectPoint([19, 3]);
    expect(keepTorus(p + 1, size)).toBe(objectPoint([0, 3]));
  });

  it('заворот вверх при y=0 → y=H-1', () => {
    const p = objectPoint([5, 0]);
    expect(keepTorus(p - (1 << 10), size)).toBe(objectPoint([5, 7]));
  });

  it('заворот вниз при y=H-1 → y=0', () => {
    const p = objectPoint([5, 7]);
    expect(keepTorus(p + (1 << 10), size)).toBe(objectPoint([5, 0]));
  });
});
