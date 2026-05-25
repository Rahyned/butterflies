# Changelog

## 2026-05-24

### README
- Creado `README.md` con descripción del proyecto, features, instalación, estructura y tech stack

### Proyecto inicializado
- Scaffolding con `create-tauri-app` (React + TypeScript)
- Instaladas dependencias: roughjs, @tauri-apps/plugin-fs, @tauri-apps/plugin-dialog
- Registrados plugins en `src-tauri/src/lib.rs`: opener, fs, dialog
- Configurados permisos en `src-tauri/capabilities/default.json`

### Tipos
- Creado `src/types/canvas.ts` con tipos `Tool`, `Point`, `CanvasElement`, `CanvasState`

### Canvas y renderizado
- Creado `src/components/Canvas.tsx` con canvas + rough.js + text overlay
- Creado `src/hooks/useCanvas.ts` con lógica de dibujo, selección, zoom/pan
- Creado `src/utils/renderer.ts` con dibujado rough.js + selection box/handles
- Creado `src/utils/hitTest.ts` para detección de clic sobre elementos
- Soportadas todas las herramientas: rect, ellipse, line, arrow, freedraw, text, eraser, select
- Colores/grosor/roughness integrados desde Toolbar → useCanvas

### Undo/Redo
- Creado `src/hooks/useHistory.ts` con stack basado en refs (50 estados)

### Toolbar
- Creado `src/components/Toolbar.tsx` con selector de herramienta, color, fill, grosor (S/M/L), roughness, botones Undo/Redo/Save/Load/New

### Atajos de teclado
- Creado `src/hooks/useKeyboard.ts` con teclas 1-8, Ctrl+Z/Y/S/O/A, Delete, Escape, Space

### File I/O
- Creado `src/utils/fileIO.ts` con guardar/cargar via @tauri-apps/plugin-dialog + plugin-fs

### Configuración de build
- Eliminado `cdylib` de `crate-type` en Cargo.toml (GNU ld no soporta ~100k exports)
- Creado `~/.cargo/bin/gcc-linker.cmd` (wrapper para que gcc encuentre dlltool.exe)
- Configurado `~/.cargo/config.toml` con linker wrapper y TMP/TEMP

### Archivos de proyecto
- Creado `opencode.json` con instructions apuntando a AGENTS.md y plan.md
- Creado `AGENTS.md` con estado del proyecto, decisiones y reglas
- Actualizado `plan.md` con checkboxes y pendientes
- Creado `CHANGELOG.md` (este archivo)

## 2026-05-25

### Fase 0 — Tipos y estado
- Agregado `'hand'` al union type `Tool` en `src/types/canvas.ts`
- Agregados estados `gridEnabled` y `showMinimap` en `useCanvas.ts`
- Tecla `0` mapeada a hand tool en `useKeyboard.ts`
- Hand tool inicia pan en `handlePointerDown`

### Fase 1 — Canvas cuadriculado
- Creada función `drawGrid()` en `Canvas.tsx` que dibuja líneas de cuadrícula (menores cada 40px, mayores cada 5 celdas)
- Grid se renderiza antes que los elementos en el canvas
- Fondo ya no es un CSS `background` — se dibuja el grid directamente
- Grid toggleable desde toolbar (comienza activo por defecto)

### Fase 2 — Hand tool
- Nuevo tool `hand` (icono ✋, shortcut `0`)
- Al activarse, click y arrastrar en canvas mueve la cámara (pan)
- Cursor cambia a `grab`
- Space + drag sigue funcionando como alternativa

### Fase 3 — Toolbar reorganizada
- Tres grupos visuales con separadores: Tools (izquierda) | Propiedades (centro) | Acciones (derecha)
- Tools divididas en 2 subgrupos: [select, rect, ellipse, line, arrow] | [text, draw, eraser, hand]
- Propiedades: stroke color, fill color (con botón ∅), width (S/M/L), roughness (0/1/2 como botones)
- Acciones: undo, redo, save, load, new, grid toggle, minimap toggle, export PNG
- Slider de roughness reemplazado por 3 botones (0/1/2)
- Estilos refinados: fondo `#0f1628`, colores más sobrios

### Fase 4 — Mover elementos seleccionados
- `useCanvas.ts`: al hacer mousedown en un elemento ya seleccionado, entra en modo "move"
- Al arrastrar, desplaza todos los elementos seleccionados (incluyendo puntos de line/arrow/freedraw)
- Soporta multi-selección: move mueve todos los elementos seleccionados simultáneamente

### Fase 5 — Selection box (selección múltiple)
- `useCanvas.ts`: al hacer mousedown en espacio vacío con tool=select, se inicia un rectángulo de selección
- `Canvas.tsx`: renderiza el rectángulo de selección dinámico
- Al soltar, selecciona todos los elementos cuya bounding box intersecta el rectángulo
- Usa refs sincrónicas (`selectionBoxRef`) para evitar closures stale

### Fase 6 — Handles de resize
- Al hacer mousedown en un handle (esquina o punto medio) de un elemento seleccionado, se inicia resize
- Soportados los 8 handles: tl, tc, tr, ml, mr, bl, bc, br
- Mantiene mínimo 5px de ancho/alto (no se puede hacer collapse)
- Handles agrandados de 6px a 8px para mejor usabilidad
- Helper `getHandleAt()` y `getHandlePositions()` en `useCanvas.ts`
- Elementos point-based (line/arrow/freedraw) no se redimensionan por ahora

### Fase 7 — Grid toggle
- Botón Grid en toolbar (sección acciones) que muestra/oculta la cuadrícula
- Estado `gridEnabled` en `useCanvas.ts`

### Fase 8 — Export a PNG
- Nueva función `exportPNG()` en `fileIO.ts`
- Crea canvas offscreen, renderiza con rough.js, pide guardar con diálogo nativo
- Fondo blanco + padding 40px alrededor del contenido
- Botón Export en toolbar

### Fase 9 — Minimapa
- Nuevo canvas overlay en esquina inferior derecha (180x130px)
- Renderiza todos los elementos en miniatura con rough.js
- Viewport indicator (rectángulo azul `#4cc9f0`) que muestra la posición actual de la cámara
- Toggleable desde toolbar (botón Map)
- Fondo semi-transparente `#0f1628` con borde

### Fase 10 — Bug fixes de coordenadas
- Text input: ahora almacena posición en screen space (`clientX - rect.left`) en vez de world space
- Al submit, convierte screen → world con `getWorldFromScreen()`, eliminando desalineación con zoom
- Textarea font size ya no escala con `camera.zoom` (siempre 20px)
- Eliminado `ctx.scale(dpr, dpr)` redundante en resize (ya se maneja en cada render)
- Cursor de hand tool cambia a `grab`
