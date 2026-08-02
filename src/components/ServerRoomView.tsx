import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ServerNode } from '../types';
import { Minus, Maximize2, X, GripVertical, ArrowUp, ArrowDown, Lock, Eye } from 'lucide-react';
import { getUpgradeCost } from '../systems/server';
import { gridToIso, type IsoConfig } from '../systems/isoRenderer';
import { assetLoader } from '../systems/assetLoader';
import { soundManager } from '../systems/soundManager';

const CELL_SIZE = 72;
const CATEGORY_COLORS: Record<string, string> = {
  web_server: '#4F5EFF',
  database: '#B7791F',
  caching: '#17A366',
  cooling: '#4F5EFF',
  storage: '#EC4899',
  security: '#D1453B',
};

let zCounter = 100;

function NodeUpgradeControls({ node }: { node: ServerNode }) {
  const upgradeNode = useGameStore((s) => s.upgradeNode);
  const cash = useGameStore((s) => s.cash);
  const overclockUnlocked = useGameStore((s) => s.unlockedPerks.includes('hardware_overclock'));

  if (!overclockUnlocked) {
    return (
      <span className="flex items-center gap-0.5 text-[9px] text-ink-soft shrink-0" title="Unlock the Hardware Overclocking perk">
        <Lock className="w-2.5 h-2.5" /> Lv.{node.scaleLevel}
      </span>
    );
  }

  const cost = getUpgradeCost(node);
  const upDisabled = cost === null || cash < cost;
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      <span className="text-[9px] text-ink-soft mr-0.5">Lv.{node.scaleLevel}</span>
      <button
        onClick={(e) => { e.stopPropagation(); upgradeNode(node.id, -1); }}
        disabled={node.scaleLevel <= 1}
        title={node.scaleLevel > 1 ? `Downgrade → Lv.${node.scaleLevel - 1} (no refund)` : 'Already at minimum'}
        className="p-0.5 rounded bg-surface border border-border hover:bg-red-soft disabled:opacity-30 cursor-pointer"
      >
        <ArrowDown className="w-2.5 h-2.5 text-red" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); upgradeNode(node.id, 1); }}
        disabled={upDisabled}
        title={cost === null ? 'Max level' : `Upgrade → Lv.${node.scaleLevel + 1} — $${cost}`}
        className="p-0.5 rounded bg-surface border border-border hover:bg-green-soft disabled:opacity-30 cursor-pointer"
      >
        <ArrowUp className="w-2.5 h-2.5 text-green" />
      </button>
    </span>
  );
}

function InventoryPanel({ onClose, rackId }: { onClose: () => void; rackId?: string | null }) {
  const racks = useGameStore((s) => s.racks);
  const inventoryNodes = useGameStore((s) => s.inventoryNodes);
  const activeView = useGameStore((s) => s.activeView);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [pos, setPos] = useState({ x: Math.max(0, window.innerWidth - 380), y: 80 });
  const [z, setZ] = useState(zCounter++);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const unplacedRacks = racks.filter(r => r.plotId === null);
  const bringToFront = () => setZ(zCounter++);

  const onPointerDownHeader = (e: React.PointerEvent) => {
    if (window.matchMedia('(max-width: 767px)').matches) return;
    bringToFront();
    const startX = e.clientX, startY = e.clientY;
    drag.current = { dx: startX - pos.x, dy: startY - pos.y };
    const onMove = (ev: PointerEvent) => {
      if (!drag.current) return;
      setPos({ x: Math.max(0, Math.min(window.innerWidth - 320, ev.clientX - drag.current.dx)), y: Math.max(0, Math.min(window.innerHeight - 200, ev.clientY - drag.current.dy)) });
    };
    const onUp = () => { drag.current = null; window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleRackDragStart = (e: React.DragEvent, rackId: string) => {
    e.dataTransfer.setData('application/rack-id', rackId);
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget.closest('.drag-item') as HTMLElement;
    if (el) setTimeout(() => el.style.opacity = '0.3', 0);
  };
  const handleRackDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget.closest('.drag-item') as HTMLElement;
    if (el) el.style.opacity = '';
  };
  const handleNodeDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('application/node-id', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleNodeDragEnd = () => { };

  if (minimized) return null;

  return (
    <div onPointerDown={bringToFront}
      className={`flex flex-col overflow-hidden rounded-xl border shadow-[0_12px_32px_-8px_rgba(20,30,60,0.15)] pointer-events-auto z-50 bg-surface
        max-md:!left-0 max-md:!right-0 max-md:!bottom-0 max-md:!top-auto max-md:max-h-[85vh] max-md:rounded-b-none
        ${maximized
          ? 'fixed right-0 top-[52px] bottom-10 w-[420px] z-50 rounded-none rounded-l-xl max-md:!inset-0 max-md:!w-auto max-md:rounded-none'
          : 'fixed w-[280px]'}`}
      style={{ left: maximized ? undefined : pos.x, top: maximized ? undefined : pos.y, zIndex: z, borderColor: 'var(--color-border)' }}>
      <div onPointerDown={maximized ? undefined : onPointerDownHeader}
        className={`flex items-center justify-between px-3 py-2 border-b select-none ${maximized ? '' : 'cursor-grab active:cursor-grabbing'}`}
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
        <span className="text-xs font-bold text-ink">INVENTORY</span>
        <div className="flex items-center gap-1 text-ink-soft">
          <button onClick={() => setMinimized(true)} className="p-1 rounded hover:bg-ink/5 cursor-pointer"><Minus className="w-3 h-3" /></button>
          <button onClick={() => setMaximized(m => !m)} className="p-1 rounded hover:bg-ink/5 cursor-pointer"><Maximize2 className="w-3 h-3" /></button>
          <button onClick={onClose} className="p-1 rounded hover:bg-red-soft hover:text-red cursor-pointer"><X className="w-3 h-3" /></button>
        </div>
      </div>

      <div className="p-3 overflow-y-auto text-xs space-y-3 flex-1" style={{ maxHeight: maximized ? 'calc(100% - 44px)' : 'clamp(300px, 55vh, 70vh)' }}>
        {unplacedRacks.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-indigo mb-1">RACKS ({unplacedRacks.length})</div>
            <div className="space-y-1">
              {unplacedRacks.map(rack => (
                <div key={rack.id} draggable
                  onDragStart={(e) => handleRackDragStart(e, rack.id)}
                  onDragEnd={handleRackDragEnd}
                  onClick={() => { if (activeView.type === 'server') useGameStore.getState().autoPlaceRack(rack.id, activeView.plotId); }}
                  className="drag-item flex items-center gap-2 px-2 py-1.5 bg-surface-2 border border-border rounded-lg cursor-pointer hover:border-indigo transition-colors active:bg-indigo-soft"
                  title="Click to auto-place on grid">
                  <GripVertical className="w-3 h-3 text-ink-soft shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-ink">{rack.label}</div>
                    <div className="text-[9px] text-ink-soft">{rack.gridW}x{rack.gridH} · {rack.maxSlots} slots</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); useGameStore.getState().sellRack(rack.id); }}
                    className="text-[9px] px-1.5 py-0.5 bg-red-soft text-red rounded transition-colors cursor-pointer shrink-0">Sell</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {unplacedRacks.length === 0 && (
          <div className="text-[10px] text-ink-soft text-center border border-dashed border-border rounded-lg py-2">No racks in inventory.</div>
        )}

        <div className="text-[10px] text-center text-ink-soft border border-indigo/20 bg-indigo-soft rounded-lg py-2">
          Buy racks & nodes from <span className="text-indigo font-semibold">Server Shop</span>
        </div>

        {inventoryNodes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-indigo">NODES ({inventoryNodes.length})</span>
              <button
                onClick={() => useGameStore.getState().clearAllNodes()}
                className="text-[9px] font-semibold px-1.5 py-0.5 bg-amber-soft text-amber border border-amber/30 rounded hover:bg-amber hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {inventoryNodes.map(node => (
                <div key={node.id} draggable
                  onDragStart={(e) => handleNodeDragStart(e, node.id)}
                  onDragEnd={handleNodeDragEnd}
                  onClick={() => {
                    if (rackId) {
                      const rack = useGameStore.getState().racks.find(r => r.id === rackId);
                      if (rack) {
                        const emptySlot = rack.slots.find(s => !s.node);
                        if (emptySlot) {
                          useGameStore.getState().placeNode(node.id, rackId, emptySlot.index);
                          return;
                        }
                      }
                    }
                    useGameStore.getState().autoPlaceNode(node.id);
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 bg-surface-2 border border-border rounded-lg cursor-pointer hover:border-indigo transition-colors active:bg-indigo-soft"
                  title="Click to auto-place in first empty slot">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[node.category] || '#666' }} />
                  <span className="font-semibold text-ink flex-1">{node.label}</span>
                  <NodeUpgradeControls node={node} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RackSlotView({ rackId, onClose }: { rackId: string; onClose: () => void }) {
  const racks = useGameStore((s) => s.racks);
  const sellNode = useGameStore((s) => s.sellNode);
  const placeNode = useGameStore((s) => s.placeNode);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  const rack = racks.find(r => r.id === rackId);
  if (!rack) return null;

  const handleSlotDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setDragOverSlotIndex(null);
    const nodeId = e.dataTransfer.getData('application/node-id');
    if (nodeId) placeNode(nodeId, rackId, slotIndex);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="card p-5 max-w-md w-full border border-border shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-ink">{rack.label} Slots</h3>
            <p className="text-xs text-ink-soft">Slots: {rack.slots.filter(s => s.node).length}/{rack.slots.length}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-2 cursor-pointer">
            <X className="w-4 h-4 text-ink-soft" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
          {rack.slots.map((slot) => {
            const isDragOver = dragOverSlotIndex === slot.index;
            return (
              <div
                key={slot.index}
                onDragOver={(e) => { e.preventDefault(); setDragOverSlotIndex(slot.index); }}
                onDragLeave={() => setDragOverSlotIndex(null)}
                onDrop={(e) => handleSlotDrop(e, slot.index)}
                className={`p-2.5 rounded-lg border text-xs transition-colors flex flex-col justify-between ${isDragOver ? 'border-indigo bg-indigo-soft' : slot.node ? 'border-border bg-surface-2' : 'border-dashed border-border'}`}
              >
                {slot.node ? (
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-ink truncate">{slot.node.label}</span>
                      <button
                        onClick={() => sellNode(rack.id, slot.index)}
                        className="text-[9px] text-red hover:underline cursor-pointer"
                      >
                        Sell
                      </button>
                    </div>
                    <div className="text-[10px] text-ink-soft flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[slot.node.category] }} />
                      {slot.node.category}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-3 text-[10px] text-ink-soft">
                    <span>Slot {slot.index + 1}</span>
                    <span className="text-[9px] mt-0.5">Drop node here</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlotGrid() {
  const activeView = useGameStore((s) => s.activeView);
  const plots = useGameStore((s) => s.plots);
  const racks = useGameStore((s) => s.racks);

  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [isIsoView, setIsIsoView] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (activeView.type !== 'server') return null;
  const plot = plots.find(p => p.id === activeView.plotId);
  if (!plot) return null;
  const plotRacks = racks.filter(r => r.plotId === plot.id);

  // Isometric 2D Server Room Canvas Renderer
  useEffect(() => {
    if (!isIsoView || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const config: IsoConfig = {
      tileWidth: 80,
      tileHeight: 40,
      originX: canvas.width / 2,
      originY: 40,
    };

    // Draw Isometric Server Room Floor Tiles
    for (let r = 0; r < plot.gridRows; r++) {
      for (let c = 0; c < plot.gridCols; c++) {
        const tileSprite = assetLoader.getFloorTileSprite(config, true, false);
        const isoPt = gridToIso(c, r, config);
        ctx.drawImage(tileSprite, isoPt.x - tileSprite.width / 2, isoPt.y);
      }
    }

    // Draw Server Racks
    plotRacks.forEach((rack) => {
      const isoPt = gridToIso(rack.gridX, rack.gridY, config);
      const heatRatio = rack.coolingCapacity > 0 ? rack.coolingUsed / rack.coolingCapacity : 0;
      const isCritical = heatRatio > 1.3 || rack.isOverheating;

      const sprite = assetLoader.getServerRackSprite(config, heatRatio, isCritical);
      ctx.drawImage(sprite, isoPt.x - sprite.width / 2, isoPt.y + config.tileHeight / 2 - sprite.height + 8);

      if (isCritical) {
        soundManager.playWarning();
      }
    });
  }, [isIsoView, plot.gridCols, plot.gridRows, plotRacks]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-[480px] max-w-full">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-ink">Server Room — <span className="text-indigo">{activeView.plotId.toUpperCase()}</span></h2>
          <span className="text-[10px] text-ink-soft bg-surface-2 border border-border px-1.5 py-0.5 rounded">{plot.gridCols}x{plot.gridRows}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsIsoView(v => !v)}
            className="text-[11px] font-semibold px-2.5 py-1.5 bg-surface-2 border border-border text-ink hover:text-indigo rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            {isIsoView ? 'View 2D' : 'View Iso 3D'}
          </button>
          <button onClick={() => setShowInventory(o => !o)}
            className="text-[11px] font-semibold px-3 py-1.5 bg-indigo hover:bg-indigo/90 text-white rounded-lg transition-colors cursor-pointer">
            {showInventory ? 'Close' : 'Inventory'}
          </button>
          <button onClick={() => useGameStore.getState().togglePanel('server')}
            className="text-[11px] font-semibold px-3 py-1.5 bg-green-soft text-green border border-green/30 rounded-lg hover:bg-green hover:text-white transition-colors cursor-pointer">
            Shop
          </button>
        </div>
      </div>

      {isIsoView ? (
        <div className="w-[480px] h-[340px] bg-slate-950 rounded-xl border border-border overflow-hidden relative shadow-inner">
          <canvas ref={canvasRef} width={480} height={340} className="w-full h-full block" />
        </div>
      ) : (
        <div className="relative border-2 border-border bg-surface rounded-lg p-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${plot.gridCols}, ${CELL_SIZE}px)` }}>
          {plotRacks.map((rack) => (
            <div
              key={rack.id}
              onClick={() => { setSelectedRackId(rack.id); setShowInventory(true); }}
              className="p-2 border border-indigo/40 bg-indigo-soft/20 rounded cursor-pointer text-xs"
            >
              <div className="font-bold text-ink truncate">{rack.label}</div>
              <div className="text-[10px] text-ink-soft">{rack.slots.filter(s => s.node).length}/{rack.slots.length} Slots</div>
            </div>
          ))}
        </div>
      )}

      {selectedRackId && <RackSlotView rackId={selectedRackId} onClose={() => setSelectedRackId(null)} />}
      {showInventory && <InventoryPanel onClose={() => setShowInventory(false)} rackId={selectedRackId} />}
    </div>
  );
}

export function ServerRoomView() {
  const activeView = useGameStore((s) => s.activeView);
  if (activeView.type !== 'server') return null;
  return (
    <div className="flex items-start justify-center p-4 h-full min-h-0 overflow-auto">
      <PlotGrid />
    </div>
  );
}