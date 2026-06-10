import { useCallback, useEffect, useRef, useState } from 'react';
import type { TextElement } from '../types/canvas';
import { measureTextHeight } from '../utils/renderer';

interface PropertiesSidebarProps {
  element: TextElement | null;
  onUpdate: (id: string, partial: Partial<TextElement>) => void;
  onClose: () => void;
}

const fontFamilies = [
  "'JetBrains Mono', monospace",
  "'Geist Mono', monospace",
  "Arial, sans-serif",
  "'Times New Roman', serif",
  "Courier New, monospace",
  "Georgia, serif",
  "Verdana, sans-serif",
];

const inputStyle: React.CSSProperties = {
  background: 'var(--color-sidebar-bg)',
  border: '1px solid var(--color-ui-border)',
  borderRadius: '4px',
  color: 'var(--color-text-secondary)',
  padding: '4px 8px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '12px',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-primary)',
  fontFamily: "'JetBrains Mono', monospace",
  marginBottom: '4px',
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

export default function PropertiesSidebar({ element, onUpdate, onClose }: PropertiesSidebarProps) {
  const vw = useViewportWidth();
  const isMobile = vw <= 768;
  const [open, setOpen] = useState(false);
  const prevElementRef = useRef(element);

  useEffect(() => {
    if (element && element !== prevElementRef.current) {
      setOpen(true);
    }
    prevElementRef.current = element;
  }, [element]);

  const handleChange = useCallback((partial: Partial<TextElement>) => {
    if (!element) return;
    const updated = { ...element, ...partial };
    if ('width' in partial || 'text' in partial || 'fontSize' in partial || 'fontFamily' in partial || 'fontWeight' in partial) {
      const w = updated.width || 50;
      updated.height = measureTextHeight(updated.text, w, updated.fontSize, updated.fontFamily, updated.fontWeight || '400');
    }
    onUpdate(element.id, updated);
  }, [element, onUpdate]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose();
  }, [onClose]);

  if (isMobile) {
    return (
      <>
        {!open && (
          <div
            onClick={() => setOpen(true)}
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 200,
              cursor: 'pointer',
              userSelect: 'none',
              background: 'var(--color-ui-bg)',
              border: '1px solid var(--color-ui-border)',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              padding: '6px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
            title="Propiedades de texto"
          >
            <span>▲</span>
            <span>Texto</span>
          </div>
        )}
        {open && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100vw',
            maxHeight: '50vh',
            background: 'var(--color-sidebar-bg)',
            border: '1px solid var(--color-ui-border)',
            borderBottom: 'none',
            borderRadius: '12px 12px 0 0',
            zIndex: 200,
            padding: '16px 16px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 -4px 16px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600 }}>Texto</span>
              <span
                onClick={handleClose}
                style={{ cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: '18px', lineHeight: '1' }}
              >✕</span>
            </div>

            {element && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ flex: '1 1 120px' }}>
                  <div style={labelStyle}>Color</div>
                  <input
                    type="color"
                    value={element.strokeColor}
                    onChange={e => handleChange({ strokeColor: e.target.value })}
                    style={{ ...inputStyle, padding: '2px', height: 32 }}
                  />
                </div>
                <div style={{ flex: '1 1 80px' }}>
                  <div style={labelStyle}>Tamaño</div>
                  <input
                    type="number"
                    min={8}
                    max={120}
                    value={element.fontSize}
                    onChange={e => handleChange({ fontSize: Math.max(8, Math.min(120, Number(e.target.value) || 20)) })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <div style={labelStyle}>Fuente</div>
                  <select
                    value={element.fontFamily}
                    onChange={e => handleChange({ fontFamily: e.target.value })}
                    style={inputStyle}
                  >
                    {fontFamilies.map(f => (
                      <option key={f} value={f}>{f.replace(/,.*/, '')}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: '1 1 80px' }}>
                  <div style={labelStyle}>Grosor</div>
                  <select
                    value={element.fontWeight || '400'}
                    onChange={e => handleChange({ fontWeight: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="400">Normal</option>
                    <option value="700">Negrita</option>
                  </select>
                </div>
              </div>
            )}

            {!element && (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>
                Seleccioná un texto para editar propiedades
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  if (!open) {
    return (
      <div
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: 0,
          top: 180,
          zIndex: 200,
          cursor: 'pointer',
          userSelect: 'none',
          background: 'var(--color-ui-bg)',
          border: '1px solid var(--color-ui-border)',
          borderRight: 'none',
          borderRadius: '6px 0 0 6px',
          padding: '14px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-primary)',
          fontSize: '14px',
          fontFamily: "'JetBrains Mono', monospace",
        }}
        title="Propiedades de texto"
      >◀</div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 140,
      width: 220,
      maxHeight: 'calc(100vh - 180px)',
      height: 'auto',
      background: 'var(--color-sidebar-bg)',
      border: '1px solid var(--color-ui-border)',
      borderRight: 'none',
      borderRadius: '8px 0 0 8px',
      zIndex: 200,
      padding: '16px 12px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      overflowY: 'auto',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600 }}>Texto</span>
        <span
          onClick={handleClose}
          style={{ cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: '18px', lineHeight: '1' }}
        >✕</span>
      </div>

      {element && (
        <>
          <div>
            <div style={labelStyle}>Color</div>
            <input
              type="color"
              value={element.strokeColor}
              onChange={e => handleChange({ strokeColor: e.target.value })}
              style={{ ...inputStyle, padding: '2px', height: 32 }}
            />
          </div>

          <div>
            <div style={labelStyle}>Tamaño</div>
            <input
              type="number"
              min={8}
              max={120}
              value={element.fontSize}
              onChange={e => handleChange({ fontSize: Math.max(8, Math.min(120, Number(e.target.value) || 20)) })}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Fuente</div>
            <select
              value={element.fontFamily}
              onChange={e => handleChange({ fontFamily: e.target.value })}
              style={inputStyle}
            >
              {fontFamilies.map(f => (
                <option key={f} value={f}>{f.replace(/,.*/, '')}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>Grosor</div>
            <select
              value={element.fontWeight || '400'}
              onChange={e => handleChange({ fontWeight: e.target.value })}
              style={inputStyle}
            >
              <option value="400">Normal</option>
              <option value="700">Negrita</option>
            </select>
          </div>
        </>
      )}

      {!element && (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: 40 }}>
          Seleccioná un texto para editar propiedades
        </div>
      )}
    </div>
  );
}
