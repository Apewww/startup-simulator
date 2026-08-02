import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Volume2, VolumeX, Move, PackageMinus } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getFurnitureDef } from '../data/furniture';
import { roleColor } from './CharacterAvatar';
import { gridToIso, isoToGrid, type IsoConfig, sortIsometricEntities } from '../systems/isoRenderer';
import { assetLoader } from '../systems/assetLoader';
import { drawEmployeeCharacter } from '../systems/characterSprite';
import { soundManager } from '../systems/soundManager';

const ISO_CONFIG: IsoConfig = {
  tileWidth: 96,
  tileHeight: 48,
  originX: 0,
  originY: 40,
};

export function OfficeGrid() {
  const employees = useGameStore((s) => s.employees);
  const furniture = useGameStore((s) => s.furniture);
  const moveEmployee = useGameStore((s) => s.moveEmployee);
  const moveFurniture = useGameStore((s) => s.moveFurniture);
  const unplaceFurniture = useGameStore((s) => s.unplaceFurniture);

  const focusEmployee = useGameStore((s) => s.focusEmployee);
  const darkMode = useGameStore((s) => s.darkMode);
  const officeGridCols = useGameStore((s) => s.officeGridCols);
  const officeGridRows = useGameStore((s) => s.officeGridRows);
  const placementFurnitureId = useGameStore((s) => s.placementFurnitureId);
  const placeFurniture = useGameStore((s) => s.placeFurniture);
  const cancelFurniturePlacement = useGameStore((s) => s.cancelFurniturePlacement);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Camera & Animation state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const [hoverTile, setHoverTile] = useState<{ gridX: number; gridY: number } | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'employee' | 'furniture'; id: string } | null>(null);
  const [relocateEntity, setRelocateEntity] = useState<{ type: 'employee' | 'furniture'; id: string; name: string } | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const animTickRef = useRef(0);

  // Calculate mouse screen position to isometric grid tile
  const getGridFromMouse = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (clientX - rect.left - pan.x - canvasRef.current.width / 2) / zoom;
    const mouseY = (clientY - rect.top - pan.y - ISO_CONFIG.originY) / zoom;

    const config: IsoConfig = {
      tileWidth: ISO_CONFIG.tileWidth,
      tileHeight: ISO_CONFIG.tileHeight,
      originX: 0,
      originY: 0,
    };

    const pt = isoToGrid(mouseX, mouseY, config);
    if (pt.gridX >= 0 && pt.gridX < officeGridCols && pt.gridY >= 0 && pt.gridY < officeGridRows) {
      return pt;
    }
    return null;
  }, [pan, zoom, officeGridCols, officeGridRows]);

  // Main Isometric Rendering Loop
  const renderIsometricScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    animTickRef.current += 1;
    const animTick = animTickRef.current;

    // Reset Canvas viewport
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center camera origin
    const centerX = canvas.width / 2 + pan.x;
    const centerY = pan.y;

    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);

    const config: IsoConfig = {
      ...ISO_CONFIG,
      originX: 0,
      originY: ISO_CONFIG.originY,
    };

    // Check tile occupancy
    const isTileOccupied = (gx: number, gy: number) => {
      const empHere = employees.some(e => e.gridX === gx && e.gridY === gy && (relocateEntity?.id !== e.id));
      const furnHere = furniture.some(f => f.gridX === gx && f.gridY === gy && (relocateEntity?.id !== f.id));
      return empHere || furnHere;
    };

    // 1. Render Isometric Floor Grid
    for (let r = 0; r < officeGridRows; r++) {
      for (let c = 0; c < officeGridCols; c++) {
        const isHover = hoverTile?.gridX === c && hoverTile?.gridY === r;
        const isOccupied = isTileOccupied(c, r);

        let strokeColor = isHover ? '#6366f1' : undefined;
        if (isHover && relocateEntity) {
          strokeColor = isOccupied ? '#ef4444' : '#22c55e';
        }

        const tileSprite = assetLoader.getFloorTileSprite(config, darkMode, isHover);
        const isoPt = gridToIso(c, r, config);

        ctx.drawImage(
          tileSprite,
          isoPt.x - tileSprite.width / 2,
          isoPt.y
        );

        if (strokeColor && isHover) {
          ctx.beginPath();
          const hw = config.tileWidth / 2;
          const hh = config.tileHeight / 2;
          const topY = isoPt.y + config.originY - 8;
          ctx.moveTo(isoPt.x, topY);
          ctx.lineTo(isoPt.x + hw, topY + hh);
          ctx.lineTo(isoPt.x, topY + config.tileHeight);
          ctx.lineTo(isoPt.x - hw, topY + hh);
          ctx.closePath();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }
    }

    // 2. Prepare & Depth-Sort Entities (Furniture + Desks + Employees)
    const entities: Array<{
      type: 'furniture' | 'employee';
      gridX: number;
      gridY: number;
      data: any;
    }> = [];

    furniture.forEach((f) => {
      entities.push({ type: 'furniture', gridX: f.gridX, gridY: f.gridY, data: f });
    });

    employees.forEach((e) => {
      entities.push({ type: 'employee', gridX: e.gridX, gridY: e.gridY, data: e });
    });

    const sortedEntities = sortIsometricEntities(entities);

    // 3. Render Entities in Isometric Z-Index order
    sortedEntities.forEach((ent) => {
      const isoPt = gridToIso(ent.gridX, ent.gridY, config);
      const isSelected = selectedEntity?.type === ent.type && selectedEntity?.id === ent.data.id;

      if (ent.type === 'furniture') {
        const furn = ent.data;
        const sprite = assetLoader.getFurnitureSprite(furn.defId, config);

        if (isSelected) {
          ctx.save();
          ctx.shadowColor = '#6366f1';
          ctx.shadowBlur = 10;
        }

        ctx.drawImage(sprite, isoPt.x - sprite.width / 2, isoPt.y + config.tileHeight / 2 - sprite.height + 6);

        if (isSelected) {
          ctx.restore();
        }
      } else if (ent.type === 'employee') {
        const emp = ent.data;
        const color = roleColor(emp.role);

        // Render Desk first
        const deskSprite = assetLoader.getDeskSprite(color, emp.currentTask !== null, config);
        ctx.drawImage(deskSprite, isoPt.x - deskSprite.width / 2, isoPt.y + config.tileHeight / 2 - deskSprite.height + 10);

        // Render Employee Character on top of desk
        drawEmployeeCharacter(
          ctx,
          {
            id: emp.id,
            name: emp.name,
            role: emp.role,
            gender: emp.gender || 'male',
            happiness: emp.happiness,
            currentTask: emp.currentTask,
            gridX: emp.gridX,
            gridY: emp.gridY,
            roleColor: color,
          },
          isoPt.x,
          isoPt.y,
          config,
          animTick,
          isSelected
        );
      }
    });

    // 4. Render Active Placement / Relocation Preview Highlight
    if ((placementFurnitureId || relocateEntity) && hoverTile) {
      const isoPt = gridToIso(hoverTile.gridX, hoverTile.gridY, config);
      let sprite: HTMLCanvasElement | null = null;

      if (placementFurnitureId) {
        sprite = assetLoader.getFurnitureSprite(placementFurnitureId, config);
      } else if (relocateEntity?.type === 'furniture') {
        const furn = furniture.find(f => f.id === relocateEntity.id);
        if (furn) sprite = assetLoader.getFurnitureSprite(furn.defId, config);
      } else if (relocateEntity?.type === 'employee') {
        const emp = employees.find(e => e.id === relocateEntity.id);
        if (emp) sprite = assetLoader.getDeskSprite(roleColor(emp.role), false, config);
      }

      if (sprite) {
        ctx.globalAlpha = 0.65;
        ctx.drawImage(sprite, isoPt.x - sprite.width / 2, isoPt.y + config.tileHeight / 2 - sprite.height + 6);
        ctx.globalAlpha = 1.0;
      }
    }

    ctx.restore();
  }, [
    darkMode,
    employees,
    furniture,
    hoverTile,
    officeGridCols,
    officeGridRows,
    pan,
    placementFurnitureId,
    relocateEntity,
    selectedEntity,
    zoom,
  ]);

  // RequestAnimationFrame animation loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderIsometricScene();
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [renderIsometricScene]);

  // Resize canvas according to container dimensions
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = Math.max(500, containerRef.current.clientHeight);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2) {
      // Middle or Right Click for Panning
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }

    const tile = getGridFromMouse(e.clientX, e.clientY);
    setHoverTile(tile);
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    soundManager.playClick();
    const tile = getGridFromMouse(e.clientX, e.clientY);
    if (!tile) return;

    // Handle Active Relocation Mode
    if (relocateEntity) {
      const occupied = employees.some(emp => emp.gridX === tile.gridX && emp.gridY === tile.gridY && emp.id !== relocateEntity.id)
        || furniture.some(f => f.gridX === tile.gridX && f.gridY === tile.gridY && f.id !== relocateEntity.id);

      if (occupied) return;

      if (relocateEntity.type === 'employee') {
        moveEmployee(relocateEntity.id, tile.gridX, tile.gridY);
      } else {
        moveFurniture(relocateEntity.id, tile.gridX, tile.gridY);
      }

      soundManager.playSuccess();
      setRelocateEntity(null);
      setSelectedEntity(null);
      return;
    }

    // Handle Furniture Shop Placement Mode
    if (placementFurnitureId) {
      placeFurniture(tile.gridX, tile.gridY);
      soundManager.playSuccess();
      return;
    }

    // Check Employee click
    const clickedEmp = employees.find((emp) => emp.gridX === tile.gridX && emp.gridY === tile.gridY);
    if (clickedEmp) {
      setSelectedEntity({ type: 'employee', id: clickedEmp.id });
      focusEmployee(clickedEmp.id);
      soundManager.playTyping();
      return;
    }

    // Check Furniture click
    const clickedFurn = furniture.find((f) => f.gridX === tile.gridX && f.gridY === tile.gridY);
    if (clickedFurn) {
      setSelectedEntity({ type: 'furniture', id: clickedFurn.id });
      return;
    }

    setSelectedEntity(null);
  };

  const startRelocate = (type: 'employee' | 'furniture', id: string, name: string) => {
    soundManager.playClick();
    setRelocateEntity({ type, id, name });
  };

  const handleUnplace = (furnId: string) => {
    soundManager.playClick();
    unplaceFurniture(furnId);
    setSelectedEntity(null);
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const selectedEmp = selectedEntity?.type === 'employee' ? employees.find((e) => e.id === selectedEntity.id) : null;
  const selectedFurn = selectedEntity?.type === 'furniture' ? furniture.find((f) => f.id === selectedEntity.id) : null;
  const selectedFurnDef = selectedFurn ? getFurnitureDef(selectedFurn.defId) : null;
  const activePlacementDef = placementFurnitureId ? getFurnitureDef(placementFurnitureId) : null;

  return (
    <div className="card p-4 flex flex-col gap-4 flex-1 min-h-0 relative select-none" ref={containerRef}>
      {/* Top Action & Camera Control Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink uppercase tracking-wider">Visual Kantor Isometric 2D</span>
          <span className="text-[10px] bg-indigo/10 text-indigo font-semibold px-2 py-0.5 rounded-full">
            {employees.length} Karyawan
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-lg border border-border">
          <button
            onClick={toggleSound}
            className="p-1.5 rounded hover:bg-surface text-ink-soft hover:text-ink cursor-pointer"
            title={isMuted ? 'Unmute Sound SFX' : 'Mute Sound SFX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red" /> : <Volume2 className="w-4 h-4 text-indigo" />}
          </button>
          <div className="w-[1px] h-4 bg-border" />
          <button
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
            className="p-1.5 rounded hover:bg-surface text-ink-soft hover:text-ink cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            className="p-1.5 rounded hover:bg-surface text-ink-soft hover:text-ink cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded hover:bg-surface text-ink-soft hover:text-ink cursor-pointer"
            title="Reset Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Relocation & Furniture Placement Notice Banner */}
      {relocateEntity && (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg text-xs text-emerald-600 font-medium">
          <span>Relokasi <strong>{relocateEntity.name}</strong> — Klik tile isometrik hijau untuk memindahkannya.</span>
          <button
            onClick={() => setRelocateEntity(null)}
            className="p-1 hover:bg-emerald-500/20 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activePlacementDef && (
        <div className="flex items-center justify-between bg-indigo/10 border border-indigo/20 p-2.5 rounded-lg text-xs text-indigo font-medium">
          <span>Memasang <strong>{activePlacementDef.name}</strong> — Klik pada tile isometrik untuk menempatkannya.</span>
          <button
            onClick={cancelFurniturePlacement}
            className="p-1 hover:bg-indigo/20 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Isometric HTML5 2D Canvas Viewport */}
      <div
        className="flex-1 w-full bg-slate-900/10 rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing border border-border"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Controls Overlay for Selected Employee */}
        {selectedEmp && (
          <div className="absolute bottom-4 left-4 card p-3 border border-indigo/30 bg-surface/90 backdrop-blur shadow-lg text-xs max-w-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-ink">
              <span>{selectedEmp.name}</span>
              <button onClick={() => setSelectedEntity(null)} className="text-ink-soft hover:text-red">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-ink-soft text-[11px]">{selectedEmp.role} • Lv.{selectedEmp.level}</div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Happiness:</span>
              <span className="font-semibold text-indigo">{Math.round(selectedEmp.happiness)}%</span>
            </div>
            <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo h-full transition-all"
                style={{ width: `${selectedEmp.happiness}%` }}
              />
            </div>
            <button
              onClick={() => startRelocate('employee', selectedEmp.id, selectedEmp.name)}
              className="w-full mt-2 py-1.5 px-3 bg-indigo hover:bg-indigo/90 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Move className="w-3.5 h-3.5" /> Pindah Posisi Meja
            </button>
          </div>
        )}

        {/* Floating Controls Overlay for Selected Furniture */}
        {selectedFurnDef && selectedFurn && (
          <div className="absolute bottom-4 left-4 card p-3 border border-indigo/30 bg-surface/90 backdrop-blur shadow-lg text-xs max-w-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-ink">
              <span>{selectedFurnDef.name}</span>
              <button onClick={() => setSelectedEntity(null)} className="text-ink-soft hover:text-red">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-ink-soft text-[11px]">Tile Posisi: ({selectedFurn.gridX}, {selectedFurn.gridY})</div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => startRelocate('furniture', selectedFurn.id, selectedFurnDef.name)}
                className="flex-1 py-1.5 px-2 bg-indigo hover:bg-indigo/90 text-white rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Move className="w-3.5 h-3.5" /> Pindah
              </button>
              <button
                onClick={() => handleUnplace(selectedFurn.id)}
                className="py-1.5 px-2 bg-red-soft text-red hover:bg-red hover:text-white rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Simpan ke gudang inventaris"
              >
                <PackageMinus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
