import { useCallback, useState } from 'react';
import type { CanvasElement, Group } from '../types/canvas';
import { generateId } from '../utils/random';

export function useLayers() {
  const [groups, setGroups] = useState<Group[]>([]);

  const groupElements = useCallback((ids: string[]) => {
    if (ids.length < 2) return;
    const groupId = generateId();
    setGroups(prev => [...prev, { id: groupId, elementIds: ids }]);
  }, []);

  const ungroupElements = useCallback((selectedIds: string[]) => {
    setGroups(prev => prev.filter(group =>
      !group.elementIds.some(id => selectedIds.includes(id))
    ));
  }, []);

  const deleteSelected = useCallback((
    selectedIds: string[],
    setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  ) => {
    setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
    setGroups(prev => {
      const updated = prev.map(group => ({
        ...group,
        elementIds: group.elementIds.filter(id => !selectedIds.includes(id)),
      }));
      return updated.filter(group => group.elementIds.length >= 2);
    });
  }, []);

  const bringToFront = useCallback((
    selectedIds: string[],
    setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  ) => {
    if (selectedIds.length === 0) return;
    setElements(prev => {
      const maxZ = Math.max(...prev.map(el => el.zIndex));
      return prev.map(el =>
        selectedIds.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el
      );
    });
  }, []);

  const sendToBack = useCallback((
    selectedIds: string[],
    setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  ) => {
    if (selectedIds.length === 0) return;
    setElements(prev => {
      const minZ = Math.min(...prev.map(el => el.zIndex));
      return prev.map(el =>
        selectedIds.includes(el.id) ? { ...el, zIndex: minZ - 1 } : el
      );
    });
  }, []);

  const moveUp = useCallback((
    selectedIds: string[],
    setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  ) => {
    if (selectedIds.length === 0) return;
    setElements(prev => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const selected = new Set(selectedIds);
      for (let i = sorted.length - 1; i >= 0; i--) {
        const el = sorted[i];
        if (selected.has(el.id) && i < sorted.length - 1) {
          const above = sorted[i + 1];
          if (!selected.has(above.id)) {
            return prev.map(e => {
              if (e.id === el.id) return { ...e, zIndex: above.zIndex };
              if (e.id === above.id) return { ...e, zIndex: el.zIndex };
              return e;
            });
          }
        }
      }
      return prev;
    });
  }, []);

  const moveDown = useCallback((
    selectedIds: string[],
    setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  ) => {
    if (selectedIds.length === 0) return;
    setElements(prev => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const selected = new Set(selectedIds);
      for (let i = 0; i < sorted.length; i++) {
        const el = sorted[i];
        if (selected.has(el.id) && i > 0) {
          const below = sorted[i - 1];
          if (!selected.has(below.id)) {
            return prev.map(e => {
              if (e.id === el.id) return { ...e, zIndex: below.zIndex };
              if (e.id === below.id) return { ...e, zIndex: el.zIndex };
              return e;
            });
          }
        }
      }
      return prev;
    });
  }, []);

  return {
    groups, setGroups,
    groupElements, ungroupElements,
    deleteSelected,
    bringToFront, sendToBack, moveUp, moveDown,
  };
}