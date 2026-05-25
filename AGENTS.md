# AGENTS.md — Excalidraw Desktop

Sos el desarrollador principal de esta app. Seguí este documento como fuente de verdad para el estado del proyecto, decisiones tomadas y qué hacer a continuación.

---

## Stack

- **Tauri 2** (shell desktop nativo, Rust)
- **React 19 + TypeScript** (frontend)
- **rough.js 4.6.6** (render estilo "dibujado a mano")
- **@tauri-apps/plugin-fs + plugin-dialog** (guardar/cargar archivos .json)
- **CSS puro** (sin Tailwind, sin UI libraries)
- **Vite 7** (bundler)

## Estado actual (24 mayo 2026)

### ✅ Funcionando

- Las 8 tools: `select`, `rect`, `ellipse`, `line`, `arrow`, `freedraw`, `text`, `eraser`
- Zoom con Ctrl+wheel (rango 0.1x – 5x)
- Pan con espacio + drag
- Undo/Redo con Ctrl+Z / Ctrl+Shift+Z (historial de 50 estados)
- Guardar/Cargar con diálogo nativo del SO (@tauri-apps/plugin-dialog + plugin-fs)
- Atajos de teclado: teclas 1-8 para tools, Ctrl+S/O/A, Delete/Backspace, Escape
- rough.js integrado con seed fijo por elemento (el dibujo no "tiembla" al re-renderizar)
- Toolbar con selector de herramienta, color de trazo, color de relleno, grosor (S/M/L), roughness (slider 0-2), botones Undo/Redo/Save/Load/New
- Text tool con input overlay (textarea), submit con Enter, cancel con Escape
- Selection visual con dashed box azul `#4cc9f0` y handles en esquinas
- Tema oscuro: fondo `#1a1a2e`, toolbar `#16213e`
- `npm run tauri dev` arranca sin errores
- Build release genera `excalidraw-desktop.exe` (verificado)

### ⏳ Pendientes (priorizados)

1. **Mover elementos seleccionados** — con tool `select`, drag sobre un elemento seleccionado debe moverlo (actualmente solo selecciona al hacer click, no arrastra)
2. **Selection box** — con tool `select`, arrastrar en espacio vacío debe dibujar un recuadro de selección y seleccionar múltiples elementos
3. **Shift para constraint** — Shift + drag en rect/ellipse debe forzar cuadrado/círculo (proporción 1:1)
4. **Mejorar punta de flecha** — actualmente se dibuja con Canvas 2D API directa, debería integrarse mejor con rough.js o al menos coincidir visualmente
5. **Optimizar freedraw** — cada segmento se dibuja con `rc.line()` de rough.js, podría ser lento con muchos puntos; considerar dibujar con ctx nativo y solo aplicar rough.js al finalizar

### Decisiones técnicas tomadas

| Decisión | Razón |
|----------|-------|
| `crate-type` = `["staticlib", "rlib"]` (sin `cdylib`) | GNU ld no soporta ~100k exports en DLL modo debug; Tauri linkea estático, no necesita cdylib |
| Linker wrapper `gcc-linker.cmd` en `~/.cargo/bin/` | Necesario para que gcc encuentre `dlltool.exe` de MSYS2 en PATH |
| `.cargo/config.toml` con `[target.x86_64-pc-windows-gnu] linker = "gcc-linker.cmd"` | Asegura que Cargo use el wrapper |
| TMP/TEMP en `.cargo/config.toml` | Evita que gcc intente crear archivos temporales en `C:\WINDOWS` (permiso denegado) |
| `useHistory` con `useRef` en vez de `useState` para stack | Evita closures stale en callbacks de undo/redo |
| Colores/grosor/roughness en estado de `useCanvas` | Flujo unificado desde Toolbar → useCanvas → elementos dibujados |

### Reglas obligatorias

- **No usar `any` en TypeScript** sin comentario justificatorio
- **No usar librerías UI** (ni Tailwind, ni MUI, ni shadcn)
- **No guardar en localStorage** — solo Tauri FS
- **No hacer fetch a URLs externas**
- **Registrar cada cambio en `CHANGELOG.md`** con fecha, descripción y archivos tocados

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
