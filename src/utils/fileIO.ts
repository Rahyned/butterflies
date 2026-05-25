import type { CanvasElement } from '../types/canvas';
import { getElementBounds } from './hitTest';

export async function saveFile(elements: CanvasElement[]) {
  const { save } = await import('@tauri-apps/plugin-dialog');
  const { writeTextFile } = await import('@tauri-apps/plugin-fs');
  const path = await save({ filters: [{ name: 'Dibujo de Canvas', extensions: ['json'] }] });
  if (path) {
    await writeTextFile(path as string, JSON.stringify({ version: 1, elements }, null, 2));
  }
}

export async function loadFile(): Promise<CanvasElement[] | null> {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const { readTextFile } = await import('@tauri-apps/plugin-fs');
  const path = await open({ filters: [{ name: 'Dibujo de Canvas', extensions: ['json'] }] });
  if (!path) return null;
  const content = await readTextFile(path as string);
  const data = JSON.parse(content);
  return data.elements;
}

export async function exportPNG(elements: CanvasElement[]) {
  const { save } = await import('@tauri-apps/plugin-dialog');
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

  const rough = await import('roughjs');
  const rc = rough.default.canvas(canvas);

  for (const el of elements) {
    const { renderElement } = await import('./renderer');
    renderElement(ctx, el, rc);
  }

  const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
  const path = await save({ filters: [{ name: 'Imagen PNG', extensions: ['png'] }] });
  if (path) {
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    const arrayBuffer = await blob.arrayBuffer();
    await writeFile(path as string, new Uint8Array(arrayBuffer));
  }
}
