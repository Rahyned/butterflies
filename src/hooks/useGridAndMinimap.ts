import { useState } from 'react';

export function useGridAndMinimap() {
  const [gridEnabled, setGridEnabled] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  return { gridEnabled, setGridEnabled, showMinimap, setShowMinimap };
}