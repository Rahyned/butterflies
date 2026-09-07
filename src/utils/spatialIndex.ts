import type { CanvasElement } from '../types/canvas';
import { getElementBounds, type Bounds } from './hitTest';

const CELL_SIZE = 128;

type BucketMap = Map<string, CanvasElement[]>;

function cellKey(cx: number, cy: number): string {
  return `${cx}:${cy}`;
}

function getCellRange(b: Bounds): { minX: number; maxX: number; minY: number; maxY: number } {
  return {
    minX: Math.floor(b.x / CELL_SIZE),
    maxX: Math.floor((b.x + b.width) / CELL_SIZE),
    minY: Math.floor(b.y / CELL_SIZE),
    maxY: Math.floor((b.y + b.height) / CELL_SIZE),
  };
}

export class SpatialIndex {
  private buckets: BucketMap = new Map();
  private readonly elements: CanvasElement[];

  constructor(elements: CanvasElement[]) {
    this.elements = elements;
    for (const el of elements) {
      const b = getElementBounds(el);
      const range = getCellRange(b);
      for (let cx = range.minX; cx <= range.maxX; cx++) {
        for (let cy = range.minY; cy <= range.maxY; cy++) {
          const key = cellKey(cx, cy);
          const bucket = this.buckets.get(key);
          if (bucket) bucket.push(el);
          else this.buckets.set(key, [el]);
        }
      }
    }
  }

  get size(): number {
    return this.elements.length;
  }

  query(bounds: Bounds): CanvasElement[] {
    const range = getCellRange(bounds);
    const seen = new Set<string>();
    const result: CanvasElement[] = [];
    for (let cx = range.minX; cx <= range.maxX; cx++) {
      for (let cy = range.minY; cy <= range.maxY; cy++) {
        const bucket = this.buckets.get(cellKey(cx, cy));
        if (!bucket) continue;
        for (const el of bucket) {
          if (!seen.has(el.id)) {
            seen.add(el.id);
            result.push(el);
          }
        }
      }
    }
    return result;
  }
}