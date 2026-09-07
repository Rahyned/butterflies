import { describe, expect, it } from 'vitest';
import { SpatialIndex } from './spatialIndex';
import type { CanvasElement } from '../../types/canvas';

function rect(id: string, x: number, y: number, width: number, height: number): CanvasElement {
  return {
    type: 'rect', id, x, y, width, height,
    strokeColor: '#000', fillColor: 'transparent',
    strokeWidth: 2, roughness: 0, opacity: 1, seed: 1, zIndex: 1,
  };
}

describe('SpatialIndex', () => {
  it('indexa elementos y responde queries por bounds', () => {
    const a = rect('a', 0, 0, 10, 10);
    const b = rect('b', 500, 500, 10, 10);
    const idx = new SpatialIndex([a, b]);

    const nearA = idx.query({ x: 5, y: 5, width: 10, height: 10 });
    expect(nearA.map(e => e.id)).toContain('a');
    expect(nearA.map(e => e.id)).not.toContain('b');
  });

  it('devuelve elementos cuya bounds intersecta el rect consultado', () => {
    const a = rect('a', 100, 100, 50, 50);
    const idx = new SpatialIndex([a]);

    const inside = idx.query({ x: 120, y: 120, width: 10, height: 10 });
    const outside = idx.query({ x: 1000, y: 1000, width: 10, height: 10 });
    expect(inside.map(e => e.id)).toContain('a');
    expect(outside).toHaveLength(0);
  });

  it('no duplica elementos que tocan múltiples celdas', () => {
    const big = rect('big', 0, 0, 300, 300); // atraviesa varias celdas de 128px
    const idx = new SpatialIndex([big]);
    const result = idx.query({ x: 150, y: 150, width: 10, height: 10 });
    expect(result.filter(e => e.id === 'big')).toHaveLength(1);
  });

  it('refleja el tamaño del set de elementos', () => {
    const idx = new SpatialIndex([rect('a', 0, 0, 5, 5), rect('b', 200, 200, 5, 5)]);
    expect(idx.size).toBe(2);
  });

  it('funciona con set vacío', () => {
    const idx = new SpatialIndex([]);
    expect(idx.query({ x: 0, y: 0, width: 100, height: 100 })).toHaveLength(0);
  });
});