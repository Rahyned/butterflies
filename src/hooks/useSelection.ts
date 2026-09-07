import { useCallback, useRef, useState } from 'react';
import type { CanvasElement, Group, Point } from '../types/canvas';
import { getElementBounds, getHandleAt, hitTestElement, intersects } from '../utils/hitTest';
import { measureTextHeight } from '../utils/renderer';
import type { SpatialIndex } from '../utils/spatialIndex';
import type { Camera } from './useCamera';

export type SelectionBox = { x: number; y: number; width: number; height: number };

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const selectionBoxRef = useRef<SelectionBox | null>(null);

  const isResizing = useRef(false);
  const resizeHandle = useRef<string | null>(null);
  const resizeStartWorld = useRef<Point | null>(null);
  const resizeInitialEl = useRef<CanvasElement | null>(null);

  const isMoving = useRef(false);
  const moveStartWorld = useRef<Point | null>(null);
  const moveOrigins = useRef<Map<string, { x: number; y: number; points?: Point[] }>>(new Map());

  const isSelecting = useRef(false);
  const selectStart = useRef<Point | null>(null);

  const isResizingNow = useCallback(() => isResizing.current, []);
  const isMovingNow = useCallback(() => isMoving.current, []);
  const isSelectingNow = useCallback(() => isSelecting.current, []);

  const handleSelectPointerDown = useCallback((
    world: Point,
    ctx: { elements: CanvasElement[]; groups: Group[]; camera: Camera; selectedIds: string[]; spatialIndex: SpatialIndex },
  ) => {
    const { elements, groups, camera, selectedIds: currentSel, spatialIndex } = ctx;

    const HANDLE_HIT_RADIUS = 8 / camera.zoom;
    for (const id of currentSel) {
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

    const query = { x: world.x - 12, y: world.y - 12, width: 24, height: 24 };
    const candidates = spatialIndex.query(query).sort((a, b) => b.zIndex - a.zIndex);
    let hitId: string | null = null;
    for (const el of candidates) {
      if (hitTestElement(el, world)) {
        hitId = el.id;
        break;
      }
    }

    if (hitId) {
      const containingGroup = groups.find(g => g.elementIds.includes(hitId!));
      const idsToSelect = containingGroup ? containingGroup.elementIds : [hitId];
      const allAlreadySelected = idsToSelect.every(id => currentSel.includes(id));
      const targetIds = allAlreadySelected && currentSel.length > 0 ? currentSel : idsToSelect;

      if (!allAlreadySelected || currentSel.length === 0) {
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
  }, []);

  const handleSelectPointerMove = useCallback((world: Point, setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>) => {
    if (isResizing.current && resizeInitialEl.current && resizeStartWorld.current && resizeHandle.current) {
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

      setElements(prev => prev.map(e => {
        if (e.id !== el.id) return e;
        const w = Math.max(newW, 5);
        if (e.type === 'text') {
          const te = e as CanvasElement & { type: 'text' };
          const h = measureTextHeight(te.text, w, te.fontSize, te.fontFamily);
          return { ...e, x: newX, y: newY, width: w, height: h };
        }
        return { ...e, x: newX, y: newY, width: w, height: Math.max(newH, 5) };
      }));
      return;
    }

    if (isMoving.current && moveStartWorld.current) {
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
      const x = Math.min(selectStart.current.x, world.x);
      const y = Math.min(selectStart.current.y, world.y);
      const box = {
        x, y,
        width: Math.abs(world.x - selectStart.current.x),
        height: Math.abs(world.y - selectStart.current.y),
      };
      setSelectionBox(box);
      selectionBoxRef.current = box;
    }
  }, []);

  const handleSelectPointerUp = useCallback((elements: CanvasElement[]) => {
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
      const ids = elements.filter(el => intersects(getElementBounds(el), box)).map(el => el.id);
      setSelectedIds(ids);
      setSelectionBox(null);
      selectionBoxRef.current = null;
      selectStart.current = null;
    }
  }, []);

  const selectAll = useCallback((elements: CanvasElement[]) => {
    setSelectedIds(elements.map(el => el.id));
  }, []);

  return {
    selectedIds, setSelectedIds,
    selectionBox, setSelectionBox,
    isResizingNow, isMovingNow, isSelectingNow,
    handleSelectPointerDown, handleSelectPointerMove, handleSelectPointerUp,
    selectAll,
  };
}