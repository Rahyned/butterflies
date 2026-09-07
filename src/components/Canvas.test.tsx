import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Canvas from './Canvas';
import { ThemeProvider } from '../hooks/useTheme';
import type { CanvasElement } from './types/canvas';

function rect(id: string, x: number, y: number, width: number, height: number): CanvasElement {
  return {
    type: 'rect', id, x, y, width, height,
    strokeColor: '#000', fillColor: 'transparent',
    strokeWidth: 2, roughness: 0, opacity: 1, seed: 1, zIndex: 1,
  };
}

type CtxCall = { method: string; args: unknown[] };

function getMainCtxCalls(): CtxCall[] {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas) return [];
  const ctx = canvas.getContext('2d') as unknown as { __calls?: CtxCall[] } | null;
  return ctx?.__calls ?? [];
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'dark');
});

afterEach(() => {
  cleanup();
});

describe('Canvas E2E — render y culling', () => {
  it('dibuja elementos visibles en el viewport', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    render(
      <ThemeProvider>
        <Canvas
          elements={[rect('a', 100, 100, 50, 50)]}
          drawingElement={{ current: null }}
          selectedIds={[]}
          groups={[]}
          camera={camera}
          onPointerDown={() => {}}
          onPointerMove={() => {}}
          onPointerUp={() => {}}
          onWheel={() => {}}
          tool="select"
          onTextSubmit={() => {}}
          gridEnabled={false}
          selectionBox={null}
          showMinimap={false}
          onGroup={() => {}}
          onUngroup={() => {}}
          onBringToFront={() => {}}
          onSendToBack={() => {}}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
        />
      </ThemeProvider>,
    );

    const calls = getMainCtxCalls();
    expect(calls.some(c => c.method === 'strokeRect')).toBe(true);
  });

  it('NO dibuja elementos fuera del viewport (culling)', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    render(
      <ThemeProvider>
        <Canvas
          elements={[rect('off', 100000, 100000, 50, 50)]}
          drawingElement={{ current: null }}
          selectedIds={[]}
          groups={[]}
          camera={camera}
          onPointerDown={() => {}}
          onPointerMove={() => {}}
          onPointerUp={() => {}}
          onWheel={() => {}}
          tool="select"
          onTextSubmit={() => {}}
          gridEnabled={false}
          selectionBox={null}
          showMinimap={false}
          onGroup={() => {}}
          onUngroup={() => {}}
          onBringToFront={() => {}}
          onSendToBack={() => {}}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
        />
      </ThemeProvider>,
    );

    const calls = getMainCtxCalls();
    expect(calls.some(c => c.method === 'strokeRect')).toBe(false);
  });

  it('dibuja el elemento en progreso (drawingElement)', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    render(
      <ThemeProvider>
        <Canvas
          elements={[]}
          drawingElement={{ current: rect('d', 50, 50, 100, 100) }}
          selectedIds={[]}
          groups={[]}
          camera={camera}
          onPointerDown={() => {}}
          onPointerMove={() => {}}
          onPointerUp={() => {}}
          onWheel={() => {}}
          tool="rect"
          onTextSubmit={() => {}}
          gridEnabled={false}
          selectionBox={null}
          showMinimap={false}
          onGroup={() => {}}
          onUngroup={() => {}}
          onBringToFront={() => {}}
          onSendToBack={() => {}}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
        />
      </ThemeProvider>,
    );

    const calls = getMainCtxCalls();
    expect(calls.some(c => c.method === 'strokeRect')).toBe(true);
  });
});