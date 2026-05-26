import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasElement, Tool, Point, Group } from '../types/canvas';
import { getElementBounds } from '../utils/hitTest';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 15);
}

export function useCanvas() {
  const [tool, setTool] = useState<Tool>('select');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });

  const [strokeColor, setStrokeColor] = useState('#e2e8f0');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [roughness, setRoughness] = useState(1);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);

  const drawingElement = useRef<CanvasElement | null>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<Point | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef<Point | null>(null);
  const cameraStart = useRef<Point | null>(null);
  const spacePressed = useRef(false);
  const isMoving = useRef(false);
  const moveStartWorld = useRef<Point | null>(null);
  const moveOrigins = useRef<Map<string, { x: number; y: number; points?: Point[] }>>(new Map());
  const shiftPressed = useRef(false);

  const isResizing = useRef(false);
  const resizeHandle = useRef<string | null>(null);
  const resizeStartWorld = useRef<Point | null>(null);
  const resizeInitialEl = useRef<CanvasElement | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const selectionBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const isSelecting = useRef(false);
  const selectStart = useRef<Point | null>(null);

  const getWorldCoords = useCallback((clientX: number, clientY: number, canvasRect: DOMRect) => {
    return {
      x: (clientX - canvasRect.left - camera.x) / camera.zoom,
      y: (clientY - canvasRect.top - camera.y) / camera.zoom,
    };
  }, [camera]);

  const startDrawing = useCallback((world: Point) => {
    isDrawing.current = true;
    startPoint.current = world;

    const base = {
      strokeColor, fillColor, strokeWidth, roughness,
      opacity: 1, seed: randomSeed(),
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
    }
  }, [tool, strokeColor, fillColor, strokeWidth, roughness]);

  const updateDrawing = useCallback((world: Point) => {
    if (!isDrawing.current || !drawingElement.current || !startPoint.current) return;
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
    }
  }, []);

  const finishDrawing = useCallback(() => {
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

  const handlePointerDown = useCallback((clientX: number, clientY: number, canvasRect: DOMRect) => {
    if (isPanning.current) return;

    if (tool === 'hand') {
      isPanning.current = true;
      panStart.current = { x: clientX, y: clientY };
      cameraStart.current = { x: camera.x, y: camera.y };
      return;
    }

    const world = getWorldCoords(clientX, clientY, canvasRect);

    if (tool === 'select') {
      const HANDLE_HIT_RADIUS = 8 / camera.zoom;
      for (const id of selectedIds) {
        const el = elements.find(e => e.id === id);
        if (!el) continue;
        const bounds = getElementBounds(el);
        const handle = getHandleAt(world, bounds, HANDLE_HIT_RADIUS);
        if (handle) {
          isResizing.current = true;
          resizeHandle.current = handle;
          resizeStartWorld.current = world;
          resizeInitialEl.current = { ...el };
          return;
        }
      }

      let hitId: string | null = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (hitTestElement(elements[i], world)) {
          hitId = elements[i].id;
          break;
        }
      }

      if (hitId) {
        const containingGroup = groups.find(g => g.elementIds.includes(hitId!));
        const idsToSelect = containingGroup ? containingGroup.elementIds : [hitId];
        const allAlreadySelected = idsToSelect.every(id => selectedIds.includes(id));
        const targetIds = allAlreadySelected && selectedIds.length > 0 ? selectedIds : idsToSelect;

        if (!allAlreadySelected || selectedIds.length === 0) {
          setSelectedIds(idsToSelect);
        }

        isMoving.current = true;
        moveStartWorld.current = world;
        const map = new Map<string, { x: number; y: number; points?: Point[] }>();
        for (const id of targetIds) {
          const el = elements.find(e => e.id === id);
          if (el) {
            map.set(id, {
              x: el.x,
              y: el.y,
              points: ('points' in el && el.points) ? [...el.points] : undefined,
            });
          }
        }
        moveOrigins.current = map;
        return;
      }

      isSelecting.current = true;
      selectStart.current = world;
      const startBox = { x: world.x, y: world.y, width: 0, height: 0 };
      setSelectionBox(startBox);
      selectionBoxRef.current = startBox;
      return;
    }

    if (tool === 'text') return;

    startDrawing(world);
  }, [getWorldCoords, tool, elements, startDrawing, camera, groups]);

  const handlePointerMove = useCallback((clientX: number, clientY: number, canvasRect: DOMRect) => {
    if (isPanning.current && panStart.current && cameraStart.current) {
      const newX = cameraStart.current.x + clientX - panStart.current.x;
      const newY = cameraStart.current.y + clientY - panStart.current.y;
      if (!isFinite(newX) || !isFinite(newY)) return;
      setCamera(prev => ({ ...prev, x: newX, y: newY }));
      return;
    }

    if (isResizing.current && resizeInitialEl.current && resizeStartWorld.current && resizeHandle.current) {
      const world = getWorldCoords(clientX, clientY, canvasRect);
      const el = resizeInitialEl.current;
      const handle = resizeHandle.current;
      const dx = world.x - resizeStartWorld.current.x;
      const dy = world.y - resizeStartWorld.current.y;
      if (!isFinite(dx) || !isFinite(dy)) return;

      let newX = el.x, newY = el.y, newW = el.width, newH = el.height;

      if (handle.includes('l')) { newX = el.x + dx; newW = el.width - dx; }
      if (handle.includes('r')) { newW = el.width + dx; }
      if (handle.includes('t')) { newY = el.y + dy; newH = el.height - dy; }
      if (handle.includes('b')) { newH = el.height + dy; }

      if (newW < 0) { newX = newX + newW; newW = -newW; }
      if (newH < 0) { newY = newY + newH; newH = -newH; }

      setElements(prev => prev.map(e => e.id === el.id ? {
        ...e,
        x: newX,
        y: newY,
        width: Math.max(newW, 5),
        height: Math.max(newH, 5),
      } : e));
      return;
    }

    if (isMoving.current && moveStartWorld.current) {
      const world = getWorldCoords(clientX, clientY, canvasRect);
      const dx = world.x - moveStartWorld.current.x;
      const dy = world.y - moveStartWorld.current.y;
      setElements(prev => prev.map(el => {
        const orig = moveOrigins.current.get(el.id);
        if (!orig) return el;
        if (orig.points) {
          return { ...el, points: orig.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
        }
        return { ...el, x: orig.x + dx, y: orig.y + dy };
      }));
      return;
    }

    if (isSelecting.current && selectStart.current) {
      const world = getWorldCoords(clientX, clientY, canvasRect);
      const x = Math.min(selectStart.current.x, world.x);
      const y = Math.min(selectStart.current.y, world.y);
      const box = {
        x, y,
        width: Math.abs(world.x - selectStart.current.x),
        height: Math.abs(world.y - selectStart.current.y),
      };
      setSelectionBox(box);
      selectionBoxRef.current = box;
      return;
    }

    const world = getWorldCoords(clientX, clientY, canvasRect);
    updateDrawing(world);
  }, [getWorldCoords, updateDrawing]);

  const handlePointerUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      cameraStart.current = null;
      return;
    }

    if (isResizing.current) {
      isResizing.current = false;
      resizeHandle.current = null;
      resizeStartWorld.current = null;
      resizeInitialEl.current = null;
      return;
    }

    if (isMoving.current) {
      isMoving.current = false;
      moveStartWorld.current = null;
      moveOrigins.current = new Map();
      return;
    }

    if (isSelecting.current && selectStart.current && selectionBoxRef.current) {
      isSelecting.current = false;
      const box = selectionBoxRef.current;
      const boxRight = box.x + box.width;
      const boxBottom = box.y + box.height;

      const ids = elements.filter(el => {
        const bounds = getElementBounds(el);
        return bounds.x < boxRight && bounds.x + bounds.width > box.x &&
               bounds.y < boxBottom && bounds.y + bounds.height > box.y;
      }).map(el => el.id);

      setSelectedIds(ids);
      setSelectionBox(null);
      selectionBoxRef.current = null;
      selectStart.current = null;
      return;
    }

    finishDrawing();
  }, [finishDrawing]);

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

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanning.current = true;
    panStart.current = { x: clientX, y: clientY };
    cameraStart.current = { x: camera.x, y: camera.y };
  }, [camera]);

  const setSpacePressed = useCallback((pressed: boolean) => { spacePressed.current = pressed; }, []);
  const isSpacePressed = useCallback(() => spacePressed.current, []);

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

  const deleteSelected = useCallback(() => {
    setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
    setGroups(prev => {
      const updated = prev.map(group => ({
        ...group,
        elementIds: group.elementIds.filter(id => !selectedIds.includes(id)),
      }));
      return updated.filter(group => group.elementIds.length >= 2);
    });
    setSelectedIds([]);
  }, [selectedIds]);

  const selectAll = useCallback(() => setSelectedIds(elements.map(el => el.id)), [elements]);

  const groupElements = useCallback((ids: string[]) => {
    if (ids.length < 2) return;
    const groupId = generateId();
    setGroups(prev => [...prev, { id: groupId, elementIds: ids }]);
  }, []);

  const ungroupElements = useCallback(() => {
    setGroups(prev => prev.filter(group =>
      !group.elementIds.some(id => selectedIds.includes(id))
    ));
  }, [selectedIds]);

  return {
    tool, setTool,
    elements, setElements,
    selectedIds, setSelectedIds,
    groups, setGroups,
    groupElements, ungroupElements,
    camera, setCamera,
    strokeColor, setStrokeColor,
    fillColor, setFillColor,
    strokeWidth, setStrokeWidth,
    roughness, setRoughness,
    gridEnabled, setGridEnabled,
    showMinimap, setShowMinimap,
    drawingElement,
    selectionBox,
    handlePointerDown, handlePointerMove, handlePointerUp,
    handleWheel, startPan,
    getWorldCoords,
    setSpacePressed, isSpacePressed,
    deleteSelected, selectAll,
  };
}

function hitTestElement(el: CanvasElement, point: Point): boolean {
  if ('points' in el && el.points && el.points.length > 0) {
    const xs = el.points.map(p => p.x);
    const ys = el.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    if (point.x >= minX - 5 && point.x <= maxX + 5 && point.y >= minY - 5 && point.y <= maxY + 5) {
      for (const p of el.points) {
        if (Math.hypot(point.x - p.x, point.y - p.y) < 10) return true;
      }
    }
    return false;
  }
  return point.x >= el.x && point.x <= el.x + el.width && point.y >= el.y && point.y <= el.y + el.height;
}

function getHandlePositions(bounds: { x: number; y: number; width: number; height: number }): { name: string; pos: Point }[] {
  const { x, y, width: w, height: h } = bounds;
  return [
    { name: 'tl', pos: { x, y } },
    { name: 'tc', pos: { x: x + w / 2, y } },
    { name: 'tr', pos: { x: x + w, y } },
    { name: 'ml', pos: { x, y: y + h / 2 } },
    { name: 'mr', pos: { x: x + w, y: y + h / 2 } },
    { name: 'bl', pos: { x, y: y + h } },
    { name: 'bc', pos: { x: x + w / 2, y: y + h } },
    { name: 'br', pos: { x: x + w, y: y + h } },
  ];
}

function getHandleAt(point: Point, bounds: { x: number; y: number; width: number; height: number }, radius: number): string | null {
  for (const { name, pos } of getHandlePositions(bounds)) {
    if (Math.hypot(point.x - pos.x, point.y - pos.y) < radius) return name;
  }
  return null;
}
