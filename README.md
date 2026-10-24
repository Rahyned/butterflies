# Butterflies

**Editor de dibujo vectorial de escritorio, liviano y 100 % offline, con estilo "dibujado a mano".**

![Tauri](https://img.shields.io/badge/Tauri-2-24c8db?logo=tauri) ![React](https://img.shields.io/badge/React-19-61dafb?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript) ![rough.js](https://img.shields.io/badge/rough.js-4.6.6-ff6b6b)

![Butterflies](public/logo-nombre.png)

## El problema

Hacer bocetos y diagramas rápidos sin depender de una cuenta, de internet ni del peso de una app Electron.


## Qué hace

- **8 herramientas:** selección, rectángulo, elipse, línea, flecha, texto, dibujo libre y borrador (teclas `1`–`8`).
- **Estilo sketch con rough.js**, con semilla fija por elemento para que el trazo no "tiemble" al redibujar.
- **Personalización:** color de trazo y relleno, tres grosores y nivel de "roughness" (de línea limpia a mano alzada).
- **Lienzo:** zoom (0,1x–5x), pan con espacio + arrastre, undo/redo y atajos de teclado completos.
- **Guardar y abrir** proyectos `.json` con el diálogo nativo del sistema.
- **Privacidad:** sin servidor, sin login y sin telemetría. Los errores se guardan solo en logs locales.

## Stack

Tauri 2 (Rust) · React 19 · TypeScript 5 · rough.js · Vite · CSS sin librerías de UI.

## Cómo correrlo

Requisitos: Rust (rustup) y Node.js 18+. Probado en Windows; Tauri también soporta macOS y Linux.

```bash
npm install
npm run tauri dev     # desarrollo
npm run tauri build   # genera el ejecutable
```

## Estado

Completado (mayo 2026). Ejecutable `.exe` generado y verificado.

## Autor

Lautaro Rodríguez · [GitHub](https://github.com/Rahyned) · Licencia MIT
