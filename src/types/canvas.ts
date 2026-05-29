export type Tool = 'select' | 'rect' | 'ellipse' | 'line' | 'arrow' | 'text' | 'freedraw' | 'eraser' | 'hand';

export type Point = { x: number; y: number };

export type BaseElement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  roughness: number;
  opacity: number;
  seed: number;
  zIndex: number;
};

export type RectElement   = BaseElement & { type: 'rect' };
export type EllipseElement = BaseElement & { type: 'ellipse' };
export type LineElement   = BaseElement & { type: 'line'; points: Point[] };
export type ArrowElement  = BaseElement & { type: 'arrow'; points: Point[] };
export type TextElement   = BaseElement & { type: 'text'; text: string; fontSize: number; fontFamily: string; fontWeight?: string };
export type FreedrawElement = BaseElement & { type: 'freedraw'; points: Point[] };

export type CanvasElement =
  | RectElement | EllipseElement | LineElement
  | ArrowElement | TextElement | FreedrawElement;

export type Group = {
  id: string;
  elementIds: string[];
};

export type CanvasState = {
  elements: CanvasElement[];
  selectedIds: string[];
  camera: { x: number; y: number; zoom: number };
};
