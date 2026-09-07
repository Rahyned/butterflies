import { describe, expect, it } from 'vitest';
import { getElementBounds, getHandleAt, getHandlePositions, hitTestElement, intersects } from './hitTest';
import type { CanvasElement, Point, TextElement } from '../../types/canvas';

function rect(id: string, x: number, y: number, width: number, height: number): CanvasElement {
  return {
    type: 'rect', id, x, y, width, height,
    strokeColor: '#000', fillColor: 'transparent',
    strokeWidth: 2, roughness: 0, opacity: 1, seed: 1, zIndex: 1,
  };
}

function line(id: string, p1: Point, p2: Point): CanvasElement {
  return {
    type: 'line', id, x: 0, y: 0, width: 0, height: 0,
    strokeColor: '#000', fillColor: 'transparent',
    strokeWidth: 2, roughness: 0, opacity: 1, seed: 1, zIndex: 1,
    points: [p1, p2],
  };
}

describe('getElementBounds', () => {
  it('rect: usa x/y/w/h con mínimo 10px', () => {
    expect(getElementBounds(rect('a', 5, 5, 8, 8))).toEqual({ x: 5, y: 5, width: 10, height: 10 });
    expect(getElementBounds(rect('b', 0, 0, 50, 30))).toEqual({ x: 0, y: 0, width: 50, height: 30 });
  });

  it('line: calcula bounds de los puntos', () => {
    expect(getElementBounds(line('l', { x: 0, y: 0 }, { x: 100, y: 50 }))).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('text: altura real medida con word wrap', () => {
    const el: TextElement = {
      type: 'text', id: 't', x: 0, y: 0, width: 50, height: 20,
      strokeColor: '#000', fillColor: 'transparent',
      strokeWidth: 2, roughness: 0, opacity: 1, seed: 1, zIndex: 1,
      text: 'hola mundo', fontSize: 20, fontFamily: 'monospace', fontWeight: '400',
    };
    const bounds = getElementBounds(el);
    expect(bounds.width).toBeGreaterThanOrEqual(10);
    expect(bounds.height).toBeGreaterThanOrEqual(10);
  });
});

describe('hitTestElement', () => {
  it('rect: hit dentro del bounding box', () => {
    const el = rect('a', 0, 0, 50, 50);
    expect(hitTestElement(el, { x: 25, y: 25 })).toBe(true);
    expect(hitTestElement(el, { x: 100, y: 100 })).toBe(false);
  });

  it('line: hit cerca del segmento', () => {
    const el = line('l', { x: 0, y: 0 }, { x: 100, y: 0 });
    expect(hitTestElement(el, { x: 50, y: 3 })).toBe(true);
    expect(hitTestElement(el, { x: 50, y: 50 })).toBe(false);
  });

  it('freedraw: hit cerca de un punto', () => {
    const el: CanvasElement = {
      type: 'freedraw', id: 'f', x: 0, y: 0, width: 0, height: 0,
      strokeColor: '#000', fillColor: 'transparent',
      strokeWidth: 2, roughness: 0, opacity: 1, seed: 1, zIndex: 1,
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    };
    expect(hitTestElement(el, { x: 12, y: 12 })).toBe(true);
  });
});

describe('getHandlePositions / getHandleAt', () => {
  const bounds = { x: 0, y: 0, width: 100, height: 100 };

  it('genera 8 handles', () => {
    expect(getHandlePositions(bounds)).toHaveLength(8);
  });

  it('detecta el handle más cercano al punto', () => {
    expect(getHandleAt({ x: 2, y: 2 }, bounds, 10)).toBe('tl');
    expect(getHandleAt({ x: 98, y: 98 }, bounds, 10)).toBe('br');
    expect(getHandleAt({ x: 50, y: 2 }, bounds, 10)).toBe('tc');
    expect(getHandleAt({ x: 50, y: 50 }, bounds, 10)).toBeNull();
  });
});

describe('intersects', () => {
  it('detecta intersección de bounds', () => {
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 })).toBe(false);
  });
});