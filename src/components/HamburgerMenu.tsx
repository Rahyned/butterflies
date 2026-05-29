import { useCallback, useEffect, useRef, useState } from 'react';

interface HamburgerMenuProps {
  onNew: () => void;
  onSave: () => void;
  onExport: () => void;
  onResetPositions: () => void;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
}

const btnBase: React.CSSProperties = {
  background: 'transparent',
  color: '#c8d0e0',
  border: 'none',
  borderRadius: '4px',
  padding: '5px 10px',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: "'JetBrains Mono', monospace",
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  justifyContent: 'flex-start',
};

export default function HamburgerMenu({ onNew, onSave, onExport, onResetPositions, position, onPositionChange }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-hamburger-dropdown]')) return;
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{
      position: 'fixed',
      left: position.x,
      top: position.y,
      zIndex: 100,
      userSelect: 'none',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '13px',
    }}>
      <span
        onMouseDown={handleMouseDown}
        onClick={() => setOpen(o => !o)}
        style={{
          cursor: 'grab', fontSize: '20px', lineHeight: '20px',
          padding: '6px 10px', borderRadius: '6px',
          display: 'inline-block',
          background: open ? 'rgba(31,46,90,0.9)' : 'rgba(31,46,90,0.7)',
          border: '1px solid #CCDDEA',
          color: '#CCDDEA',
        }}
        title="Menú"
      >☰</span>

      {open && (
        <div data-hamburger-dropdown style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          background: '#1F2E5A',
          border: '1px solid #CCDDEA',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          zIndex: 101,
          minWidth: 170,
        }}>
          <div onClick={() => { onNew(); setOpen(false); }} style={btnBase}>📄 Nuevo</div>
          <div onClick={() => { onSave(); setOpen(false); }} style={btnBase}>💾 Guardar</div>
          <div onClick={() => { onExport(); setOpen(false); }} style={btnBase}>📤 Exportar PNG</div>
          <div style={{ height: 1, background: '#CCDDEA', margin: '4px 0' }} />
          <div onClick={() => { onResetPositions(); setOpen(false); }} style={btnBase}>↺ Reset posiciones</div>
          <div style={{ height: 1, background: '#CCDDEA', margin: '4px 0' }} />
          <div style={{ ...btnBase, opacity: 0.5, cursor: 'default' }}>🎨 Tema ↔</div>
        </div>
      )}
    </div>
  );
}
