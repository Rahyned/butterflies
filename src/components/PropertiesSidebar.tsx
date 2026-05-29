import { useCallback } from 'react';
import type { TextElement } from '../types/canvas';
import { measureTextHeight } from '../utils/renderer';

interface PropertiesSidebarProps {
  element: TextElement;
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
  background: '#0f1628',
  border: '1px solid #CCDDEA',
  borderRadius: '4px',
  color: '#CCDDEA',
  padding: '4px 8px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '12px',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#8899aa',
  fontFamily: "'JetBrains Mono', monospace",
  marginBottom: '4px',
};

export default function PropertiesSidebar({ element, onUpdate, onClose }: PropertiesSidebarProps) {
  const handleChange = useCallback((partial: Partial<TextElement>) => {
    const updated = { ...element, ...partial };
    if ('width' in partial || 'text' in partial || 'fontSize' in partial || 'fontFamily' in partial || 'fontWeight' in partial) {
      const w = updated.width || 50;
      updated.height = measureTextHeight(updated.text, w, updated.fontSize, updated.fontFamily, updated.fontWeight || '400');
    }
    onUpdate(element.id, updated);
  }, [element, onUpdate]);

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: 220,
      height: '100vh',
      background: '#1F2E5A',
      borderLeft: '1px solid #CCDDEA',
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
        <span style={{ color: '#CCDDEA', fontSize: '14px', fontWeight: 600 }}>Texto</span>
        <span
          onClick={onClose}
          style={{ cursor: 'pointer', color: '#CCDDEA', fontSize: '18px', lineHeight: '1' }}
        >✕</span>
      </div>

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
        <div style={labelStyle}>Familia</div>
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
        <div style={labelStyle}>Peso</div>
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
  );
}
