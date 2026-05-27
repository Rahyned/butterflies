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

## 2026-05-25 (tarde)

### Fase 11 — Mover elementos al arrastrar inmediatamente
- `useCanvas.ts`: al hacer click en un elemento NO seleccionado, ahora inicia el modo move inmediatamente
- Ya no requiere dos clicks: click + drag funciona de una

### Fase 12 — Shift constraint (cuadrado/círculo)
- `useCanvas.ts`: agregado `shiftPressed` ref con listener de teclado
- `updateDrawing`: cuando Shift está presionado, rect/ellipse mantienen proporción 1:1

### Fase 13 — Flecha con rough.js
- `renderer.ts`: la punta de flecha ahora se dibuja con `rc.polygon()` de rough.js en vez de Canvas 2D API directa
- Consistencia visual: misma semilla, mismo roughness que la línea

### Fase 14 — Freedraw optimizado
- `renderer.ts`: el elemento en progreso (`isDrawing=true`) se dibuja con ctx nativo (rápido)
- Al finalizar, se renderiza con rough.js (sketch)
- `Canvas.tsx`: pasa `isDrawing=true` al renderizar `drawingElement`

### Fase 15 — Bugfix texto duplicado
- `Canvas.tsx`: agregado `textSubmittedRef` para evitar que `onBlur` dispare un segundo `onTextSubmit` cuando se cierra el textarea vía Enter

### Fase 16 — Bugfix textarea no aparecía
- `Canvas.tsx`: cambiado `onPointerDown` por `onMouseDown` (pointer events no funcionaban en el WebView)
- Textarea usa `display: block/none` en vez de renderizado condicional (React conditional rendering no funciona en este entorno)
- Agregado `textareaRef` + `useEffect` para focus manual al mostrar el textarea
- Eliminados logs de debug

### [BLOQUEO] Textarea overlay no se renderiza
- **Síntoma**: el estado `textInputPos` se actualiza correctamente (visible en debug overlay), pero el textarea no aparece en pantalla.
- **Intentado**:
  - Render condicional (`{textInputPos && <textarea/>}`) → no funciona
  - `display: block/none` como style condicional → no funciona
  - `visibility/opacity` toggles → no funciona
  - `position: fixed` fuera del contenedor (para evitar `overflow:hidden`) → no funciona
  - `position: absolute` dentro del contenedor con `e.offsetX/offsetY` → no funciona
  - Eventos nativos `addEventListener('mousedown', ...)` en vez de React synthetic events → no funciona
- **Estado**: PENDIENTE. Causa raíz desconocida. Sospecha: posible interferencia del WebView de Tauri con re-render condicional de React, o error silencioso en el componente Canvas.

## 2026-05-26

### Fix: Guardado/Carga no funcionaba (FS permissions)
- Agregado `"fs:read-all"` y `"fs:write-all"` en `src-tauri/capabilities/default.json`
- Reemplazados imports dinámicos por estáticos en `src/utils/fileIO.ts`
- Agregado try/catch con console.error en saveFile, loadFile, exportPNG
- Agregada validación de `data.elements` como array en loadFile
- `saveFile` ahora retorna boolean
- `handleLoad` en `src/App.tsx` ahora limpia `selectedIds` al cargar

### Fix: Vite recargaba al guardar .json
- Agregado `"**/*.json"` al `watch.ignored` en `vite.config.ts`

### Config: LSPs para opencode
- Instalado `typescript-language-server` global
- Configurados rust-analyzer y typescript en `opencode.json`

### Notion MCP + CHANGELOG en Notion
- Configurado Notion MCP (server remoto `https://mcp.notion.com/mcp`) en `opencode.json`
- Autenticado via OAuth con `opencode mcp auth notion`
- Creada sub-página CHANGELOG dentro de la página Notion `butterflies` con el historial completo del proyecto
- Agregada regla en `AGENTS.md` para actualizar la página CHANGELOG de Notion en cada cambio
- Archivos tocados: `opencode.json`, `AGENTS.md`, `CHANGELOG.md`

### Toolbar flotante arrastrable
- Toolbar ahora es un panel flotante (`position: fixed` con `left`/`top` dinámicos) en vez de barra fija al tope
- Agregado drag handle (⠿) en el header del panel para arrastrarlo por el canvas
- Canvas ahora ocupa 100vw x 100vh completo (sin `marginTop`)
- Estilos: `borderRadius: 8px`, `boxShadow`, borde sutil
- Archivos tocados: `src/App.tsx`, `src/components/Toolbar.tsx`

### Toolbar reorganizada — solo 6 items
- Toolbar simplificada a 6 elementos: Seleccionar, Mano, Dibujar, Borrar, Nuevo, Formas y Texto (dropdown)
- Dropdown "Formas y Texto" con: Rectángulo, Elipse, Línea, Flecha, Texto
- Eliminados del toolbar: colores, grosor, roughness, undo/redo, guardar/cargar, cuadrícula, mapa, exportar
- Layout horizontal (flex row con wrap), sin ancho fijo
- Archivos tocados: `src/App.tsx`, `src/components/Toolbar.tsx`

### Menú contextual — agrupar/desagrupar elementos
- Nuevo tipo `Group` en `src/types/canvas.ts`: grupo con `id` y `elementIds`
- Nuevo estado `groups` en `src/hooks/useCanvas.ts` con `groupElements()` y `ungroupElements()`
- Al hacer clic en un elemento agrupado, se seleccionan todos los miembros del grupo
- Al mover un elemento agrupado, todos los miembros se mueven juntos
- Al eliminar elementos agrupados, se limpian los grupos (se eliminan si quedan < 2 miembros)
- Menú contextual en `Canvas.tsx` (click derecho) con opciones Agrupar/Desagrupar
- Agrupar aparece si hay ≥ 2 elementos seleccionados
- Desagrupar aparece si algún elemento seleccionado pertenece a un grupo
- Archivos tocados: `src/types/canvas.ts`, `src/hooks/useCanvas.ts`, `src/components/Canvas.tsx`, `src/App.tsx`

### Fix: menú contextual no se veía (se cerraba al instante)
- Bug: `mousedown` del canvas se disparaba con click derecho e iniciaba tools
- Bug: `window.addEventListener('contextmenu', closeMenu, true)` cerraba el menú inmediatamente porque el evento burbujeaba del div contenedor a window
- Fix: `e.button !== 0` en onDown para ignorar clicks no primarios
- Fix: `e.stopPropagation()` en el handler de contextmenu + eliminado window.contextmenu close
- Archivos tocados: `src/components/Canvas.tsx`

### Fix: menú contextual no aparecía en Tauri WebView2
- Bug: el `contextmenu` event del canvas no llegaba al contenedor (WebView2 nativo intercepta el evento)
- Fix: agregado listener `contextmenu` directo en el canvas
- Fix: agregado handler `mousedown button===2` para abrir el menú incluso si WebView2 intercepta el contextmenu event
- Fix: `minHeight: 30` + fallback text "Seleccioná ≥2 elementos" en el menú para debug visual
- Archivos tocados: `src/components/Canvas.tsx`

### Fix: tool no volvía a select después de dibujar
- Bug: al terminar de dibujar (rect, ellipse, line, arrow, freedraw) la tool NO volvía a 'select', dejando al usuario atascado en la herramienta de dibujo sin poder seleccionar
- Bug: al borrar con eraser, la tool quedaba en 'eraser'
- Fix: `finishDrawing()` ahora llama `setTool('select')`
- Fix: eraser en `startDrawing()` también llama `setTool('select')`
- Archivos tocados: `src/hooks/useCanvas.ts`

### Revert: auto-switch a select rompía freedraw multi-trazo
- Eliminado `setTool('select')` de `finishDrawing()` — impedía dibujar múltiples trazos seguidos con freedraw
- Eraser mantiene auto-switch (es one-shot)
- Para volver a select después de dibujar: Escape o click en botón "Seleccionar"
- Archivos tocados: `src/hooks/useCanvas.ts`

### Fix: Agrupar no funcionaba
- Bug: `window.addEventListener('click', closeMenu, true)` en fase capture se disparaba ANTES que el `onClick` de React en los items del menú contextual, probablemente `onGroup()` nunca se ejecutaba porque el menú se cerraba/cambiaba antes
- Fix: cambiado de `onClick` a `onMouseDown` con `e.stopPropagation()` en los items del menú, `onGroup()` se ejecuta antes del capture click de window
- Archivos tocados: `src/components/Canvas.tsx`
