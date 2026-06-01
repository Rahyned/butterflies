import { useEffect, useRef, useCallback, useState } from 'react';
import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { CanvasElement, Group } from '../types/canvas';
import { renderElement, renderSelectionBox, renderSelectionHandles } from '../utils/renderer';
import { getElementBounds } from '../utils/hitTest';
import { useTheme } from '../hooks/useTheme';


interface CanvasProps {
  elements: CanvasElement[];
  drawingElement: React.MutableRefObject<CanvasElement | null>;
  selectedIds: string[];
  groups: Group[];
  camera: { x: number; y: number; zoom: number };
  onPointerDown: (clientX: number, clientY: number, rect: DOMRect) => void;
  onPointerMove: (clientX: number, clientY: number, rect: DOMRect) => void;
  onPointerUp: () => void;
  onWheel: (deltaY: number, ctrlKey: boolean, clientX: number, clientY: number, rect: DOMRect) => void;
  tool: string;
  onTextSubmit: (text: string, x: number, y: number, w: number, h: number) => void;
  gridEnabled: boolean;
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  showMinimap: boolean;
  onGroup: () => void;
  onUngroup: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function drawGrid(ctx: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }, canvasWidth: number, canvasHeight: number) {
  const gridSize = 40;
  const cs = getComputedStyle(document.documentElement);
  const minorColor = cs.getPropertyValue('--color-grid-minor').trim();
  const majorColor = cs.getPropertyValue('--color-grid-major').trim();
  const majorEvery = 5;

  const left = -camera.x / camera.zoom;
  const top = -camera.y / camera.zoom;
  const right = (canvasWidth - camera.x) / camera.zoom;
  const bottom = (canvasHeight - camera.y) / camera.zoom;

  const startX = Math.floor(left / gridSize) * gridSize;
  const startY = Math.floor(top / gridSize) * gridSize;

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  ctx.beginPath();
  for (let x = startX; x <= right; x += gridSize) {
    const isMajor = (Math.round(x / gridSize) % majorEvery) === 0;
    ctx.strokeStyle = isMajor ? majorColor : minorColor;
    ctx.lineWidth = isMajor ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }
  for (let y = startY; y <= bottom; y += gridSize) {
    const isMajor = (Math.round(y / gridSize) % majorEvery) === 0;
    ctx.strokeStyle = isMajor ? majorColor : minorColor;
    ctx.lineWidth = isMajor ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  ctx.restore();
}

export default function Canvas({
  elements, drawingElement, selectedIds, groups, camera,
  onPointerDown, onPointerMove, onPointerUp, onWheel,
  tool, onTextSubmit, gridEnabled, selectionBox, showMinimap,
  onGroup, onUngroup, onBringToFront, onSendToBack, onMoveUp, onMoveDown,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roughCanvasRef = useRef<RoughCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const textInputPosRef = useRef(textInputPos);
  textInputPosRef.current = textInputPos;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const { theme } = useTheme();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const cs = getComputedStyle(document.documentElement);
    ctx.fillStyle = cs.getPropertyValue('--color-canvas-bg').trim();
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    let rc = roughCanvasRef.current;
    if (!rc) {
      rc = rough.canvas(canvas);
      roughCanvasRef.current = rc;
    }

    if (gridEnabled) {
      drawGrid(ctx, camera, window.innerWidth, window.innerHeight);
    }

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      renderElement(ctx, el, rc);
    }

    if (drawingElement.current) {
      renderElement(ctx, drawingElement.current, rc, true);
    }

    for (const id of selectedIds) {
      const el = elements.find(e => e.id === id);
      if (el) {
        const bounds = getElementBounds(el);
        renderSelectionBox(ctx, bounds.x, bounds.y, bounds.width, bounds.height);
        renderSelectionHandles(ctx, bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }

    if (selectionBox && selectionBox.width > 0 && selectionBox.height > 0) {
      renderSelectionBox(ctx, selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
    }

    ctx.restore();
  }, [elements, drawingElement, selectedIds, camera, gridEnabled, selectionBox, theme]);

  const renderMinimap = useCallback(() => {
    const mCanvas = minimapCanvasRef.current;
    if (!mCanvas || !showMinimap || elements.length === 0) return;

    const allBounds = elements.map(getElementBounds);
    const minX = Math.min(...allBounds.map(b => b.x));
    const minY = Math.min(...allBounds.map(b => b.y));
    const maxX = Math.max(...allBounds.map(b => b.x + b.width));
    const maxY = Math.max(...allBounds.map(b => b.y + b.height));

    const mw = 180;
    const mh = 130;
    const padding = 20;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scale = Math.min(mw / contentW, mh / contentH, 1);

    const dpr = window.devicePixelRatio || 1;
    mCanvas.width = mw * dpr;
    mCanvas.height = mh * dpr;
    mCanvas.style.width = mw + 'px';
    mCanvas.style.height = mh + 'px';
    const ctx = mCanvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const mcs = getComputedStyle(document.documentElement);
    ctx.fillStyle = mcs.getPropertyValue('--color-minimap-bg').trim();
    ctx.fillRect(0, 0, mw, mh);
    ctx.strokeStyle = mcs.getPropertyValue('--color-ui-border').trim();
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, mw, mh);

    ctx.save();
    const ox = (mw - contentW * scale) / 2;
    const oy = (mh - contentH * scale) / 2;
    ctx.translate(ox - minX * scale + padding * scale, oy - minY * scale + padding * scale);
    ctx.scale(scale, scale);

    const miniStroke = theme === 'dark' ? '#000000' : '#ffffff';
    const miniRc = rough.canvas(mCanvas);
    const sortedMinimap = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sortedMinimap) {
      const miniEl = { ...el, strokeColor: miniStroke, fillColor: 'transparent' } as CanvasElement;
      renderElement(ctx, miniEl, miniRc);
    }
    ctx.restore();

    const vpLeft = (-camera.x / camera.zoom - minX + padding) * scale + ox;
    const vpTop = (-camera.y / camera.zoom - minY + padding) * scale + oy;
    const vpW = (window.innerWidth / camera.zoom) * scale;
    const vpH = (window.innerHeight / camera.zoom) * scale;

    const selColor = getComputedStyle(document.documentElement).getPropertyValue('--color-selection').trim();
    ctx.strokeStyle = selColor || '#4cc9f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vpLeft, vpTop, vpW, vpH);
  }, [elements, camera, showMinimap, theme]);

  useEffect(() => {
    render();
    renderMinimap();
  }, [render, renderMinimap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      roughCanvasRef.current = null;
      render();
      renderMinimap();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render, renderMinimap]);

  const getWorldFromScreen = useCallback((screenX: number, screenY: number) => ({
    x: (screenX - camera.x) / camera.zoom,
    y: (screenY - camera.y) / camera.zoom,
  }), [camera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onDown = (e: MouseEvent) => {
      if (e.button === 2) {
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        return;
      }
      if (e.button !== 0) return;
      if (tool === 'text') {
        if (textInputPosRef.current) {
          const el = textareaRef.current;
          if (el && el.value.trim()) {
            const world = getWorldFromScreen(textInputPosRef.current.x, textInputPosRef.current.y);
            onTextSubmit(el.value, world.x, world.y, el.offsetWidth / camera.zoom, el.offsetHeight / camera.zoom);
          }
          setTextInputPos(null);
        } else {
          setTextInputPos({ x: e.offsetX, y: e.offsetY });
        }
        return;
      }
      const rect = canvas.getBoundingClientRect();
      onPointerDown(e.clientX, e.clientY, rect);
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      onPointerMove(e.clientX, e.clientY, rect);
    };
    const onUp = () => { onPointerUp(); };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenuPos({ x: e.clientX, y: e.clientY });
    };
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('contextmenu', onContext);
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
      canvas.removeEventListener('contextmenu', onContext);
    };
  }, [tool, onPointerDown, onPointerMove, onPointerUp, onTextSubmit, getWorldFromScreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      onWheel(e.deltaY, e.ctrlKey, e.clientX, e.clientY, rect);
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [onWheel]);

  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenuPos({ x: e.clientX, y: e.clientY });
    };
    const closeMenu = () => setContextMenuPos(null);
    div.addEventListener('contextmenu', onContext);
    window.addEventListener('click', closeMenu, false);
    return () => {
      div.removeEventListener('contextmenu', onContext);
      window.removeEventListener('click', closeMenu);
    };
  }, []);

  useEffect(() => {
    if (textInputPos && textareaRef.current) {
      const el = textareaRef.current;
      el.value = '';
      el.style.height = 'auto';
      el.focus();
    }
  }, [textInputPos]);

  useEffect(() => {
    if (tool !== 'text' && textInputPos) {
      setTextInputPos(null);
    }
  }, [tool, textInputPos]);

  const cursorStyle = tool === 'text' ? 'text'
    : tool === 'eraser' ? 'pointer'
    : tool === 'hand' ? 'grab'
    : 'crosshair';

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            cursor: cursorStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'var(--color-canvas-bg)',
          }}
        />
        {showMinimap && (
          <canvas
            ref={minimapCanvasRef}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              borderRadius: 6,
              zIndex: 300,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          />
        )}
        <div style={{
          display: textInputPos ? 'block' : 'none',
          position: 'absolute',
          left: textInputPos?.x ?? 0,
          top: textInputPos?.y ?? 0,
          zIndex: 9999,
        }}>
          <textarea
            ref={textareaRef}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const el = textareaRef.current;
                if (el && el.value.trim() && textInputPos) {
                  const world = getWorldFromScreen(textInputPos.x, textInputPos.y);
                  onTextSubmit(el.value, world.x, world.y, el.offsetWidth / camera.zoom, el.offsetHeight / camera.zoom);
                }
                setTextInputPos(null);
              }
              if (e.key === 'Escape') {
                setTextInputPos(null);
              }
            }}
            onInput={() => {
              const el = textareaRef.current;
              if (!el) return;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
            style={{
              background: 'var(--color-textarea-bg)',
              border: '1px solid var(--color-ui-border)',
              color: 'var(--color-text-primary)',
              fontFamily: 'monospace',
              fontSize: '20px',
              padding: '4px',
              outline: 'none',
              resize: 'both',
              overflow: 'auto',
              minWidth: '100px',
              minHeight: '30px',
            }}
          />
        </div>
        {contextMenuPos && (
          <div style={{
            position: 'fixed',
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            zIndex: 10000,
            background: 'var(--color-ui-bg)',
            border: '1px solid var(--color-ui-border)',
            borderRadius: 4,
            padding: '4px 0',
            minWidth: 170,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: 'var(--color-text-primary)',
          }}>
            {selectedIds.length >= 2 && (
              <div
                onClick={() => { onGroup(); setContextMenuPos(null); }}
                style={{ padding: '6px 16px', cursor: 'pointer', userSelect: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Agrupar
              </div>
            )}
            {groups.some(g => g.elementIds.some(id => selectedIds.includes(id))) && (
              <div
                onClick={() => { onUngroup(); setContextMenuPos(null); }}
                style={{ padding: '6px 16px', cursor: 'pointer', userSelect: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Desagrupar
              </div>
            )}
            {selectedIds.length >= 1 && (
              <>
                <div style={{ height: 1, background: 'var(--color-text-secondary)', margin: '4px 0' }} />
                <div
                  onClick={() => { onBringToFront(); setContextMenuPos(null); }}
                  style={{ padding: '6px 16px', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Traer al frente
                </div>
                <div
                  onClick={() => { onMoveUp(); setContextMenuPos(null); }}
                  style={{ padding: '6px 16px', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Subir capa
                </div>
                <div
                  onClick={() => { onMoveDown(); setContextMenuPos(null); }}
                  style={{ padding: '6px 16px', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Bajar capa
                </div>
                <div
                  onClick={() => { onSendToBack(); setContextMenuPos(null); }}
                  style={{ padding: '6px 16px', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Enviar al fondo
                </div>
              </>
            )}
            {selectedIds.length < 1 && (
              <div style={{ padding: '6px 16px', color: '#5a6a8a', fontSize: 11 }}>
                Seleccioná un elemento
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
