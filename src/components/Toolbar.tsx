import type { Tool } from '../types/canvas';

interface ToolbarProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  roughness: number;
  onRoughnessChange: (roughness: number) => void;
  onSave: () => void;
  onLoad: () => void;
  onNew: () => void;
  onUndo: () => void;
  onRedo: () => void;
  gridEnabled: boolean;
  onGridToggle: () => void;
  showMinimap: boolean;
  onMinimapToggle: () => void;
  onExportPNG: () => void;
}

const toolGroups: { id: Tool; label: string; icon: string }[][] = [
  [
    { id: 'select', label: 'Seleccionar', icon: '⇱' },
    { id: 'rect', label: 'Rectángulo', icon: '▭' },
    { id: 'ellipse', label: 'Elipse', icon: '○' },
    { id: 'line', label: 'Línea', icon: '╱' },
    { id: 'arrow', label: 'Flecha', icon: '→' },
  ],
  [
    { id: 'text', label: 'Texto', icon: 'T' },
    { id: 'freedraw', label: 'Dibujar', icon: '✎' },
    { id: 'eraser', label: 'Borrador', icon: '⌫' },
    { id: 'hand', label: 'Mano', icon: '✋' },
  ],
];

const strokeWidths = [
  { value: 1, label: 'F' },
  { value: 2, label: 'M' },
  { value: 4, label: 'G' },
];

const roughnessValues = [0, 1, 2];

const btnBase: React.CSSProperties = {
  background: 'transparent',
  color: '#c8d0e0',
  border: '1px solid #2d3a5a',
  borderRadius: '4px',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '12px',
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
  border: '1px solid #4cc9f0',
};

const sep: React.CSSProperties = {
  width: '1px',
  height: '28px',
  background: '#2d3a5a',
  flexShrink: 0,
};

export default function Toolbar({
  tool, onToolChange,
  strokeColor, onStrokeColorChange,
  fillColor, onFillColorChange,
  strokeWidth, onStrokeWidthChange,
  roughness, onRoughnessChange,
  onSave, onLoad, onNew, onUndo, onRedo,
  gridEnabled, onGridToggle,
  showMinimap, onMinimapToggle,
  onExportPNG,
}: ToolbarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 10px',
      background: '#0f1628',
      borderBottom: '1px solid #1a2640',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '12px',
      color: '#c8d0e0',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      userSelect: 'none',
      overflowX: 'auto',
    }}>
      {/* Group 1: Tools */}
      {toolGroups[0].map(t => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => onToolChange(t.id)}
          style={tool === t.id ? activeBtn : btnBase}
        >
          {t.icon} {t.label}
        </button>
      ))}
      <div style={sep} />
      {toolGroups[1].map(t => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => onToolChange(t.id)}
          style={tool === t.id ? activeBtn : btnBase}
        >
          {t.icon} {t.label}
        </button>
      ))}

      <div style={sep} />

      {/* Group 2: Properties */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
        Trazo
        <input
          type="color"
          value={strokeColor}
          onChange={e => onStrokeColorChange(e.target.value)}
          style={{ width: '22px', height: '22px', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
        />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
        Relleno
        <input
          type="color"
          value={fillColor === 'transparent' ? '#ffffff' : fillColor}
          onChange={e => onFillColorChange(e.target.value)}
          style={{ width: '22px', height: '22px', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
        />
        <button
          onClick={() => onFillColorChange('transparent')}
          style={fillColor === 'transparent' ? activeBtn : btnBase}
          title="Sin relleno"
        >
          ∅
        </button>
      </label>

      <div style={sep} />

      <span style={{ fontSize: '11px', marginRight: '2px' }}>G:</span>
      {strokeWidths.map(sw => (
        <button
          key={sw.value}
          onClick={() => onStrokeWidthChange(sw.value)}
          style={strokeWidth === sw.value ? activeBtn : btnBase}
        >
          {sw.label}
        </button>
      ))}

      <div style={sep} />

      <span style={{ fontSize: '11px', marginRight: '2px' }}>R:</span>
      {roughnessValues.map(r => (
        <button
          key={r}
          onClick={() => onRoughnessChange(r)}
          style={roughness === r ? activeBtn : btnBase}
        >
          {r}
        </button>
      ))}

      <div style={sep} />

      {/* Group 3: Actions */}
      <button onClick={onUndo} title="Deshacer (Ctrl+Z)" style={btnBase}>↩</button>
      <button onClick={onRedo} title="Rehacer (Ctrl+Shift+Z)" style={btnBase}>↪</button>

      <div style={sep} />

      <button onClick={onSave} title="Guardar (Ctrl+S)" style={btnBase}>Guardar</button>
      <button onClick={onLoad} title="Cargar (Ctrl+O)" style={btnBase}>Cargar</button>
      <button onClick={onNew} title="Nuevo dibujo" style={btnBase}>Nuevo</button>

      <div style={sep} />

      <button onClick={onGridToggle} title="Mostrar cuadrícula" style={gridEnabled ? activeBtn : btnBase}>
        Cuadrícula
      </button>
      <button onClick={onMinimapToggle} title="Mostrar minimapa" style={showMinimap ? activeBtn : btnBase}>
        Mapa
      </button>
      <button onClick={onExportPNG} title="Exportar como PNG" style={btnBase}>
        Exportar
      </button>
    </div>
  );
}