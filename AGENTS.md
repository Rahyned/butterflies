# AGENTS.md — Butterflies

Sos el desarrollador principal de esta app. Seguí este documento como fuente de verdad para el estado del proyecto, decisiones tomadas y qué hacer a continuación.

---

## Stack

- **Tauri 2** (shell desktop nativo, Rust)
- **React 19 + TypeScript** (frontend)
- **rough.js 4.6.6** (render estilo "dibujado a mano")
- **@tauri-apps/plugin-fs + plugin-dialog** (guardar/cargar archivos .json)
- **CSS puro** (sin Tailwind, sin UI libraries)
- **Vite 7** (bundler)

## Estado actual (26 mayo 2026)

### ✅ Funcionando

- Notion MCP conectado (hosted remote, OAuth) para sincronizar CHANGELOG automáticamente
- Las 8 tools: `select`, `rect`, `ellipse`, `line`, `arrow`, `freedraw`, `eraser`
- Zoom con Ctrl+wheel (rango 0.1x – 5x)
- Pan con espacio + drag
- Undo/Redo con Ctrl+Z / Ctrl+Shift+Z (historial de 50 estados)
- Guardar/Cargar con diálogo nativo del SO (@tauri-apps/plugin-dialog + plugin-fs)
- Atajos de teclado: teclas 1-8 para tools, Ctrl+S/O/A, Delete/Backspace, Escape
- rough.js integrado con seed fijo por elemento (el dibujo no "tiembla" al re-renderizar)
- Toolbar con selector de herramienta, color de trazo, color de relleno, grosor (S/M/L), roughness (botones 0/1/2), botones Undo/Redo/Save/Load/New/Grid/Map/Export
- Text tool: click crea TextElement con word wrap, Enter confirma, Escape cierra
- Selection visual con dashed box azul `#4cc9f0` y handles en esquinas (8 handles, resize funcional)
- Mover elementos seleccionados con drag (click + drag inmediato)
- Selection box (arrastrar en vacío con select para selección múltiple)
- Shift constraint en rect/ellipse (cuadrado/círculo)
- Arrow head con rough.js (consistencia visual)
- Freedraw optimizado (ctx nativo durante dibujo, rough.js al finalizar)
- Grid toggle y minimapa
- Export a PNG
- Hand tool (pan con click + drag y shortcut 0)
- Tema oscuro: fondo `#1a1a2e`, toolbar `#0f1628`
- `npm run tauri dev` arranca sin errores
- Build release genera `butterflies.exe` (verificado)

### ⏳ Pendientes

_(ninguno — todo implementado)_

### Decisiones técnicas tomadas

| Decisión | Razón |
|----------|-------|
| `crate-type` = `["staticlib", "rlib"]` (sin `cdylib`) | GNU ld no soporta ~100k exports en DLL modo debug; Tauri linkea estático, no necesita cdylib |
| Linker wrapper `gcc-linker.cmd` en `~/.cargo/bin/` | Necesario para que gcc encuentre `dlltool.exe` de MSYS2 en PATH |
| `.cargo/config.toml` con `[target.x86_64-pc-windows-gnu] linker = "gcc-linker.cmd"` | Asegura que Cargo use el wrapper |
| TMP/TEMP en `.cargo/config.toml` | Evita que gcc intente crear archivos temporales en `C:\WINDOWS` (permiso denegado) |
| `useHistory` con `useRef` en vez de `useState` para stack | Evita closures stale en callbacks de undo/redo |
| Colores/grosor/roughness en estado de `useCanvas` | Flujo unificado desde Toolbar → useCanvas → elementos dibujados |
| Textarea no-controlado (sin `value` prop) | WebView2 + React 19 no renderiza `<textarea>` controlado con `value`; no-controlado funciona |

### Reglas obligatorias

- **No usar `any` en TypeScript** sin comentario justificatorio
- **No usar librerías UI** (ni Tailwind, ni MUI, ni shadcn)
- **No guardar en localStorage** — solo Tauri FS
- **No hacer fetch a URLs externas**
- **Registrar cada cambio en `CHANGELOG.md`** con fecha, descripción y archivos tocados
- **Actualizar la página CHANGELOG en Notion** con cada cambio que se registre en `CHANGELOG.md`. La página está dentro de la página `butterflies` (ID: `36c71396-eaa5-8079-9197-c049b3e512e0`), sub-página CHANGELOG (ID: `36c71396-eaa5-81e5-95d7-de59efa25e7c`)

## Comandos

```bash
npm run tauri dev       # desarrollo
npm run tauri build     # build release (necesita admin para el instalador)
cargo build --manifest-path src-tauri/Cargo.toml --release   # solo el binario
npx tsc --noEmit        # chequeo de tipos
```

## Estructura de archivos

```
src/
├── App.tsx                    ← entrada principal, conecta todo
├── App.css                    ← estilos base
├── main.tsx                   ← punto de montaje React
├── types/canvas.ts            ← tipos: CanvasElement, Tool, Point, etc.
├── components/
│   ├── Canvas.tsx             ← canvas + rough.js + text overlay
│   └── Toolbar.tsx            ← barra de herramientas y controles
├── hooks/
│   ├── useCanvas.ts           ← estado del canvas, dibujo, selección, zoom/pan
│   ├── useHistory.ts          ← undo/redo con refs (50 estados)
│   └── useKeyboard.ts         ← atajos de teclado
└── utils/
    ├── renderer.ts            ← dibujado con rough.js + selection box/handles
    ├── hitTest.ts             ← detección de clic sobre elementos
    └── fileIO.ts              ← guardar/cargar via Tauri FS + dialog
src-tauri/
├── src/lib.rs                 ← plugins: opener, fs, dialog
├── src/main.rs                ← entry point del binario
├── Cargo.toml                 ← dependencias Rust
├── tauri.conf.json            ← configuración Tauri
└── capabilities/default.json  ← permisos: fs, dialog
```
