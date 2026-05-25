import { useCallback, useRef, useEffect } from 'react';
import type { CanvasElement } from '../types/canvas';

const MAX_HISTORY = 50;

export function useHistory(elements: CanvasElement[], setElements: (els: CanvasElement[]) => void) {
  const stackRef = useRef<CanvasElement[][]>([[]]);
  const pointerRef = useRef(0);
  const skipRef = useRef(false);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    stackRef.current = stackRef.current.slice(0, pointerRef.current + 1);
    stackRef.current.push([...elements]);
    if (stackRef.current.length > MAX_HISTORY) stackRef.current.shift();
    pointerRef.current = stackRef.current.length - 1;
  }, [elements]);

  const undo = useCallback(() => {
    if (pointerRef.current <= 0) return;
    pointerRef.current--;
    skipRef.current = true;
    setElements([...stackRef.current[pointerRef.current]]);
  }, [setElements]);

  const redo = useCallback(() => {
    if (pointerRef.current >= stackRef.current.length - 1) return;
    pointerRef.current++;
    skipRef.current = true;
    setElements([...stackRef.current[pointerRef.current]]);
  }, [setElements]);

  return { undo, redo };
}
