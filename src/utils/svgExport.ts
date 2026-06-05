import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import type { CanvasElement } from '../types/canvas';
import { getElementBounds } from './hitTest';

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function svgRect(el: CanvasElement & { type: 'rect' }): string {
  const fill = el.fillColor !== 'transparent' ? ` fill="${escapeXml(el.fillColor)}"` : ' fill="none"';
  return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" stroke="${escapeXml(el.strokeColor)}" stroke-width="${el.strokeWidth}"${fill}/>`;
}

function svgEllipse(el: CanvasElement & { type: 'ellipse' }): string {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rx = el.width / 2;
  const ry = el.height / 2;
  const fill = el.fillColor !== 'transparent' ? ` fill="${escapeXml(el.fillColor)}"` : ' fill="none"';
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke="${escapeXml(el.strokeColor)}" stroke-width="${el.strokeWidth}"${fill}/>`;
}

function svgLine(el: CanvasElement & { type: 'line' }): string {
  if (el.points.length < 2) return '';
  const [p1, p2] = el.points;
  return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${escapeXml(el.strokeColor)}" stroke-width="${el.strokeWidth}" stroke-linecap="round"/>`;
}

function svgArrow(el: CanvasElement & { type: 'arrow' }): string {
  if (el.points.length < 2) return '';
  const [p1, p2] = el.points;
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const headLen = 12;
  const headAngle = Math.PI / 6;
  const hx1 = p2.x - headLen * Math.cos(angle - headAngle);
  const hy1 = p2.y - headLen * Math.sin(angle - headAngle);
  const hx2 = p2.x - headLen * Math.cos(angle + headAngle);
  const hy2 = p2.y - headLen * Math.sin(angle + headAngle);
  const line = `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${escapeXml(el.strokeColor)}" stroke-width="${el.strokeWidth}" stroke-linecap="round"/>`;
  const head = `<polygon points="${p2.x},${p2.y} ${hx1},${hy1} ${hx2},${hy2}" fill="${escapeXml(el.strokeColor)}"/>`;
  return line + '\n    ' + head;
}

function svgFreedraw(el: CanvasElement & { type: 'freedraw' }): string {
  if (el.points.length < 2) return '';
  const pointsAttr = el.points.map(p => `${p.x},${p.y}`).join(' ');
  return `<polyline points="${pointsAttr}" fill="none" stroke="${escapeXml(el.strokeColor)}" stroke-width="${el.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function svgText(el: CanvasElement & { type: 'text' }): string {
  const fontWeight = el.fontWeight || '400';
  const fontSize = el.fontSize;
  const lineHeight = fontSize * 1.2;
  const words = el.text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = `${fontWeight} ${fontSize}px ${el.fontFamily}`;
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const m = ctx.measureText(testLine);
    if (m.width > el.width && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const tspans = lines.map((line, i) =>
    `      <tspan x="${el.x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join('\n');

  return `<text x="${el.x}" y="${el.y}" font-family="${escapeXml(el.fontFamily)}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${escapeXml(el.strokeColor)}">\n${tspans}\n    </text>`;
}

function transformElement(el: CanvasElement): string {
  switch (el.type) {
    case 'rect':     return svgRect(el);
    case 'ellipse':  return svgEllipse(el);
    case 'line':     return svgLine(el);
    case 'arrow':    return svgArrow(el);
    case 'freedraw': return svgFreedraw(el);
    case 'text':     return svgText(el);
  }
}

export async function exportSVG(elements: CanvasElement[]) {
  if (elements.length === 0) return;

  const allBounds = elements.map(getElementBounds);
  const minX = Math.min(...allBounds.map(b => b.x));
  const minY = Math.min(...allBounds.map(b => b.y));
  const maxX = Math.max(...allBounds.map(b => b.x + b.width));
  const maxY = Math.max(...allBounds.map(b => b.y + b.height));

  const padding = 40;
  const vw = Math.ceil(maxX - minX + padding * 2);
  const vh = Math.ceil(maxY - minY + padding * 2);

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const content = sorted.map(el => '    ' + transformElement(el)).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-padding + minX} ${-padding + minY} ${vw} ${vh}" width="${vw}" height="${vh}">
  <rect x="${-padding + minX}" y="${-padding + minY}" width="${vw}" height="${vh}" fill="#ffffff"/>
${content}
</svg>`;

  try {
    const path = await save({ filters: [{ name: 'SVG', extensions: ['svg'] }] });
    if (path) {
      await writeTextFile(path as string, svg);
    }
  } catch (err) {
    console.error('Error al exportar SVG:', err);
  }
}
