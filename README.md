# Excalidraw Desktop

Una app de dibujo vectorial estilo Excalidraw que corre como ejecutable desktop offline. Sin servidor, sin login, sin internet.

Construida con **Tauri 2**, **React 19**, **TypeScript** y **rough.js**.

![stack](https://img.shields.io/badge/Tauri-2-24c8db?logo=tauri)
![stack](https://img.shields.io/badge/React-19-61dafb?logo=react)
![stack](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![stack](https://img.shields.io/badge/rough.js-4.6.6-ff6b6b)

---

## Captura

![screenshot](screenshot.png)
<!-- TODO: agregar screenshot.png del programa funcionando -->

---

## Características

### 🛠 Herramientas de dibujo
| Tool | Tecla | Descripción |
|------|-------|-------------|
| Select | `1` | Seleccionar y mover elementos |
| Rectángulo | `2` | Dibujar rectángulos (Shift + drag = cuadrado) |
| Elipse | `3` | Dibujar elipses (Shift + drag = círculo) |
| Línea | `4` | Dibujar líneas rectas |
| Flecha | `5` | Línea con punta de flecha |
| Texto | `6` | Texto inline |
| Dibujo libre | `7` | Trazo a mano alzada |
| Borrador | `8` | Eliminar elementos |

### 🎨 Personalización
- **Color de trazo** — selector de color nativo
- **Color de relleno** — selector + opción "sin relleno"
- **Grosor** — S / M / L
- **Roughness** — slider 0–2 (de línea limpia a dibujado a mano)

### ⌨️ Atajos de teclado
| Tecla | Acción |
|-------|--------|
| `1` – `8` | Seleccionar herramienta |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+S` | Guardar |
| `Ctrl+O` | Cargar |
| `Ctrl+A` | Seleccionar todo |
| `Delete` / `Backspace` | Eliminar selección |
| `Escape` | Volver a Select, deseleccionar |
| `Espacio + drag` | Pan del canvas |
| `Ctrl + rueda` | Zoom (0.1x – 5x) |

### 💾 Guardar y cargar
Usa el diálogo nativo del sistema operativo (Tauri `plugin-dialog`). Los archivos se guardan en formato `.json`.

### 🎯 Estilo sketch
Todos los elementos se renderizan con **rough.js** usando una semilla fija por elemento — el dibujo no "tiembla" al re-renderizar.

---

## Requisitos

- **Rust** (via [rustup](https://rustup.rs))
- **Node.js** 18+
- **Windows** (probado en Windows con MSYS2/mingw64) — Tauri también soporta macOS y Linux con mínimos cambios

---

## Instalación y desarrollo

```bash
# Clonar
git clone <repo-url>
cd excalidraw-desktop

# Instalar dependencias
npm install

# Desarrollo (con hot-reload)
npm run tauri dev

# Compilar ejecutable
npm run tauri build
```

El ejecutable se genera en `src-tauri/target/release/excalidraw-desktop.exe`.

> En Windows con toolchain GNU (mingw64), asegurate de tener `C:\msys64\mingw64\bin` en el PATH para que el linker encuentre `dlltool.exe`. Ver `~/.cargo/config.toml` para la configuración automática.

---

## Estructura del proyecto

```
src/
├── App.tsx                    ← componente principal
├── App.css                    ← estilos base
├── main.tsx                   ← punto de montaje React
├── types/canvas.ts            ← tipos TypeScript
├── components/
│   ├── Canvas.tsx             ← canvas + rough.js + input de texto
│   └── Toolbar.tsx            ← barra de herramientas
├── hooks/
│   ├── useCanvas.ts           ← lógica de dibujo, selección, zoom/pan
│   ├── useHistory.ts          ← undo/redo
│   └── useKeyboard.ts         ← atajos de teclado
└── utils/
    ├── renderer.ts            ← renderizado con rough.js
    ├── hitTest.ts             ← detección de clic
    └── fileIO.ts              ← guardar/cargar archivos
src-tauri/
├── src/lib.rs                 ← plugins de Tauri
├── src/main.rs                ← entry point
├── Cargo.toml
├── tauri.conf.json
└── capabilities/default.json
```

---

## Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| [Tauri 2](https://v2.tauri.app) | 2.11 | Shell desktop nativo |
| [React](https://react.dev) | 19 | UI |
| [TypeScript](https://www.typescriptlang.org) | 5.8 | Tipado |
| [rough.js](https://roughjs.com) | 4.6.6 | Render "dibujado a mano" |
| [Vite](https://vite.dev) | 7 | Bundler |
| CSS puro | — | Sin librerías UI |

---

## Licencia

MIT
