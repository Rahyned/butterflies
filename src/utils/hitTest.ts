import type { CanvasElement, Point } from '../types/canvas';

export function hitTestElement(el: CanvasElement, point: Point): boolean {
  if ('points' in el && el.points && el.points.length > 0) {
    const threshold = 8;
    for (const p of el.points) {
      const dist = Math.sqrt((point.x - p.x) ** 2 + (point.y - p.y) ** 2);
      if (dist < threshold) return true;
    }
    const xs = el.points.map(p => p.x);
    const ys = el.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) return true;
    return false;
  }

  return (
    point.x >= el.x &&
    point.x <= el.x + el.width &&
    point.y >= el.y &&
    point.y <= el.y + el.height
  );
}

export function getElementBounds(el: CanvasElement): { x: number; y: number; width: number; height: number } {
  if ('points' in el && el.points && el.points.length > 0) {
    const xs = el.points.map(p => p.x);
    const ys = el.points.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: Math.max(maxX - minX, 10), height: Math.max(maxY - minY, 10) };
  }
  if (el.type === 'text') {
    return { x: el.x, y: el.y, width: el.text.length * el.fontSize * 0.6, height: el.fontSize * 1.2 };
  }
  return { x: el.x, y: el.y, width: Math.max(el.width, 10), height: Math.max(el.height, 10) };
}
