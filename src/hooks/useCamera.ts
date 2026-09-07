import { useCallback, useRef, useState } from 'react';
import type { CanvasElement, Point } from '../types/canvas';
import { getElementBounds } from '../utils/hitTest';

export type Camera = { x: number; y: number; zoom: number };

export function useCamera() {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const isPanning = useRef(false);
  const panStart = useRef<Point | null>(null);
  const cameraStart = useRef<Point | null>(null);
  const spacePressed = useRef(false);

  const getWorldCoords = useCallback((clientX: number, clientY: number, canvasRect: DOMRect): Point => {
    return {
      x: (clientX - canvasRect.left - camera.x) / camera.zoom,
      y: (clientY - canvasRect.top - camera.y) / camera.zoom,
    };
  }, [camera]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanning.current = true;
    panStart.current = { x: clientX, y: clientY };
    cameraStart.current = { x: camera.x, y: camera.y };
  }, [camera]);

  const updatePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanning.current || !panStart.current || !cameraStart.current) return;
    const newX = cameraStart.current.x + clientX - panStart.current.x;
    const newY = cameraStart.current.y + clientY - panStart.current.y;
    if (!isFinite(newX) || !isFinite(newY)) return;
    setCamera(prev => ({ ...prev, x: newX, y: newY }));
  }, []);

  const endPan = useCallback(() => {
    isPanning.current = false;
    panStart.current = null;
    cameraStart.current = null;
  }, []);

  const isPanningNow = useCallback(() => isPanning.current, []);

  const handleWheel = useCallback((deltaY: number, ctrlKey: boolean, clientX: number, clientY: number, canvasRect: DOMRect) => {
    if (ctrlKey) {
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      setCamera(prev => {
        const newZoom = Math.max(0.1, Math.min(5, prev.zoom * zoomFactor));
        const mx = clientX - canvasRect.left;
        const my = clientY - canvasRect.top;
        const newX = mx - (mx - prev.x) * (newZoom / prev.zoom);
        const newY = my - (my - prev.y) * (newZoom / prev.zoom);
        if (!isFinite(newX) || !isFinite(newY) || !isFinite(newZoom)) return prev;
        return { zoom: newZoom, x: newX, y: newY };
      });
    } else {
      setCamera(prev => {
        const newY = prev.y - deltaY;
        if (!isFinite(newY)) return prev;
        return { ...prev, y: newY };
      });
    }
  }, []);

  const setSpacePressed = useCallback((pressed: boolean) => { spacePressed.current = pressed; }, []);
  const isSpacePressed = useCallback(() => spacePressed.current, []);

  const zoomToFit = useCallback((elements: CanvasElement[]) => {
    if (elements.length === 0) return;
    const allBounds = elements.map(getElementBounds);
    const minX = Math.min(...allBounds.map(b => b.x));
    const minY = Math.min(...allBounds.map(b => b.y));
    const maxX = Math.max(...allBounds.map(b => b.x + b.width));
    const maxY = Math.max(...allBounds.map(b => b.y + b.height));
    const padding = 40;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const zoom = Math.max(0.1, Math.min(1, Math.min(vw / contentW, vh / contentH)));
    const x = (vw - contentW * zoom) / 2 - minX * zoom + padding * zoom;
    const y = (vh - contentH * zoom) / 2 - minY * zoom + padding * zoom;
    setCamera({ x, y, zoom });
  }, []);

  const resetZoom = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  }, []);

  return {
    camera, setCamera,
    getWorldCoords,
    handleWheel,
    startPan, updatePan, endPan, isPanningNow,
    setSpacePressed, isSpacePressed,
    zoomToFit, resetZoom,
  };
}