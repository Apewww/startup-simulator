// Isometric Math & Rendering Utilities for 2D Canvas

export interface IsoPoint {
  x: number;
  y: number;
}

export interface GridPoint {
  gridX: number;
  gridY: number;
}

export interface IsoConfig {
  tileWidth: number;   // e.g. 96
  tileHeight: number;  // e.g. 48 (1:2 isometric ratio)
  originX: number;     // Center offset X
  originY: number;     // Center offset Y
}

/**
 * Converts 2D Grid coordinates (gridX, gridY) to Isometric Screen coordinates (screenX, screenY)
 */
export function gridToIso(gridX: number, gridY: number, config: IsoConfig): IsoPoint {
  const isoX = (gridX - gridY) * (config.tileWidth / 2) + config.originX;
  const isoY = (gridX + gridY) * (config.tileHeight / 2) + config.originY;
  return { x: isoX, y: isoY };
}

/**
 * Converts Isometric Screen coordinates back to 2D Grid coordinates
 */
export function isoToGrid(screenX: number, screenY: number, config: IsoConfig): GridPoint {
  const relX = screenX - config.originX;
  const relY = screenY - config.originY;

  const halfW = config.tileWidth / 2;
  const halfH = config.tileHeight / 2;

  const gridX = Math.floor((relY / halfH + relX / halfW) / 2);
  const gridY = Math.floor((relY / halfH - relX / halfW) / 2);

  return { gridX, gridY };
}

/**
 * Draw an Isometric Diamond Tile polygon on Canvas
 */
export function drawIsoTile(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  config: IsoConfig,
  fillColor: string,
  strokeColor?: string,
  height: number = 0
) {
  const center = gridToIso(gridX, gridY, config);
  const halfW = config.tileWidth / 2;
  const halfH = config.tileHeight / 2;

  const topY = center.y - height;

  ctx.beginPath();
  ctx.moveTo(center.x, topY);                 // Top vertex
  ctx.lineTo(center.x + halfW, topY + halfH); // Right vertex
  ctx.lineTo(center.x, topY + config.tileHeight); // Bottom vertex
  ctx.lineTo(center.x - halfW, topY + halfH); // Left vertex
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw 3D side edge for tile thickness if height > 0
  if (height > 0) {
    // Left thickness face
    ctx.beginPath();
    ctx.moveTo(center.x - halfW, topY + halfH);
    ctx.lineTo(center.x, topY + config.tileHeight);
    ctx.lineTo(center.x, center.y + config.tileHeight);
    ctx.lineTo(center.x - halfW, center.y + halfH);
    ctx.closePath();
    ctx.fillStyle = adjustColorBrightness(fillColor, -20);
    ctx.fill();

    // Right thickness face
    ctx.beginPath();
    ctx.moveTo(center.x, topY + config.tileHeight);
    ctx.lineTo(center.x + halfW, topY + halfH);
    ctx.lineTo(center.x + halfW, center.y + halfH);
    ctx.lineTo(center.x, center.y + config.tileHeight);
    ctx.closePath();
    ctx.fillStyle = adjustColorBrightness(fillColor, -35);
    ctx.fill();
  }
}

/**
 * Helper to adjust HEX color brightness for 3D isometric shading
 */
export function adjustColorBrightness(hexColor: string, percent: number): string {
  let color = hexColor.replace('#', '');
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }

  const num = parseInt(color, 16);
  if (isNaN(num)) return hexColor;

  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00FF) + percent;
  let b = (num & 0x0000FF) + percent;

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Sorts rendered game entities for correct z-index depth rendering in isometric view.
 * Items with lower (gridX + gridY) are rendered first (background), higher rendered front.
 */
export function sortIsometricEntities<T extends { gridX: number; gridY: number; zOffset?: number }>(entities: T[]): T[] {
  return [...entities].sort((a, b) => {
    const depthA = a.gridX + a.gridY + (a.zOffset || 0);
    const depthB = b.gridX + b.gridY + (b.zOffset || 0);
    if (depthA !== depthB) return depthA - depthB;
    return a.gridX - b.gridX;
  });
}
