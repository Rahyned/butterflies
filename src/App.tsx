import { useCallback, useRef, useState } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import { useCanvas } from './hooks/useCanvas';
import { useHistory } from './hooks/useHistory';
import { useKeyboard } from './hooks/useKeyboard';
import { saveFile, loadFile } from './utils/fileIO';
import type { CanvasElement } from './types/canvas';
import './App.css';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 15);
}

function App() {
  const [toolbarPos, setToolbarPos] = useState({ x: 12, y: 12 });
  const {
    tool, setTool,
    elements, setElements,
    selectedIds, setSelectedIds,
    groups, groupElements, ungroupElements,
    camera,
    strokeColor,
    strokeWidth,
    roughness,
    gridEnabled,
    showMinimap,
    drawingElement,
    selectionBox,
    handlePointerDown: rawPointerDown,
    handlePointerMove: rawPointerMove,
    handlePointerUp: rawPointerUp,
    handleWheel,
    startPan,
    setSpacePressed,
    isSpacePressed,
    deleteSelected,
    selectAll,
  } = useCanvas();

  const { undo, redo } = useHistory(elements, setElements);

  const handlePointerDown = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    if (isSpacePressed()) { startPan(clientX, clientY); return; }
    rawPointerDown(clientX, clientY, rect);
  }, [rawPointerDown, startPan, isSpacePressed]);

  const handlePointerMove = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    rawPointerMove(clientX, clientY, rect);
  }, [rawPointerMove]);

  const handlePointerUp = useCallback(() => {
    rawPointerUp();
  }, [rawPointerUp]);

  const handleTextSubmit = useCallback((text: string, x: number, y: number, w: number, h: number) => {
    const el: CanvasElement = {
      type: 'text',
      id: generateId(),
      x, y,
      width: w,
      height: h,
      strokeColor, fillColor: 'transparent',
      strokeWidth, roughness,
      opacity: 1, seed: randomSeed(),
      text, fontSize: 20,
      fontFamily: "'JetBrains Mono', monospace",
    };
    setElements(prev => [...prev, el]);
    setTool('select');
  }, [strokeColor, strokeWidth, roughness, setElements, setTool]);

  const handleGroup = useCallback(() => {
    groupElements(selectedIds);
  }, [groupElements, selectedIds]);

  const handleUngroup = useCallback(() => {
    ungroupElements();
  }, [ungroupElements]);

  const handleSave = useCallback(async () => { await saveFile(elements); }, [elements]);
  const handleLoad = useCallback(async () => {
    const loaded = await loadFile();
    if (loaded) {
      setElements(loaded);
      setSelectedIds([]);
    }
  }, [setElements, setSelectedIds]);

  const handleNew = useCallback(() => {
    setElements([]);
    setSelectedIds([]);
  }, [setElements, setSelectedIds]);

  const handleEscape = useCallback(() => {
    setSelectedIds([]);
    setTool('select');
  }, [setSelectedIds, setTool]);

  const spaceRef = useRef(false);
  const handleSpaceDown = useCallback(() => { spaceRef.current = true; setSpacePressed(true); }, [setSpacePressed]);
  const handleSpaceUp = useCallback(() => { spaceRef.current = false; setSpacePressed(false); }, [setSpacePressed]);

  useKeyboard({
    onToolChange: setTool,
    onUndo: undo,
    onRedo: redo,
    onSave: handleSave,
    onLoad: handleLoad,
    onDelete: deleteSelected,
    onSelectAll: selectAll,
    onEscape: handleEscape,
    onSpaceDown: handleSpaceDown,
    onSpaceUp: handleSpaceUp,
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        onNew={handleNew}
        position={toolbarPos}
        onPositionChange={setToolbarPos}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          elements={elements}
          drawingElement={drawingElement}
          selectedIds={selectedIds}
          groups={groups}
          camera={camera}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          tool={tool}
          onTextSubmit={handleTextSubmit}
          gridEnabled={gridEnabled}
          selectionBox={selectionBox}
          showMinimap={showMinimap}
          onGroup={handleGroup}
          onUngroup={handleUngroup}
        />
      </div>
    </div>
  );
}

export default App;
