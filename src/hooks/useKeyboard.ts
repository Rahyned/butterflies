import { useEffect } from 'react';
import type { Tool } from '../types/canvas';

interface KeyboardConfig {
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onLoad: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onEscape: () => void;
  onSpaceDown: () => void;
  onSpaceUp: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onNudge: (dx: number, dy: number) => void;
  onZoomFit: () => void;
  onZoomReset: () => void;
}

export function useKeyboard({
  onToolChange, onUndo, onRedo, onSave, onLoad,
  onDelete, onSelectAll, onEscape, onSpaceDown, onSpaceUp,
  onBringToFront, onSendToBack, onMoveUp, onMoveDown,
  onNudge, onZoomFit, onZoomReset,
}: KeyboardConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === ' ') {
        e.preventDefault();
        onSpaceDown();
        return;
      }

      if (e.key === 'Escape') { onEscape(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { onDelete(); return; }

      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        onNudge(dx, dy);
        return;
      }

      if (ctrl) {
        if (e.code === 'BracketLeft') {
          e.preventDefault();
          if (e.shiftKey) onSendToBack();
          else onMoveDown();
          return;
        }
        if (e.code === 'BracketRight') {
          e.preventDefault();
          if (e.shiftKey) onBringToFront();
          else onMoveUp();
          return;
        }
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) onRedo();
            else onUndo();
            return;
          case 'y':
            e.preventDefault();
            onRedo();
            return;
          case 's':
            e.preventDefault();
            onSave();
            return;
          case 'o':
            e.preventDefault();
            onLoad();
            return;
          case 'a':
            e.preventDefault();
            onSelectAll();
            return;
          case '0':
            e.preventDefault();
            if (e.shiftKey) onZoomFit();
            else onZoomReset();
            return;
        }
        return;
      }

      const toolMap: Record<string, Tool> = {
        '0': 'hand',
        '1': 'select', '2': 'rect', '3': 'ellipse',
        '4': 'line', '5': 'arrow', '6': 'text',
        '7': 'freedraw', '8': 'eraser',
      };
      const tool = toolMap[e.key];
      if (tool) {
        e.preventDefault();
        onToolChange(tool);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        onSpaceUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onToolChange, onUndo, onRedo, onSave, onLoad, onDelete, onSelectAll, onEscape, onSpaceDown, onSpaceUp, onBringToFront, onSendToBack, onMoveUp, onMoveDown, onNudge, onZoomFit, onZoomReset]);
}
