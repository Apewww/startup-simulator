// Asset Loader & Procedural/Image Sprite Generator for Isometric 2D Game Assets

import { drawIsoTile, type IsoConfig } from './isoRenderer';

export class AssetLoader {
  private cache: Map<string, HTMLCanvasElement> = new Map();
  private loadedImages: Map<string, HTMLImageElement> = new Map();

  constructor() {
    this.preloadImageAssets();
  }

  /**
   * Preload external PNG game sprite assets from public/assets/
   */
  private preloadImageAssets() {
    if (typeof window === 'undefined') return;

    const assetsToLoad = [
      { name: 'furniture', src: '/assets/iso_office_furniture_1785636627440.png' },
      { name: 'server_racks', src: '/assets/iso_server_racks_1785636637171.png' },
      { name: 'characters', src: '/assets/iso_character_sprites_1785636647267.png' },
    ];

    assetsToLoad.forEach((asset) => {
      const img = new Image();
      img.src = asset.src;
      img.onload = () => {
        this.loadedImages.set(asset.name, img);
      };
    });
  }

  /**
   * Generates or retrieves cached Isometric Office Floor Tile Sprite
   */
  public getFloorTileSprite(config: IsoConfig, isDarkMode: boolean, isHovered: boolean = false): HTMLCanvasElement {
    const key = `floor_${config.tileWidth}_${config.tileHeight}_${isDarkMode}_${isHovered}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = config.tileWidth + 8;
    canvas.height = config.tileHeight + 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const localConfig: IsoConfig = {
      tileWidth: config.tileWidth,
      tileHeight: config.tileHeight,
      originX: config.tileWidth / 2 + 4,
      originY: 8,
    };

    let baseColor = isDarkMode ? '#242b3d' : '#e2e8f0';
    let strokeColor = isDarkMode ? '#333d54' : '#cbd5e1';

    if (isHovered) {
      baseColor = isDarkMode ? '#3b4261' : '#f1f5f9';
      strokeColor = '#6366f1';
    }

    drawIsoTile(ctx, 0, 0, localConfig, baseColor, strokeColor, 4);

    // Add wooden/carpet subtle grid pattern texture
    ctx.save();
    ctx.strokeStyle = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(localConfig.originX, localConfig.originY + 4);
    ctx.lineTo(localConfig.originX, localConfig.originY + config.tileHeight - 4);
    ctx.stroke();
    ctx.restore();

    this.cache.set(key, canvas);
    return canvas;
  }

  /**
   * Generates Isometric Desk & Computer Workstation Sprite
   */
  public getDeskSprite(roleColor: string, isWorking: boolean, config: IsoConfig): HTMLCanvasElement {
    const key = `desk_${roleColor}_${isWorking}_${config.tileWidth}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = config.tileWidth;
    canvas.height = config.tileHeight * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const cx = canvas.width / 2;
    const cy = canvas.height - config.tileHeight / 2 - 4;
    const hw = config.tileWidth * 0.38;
    const hh = config.tileHeight * 0.38;

    // 1. Desk Legs
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - hw * 0.8, cy - 10, 4, 18);
    ctx.fillRect(cx + hw * 0.8 - 4, cy - 10, 4, 18);
    ctx.fillRect(cx, cy + hh * 0.8 - 6, 4, 14);

    // 2. Desk Wooden Surface Top
    const deskY = cy - 16;
    ctx.beginPath();
    ctx.moveTo(cx, deskY - hh);
    ctx.lineTo(cx + hw, deskY);
    ctx.lineTo(cx, deskY + hh);
    ctx.lineTo(cx - hw, deskY);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Computer Monitor
    const monX = cx;
    const monY = deskY - 6;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(monX - 12, monY - 18, 24, 14);

    // Monitor Stand
    ctx.fillRect(monX - 3, monY - 4, 6, 4);
    ctx.fillRect(monX - 6, monY, 12, 2);

    // Screen Display Glow
    ctx.fillStyle = isWorking ? roleColor : '#334155';
    ctx.fillRect(monX - 10, monY - 16, 20, 10);

    if (isWorking) {
      // Code / UI lines on monitor screen
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(monX - 8, monY - 14, 12, 1.5);
      ctx.fillRect(monX - 8, monY - 11, 16, 1.5);
      ctx.fillRect(monX - 8, monY - 8, 9, 1.5);
    }

    // 4. Keyboard on Desk
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 7, deskY + 2, 14, 5);

    this.cache.set(key, canvas);
    return canvas;
  }

  /**
   * Generates Isometric Server Rack Sprite
   */
  public getServerRackSprite(config: IsoConfig, loadFactor: number = 0.2, isOverloaded: boolean = false): HTMLCanvasElement {
    const key = `server_rack_${config.tileWidth}_${Math.floor(loadFactor * 10)}_${isOverloaded}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = config.tileWidth;
    canvas.height = config.tileHeight * 2.5;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const cx = canvas.width / 2;
    const baseBottomY = canvas.height - 8;

    const rackWidth = config.tileWidth * 0.42;
    const rackHeight = config.tileHeight * 1.6;

    // 1. Rack Base Shadow
    ctx.beginPath();
    ctx.ellipse(cx, baseBottomY, rackWidth, rackWidth * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // 2. Server Main Body Cabinet
    const rectX = cx - rackWidth / 2;
    const rectY = baseBottomY - rackHeight;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rectX, rectY, rackWidth, rackHeight);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(rectX, rectY, rackWidth, rackHeight);

    // 3. Server Blades (Racks)
    const bladeCount = 6;
    const bladeH = (rackHeight - 12) / bladeCount;

    for (let i = 0; i < bladeCount; i++) {
      const bY = rectY + 6 + i * bladeH;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(rectX + 3, bY, rackWidth - 6, bladeH - 2);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(rectX + 3, bY, rackWidth - 6, bladeH - 2);

      // Server Blade LED Status Lights
      let ledColor = '#22c55e'; // Green
      if (isOverloaded) {
        ledColor = '#ef4444'; // Red
      } else if (loadFactor > 0.7) {
        ledColor = '#f59e0b'; // Amber/Yellow
      }

      ctx.fillStyle = ledColor;
      ctx.beginPath();
      ctx.arc(rectX + 8, bY + bladeH / 2 - 1, 2, 0, Math.PI * 2);
      ctx.arc(rectX + 14, bY + bladeH / 2 - 1, 2, 0, Math.PI * 2);
      ctx.fill();

      // HDD Activity Bar
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(rectX + 22, bY + bladeH / 2 - 2, 10, 3);
    }

    this.cache.set(key, canvas);
    return canvas;
  }

  /**
   * Generates Furniture Asset Sprite (Coffee Machine, Ergonomic Chair, Water Dispenser)
   */
  public getFurnitureSprite(defId: string, config: IsoConfig): HTMLCanvasElement {
    const key = `furniture_${defId}_${config.tileWidth}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = config.tileWidth;
    canvas.height = config.tileHeight * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const cx = canvas.width / 2;
    const cy = canvas.height - config.tileHeight / 2;

    if (defId === 'coffee_machine') {
      // Coffee Table + Machine
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 14, cy - 20, 28, 16); // Table
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 8, cy - 36, 16, 16); // Express Machine
      ctx.fillStyle = '#ef4444'; // Red Coffee Pot
      ctx.fillRect(cx + 1, cy - 28, 6, 7);
    } else if (defId === 'water_dispenser') {
      // Water Cooler
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 10, cy - 24, 20, 20); // Stand
      ctx.fillStyle = '#38bdf8'; // Blue Water Jug
      ctx.beginPath();
      ctx.arc(cx, cy - 32, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (defId === 'ergonomic_chair') {
      // Office Chair
      ctx.fillStyle = '#4f5eff'; // Ergonomic Back
      ctx.fillRect(cx - 8, cy - 26, 16, 16);
      ctx.fillStyle = '#1e293b'; // Seat Cushion
      ctx.fillRect(cx - 10, cy - 10, 20, 6);
    }

    this.cache.set(key, canvas);
    return canvas;
  }
}

export const assetLoader = new AssetLoader();
