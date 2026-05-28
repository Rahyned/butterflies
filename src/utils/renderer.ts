import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { CanvasElement, Point } from '../types/canvas';

export function renderElement(ctx: CanvasRenderingContext2D, el: CanvasElement, rc: RoughCanvas, isDrawing = false) {
  const opts: Record<string, unknown> = {
    seed: el.seed,
    roughness: el.roughness,
    stroke: el.strokeColor,
    fill: el.fillColor === 'transparent' ? undefined : el.fillColor,
    strokeWidth: el.strokeWidth,
    fillStyle: 'solid',
  };

  switch (el.type) {
    case 'rect':
      rc.rectangle(el.x, el.y, el.width, el.height, opts);
      break;
    case 'ellipse':
      rc.ellipse(el.x + el.width / 2, el.y + el.height / 2, el.width, el.height, opts);
      break;
    case 'line':
      if (el.points.length >= 2) {
        rc.line(el.points[0].x, el.points[0].y, el.points[1].x, el.points[1].y, opts);
      }
      break;
    case 'arrow': {
      if (el.points.length < 2) break;
      const [p1, p2] = el.points;
      rc.line(p1.x, p1.y, p2.x, p2.y, opts);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const headLen = 12;
      const headAngle = Math.PI / 6;
      rc.polygon([
        [p2.x, p2.y] as const,
        [p2.x - headLen * Math.cos(angle - headAngle), p2.y - headLen * Math.sin(angle - headAngle)] as const,
        [p2.x - headLen * Math.cos(angle + headAngle), p2.y - headLen * Math.sin(angle + headAngle)] as const,
      ] as [number, number][], {
        ...opts,
        fill: el.strokeColor,
        fillStyle: 'solid',
        stroke: el.strokeColor,
      });
      break;
    }
    case 'freedraw':
      if (el.points.length < 2) break;
      if (isDrawing) {
        ctx.save();
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = el.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = el.opacity;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        for (let i = 1; i < el.points.length; i++) {
          rc.line(el.points[i - 1].x, el.points[i - 1].y, el.points[i].x, el.points[i].y, opts);
        }
      }
      break;
    case 'text':
      ctx.save();
      ctx.font = `${el.fontSize}px ${el.fontFamily}`;
      ctx.fillStyle = el.strokeColor;
      ctx.globalAlpha = el.opacity;
      ctx.textBaseline = 'top';
      {
        const words = el.text.split(' ');
        let line = '';
        let lineY = 0;
        const lineHeight = el.fontSize * 1.2;
        for (const word of words) {
          const testLine = line ? line + ' ' + word : word;
          const m = ctx.measureText(testLine);
          if (m.width > el.width && line) {
            ctx.fillText(line, el.x, el.y + lineY);
            line = word;
            lineY += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (line) {
          ctx.fillText(line, el.x, el.y + lineY);
        }
      }
      ctx.restore();
      break;
  }
}

export function renderSelectionBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.restore();
}

export function renderSelectionHandles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#000000';
  const size = 8;
  const handles: Point[] = [
    { x, y },
    { x: x + w / 2, y },
    { x: x + w, y },
    { x, y: y + h / 2 },
    { x: x + w, y: y + h / 2 },
    { x, y: y + h },
    { x: x + w / 2, y: y + h },
    { x: x + w, y: y + h },
  ];
  for (const p of handles) {
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
  }
  ctx.restore();
}
