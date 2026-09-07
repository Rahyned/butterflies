import { useCallback, useEffect, useRef } from 'react';
import type { CanvasElement, Point, Tool } from '../types/canvas';
import { hitTestElement } from '../utils/hitTest';
import { generateId, getNextZIndex, randomSeed } from '../utils/random';

export interface DrawingStyles {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  roughness: number;
}

export function useDrawing() {
  const drawingElement = useRef<CanvasElement | null>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<Point | null>(null);
  const shiftPressed = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftPressed.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftPressed.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isDrawingNow = useCallback(() => isDrawing.current, []);

  const startDrawing = useCallback((
    world: Point,
    tool: Tool,
    styles: DrawingStyles,
    elements: CanvasElement[],
    setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  ) => {
    isDrawing.current = true;
    startPoint.current = world;

    const base = {
      strokeColor: styles.strokeColor,
      fillColor: styles.fillColor,
      strokeWidth: styles.strokeWidth,
      roughness: styles.roughness,
      opacity: 1,
      seed: randomSeed(),
      zIndex: getNextZIndex(elements),
    };

    switch (tool) {
      case 'rect':
      case 'ellipse': {
        const type = tool as 'rect' | 'ellipse';
        drawingElement.current = { type, id: generateId(), x: world.x, y: world.y, width: 0, height: 0, ...base };
        break;
      }
      case 'line':
      case 'arrow': {
        const type = tool as 'line' | 'arrow';
        drawingElement.current = { type, id: generateId(), x: 0, y: 0, width: 0, height: 0, ...base, points: [world, world] };
        break;
      }
      case 'freedraw': {
        drawingElement.current = { type: 'freedraw', id: generateId(), x: 0, y: 0, width: 0, height: 0, ...base, points: [world] };
        break;
      }
      case 'eraser': {
        setElements(prev => prev.filter(el => !hitTestElement(el, world)));
        break;
      }
      default:
        break;
    }
  }, []);

  const updateDrawing = useCallback((
    world: Point,
    setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  ) => {
    if (!isDrawing.current) return;
    if (!drawingElement.current) {
      setElements(prev => prev.filter(el => !hitTestElement(el, world)));
      return;
    }
    if (!startPoint.current) return;
    const start = startPoint.current;
    const el = drawingElement.current;

    switch (el.type) {
      case 'rect':
      case 'ellipse': {
        const x = Math.min(start.x, world.x);
        const y = Math.min(start.y, world.y);
        let w = Math.abs(world.x - start.x);
        let h = Math.abs(world.y - start.y);
        if (shiftPressed.current) {
          const size = Math.max(w, h);
          w = size;
          h = size;
        }
        drawingElement.current = { ...el, x, y, width: w, height: h };
        break;
      }
      case 'line':
      case 'arrow':
        drawingElement.current = { ...el, points: [start, world] };
        break;
      case 'freedraw':
        drawingElement.current = { ...el, points: [...el.points, world] };
        break;
      default:
        break;
    }
  }, []);

  const finishDrawing = useCallback((setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>) => {
    if (!isDrawing.current || !drawingElement.current) {
      isDrawing.current = false;
      return;
    }
    const el = drawingElement.current;
    const tooSmall = (el.type === 'rect' || el.type === 'ellipse') && el.width < 3 && el.height < 3;

    if (!tooSmall) {
      setElements(prev => [...prev, el]);
    }
    drawingElement.current = null;
    isDrawing.current = false;
    startPoint.current = null;
  }, []);

  return {
    drawingElement,
    isDrawingNow,
    startDrawing,
    updateDrawing,
    finishDrawing,
  };
}