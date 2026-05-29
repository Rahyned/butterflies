import type { CanvasElement, Point, TextElement } from '../types/canvas';
import { measureTextHeight } from './renderer';

function isTextElement(el: CanvasElement): el is TextElement {
  return el.type === 'text';
}

function distToSegmentSq(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (a.x + t * abx)) ** 2 + (p.y - (a.y + t * aby)) ** 2;
}

export function hitTestElement(el: CanvasElement, point: Point): boolean {
  if ('points' in el && el.points && el.points.length > 0) {
    const pts = el.points;
    if (pts.length === 2) {
      return distToSegmentSq(point, pts[0], pts[1]) < 100;
    }
    const threshold = 8;
    for (const p of pts) {
      const dist = Math.sqrt((point.x - p.x) ** 2 + (point.y - p.y) ** 2);
      if (dist < threshold) return true;
    }
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) return true;
    return false;
  }

  const bounds = getElementBounds(el);
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function getElementBounds(el: CanvasElement): { x: number; y: number; width: number; height: number } {
  if (isTextElement(el)) {
    const h = measureTextHeight(el.text, el.width, el.fontSize, el.fontFamily);
    return { x: el.x, y: el.y, width: Math.max(el.width, 10), height: Math.max(h, 10) };
  }
  if ('points' in el && el.points && el.points.length > 0) {
    const xs = el.points.map(p => p.x);
    const ys = el.points.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: Math.max(maxX - minX, 10), height: Math.max(maxY - minY, 10) };
  }
  return { x: el.x, y: el.y, width: Math.max(el.width, 10), height: Math.max(el.height, 10) };
}
