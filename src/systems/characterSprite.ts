// Isometric 2D Character & Status Bubble Renderer

import type { IsoConfig } from './isoRenderer';

export interface EmployeeRenderState {
  id: string;
  name: string;
  role: string;
  gender: 'male' | 'female';
  happiness: number;
  currentTask: string | null;
  gridX: number;
  gridY: number;
  roleColor: string;
}

/**
 * Render Employee Character Sprite sitting or standing at Isometric Grid Tile
 */
export function drawEmployeeCharacter(
  ctx: CanvasRenderingContext2D,
  employee: EmployeeRenderState,
  isoX: number,
  isoY: number,
  config: IsoConfig,
  animTick: number,
  isSelected: boolean = false
) {
  ctx.save();

  const cx = isoX;
  const cy = isoY + config.tileHeight / 2 - 12;

  // 1. Selection Highlight Ring
  if (isSelected) {
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 18, 9, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fill();
  }

  // 2. Character Shadow
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 10, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  // 3. Body (Torso / Shirt)
  const isWorking = employee.currentTask !== null;
  const isLowHappiness = employee.happiness < 30;

  // Typing arm animation bobbing offset
  const armOffset = isWorking ? Math.sin(animTick * 0.2) * 2 : 0;

  // Torso / Shirt Color based on role
  ctx.fillStyle = employee.roleColor;
  ctx.fillRect(cx - 7, cy - 14, 14, 14);

  // Arms / Hands
  ctx.fillStyle = '#fbcfe8'; // Skin tone
  ctx.fillRect(cx - 10, cy - 10 + armOffset, 4, 8);
  ctx.fillRect(cx + 6, cy - 10 - armOffset, 4, 8);

  // 4. Head & Face
  const headY = cy - 24;
  ctx.fillStyle = '#fde047'; // Skin tone
  ctx.beginPath();
  ctx.arc(cx, headY, 7, 0, Math.PI * 2);
  ctx.fill();

  // Hair Style
  ctx.fillStyle = employee.gender === 'male' ? '#451a03' : '#854d0e';
  ctx.beginPath();
  ctx.arc(cx, headY - 2, 7.5, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eyes (Surprised/tired if low happiness, normal if working)
  ctx.fillStyle = '#0f172a';
  if (isLowHappiness) {
    // Sad X_X eyes
    ctx.fillText('x', cx - 4, headY + 2);
    ctx.fillText('x', cx + 1, headY + 2);
  } else {
    ctx.fillRect(cx - 3, headY - 1, 2, 2);
    ctx.fillRect(cx + 1, headY - 1, 2, 2);
  }

  // 5. Floating Status Bubble Above Head
  const bubbleY = headY - 16 + Math.sin(animTick * 0.1) * 3;

  if (isLowHappiness) {
    drawStatusBubble(ctx, cx, bubbleY, '💔', '#ef4444');
  } else if (!isWorking) {
    drawStatusBubble(ctx, cx, bubbleY, '☕', '#f59e0b');
  } else {
    drawStatusBubble(ctx, cx, bubbleY, '💻', '#3b82f6');
  }

  ctx.restore();
}

/**
 * Draws a floating emoji status bubble above character head
 */
function drawStatusBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  emoji: string,
  borderColor: string
) {
  ctx.save();

  const bw = 22;
  const bh = 18;

  // Bubble background
  ctx.beginPath();
  ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bubble pointer tip
  ctx.beginPath();
  ctx.moveTo(x - 3, y + bh / 2);
  ctx.lineTo(x, y + bh / 2 + 4);
  ctx.lineTo(x + 3, y + bh / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Emoji icon
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y + 1);

  ctx.restore();
}
