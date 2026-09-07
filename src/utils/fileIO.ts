import type { CanvasElement } from '../types/canvas';
import { getElementBounds } from './hitTest';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile, writeFile, remove } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';
import rough from 'roughjs';
import { renderElement } from './renderer';

const DARK_DEFAULT_STROKE = '#e2e8f0';
const AUTOSAVE_FILENAME = 'autosave.json';

async function autosavePath(): Promise<string> {
  const dir = await appDataDir();
  return `${dir}${AUTOSAVE_FILENAME}`;
}

function normalizeForExport(elements: CanvasElement[]): CanvasElement[] {
  return elements.map(el => {
    if (el.strokeColor === DARK_DEFAULT_STROKE) {
      return { ...el, strokeColor: '#000000' };
    }
    return el;
  });
}

export async function saveFile(elements: CanvasElement[]): Promise<boolean> {
  try {
    const path = await save({ filters: [{ name: 'Dibujo de Canvas', extensions: ['json'] }] });
    if (!path) return false;
    await writeTextFile(path as string, JSON.stringify({ version: 1, elements: normalizeForExport(elements) }, null, 2));
    return true;
  } catch (err) {
    console.error('Error al guardar:', err);
    return false;
  }
}

export async function loadFile(): Promise<CanvasElement[] | null> {
  try {
    const path = await open({ filters: [{ name: 'Dibujo de Canvas', extensions: ['json'] }] });
    if (!path) return null;
    const content = await readTextFile(path as string);
    const data = JSON.parse(content);
    if (!Array.isArray(data?.elements)) {
      console.error('Error al cargar: el archivo no contiene un array de elementos válido');
      return null;
    }
    return data.elements as CanvasElement[];
  } catch (err) {
    console.error('Error al cargar:', err);
    return null;
  }
}

export async function exportPNG(elements: CanvasElement[]) {
  try {
    if (elements.length === 0) return;

    const allBounds = elements.map(getElementBounds);
    const minX = Math.min(...allBounds.map(b => b.x));
    const minY = Math.min(...allBounds.map(b => b.y));
    const maxX = Math.max(...allBounds.map(b => b.x + b.width));
    const maxY = Math.max(...allBounds.map(b => b.y + b.height));

    const padding = 40;
    const width = Math.ceil(maxX - minX + padding * 2);
    const height = Math.ceil(maxY - minY + padding * 2);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.translate(padding - minX, padding - minY);

    const rc = rough.canvas(canvas);

    for (const el of normalizeForExport(elements)) {
      renderElement(ctx, el, rc);
    }

    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
    const path = await save({ filters: [{ name: 'Imagen PNG', extensions: ['png'] }] });
    if (path) {
      const arrayBuffer = await blob.arrayBuffer();
      await writeFile(path as string, new Uint8Array(arrayBuffer));
    }
  } catch (err) {
    console.error('Error al exportar PNG:', err);
  }
}

export async function saveAutosave(elements: CanvasElement[]): Promise<void> {
  try {
    const path = await autosavePath();
    await writeTextFile(path, JSON.stringify({ version: 1, elements }, null, 2));
  } catch (err) {
    console.error('Error al guardar autosave:', err);
  }
}

export async function loadAutosave(): Promise<CanvasElement[] | null> {
  try {
    const path = await autosavePath();
    const content = await readTextFile(path);
    const data = JSON.parse(content);
    if (!Array.isArray(data?.elements)) return null;
    return data.elements as CanvasElement[];
  } catch {
    return null;
  }
}

export async function clearAutosave(): Promise<void> {
  try {
    const path = await autosavePath();
    await remove(path);
  } catch {
    // no existe, no pasa nada
  }
}
