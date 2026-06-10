import { useCallback, useEffect, useRef, useState } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import HamburgerMenu from './components/HamburgerMenu';
import ActionButtons from './components/ActionButtons';
import { useCanvas } from './hooks/useCanvas';
import { useHistory } from './hooks/useHistory';
import { useKeyboard } from './hooks/useKeyboard';

import PropertiesSidebar from './components/PropertiesSidebar';
import { saveFile, loadFile, exportPNG } from './utils/fileIO';
import { exportSVG } from './utils/svgExport';
import { measureTextHeight } from './utils/renderer';
import type { CanvasElement, TextElement } from './types/canvas';
import './App.css';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 15);
}

function App() {
  const [vw, setVw] = useState(window.innerWidth);
  const [toolbarPos, setToolbarPos] = useState(() => ({
    x: Math.max(0, Math.round((window.innerWidth - 520) / 2)),
    y: 40,
  }));
  const [hamburgerPos, setHamburgerPos] = useState({ x: 40, y: 40 });
  const [actionsPos, setActionsPos] = useState(() => ({
    x: window.innerWidth - 220,
    y: 40,
  }));

  useEffect(() => {
    function onResize() {
      const w = window.innerWidth;
      setVw(w);
      setToolbarPos(prev => {
        const estW = w < 768 ? 260 : 520;
        if (prev.x + estW > w) {
          return { ...prev, x: Math.max(0, Math.round((w - estW) / 2)) };
        }
        return prev;
      });
      setHamburgerPos(prev => {
        if (prev.x + 50 > w) return { ...prev, x: 40 };
        return prev;
      });
      setActionsPos(prev => {
        if (prev.x + 220 > w) return { ...prev, x: w - 220 };
        return prev;
      });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const {
    tool, setTool,
    elements, setElements,
    selectedIds, setSelectedIds,
    groups, groupElements, ungroupElements,
    bringToFront, sendToBack, moveUp, moveDown,
    camera,
    strokeColor,
    strokeWidth,
    roughness,
    gridEnabled, setGridEnabled,
    showMinimap, setShowMinimap,
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

  useEffect(() => {
    const splash = document.getElementById('splash-overlay');
    if (!splash) return;
    const timer = setTimeout(() => {
      splash.style.opacity = '0';
      splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

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

  const handleTextSubmit = useCallback((text: string, x: number, y: number, w: number, _h: number) => {
    const fontSize = 20;
    const fontFamily = "'JetBrains Mono', monospace";
    const minW = 50;
    const worldW = Math.max(w, minW);
    const worldH = measureTextHeight(text, worldW, fontSize, fontFamily);

    setElements(prev => {
      const maxZ = prev.length > 0 ? Math.max(...prev.map(el => el.zIndex)) : -1;
      const el: CanvasElement = {
        type: 'text',
        id: generateId(),
        x, y,
        width: worldW,
        height: worldH,
        strokeColor, fillColor: 'transparent',
        strokeWidth, roughness,
        opacity: 1, seed: randomSeed(),
        zIndex: maxZ + 1,
        text, fontSize,
        fontFamily,
        fontWeight: '400',
      };
      return [...prev, el];
    });
    setTool('select');
  }, [strokeColor, strokeWidth, roughness, setElements, setTool]);

  const handleGroup = useCallback(() => {
    groupElements(selectedIds);
  }, [groupElements, selectedIds]);

  const handleUngroup = useCallback(() => {
    ungroupElements();
  }, [ungroupElements]);

  const handleSave = useCallback(async () => { await saveFile(elements); }, [elements]);
  const handleExport = useCallback(async () => { await exportPNG(elements); }, [elements]);
  const handleExportSVG = useCallback(async () => { await exportSVG(elements); }, [elements]);
  const handleLoad = useCallback(async () => {
    const loaded = await loadFile();
    if (loaded) {
      setElements(loaded);
      setSelectedIds([]);
    }
  }, [setElements, setSelectedIds]);

  const handleResetPositions = useCallback(() => {
    const w = vw;
    setToolbarPos({ x: Math.max(0, Math.round((w - 520) / 2)), y: 40 });
    setHamburgerPos({ x: 40, y: 40 });
    setActionsPos({ x: w - 220, y: 40 });
  }, [vw]);

  const handleNew = useCallback(() => {
    setElements([]);
    setSelectedIds([]);
  }, [setElements, setSelectedIds]);

  const selectedTextElement: TextElement | null =
    selectedIds.length === 1
      ? (elements.find(el => el.id === selectedIds[0] && el.type === 'text') as TextElement | undefined) ?? null
      : null;

  const handleUpdateTextElement = useCallback((id: string, partial: Partial<TextElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...partial } as CanvasElement : el));
  }, [setElements]);

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
    onBringToFront: bringToFront,
    onSendToBack: sendToBack,
    onMoveUp: moveUp,
    onMoveDown: moveDown,
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HamburgerMenu
        onNew={handleNew}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportPNG={handleExport}
        onExportSVG={handleExportSVG}
        onResetPositions={handleResetPositions}
        position={hamburgerPos}
        onPositionChange={setHamburgerPos}
      />
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        position={toolbarPos}
        onPositionChange={setToolbarPos}
      />
      <ActionButtons
        onUndo={undo}
        onRedo={redo}
        gridEnabled={gridEnabled}
        onGridToggle={() => setGridEnabled(!gridEnabled)}
        showMinimap={showMinimap}
        onMapToggle={() => setShowMinimap(!showMinimap)}
        position={actionsPos}
        onPositionChange={setActionsPos}
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
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
        />
        <PropertiesSidebar
          element={selectedTextElement}
          onUpdate={handleUpdateTextElement}
          onClose={() => setSelectedIds([])}
        />
      </div>
    </div>
  );
}

export default App;
