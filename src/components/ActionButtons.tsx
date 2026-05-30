import { useCallback, useEffect, useRef } from 'react';

interface ActionButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
  gridEnabled: boolean;
  onGridToggle: () => void;
  showMinimap: boolean;
  onMapToggle: () => void;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
}

const btnBase: React.CSSProperties = {
  background: 'transparent',
  color: '#EAEEEF',
  border: '1px solid #CCDDEA',
  borderRadius: '4px',
  padding: '5px 8px',
  cursor: 'pointer',
  fontSize: '16px',
  lineHeight: '1',
  fontFamily: "'JetBrains Mono', monospace",
  display: 'flex',
  alignItems: 'center',
};

const activeBtn: React.CSSProperties = {
  ...btnBase,
  background: '#4cc9f0',
  color: '#1a1a2e',
};

export default function ActionButtons({
  onUndo, onRedo, gridEnabled, onGridToggle, showMinimap, onMapToggle,
  position, onPositionChange,
}: ActionButtonsProps) {
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      onPositionChange({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const handleUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [onPositionChange]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 300,
        cursor: 'grab',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        background: '#1F2E5A',
        border: '1px solid #CCDDEA',
        borderRadius: '8px',
      }}
    >
      <button onClick={onUndo} style={btnBase} title="Deshacer (Ctrl+Z)">↩</button>
      <button onClick={onRedo} style={btnBase} title="Rehacer (Ctrl+Shift+Z)">↪</button>
      <div style={{ width: 1, height: 24, background: '#EAEEEF', margin: '0 2px' }} />
      <button onClick={onGridToggle} style={gridEnabled ? activeBtn : btnBase} title="Mostrar/ocultar cuadrícula">⊞</button>
      <button onClick={onMapToggle} style={showMinimap ? activeBtn : btnBase} title="Mostrar/ocultar minimapa">🗺</button>
    </div>
  );
}
