import { describe, expect, it } from 'vitest';
import { generateId, getNextZIndex, randomSeed } from './random';

describe('random utils', () => {
  it('generateId devuelve strings únicos y no vacíos', () => {
    const a = generateId();
    const b = generateId();
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });

  it('randomSeed está dentro del rango de 15 bits', () => {
    for (let i = 0; i < 100; i++) {
      const seed = randomSeed();
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(2 ** 15);
    }
  });

  it('getNextZIndex devuelve max+1', () => {
    expect(getNextZIndex([{ zIndex: 0 }, { zIndex: 5 }, { zIndex: 3 }])).toBe(6);
  });

  it('getNextZIndex con lista vacía devuelve 0', () => {
    expect(getNextZIndex([])).toBe(0);
  });
});