interface ActionButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
  gridEnabled: boolean;
  onGridToggle: () => void;
  showMinimap: boolean;
  onMapToggle: () => void;
}

const btnBase: React.CSSProperties = {
  background: 'transparent',
  color: '#c8d0e0',
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
}: ActionButtonsProps) {
  return (
    <div style={{
      position: 'fixed',
      right: 40,
      top: 40,
      zIndex: 100,
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      background: 'rgba(31,46,90,0.7)',
      border: '1px solid #CCDDEA',
      borderRadius: '8px',
    }}>
      <button onClick={onUndo} style={btnBase} title="Deshacer (Ctrl+Z)">↩</button>
      <button onClick={onRedo} style={btnBase} title="Rehacer (Ctrl+Shift+Z)">↪</button>
      <div style={{ width: 1, height: 24, background: '#CCDDEA', margin: '0 2px' }} />
      <button onClick={onGridToggle} style={gridEnabled ? activeBtn : btnBase} title="Mostrar/ocultar cuadrícula">⊞</button>
      <button onClick={onMapToggle} style={showMinimap ? activeBtn : btnBase} title="Mostrar/ocultar minimapa">🗺</button>
    </div>
  );
}
