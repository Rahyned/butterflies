import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CanvasElement, Tool } from '../types/canvas';
import { SpatialIndex } from '../utils/spatialIndex';
import { useTheme } from './useTheme';
import { useCamera } from './useCamera';
import { useSelection } from './useSelection';
import { useDrawing } from './useDrawing';
import { useLayers } from './useLayers';
import { useGridAndMinimap } from './useGridAndMinimap';

export function useCanvas() {
  const [tool, setTool] = useState<Tool>('select');
  const [elements, setElements] = useState<CanvasElement[]>([]);

  const cameraApi = useCamera();
  const selectionApi = useSelection();
  const drawingApi = useDrawing();
  const layersApi = useLayers();
  const gridApi = useGridAndMinimap();

  const [strokeColor, setStrokeColor] = useState(() => {
    const cs = typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-default-stroke').trim() : '';
    return cs || '#e2e8f0';
  });
  const { theme } = useTheme();
  const prevTheme = useRef(theme);

  const darkDefault = '#e2e8f0';
  const lightDefault = '#000000';

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement).getPropertyValue('--color-default-stroke').trim();
    if (cs) setStrokeColor(cs);

    const old = prevTheme.current;
    if (old !== theme) {
      const oldDefault = old === 'dark' ? darkDefault : lightDefault;
      const newDefault = theme === 'dark' ? darkDefault : lightDefault;
      setElements(prev => prev.map(el =>
        el.strokeColor === oldDefault
          ? { ...el, strokeColor: newDefault }
          : el
      ));
      prevTheme.current = theme;
    }
  }, [theme]);

  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [roughness, setRoughness] = useState(0);

  const spatialIndex = useMemo(() => new SpatialIndex(elements), [elements]);

  const handlePointerDown = useCallback((clientX: number, clientY: number, canvasRect: DOMRect) => {
    if (cameraApi.isPanningNow()) return;

    if (tool === 'hand') {
      cameraApi.startPan(clientX, clientY);
      return;
    }

    const world = cameraApi.getWorldCoords(clientX, clientY, canvasRect);

    if (tool === 'select') {
      selectionApi.handleSelectPointerDown(world, {
        elements,
        groups: layersApi.groups,
        camera: cameraApi.camera,
        selectedIds: selectionApi.selectedIds,
        spatialIndex,
      });
      return;
    }

    if (tool === 'text') return;

    drawingApi.startDrawing(world, tool, { strokeColor, fillColor, strokeWidth, roughness }, elements, setElements);
  }, [cameraApi, tool, selectionApi, layersApi.groups, drawingApi, elements, spatialIndex, strokeColor, fillColor, strokeWidth, roughness]);

  const handlePointerMove = useCallback((clientX: number, clientY: number, canvasRect: DOMRect) => {
    if (cameraApi.isPanningNow()) {
      cameraApi.updatePan(clientX, clientY);
      return;
    }

    const world = cameraApi.getWorldCoords(clientX, clientY, canvasRect);

    if (selectionApi.isResizingNow() || selectionApi.isMovingNow() || selectionApi.isSelectingNow()) {
      selectionApi.handleSelectPointerMove(world, setElements);
      return;
    }

    drawingApi.updateDrawing(world, setElements);
  }, [cameraApi, selectionApi, drawingApi]);

  const handlePointerUp = useCallback(() => {
    if (cameraApi.isPanningNow()) {
      cameraApi.endPan();
      return;
    }

    if (selectionApi.isResizingNow() || selectionApi.isMovingNow() || selectionApi.isSelectingNow()) {
      selectionApi.handleSelectPointerUp(elements);
      return;
    }

    drawingApi.finishDrawing(setElements);
  }, [cameraApi, selectionApi, drawingApi, elements]);

  const handleWheel = useCallback((deltaY: number, ctrlKey: boolean, clientX: number, clientY: number, canvasRect: DOMRect) => {
    cameraApi.handleWheel(deltaY, ctrlKey, clientX, clientY, canvasRect);
  }, [cameraApi]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    cameraApi.startPan(clientX, clientY);
  }, [cameraApi]);

  const setSpacePressed = useCallback((pressed: boolean) => {
    cameraApi.setSpacePressed(pressed);
  }, [cameraApi]);

  const isSpacePressed = useCallback(() => cameraApi.isSpacePressed(), [cameraApi]);

  const deleteSelected = useCallback(() => {
    layersApi.deleteSelected(selectionApi.selectedIds, setElements);
    selectionApi.setSelectedIds([]);
  }, [layersApi, selectionApi]);

  const selectAll = useCallback(() => {
    selectionApi.selectAll(elements);
  }, [selectionApi, elements]);

  const groupElements = useCallback((ids: string[]) => {
    layersApi.groupElements(ids);
  }, [layersApi]);

  const ungroupElements = useCallback(() => {
    layersApi.ungroupElements(selectionApi.selectedIds);
  }, [layersApi, selectionApi]);

  const bringToFront = useCallback(() => {
    layersApi.bringToFront(selectionApi.selectedIds, setElements);
  }, [layersApi, selectionApi]);

  const sendToBack = useCallback(() => {
    layersApi.sendToBack(selectionApi.selectedIds, setElements);
  }, [layersApi, selectionApi]);

  const moveUp = useCallback(() => {
    layersApi.moveUp(selectionApi.selectedIds, setElements);
  }, [layersApi, selectionApi]);

  const moveDown = useCallback(() => {
    layersApi.moveDown(selectionApi.selectedIds, setElements);
  }, [layersApi, selectionApi]);

  const nudgeSelected = useCallback((dx: number, dy: number) => {
    if (selectionApi.selectedIds.length === 0) return;
    setElements(prev => prev.map(el => {
      if (!selectionApi.selectedIds.includes(el.id)) return el;
      if ('points' in el && el.points) {
        return { ...el, points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
      }
      return { ...el, x: el.x + dx, y: el.y + dy };
    }));
  }, [selectionApi]);

  const zoomToFit = useCallback(() => {
    cameraApi.zoomToFit(elements);
  }, [cameraApi, elements]);

  const resetZoom = useCallback(() => {
    cameraApi.resetZoom();
  }, [cameraApi]);

  return {
    tool, setTool,
    elements, setElements,
    selectedIds: selectionApi.selectedIds, setSelectedIds: selectionApi.setSelectedIds,
    groups: layersApi.groups, setGroups: layersApi.setGroups,
    groupElements, ungroupElements,
    bringToFront, sendToBack, moveUp, moveDown,
    camera: cameraApi.camera, setCamera: cameraApi.setCamera,
    strokeColor, setStrokeColor,
    fillColor, setFillColor,
    strokeWidth, setStrokeWidth,
    roughness, setRoughness,
    gridEnabled: gridApi.gridEnabled, setGridEnabled: gridApi.setGridEnabled,
    showMinimap: gridApi.showMinimap, setShowMinimap: gridApi.setShowMinimap,
    drawingElement: drawingApi.drawingElement,
    selectionBox: selectionApi.selectionBox,
    handlePointerDown, handlePointerMove, handlePointerUp,
    handleWheel, startPan,
    getWorldCoords: cameraApi.getWorldCoords,
    setSpacePressed, isSpacePressed,
    deleteSelected, selectAll,
    nudgeSelected,
    zoomToFit, resetZoom,
    zoom: cameraApi.camera.zoom,
  };
}