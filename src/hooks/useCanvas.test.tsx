import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCanvas } from './useCanvas';
import { useHistory } from './useHistory';

const rect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;

function setup() {
  const wrapper = renderHook(() => {
    const canvas = useCanvas();
    const { undo, redo } = useHistory(canvas.elements, canvas.setElements);
    return { ...canvas, undo, redo };
  });
  return wrapper;
}

function key(key: string, opts: { shiftKey?: boolean; ctrlKey?: boolean; code?: string } = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, ...opts }));
}

describe('useCanvas E2E — herramientas de dibujo', () => {
  it('rect: dibuja rectángulo con pointer down/move/up', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(300, 200, rect));
    act(() => result.current.handlePointerUp());

    expect(result.current.elements).toHaveLength(1);
    const el = result.current.elements[0];
    expect(el.type).toBe('rect');
    expect(el.x).toBe(100);
    expect(el.y).toBe(100);
    expect(el.width).toBe(200);
    expect(el.height).toBe(100);
  });

  it('ellipse: dibuja elipse con bounds correctos', () => {
    const { result } = setup();
    act(() => result.current.setTool('ellipse'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(200, 160, rect));
    act(() => result.current.handlePointerUp());

    expect(result.current.elements).toHaveLength(1);
    expect(result.current.elements[0].type).toBe('ellipse');
    expect(result.current.elements[0]).toMatchObject({ x: 100, y: 100, width: 100, height: 60 });
  });

  it('shift constraint: rect se vuelve cuadrado con Shift', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => { key('Shift'); });
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(300, 160, rect));
    act(() => result.current.handlePointerUp());

    expect(result.current.elements[0]).toMatchObject({ width: 200, height: 200 });
  });

  it('line y arrow: crean elementos con points', () => {
    for (const tool of ['line', 'arrow'] as const) {
      const { result } = setup();
      act(() => result.current.setTool(tool));
      act(() => result.current.handlePointerDown(100, 100, rect));
      act(() => result.current.handlePointerMove(250, 250, rect));
      act(() => result.current.handlePointerUp());
      expect(result.current.elements[0].type).toBe(tool);
      const el = result.current.elements[0] as { points: { x: number; y: number }[] };
      expect(el.points).toEqual([{ x: 100, y: 100 }, { x: 250, y: 250 }]);
    }
  });

  it('freedraw: acumula puntos', () => {
    const { result } = setup();
    act(() => result.current.setTool('freedraw'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(120, 120, rect));
    act(() => result.current.handlePointerMove(140, 140, rect));
    act(() => result.current.handlePointerUp());

    expect(result.current.elements).toHaveLength(1);
    expect(result.current.elements[0].type).toBe('freedraw');
    expect((result.current.elements[0] as { points: unknown[] }).points).toHaveLength(3);
  });

  it('eraser: elimina elemento bajo el cursor', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(200, 200, rect));
    act(() => result.current.handlePointerUp());
    expect(result.current.elements).toHaveLength(1);

    act(() => result.current.setTool('eraser'));
    act(() => result.current.handlePointerDown(150, 150, rect));
    expect(result.current.elements).toHaveLength(0);
  });

  it('rect demasiado chico (<3px) se descarta', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(101, 101, rect));
    act(() => result.current.handlePointerUp());
    expect(result.current.elements).toHaveLength(0);
  });
});

describe('useCanvas E2E — selección y movimiento', () => {
  it('selecciona elemento al hacer click y lo mueve con drag', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(200, 200, rect));
    act(() => result.current.handlePointerUp());

    act(() => result.current.setTool('select'));
    act(() => result.current.handlePointerDown(150, 150, rect));
    expect(result.current.selectedIds).toHaveLength(1);

    act(() => result.current.handlePointerMove(250, 250, rect));
    act(() => result.current.handlePointerUp());

    expect(result.current.elements[0]).toMatchObject({ x: 200, y: 200 });
  });

  it('selection box: selecciona múltiples elementos', () => {
    const { result } = setup();
    for (const [x, y] of [[100, 100], [300, 100]] as const) {
      act(() => result.current.setTool('rect'));
      act(() => result.current.handlePointerDown(x, y, rect));
      act(() => result.current.handlePointerMove(x + 50, y + 50, rect));
      act(() => result.current.handlePointerUp());
    }
    act(() => result.current.setTool('select'));
    act(() => result.current.handlePointerDown(80, 80, rect));
    act(() => result.current.handlePointerMove(400, 200, rect));
    act(() => result.current.handlePointerUp());

    expect(result.current.selectedIds).toHaveLength(2);
  });

  it('resize: arrastrar handle br cambia bounds', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(200, 200, rect));
    act(() => result.current.handlePointerUp());

    act(() => result.current.setTool('select'));
    act(() => result.current.handlePointerDown(200, 200, rect)); // click en el elemento
    act(() => result.current.handlePointerDown(200, 200, rect)); // start resize en handle br
    act(() => result.current.handlePointerMove(300, 300, rect));
    act(() => result.current.handlePointerUp());

    expect(result.current.elements[0]).toMatchObject({ width: 200, height: 200 });
  });

  it('deleteSelected: borra la selección', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(200, 200, rect));
    act(() => result.current.handlePointerUp());

    act(() => result.current.setTool('select'));
    act(() => result.current.handlePointerDown(150, 150, rect));
    expect(result.current.selectedIds).toHaveLength(1);

    act(() => result.current.deleteSelected());
    expect(result.current.elements).toHaveLength(0);
  });

  it('nudgeSelected: mueve la selección con flechas', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(200, 200, rect));
    act(() => result.current.handlePointerUp());

    act(() => result.current.setTool('select'));
    act(() => result.current.handlePointerDown(150, 150, rect));
    act(() => result.current.nudgeSelected(10, 0));
    expect(result.current.elements[0]).toMatchObject({ x: 110, y: 100 });
  });
});

describe('useCanvas E2E — zoom, undo/redo y capas', () => {
  it('zoom con ctrl+wheel se centra en el cursor', () => {
    const { result } = setup();
    const before = result.current.camera;
    act(() => result.current.handleWheel(-100, true, 400, 300, rect));
    const after = result.current.camera;
    expect(after.zoom).toBeGreaterThan(before.zoom);
    expect(after.zoom).toBeLessThanOrEqual(5);
    expect(after.x).toBeCloseTo(400 - (400 - before.x) * (after.zoom / before.zoom));
  });

  it('zoom to fit ajusta la cámara al contenido', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(200, 200, rect));
    act(() => result.current.handlePointerUp());

    act(() => result.current.zoomToFit());
    const cam = result.current.camera;
    expect(cam.zoom).toBeGreaterThan(0.1);
    expect(cam.zoom).toBeLessThanOrEqual(1);
  });

  it('resetZoom vuelve a 100% en origen', () => {
    const { result } = setup();
    act(() => result.current.handleWheel(-100, true, 400, 300, rect));
    expect(result.current.camera.zoom).not.toBe(1);
    act(() => result.current.resetZoom());
    expect(result.current.camera).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('undo/redo restaura estados', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(200, 200, rect));
    act(() => result.current.handlePointerUp());
    expect(result.current.elements).toHaveLength(1);

    act(() => result.current.undo());
    expect(result.current.elements).toHaveLength(0);

    act(() => result.current.redo());
    expect(result.current.elements).toHaveLength(1);
  });

  it('bringToFront/sendToBack ordenan zIndex', () => {
    const { result } = setup();
    act(() => result.current.setTool('rect'));
    act(() => result.current.handlePointerDown(100, 100, rect));
    act(() => result.current.handlePointerMove(200, 200, rect));
    act(() => result.current.handlePointerUp());
    act(() => result.current.handlePointerDown(250, 100, rect));
    act(() => result.current.handlePointerMove(350, 200, rect));
    act(() => result.current.handlePointerUp());
    expect(result.current.elements).toHaveLength(2);

    act(() => result.current.setTool('select'));
    act(() => result.current.handlePointerDown(120, 120, rect));
    const first = result.current.elements[0];
    act(() => result.current.bringToFront());
    const firstAfter = result.current.elements.find(e => e.id === first.id)!;
    expect(firstAfter.zIndex).toBeGreaterThan(first.zIndex);
  });
});