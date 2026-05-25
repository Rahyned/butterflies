# CLAUDE.md — Mi Excalidraw Desktop

Sos el desarrollador principal de esta app. Seguí este documento como fuente de verdad.
Tomá decisiones de implementación sin pedir permiso salvo que algo contradiga lo especificado acá.

---

## Qué es este proyecto

Una app de dibujo vectorial estilo Excalidraw que corre como ejecutable desktop offline.
Sin servidor. Sin login. Sin internet.

**Stack:**
- Tauri 2 (shell desktop nativo, Rust)
- React + TypeScript (frontend)
- rough.js (render estilo "dibujado a mano")
- Tauri FS API (guardar/cargar archivos .json localmente)
- CSS puro (sin Tailwind, sin UI libraries)

---

## Setup inicial (solo si el proyecto no existe aún)

```bash
npm create tauri-app@latest . -- --template react-ts
npm install
npm install roughjs
npm install --save-dev @types/roughjs
```

Para correr en dev:
```bash
npm run tauri dev
```

Para compilar el ejecutable:
```bash
npm run tauri build
```

---

## Estructura de archivos objetivo

```
src/
├── App.tsx
├── App.css
├── main.tsx
├── types/
│   └── canvas.ts          ← tipos de elementos del canvas
├── components/
│   ├── Canvas.tsx          ← lienzo principal (<canvas>)
│   ├── Toolbar.tsx         ← barra de herramientas
│   └── PropertiesPanel.tsx ← panel de color/grosor (derecha)
├── hooks/
│   ├── useCanvas.ts        ← lógica de dibujo + estado de elementos
│   ├── useHistory.ts       ← undo/redo
│   └── useKeyboard.ts      ← atajos de teclado
└── utils/
    ├── renderer.ts         ← dibuja elementos con rough.js en el canvas
    ├── hitTest.ts          ← detecta click sobre elementos
    └── fileIO.ts           ← guardar/cargar via Tauri FS
src-tauri/
├── src/main.rs             ← NO MODIFICAR salvo que sea necesario
└── tauri.conf.json         ← configurar permisos FS si hace falta
```

---

## Tipos base — `src/types/canvas.ts`

```typescript
export type Tool = 'select' | 'rect' | 'ellipse' | 'line' | 'arrow' | 'text' | 'freedraw' | 'eraser';

export type Point = { x: number; y: number };

export type BaseElement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  roughness: number;       // 0 = limpio, 2 = muy sketch
  opacity: number;
  seed: number;            // semilla para rough.js (estabiliza el render)
};

export type RectElement   = BaseElement & { type: 'rect' };
export type EllipseElement = BaseElement & { type: 'ellipse' };
export type LineElement   = BaseElement & { type: 'line'; points: Point[] };
export type ArrowElement  = BaseElement & { type: 'arrow'; points: Point[] };
export type TextElement   = BaseElement & { type: 'text'; text: string; fontSize: number; fontFamily: string };
export type FreedrawElement = BaseElement & { type: 'freedraw'; points: Point[] };

export type CanvasElement =
  | RectElement | EllipseElement | LineElement
  | ArrowElement | TextElement | FreedrawElement;

export type CanvasState = {
  elements: CanvasElement[];
  selectedIds: string[];
  camera: { x: number; y: number; zoom: number };
};
```

---

## Comportamiento del Canvas — `src/components/Canvas.tsx`

- Un `<canvas>` que ocupa `100vw × 100vh` menos la toolbar.
- Usa `useRef` para acceder al elemento canvas directamente.
- Re-dibuja todo en cada frame con `requestAnimationFrame` o cuando cambia el estado.
- El canvas NO usa React para dibujar elementos individuales — todo va por la Canvas 2D API + rough.js.

### Eventos de mouse que debe manejar:
| Evento | Acción |
|--------|--------|
| `mousedown` | Empezar a dibujar / seleccionar / mover |
| `mousemove` | Actualizar elemento en progreso (preview en tiempo real) |
| `mouseup` | Finalizar elemento, agregarlo al estado |
| `wheel` | Zoom (ctrl+wheel) y scroll (wheel solo) |
| `dblclick` | En tool=text: crear TextElement con input inline |

### Zoom y pan:
- Pan: arrastrar con barra espaciadora presionada + mouse drag, o con mouse medio.
- Zoom: Ctrl + rueda del mouse. Rango: 0.1x a 5x.
- Todas las coordenadas internas se almacenan en "world space" (independientes del zoom).
- Al dibujar, convertir mouse coords a world coords: `worldX = (mouseX - camera.x) / camera.zoom`.

---

## Renderer — `src/utils/renderer.ts`

Usa rough.js para dibujar. Cada elemento tiene un `seed` fijo para que el estilo sketch sea estable (no cambie en cada re-render).

```typescript
import rough from 'roughjs';

export function renderElement(ctx: CanvasRenderingContext2D, el: CanvasElement, rc: RoughCanvas) {
  const opts = {
    seed: el.seed,
    roughness: el.roughness,
    stroke: el.strokeColor,
    fill: el.fillColor === 'transparent' ? undefined : el.fillColor,
    strokeWidth: el.strokeWidth,
  };

  switch (el.type) {
    case 'rect':
      rc.rectangle(el.x, el.y, el.width, el.height, opts);
      break;
    case 'ellipse':
      rc.ellipse(el.x + el.width/2, el.y + el.height/2, el.width, el.height, opts);
      break;
    case 'line':
      rc.line(el.points[0].x, el.points[0].y, el.points[1].x, el.points[1].y, opts);
      break;
    case 'arrow':
      // línea + punta de flecha (triángulo pequeño al final)
      break;
    case 'freedraw':
      // polyline con los puntos grabados
      break;
    case 'text':
      ctx.font = `${el.fontSize}px ${el.fontFamily}`;
      ctx.fillStyle = el.strokeColor;
      ctx.fillText(el.text, el.x, el.y);
      break;
  }
}
```

---

## Herramientas requeridas (v1)

| Tool | Comportamiento |
|------|---------------|
| `select` | Click = seleccionar elemento. Drag sobre elemento = mover. Drag en vacío = selection box. |
| `rect` | mousedown → mousemove → mouseup dibuja rectángulo. Shift = cuadrado. |
| `ellipse` | Igual que rect pero elipse. Shift = círculo. |
| `line` | mousedown = punto A, mouseup = punto B. |
| `arrow` | Igual que line, con punta de flecha en punto B. |
| `text` | Click en canvas → aparece `<input>` o `<textarea>` overlay en esa posición → Enter o click afuera = confirmar y crear TextElement. |
| `freedraw` | mousedown → grabar puntos mientras se mueve → mouseup = finalizar. |
| `eraser` | Click/drag sobre elementos = eliminarlos. |

---

## Toolbar — `src/components/Toolbar.tsx`

Barra horizontal en la parte superior. Contiene:
- Botones de herramienta (íconos SVG inline, sin librería de íconos externa)
- Separador visual
- Color de trazo (color picker nativo `<input type="color">`)
- Color de relleno (ídem + opción "sin relleno")
- Grosor de línea (slider o botones S/M/L)
- Roughness (slider 0-2)
- Botones: Guardar | Cargar | Nuevo | Deshacer | Rehacer

El tool activo se resalta visualmente.

---

## Undo/Redo — `src/hooks/useHistory.ts`

Patrón stack clásico:
```typescript
const [history, setHistory] = useState<CanvasElement[][]>([[]]);
const [pointer, setPointer] = useState(0);

function pushState(elements: CanvasElement[]) { ... }
function undo() { ... }
function redo() { ... }
```
Máximo 50 estados en el historial.

---

## Atajos de teclado

| Tecla | Acción |
|-------|--------|
| `1` | Tool: select |
| `2` | Tool: rect |
| `3` | Tool: ellipse |
| `4` | Tool: line |
| `5` | Tool: arrow |
| `6` | Tool: text |
| `7` | Tool: freedraw |
| `8` | Tool: eraser |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+S` | Guardar |
| `Ctrl+O` | Cargar |
| `Delete` / `Backspace` | Eliminar elementos seleccionados |
| `Escape` | Volver a tool select, deseleccionar |
| `Ctrl+A` | Seleccionar todos |
| `Espacio + drag` | Pan del canvas |

---

## Guardar y cargar — `src/utils/fileIO.ts`

Usar la Tauri FS API (v2):

```typescript
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

export async function saveFile(elements: CanvasElement[]) {
  const path = await save({ filters: [{ name: 'Canvas', extensions: ['json'] }] });
  if (path) await writeTextFile(path, JSON.stringify({ version: 1, elements }, null, 2));
}

export async function loadFile(): Promise<CanvasElement[] | null> {
  const path = await open({ filters: [{ name: 'Canvas', extensions: ['json'] }] });
  if (!path) return null;
  const content = await readTextFile(path as string);
  const data = JSON.parse(content);
  return data.elements;
}
```

En `src-tauri/tauri.conf.json`, asegurate de tener los permisos:
```json
"plugins": {
  "fs": { "all": true },
  "dialog": { "all": true }
}
```

Y en `Cargo.toml`:
```toml
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
```

---

## Estética visual

- Fondo del canvas: `#1a1a2e` (azul noche muy oscuro)
- Toolbar: `#16213e` con borde inferior sutil
- Colores de trazo por defecto: `#e2e8f0` (casi blanco)
- Relleno por defecto: `transparent`
- Font de UI: `'Geist Mono'` o `'JetBrains Mono'` (monospace, disponible via Google Fonts)
- Elementos seleccionados: borde de selección azul eléctrico `#4cc9f0` con handles en las esquinas
- Sin sombras exageradas, sin bordes redondeados en la toolbar

---

## Criterios de calidad — estado actual (24 mayo 2026)

- [x] Las 7 herramientas funcionan correctamente (+ eraser = 8 tools)
- [x] Zoom y pan son fluidos
- [x] Undo/redo funciona con Ctrl+Z / Ctrl+Y
- [x] Guardar y cargar abre diálogo nativo del SO
- [x] Los atajos de teclado funcionan todos
- [x] rough.js está integrado y los elementos tienen el estilo sketch
- [x] El seed está fijo por elemento (el dibujo no "tiembla" al re-renderizar)
- [x] `npm run tauri dev` arranca sin errores
- [x] No hay `any` sin justificación en el TypeScript

## Pendientes para próxima iteración

- [ ] Mover elementos arrastrándolos con tool=select (actualmente solo selecciona)
- [ ] Selection box: arrastrar en vacío con select para selección múltiple
- [ ] Shift+drag en rect/ellipse para forzar cuadrado/círculo
- [ ] Mejorar punta de flecha (consistencia visual con rough.js)
- [ ] Optimizar freedraw (usar ctx nativo durante el dibujo, rough.js al finalizar)

---

## Orden de implementación (completado ✅)

1. ✅ Setup del proyecto y verificar que `npm run tauri dev` abre la ventana
2. ✅ `types/canvas.ts` — definir todos los tipos
3. ✅ `Canvas.tsx` con dibujo de rectángulos básico
4. ✅ Integrar rough.js en `renderer.ts`
5. ✅ Agregar las demás herramientas de a una
6. ✅ `useHistory.ts` + undo/redo
7. ✅ Tool `select` con move (parcial: selecciona pero no arrastra)
8. ✅ `Toolbar.tsx` con controles de color/grosor
9. ✅ Tool `text` con input overlay
10. ✅ `fileIO.ts` + guardar/cargar
11. ✅ Zoom y pan
12. ✅ Atajos de teclado (`useKeyboard.ts`)
13. ✅ Polish visual

---

## Lo que NO hay que hacer

- No usar Electron
- No usar Tailwind ni ninguna UI library (shadcn, MUI, etc.)
- No usar `any` en TypeScript salvo casos muy específicos justificados con comentario
- No guardar en localStorage — solo archivos locales via Tauri FS
- No hacer fetch a ninguna URL externa
- No fragmentar la lógica del canvas en demasiados componentes — Canvas.tsx puede ser grande, está bien

## Archivos de configuración del proyecto

| Archivo | Propósito |
|---------|-----------|
| `opencode.json` | Configuración de opencode: `instructions: ["AGENTS.md", "plan.md"]` |
| `AGENTS.md` | Instrucciones para el agente: estado, decisiones, pendientes, reglas |
| `plan.md` | Plan original del proyecto, actualizado con estado actual |
| `CHANGELOG.md` | Registro cronológico de cambios implementados |
