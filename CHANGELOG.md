# Changelog

## 2026-06-05

### Trazos lisos con roughness 0 (Canvas nativo)
- `src/utils/renderer.ts`: cuando `roughness === 0`, todas las formas se dibujan con Canvas 2D API nativa en vez de rough.js
- rect, ellipse, line, arrow, freedraw y text tienen su implementación nativa: trazos perfectamente lisos, sin perturbaciones
- Default de `roughness` cambiado de `1` a `0` en `useCanvas.ts`
- Archivos tocados: `src/utils/renderer.ts`, `src/hooks/useCanvas.ts`

### Exportar SVG
- Creado `src/utils/svgExport.ts` con traducción de cada `CanvasElement` a SVG equivalente:
  - `rect` → `<rect>`, `ellipse` → `<ellipse>`, `line` → `<line>`
  - `arrow` → `<line>` + `<polygon>` para punta de flecha
  - `freedraw` → `<polyline>`, `text` → `<text>` con `<tspan>` por línea (word wrap)
  - viewBox con padding 40px, fondo blanco, elementos ordenados por zIndex
  - Se guarda con diálogo nativo como `.svg`
- Botón `📐 Exportar SVG` en menú hamburguesa
- Botón `🖼 Exportar PNG` renombrado (antes `📤`)
- Botón `📂 Importar` agregado entre Guardar y Exportar en menú hamburguesa
- Archivos tocados: `src/utils/svgExport.ts`, `src/components/HamburgerMenu.tsx`, `src/App.tsx`

## 2026-06-03

### Minimapa expandible + más grande con spacing
- Minimapa ahora 200×150 colapsado (vs 180×130), con spacing 24px desde bordes inferiores derechos (vs 12px)
- Al hacer click: se expande a 400×300 (toggle)
- Nuevo estado `minimapExpanded` en `Canvas.tsx` + onClick handler en el canvas del minimapa
- `renderMinimap` usa dimensiones condicionales según estado expandido
- CSS transition suave en width/height
- Archivos tocados: `src/components/Canvas.tsx`

## 2026-06-01

### Sistema de temas oscuro/claro
- Creado `src/hooks/useTheme.tsx` con `ThemeProvider` + `useTheme()` hook, persistencia en localStorage y atributo `data-theme` en `<html>`
- Definidos colores CSS variables en `src/App.css` para dos temas:
  - **Oscuro (default)**: canvas `#1a1a2e`, UI `#0f1628`, bordes `#2a3a5a`, texto `#e2e8f0`
  - **Claro (secundario)**: canvas `#EAEEEF`, UI `#1F2E5A`, bordes `#CCDDEA`, texto `#EAEEEF`
- Todos los componentes migraron de colores hardcodeados a `var(--color-*)`:
  - `Canvas.tsx`: fondo, grilla, minimapa, textarea, menú contextual
  - `Toolbar.tsx`: contenedor, botones, dropdown, separadores, hover
  - `HamburgerMenu.tsx`: ícono, dropdown, separadores, hover
  - `ActionButtons.tsx`: contenedor, botones, separador
  - `PropertiesSidebar.tsx`: panel colapsado/expandido, inputs, colores de texto
- `useCanvas.ts`: default stroke color lee `--color-default-stroke` de CSS
- Hamburger menu: botón "Tema" funcional → toggle con ícono ☀️/🌙 según tema activo
- Archivos tocados: `src/hooks/useTheme.tsx`, `src/App.css`, `src/App.tsx`, `src/components/Canvas.tsx`, `src/components/Toolbar.tsx`, `src/components/HamburgerMenu.tsx`, `src/components/ActionButtons.tsx`, `src/components/PropertiesSidebar.tsx`, `src/hooks/useCanvas.ts`, `CHANGELOG.md`

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
- Bug: `window.addEventListener('click', closeMenu, true)` en fase capture se disparaba ANTES que el `onClick` de React en los items del menú contextual, `onGroup()` nunca se ejecutaba
- Fix: cambiado `true` (capture) a `false` (bubble phase) en window.click — ahora onClick del target corre primero, luego closeMenu
- Menu items vuelven a `onClick` (no onMouseDown)
- Archivos tocados: `src/components/Canvas.tsx`

## 2026-05-27

### Sistema de capas (zIndex + Painter's Algorithm)
- Agregado campo `zIndex: number` a `BaseElement` en `src/types/canvas.ts`
- Nuevas funciones de capas en `src/hooks/useCanvas.ts`:
  - `bringToFront()`: selección al frente (zIndex = max + 1)
  - `sendToBack()`: selección al fondo (zIndex = min - 1)
  - `moveUp()`: sube un lugar (swap zIndex con elemento superior)
  - `moveDown()`: baja un lugar (swap zIndex con elemento inferior)
- Elementos nuevos reciben `zIndex` incremental via `getNextZIndex()`
- Render ordenado por zIndex (ascendente: fondo → frente) en `Canvas.tsx`
- Hit-testing para selección respeta el orden visual (último zIndex = primero en detectarse)
- Menú contextual con opciones de capas: Traer al frente, Subir capa, Bajar capa, Enviar al fondo
- Atajos de teclado en `useKeyboard.ts`:
  - `Ctrl+]` → Subir capa
  - `Ctrl+[` → Bajar capa
  - `Ctrl+Shift+]` → Traer al frente
  - `Ctrl+Shift+[` → Enviar al fondo
- Guardado/carga serializa zIndex automáticamente (incluido en JSON)
- Archivos tocados: `src/types/canvas.ts`, `src/hooks/useCanvas.ts`, `src/hooks/useKeyboard.ts`, `src/components/Canvas.tsx`, `src/App.tsx`

## 2026-05-28

### Color scheme: Combinación #4 (Midnight Denim + Cloudy Sky)
- Fondo de canvas cambiado a Cloudy Sky `#CCDDEA`
- Interfaz (toolbar, minimap, menú contextual) cambiada a Midnight Denim `#1F2E5A`
- Cuadrícula ahora usa Midnight Denim con opacidad reducida (15% minor, 25% major) sobre fondo claro
- Textarea overlay actualizado para coincidir con Midnight Denim
- Archivos tocados: `src/App.css`, `src/components/Canvas.tsx`, `src/components/Toolbar.tsx`

### Bordes de interfaz cambiados a Cloudy Sky #CCDDEA
- Todos los bordes de la toolbar (botones, contenedor, drag handle, dropdown) cambiados a `#CCDDEA`
- Bordes del menú contextual, minimapa y textarea también cambiados a `#CCDDEA`
- Separador del menú contextual actualizado
- Archivos tocados: `src/components/Toolbar.tsx`, `src/components/Canvas.tsx`

### Patrón escamas en la toolbar
- Reemplazado patrón sayagata por patrón de escamas (arcos superpuestos estilo pez/dragón)
- Color: Cloudy Sky `#CCDDEA` al 8% de opacidad, tile 20×20px
- Arcos SVG con radio 5px dispuestos en filas escalonadas
- Archivos tocados: `src/components/Toolbar.tsx`

### Color de trazo default cambiado a oscuro
- Default stroke color cambiado de `#e2e8f0` (claro) a `#1F2E5A` (midnight denim) para visibilidad sobre fondo Cloudy Sky
- Archivos tocados: `src/hooks/useCanvas.ts`

## 2026-05-28

### Bugfix: Text tool se achicaba con zoom ≠ 1
- `Canvas.tsx`: `offsetWidth`/`offsetHeight` del textarea ahora se dividen por `camera.zoom` al crear el `TextElement`, corrigiendo que el texto se viera más chico o más grande según el zoom
- `App.tsx` (`handleTextSubmit`): ahora mide el texto real con `ctx.measureText()` simulando word wrap para calcular `width`/`height` exactos del contenido, en vez de usar el tamaño arbitrario del textarea
- Archivos tocados: `src/components/Canvas.tsx`, `src/App.tsx`

### Fix: hitbox de texto editable más chica que el contenido
- Creado `measureTextHeight()` en `src/utils/renderer.ts`: función pura que calcula la altura real del texto con word wrap dado `(text, width, fontSize, fontFamily)`
- `src/utils/hitTest.ts` (`getElementBounds`): para `TextElement`, calcula la altura real con `measureTextHeight()` dinámicamente en vez de usar `el.height`, garantizando que la hitbox de selección y los handles siempre rodeen al contenido completo
- `src/hooks/useCanvas.ts` (resize): al redimensionar un `TextElement`, el alto se recalcula automáticamente con `measureTextHeight()` según el nuevo ancho; solo el ancho es editable
- `src/App.tsx` (`handleTextSubmit`): reemplazada lógica inline por `measureTextHeight()`
- Archivos tocados: `src/utils/renderer.ts`, `src/utils/hitTest.ts`, `src/hooks/useCanvas.ts`, `src/App.tsx`

## 2026-05-29

### ☰ Hamburger standalone left + action buttons right
- Creado `src/components/HamburgerMenu.tsx`: ☰ standalone en top:40 left:40, dropdown con Nuevo, Guardar, Exportar PNG, placeholder Tema
- Creado `src/components/ActionButtons.tsx`: ↩ ↪ ⊞ 🗺 standalone en top:40 right:40, con fondo semi-transparente y borde consistente
- `Toolbar.tsx`: simplificada — solo tools + shapes dropdown, sin hamburger ni action buttons. Props reducidas a `tool`, `onToolChange`, `position`, `onPositionChange`
- `App.tsx`: renderiza los 3 widgets independientes con el mismo `top: 40` (mismo spacing que toolbar tiene con borde superior)
- Archivos tocados: `src/components/HamburgerMenu.tsx`, `src/components/ActionButtons.tsx`, `src/components/Toolbar.tsx`, `src/App.tsx`, `CHANGELOG.md`

### HamburgerMenu y ActionButtons ahora draggables
- Agregados props `position`/`onPositionChange` a ambos widgets
- Drag handle con refs y window mousemove/mouseup listeners (mismo patrón que toolbar)
- ActionButtons cambió de `right` a `left` para que el drag funcione sin depender del viewport width
- Archivos tocados: `src/components/HamburgerMenu.tsx`, `src/components/ActionButtons.tsx`, `src/App.tsx`

### ↺ Reset posiciones en menú hamburger
- Nuevo ítem en dropdown del ☰ que resetea toolbar, hamburger y action buttons a sus posiciones iniciales
- `handleResetPositions` en `App.tsx` setea los 3 estados a sus valores de origen
- Archivos tocados: `src/components/HamburgerMenu.tsx`, `src/App.tsx`

### Sidebar de propiedades para texto
- Creado `src/components/PropertiesSidebar.tsx`: panel lateral derecho (220px) que aparece al seleccionar un TextElement
- Controles: color (input type=color), tamaño (number 8-120), familia (select con 7 fuentes), peso (Normal/Negrita)
- Al modificar cualquier propiedad, se recalcula `height` del texto con `measureTextHeight()` automáticamente
- Agregado `fontWeight?: string` a `TextElement` en types/canvas.ts (opcional, compatibilidad retroactiva)
- `renderer.ts`: `ctx.font` usa fontWeight, `measureTextHeight` acepta fontWeight opcional
- Sidebar se cierra al hacer clic en ✕ o al cambiar selección (Escape, click en vacío, etc.)
- Archivos tocados: `src/types/canvas.ts`, `src/utils/renderer.ts`, `src/components/PropertiesSidebar.tsx`, `src/App.tsx`

### Sidebar colapsable [<] + auto-open
- Sidebar ahora siempre se renderiza: colapsada muestra un tab `[<]` a la derecha, click lo expande
- Se abre automáticamente al seleccionar un TextElement
- El tab colapsado está en `top: 180` para no tapar los action buttons de arriba a la derecha
- Archivos tocados: `src/components/PropertiesSidebar.tsx`, `src/App.tsx`
