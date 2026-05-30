import { useCallback, useEffect, useRef, useState } from 'react';
import type { Tool } from '../types/canvas';

interface ToolbarProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
}

const shapeTools: { id: Tool; label: string; icon: string }[] = [
  { id: 'rect', label: 'Rectángulo', icon: '▭' },
  { id: 'ellipse', label: 'Elipse', icon: '○' },
  { id: 'line', label: 'Línea', icon: '╱' },
  { id: 'arrow', label: 'Flecha', icon: '→' },
  { id: 'text', label: 'Texto', icon: 'T' },
];

const isShapeTool = (t: Tool): boolean =>
  t === 'rect' || t === 'ellipse' || t === 'line' || t === 'arrow' || t === 'text';

const btnBase: React.CSSProperties = {
  background: 'transparent',
  color: '#EAEEEF',
  border: '1px solid #CCDDEA',
  borderRadius: '4px',
  padding: '5px 10px',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: "'JetBrains Mono', monospace",
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const activeBtn: React.CSSProperties = {
  ...btnBase,
  background: '#4cc9f0',
  color: '#1a1a2e',
  border: '1px solid #CCDDEA',
};

const dropdownBtn: React.CSSProperties = {
  ...btnBase,
  minWidth: 155,
};

export default function Toolbar({
  tool, onToolChange,
  position, onPositionChange,
}: ToolbarProps) {
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const currentShape = isShapeTool(tool) ? shapeTools.find(t => t.id === tool) : null;

  return (
    <div style={{
      position: 'fixed',
      left: position.x,
      top: position.y,
      zIndex: 300,
      userSelect: 'none',
      width: 'auto',
      height: 80,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible',
      background: '#1F2E5A',
      border: '1px solid #CCDDEA',
      borderRadius: '8px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '13px',
      color: '#EAEEEF',
    }}>
      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        style={{
          cursor: 'grab',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderBottom: '1px solid #CCDDEA',
          fontSize: '11px',
          color: '#EAEEEF',
        }}
      >
        <span style={{ fontSize: '14px', lineHeight: '14px' }}>⠿</span>
        <span>Butterflies</span>
      </div>

      {/* Tool buttons */}
      <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'visible' }}>
        <button
          onClick={() => onToolChange('select')}
          style={tool === 'select' ? activeBtn : btnBase}
          title="Seleccionar (1)"
        >
          ⇱ Seleccionar
        </button>

        <button
          onClick={() => onToolChange('hand')}
          style={tool === 'hand' ? activeBtn : btnBase}
          title="Mano (0)"
        >
          ✋ Mano
        </button>

        <button
          onClick={() => onToolChange('freedraw')}
          style={tool === 'freedraw' ? activeBtn : btnBase}
          title="Dibujar (7)"
        >
          ✎ Dibujar
        </button>

        <button
          onClick={() => onToolChange('eraser')}
          style={tool === 'eraser' ? activeBtn : btnBase}
          title="Borrador (8)"
        >
          ⌫ Borrar
        </button>

        {/* Formas y Texto dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={dropdownBtn}
            title="Formas y Texto"
          >
            <span>{currentShape ? `${currentShape.icon} ${currentShape.label}` : '▦ Formas y Texto'}</span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '2px',
              background: '#1F2E5A',
              border: '1px solid #CCDDEA',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              zIndex: 301,
            }}>
              {shapeTools.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    onToolChange(s.id);
                    setDropdownOpen(false);
                  }}
                  style={tool === s.id ? { ...btnBase, ...activeBtn } : btnBase}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
