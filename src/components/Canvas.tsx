import { useEffect, useRef, useCallback, useState } from 'react';
import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { CanvasElement, Group } from '../types/canvas';
import { renderElement, renderSelectionBox, renderSelectionHandles } from '../utils/renderer';
import { getElementBounds } from '../utils/hitTest';


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
}

function drawGrid(ctx: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }, canvasWidth: number, canvasHeight: number) {
  const gridSize = 40;
  const minorColor = 'rgba(60, 60, 100, 0.3)';
  const majorColor = 'rgba(80, 80, 140, 0.4)';
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
  onGroup, onUngroup,
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

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

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

    for (const el of elements) {
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
  }, [elements, drawingElement, selectedIds, camera, gridEnabled, selectionBox]);

  useEffect(() => {
    render();
  }, [render]);

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
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render]);

  useEffect(() => {
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

    ctx.fillStyle = 'rgba(15, 22, 40, 0.9)';
    ctx.fillRect(0, 0, mw, mh);
    ctx.strokeStyle = '#2d3a5a';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, mw, mh);

    ctx.save();
    const ox = (mw - contentW * scale) / 2;
    const oy = (mh - contentH * scale) / 2;
    ctx.translate(ox - minX * scale + padding * scale, oy - minY * scale + padding * scale);
    ctx.scale(scale, scale);

    const miniRc = rough.canvas(mCanvas);
    for (const el of elements) {
      renderElement(ctx, el, miniRc);
    }
    ctx.restore();

    const vpLeft = (-camera.x / camera.zoom - minX + padding) * scale + ox;
    const vpTop = (-camera.y / camera.zoom - minY + padding) * scale + oy;
    const vpW = (window.innerWidth / camera.zoom) * scale;
    const vpH = (window.innerHeight / camera.zoom) * scale;

    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vpLeft, vpTop, vpW, vpH);
  }, [elements, camera, showMinimap]);

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
            onTextSubmit(el.value, world.x, world.y, el.offsetWidth, el.offsetHeight);
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
            background: '#1a1a2e',
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
              zIndex: 10,
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
                  onTextSubmit(el.value, world.x, world.y, el.offsetWidth, el.offsetHeight);
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
              background: 'rgba(26, 26, 46, 0.9)',
              border: '1px dashed #4cc9f0',
              color: '#e2e8f0',
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
            background: '#0f1628',
            border: '1px solid #2d3a5a',
            borderRadius: 4,
            padding: '4px 0',
            minWidth: 160,
            minHeight: 30,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: '#e2e8f0',
          }}>
            {selectedIds.length >= 2 && (
              <div
                onClick={() => { onGroup(); setContextMenuPos(null); }}
                style={{
                  padding: '6px 16px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1e2a4a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Agrupar
              </div>
            )}
            {groups.some(g => g.elementIds.some(id => selectedIds.includes(id))) && (
              <div
                onClick={() => { onUngroup(); setContextMenuPos(null); }}
                style={{
                  padding: '6px 16px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1e2a4a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Desagrupar
              </div>
            )}
            {selectedIds.length < 2 && !groups.some(g => g.elementIds.some(id => selectedIds.includes(id))) && (
              <div style={{ padding: '6px 16px', color: '#5a6a8a', fontSize: 11 }}>
                Seleccioná ≥2 elementos
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
