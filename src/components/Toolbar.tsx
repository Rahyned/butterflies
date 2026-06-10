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
  color: 'var(--color-text-primary)',
  border: 'none',
  borderRadius: 0,
  padding: '4px 8px',
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
  color: 'var(--color-active-ui)',
  fontWeight: 700,
};

const dropdownBtn: React.CSSProperties = {
  ...btnBase,
  padding: '4px 10px',
  border: 'none',
  borderRadius: 0,
  gap: '6px',
};

function useViewportWidth(): number {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

export default function Toolbar({
  tool, onToolChange,
  position, onPositionChange,
}: ToolbarProps) {
  const vw = useViewportWidth();
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const compact = vw < 768;

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
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible',
      background: 'var(--color-ui-bg)',
      border: '1px solid var(--color-ui-border)',
      borderRadius: '8px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '13px',
      color: 'var(--color-text-primary)',
      maxWidth: Math.min(640, vw - 32),
    }}>
      <div
        onMouseDown={handleDragStart}
        style={{
          cursor: 'grab',
          padding: compact ? '4px 10px' : '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderBottom: '1px solid var(--color-ui-border)',
          fontSize: '11px',
          color: 'var(--color-text-primary)',
        }}
      >
        <span style={{ fontSize: '14px', lineHeight: '14px' }}>⠿</span>
        {!compact && <span>Butterflies</span>}
      </div>

      <div style={{
        padding: compact ? '4px 6px' : '6px 10px',
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        overflow: 'visible',
        flexWrap: 'wrap',
        gap: compact ? '2px' : '0',
      }}>
        <button
          onClick={() => onToolChange('select')}
          style={tool === 'select' ? activeBtn : btnBase}
          title="Seleccionar (1)"
        >
          ⇱{!compact && ' Seleccionar'}
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--color-ui-border)', margin: compact ? '0 4px' : '0 10px' }} />

        <button
          onClick={() => onToolChange('hand')}
          style={tool === 'hand' ? activeBtn : btnBase}
          title="Mano (0)"
        >
          ✋{!compact && ' Mano'}
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--color-ui-border)', margin: compact ? '0 4px' : '0 10px' }} />

        <button
          onClick={() => onToolChange('freedraw')}
          style={tool === 'freedraw' ? activeBtn : btnBase}
          title="Dibujar (7)"
        >
          ✎{!compact && ' Dibujar'}
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--color-ui-border)', margin: compact ? '0 4px' : '0 10px' }} />

        <button
          onClick={() => onToolChange('eraser')}
          style={tool === 'eraser' ? activeBtn : btnBase}
          title="Borrador (8)"
        >
          ⌫{!compact && ' Borrar'}
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--color-ui-border)', margin: compact ? '0 4px' : '0 10px' }} />

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={dropdownBtn}
            title="Formas y Texto"
          >
            <span>{currentShape ? `${currentShape.icon}${compact ? '' : ' ' + currentShape.label}` : compact ? '▦' : '▦ Formas y Texto'}</span>
            {!compact && <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>}
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '2px',
              background: 'var(--color-ui-bg)',
              border: '1px solid var(--color-ui-border)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              padding: '4px 0',
              zIndex: 301,
              minWidth: compact ? 130 : 155,
            }}>
              {shapeTools.map((s, i) => (
                <div key={s.id}>
                  <div
                    onClick={() => {
                      onToolChange(s.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      padding: compact ? '5px 10px' : '6px 12px',
                      cursor: 'pointer',
                      color: tool === s.id ? 'var(--color-active-ui)' : 'var(--color-text-primary)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {s.icon} {s.label}
                  </div>
                  {i < shapeTools.length - 1 && (
                    <div style={{
                      height: 1,
                      background: 'var(--color-ui-border)',
                      margin: '2px 12px',
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
