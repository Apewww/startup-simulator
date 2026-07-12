import { useState, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ServerRack, ServerNode } from '../types';
import { Minus, Maximize2, X, GripVertical, ArrowUp, ArrowDown, Lock } from 'lucide-react';
import { getUpgradeCost } from '../systems/server';

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
  const inventoryNodes = useGameStore((s) => s.inventoryNodes);
  const placeNode = useGameStore((s) => s.placeNode);
  const unequipNode = useGameStore((s) => s.unequipNode);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [placedSlot, setPlacedSlot] = useState<number | null>(null);

  const rack = racks.find(r => r.id === rackId);
  if (!rack) return null;

  const handleSlotDragOver = (e: React.DragEvent, idx: number) => {
    if (e.dataTransfer.types.includes('application/node-id')) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverSlot(idx); }
  };
  const handleSlotDragLeave = () => setDragOverSlot(null);
  const handleSlotDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault(); setDragOverSlot(null);
    const nodeId = e.dataTransfer.getData('application/node-id');
    if (nodeId) { placeNode(nodeId, rackId, idx); setPlacedSlot(idx); setTimeout(() => setPlacedSlot(null), 600); }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl shadow-[0_12px_32px_-8px_rgba(20,30,60,0.15)] w-[520px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-ink">{rack.label}</h3>
            <div className="text-[11px] text-ink-soft mt-0.5 flex gap-3 items-center">
              <span>{rack.tier} · {rack.maxSlots} slots</span>
              <span className="text-indigo">Cool {rack.coolingUsed}/{rack.coolingCapacity}</span>
              <span className="text-amber">{rack.powerDraw}pw</span>
              {rack.slots.some(s => s.node) && (
                <button
                  onClick={() => { useGameStore.getState().clearRack(rack.id); }}
                  className="text-[9px] px-1.5 py-0.5 bg-amber-soft text-amber border border-amber/30 rounded hover:bg-amber hover:text-white transition-colors cursor-pointer ml-1"
                  title="Clear all nodes from this rack"
                >
                  Clear Nodes
                </button>
              )}
              {rack.isOverheating && <span className="text-red font-bold ml-1">OVERHEAT!</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-xl cursor-pointer">&times;</button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {rack.slots.map(slot => {
              const isDragOver = dragOverSlot === slot.index;
              const justPlaced = placedSlot === slot.index;
              return (
                <div key={slot.index}
                  onDrop={(e) => handleSlotDrop(e, slot.index)}
                  onDragOver={(e) => handleSlotDragOver(e, slot.index)}
                  onDragLeave={handleSlotDragLeave}
                  className={`border-2 rounded-lg min-h-[72px] transition-all duration-200 ${slot.node ? 'border-border bg-surface-2' :
                      isDragOver ? 'border-indigo bg-indigo-soft' :
                        'border-dashed border-border bg-surface-2/50'
                    } ${justPlaced ? 'border-green shadow-[0_0_12px_rgba(23,163,102,0.2)]' : ''}`}>
                  {slot.node ? (
                    <div className="p-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[slot.node.category] || '#666' }} />
                          <span className="text-xs font-semibold text-ink truncate">{slot.node.label}</span>
                          {slot.node.status !== 'active' && (
                            <span className={`text-[9px] px-1 py-0.5 rounded ${slot.node.status === 'crashed' ? 'bg-red-soft text-red' : 'bg-amber-soft text-amber'
                              }`}>{slot.node.status}</span>
                          )}
                        </div>
                        <button onClick={() => unequipNode(rack.id, slot.index)}
                          className="text-[10px] text-ink-soft hover:text-ink cursor-pointer shrink-0 ml-1">✕</button>
                      </div>
                      <div className="flex gap-2 mt-1 text-[10px] text-ink-soft">
                        <span>Heat: {slot.node.heat}</span><span>Power: {slot.node.power}pw</span><span>$ {slot.node.monthlyCost}/mo</span>
                      </div>
                      {(slot.node.category === 'web_server' || slot.node.category === 'database') && (
                        <div className="mt-1.5">
                          <div className="flex justify-between text-[9px] text-ink-soft mb-0.5">
                            <span>Load</span><span>{Math.round(slot.node.load)}%</span>
                          </div>
                          <div className="w-full bg-border rounded h-1.5">
                            <div className={`h-1.5 rounded transition-all ${slot.node.load > 90 ? 'bg-red' : slot.node.load > 70 ? 'bg-amber' : 'bg-green'}`}
                              style={{ width: `${Math.min(slot.node.load, 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center h-full min-h-[64px] text-[10px] ${isDragOver ? 'text-indigo' : 'text-ink-soft'}`}>
                      <span>Slot {slot.index + 1}</span>
                      <span className="text-[9px] mt-0.5">Drop node here</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {inventoryNodes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[10px] font-semibold text-ink-soft mb-2">INVENTORY</div>
              <div className="flex flex-wrap gap-1.5">
                {inventoryNodes.map(node => (
                  <div key={node.id} draggable
                    onDragStart={(e) => { e.dataTransfer.setData('application/node-id', node.id); e.dataTransfer.effectAllowed = 'move'; }}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-surface-2 border border-border rounded-lg text-[10px] text-ink cursor-grab active:cursor-grabbing hover:border-indigo transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[node.category] || '#666' }} />
                    {node.label}
                    <NodeUpgradeControls node={node} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlotGrid() {
  const activeView = useGameStore((s) => s.activeView);
  const plots = useGameStore((s) => s.plots);
  const racks = useGameStore((s) => s.racks);
  const placeRack = useGameStore((s) => s.placeRack);
  const moveRack = useGameStore((s) => s.moveRack);
  const unplaceRack = useGameStore((s) => s.unplaceRack);
  const [dragOverPos, setDragOverPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [draggedRackId, setDraggedRackId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  if (activeView.type !== 'server') return null;
  const plot = plots.find(p => p.id === activeView.plotId);
  if (!plot) return null;
  const plotRacks = racks.filter(r => r.plotId === plot.id);

  const getGridPos = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / CELL_SIZE);
    return { x: Math.max(0, Math.min(x, plot.gridCols - 1)), y: Math.max(0, Math.min(y, plot.gridRows - 1)) };
  }, [plot.gridCols, plot.gridRows]);

  const colCheck = (x: number, y: number, w: number, h: number, excludeId?: string) =>
    racks.some(r => r.id !== excludeId && r.plotId === plot.id && x < r.gridX + r.gridW && x + w > r.gridX && y < r.gridY + r.gridH && y + h > r.gridY);

  const getRackFromData = useCallback((e: React.DragEvent) => {
    const id = e.dataTransfer.getData('application/rack-id');
    return id ? racks.find(r => r.id === id) : null;
  }, [racks]);

  const handleGridDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('application/rack-id')) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    const rack = getRackFromData(e);
    if (!rack) return;
    if (draggedRackId !== rack.id) setDraggedRackId(rack.id);
    const pos = getGridPos(e.clientX, e.clientY);
    if (!pos || pos.x + rack.gridW > plot.gridCols || pos.y + rack.gridH > plot.gridRows) return;
    if (colCheck(pos.x, pos.y, rack.gridW, rack.gridH, rack.id)) return;
    setDragOverPos({ x: pos.x, y: pos.y, w: rack.gridW, h: rack.gridH });
  };

  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOverPos(null);
    const rack = getRackFromData(e);
    if (!rack) return;
    const pos = getGridPos(e.clientX, e.clientY);
    if (!pos || pos.x + rack.gridW > plot.gridCols || pos.y + rack.gridH > plot.gridRows) return;
    if (colCheck(pos.x, pos.y, rack.gridW, rack.gridH, rack.id)) return;
    rack.plotId === plot.id ? moveRack(rack.id, pos.x, pos.y) : placeRack(rack.id, plot.id, pos.x, pos.y);
  };

  const handleRackDragStart = (e: React.DragEvent, rack: ServerRack) => {
    e.dataTransfer.setData('application/rack-id', rack.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedRackId(rack.id);
  };
  const handleRackDragEnd = () => { setDragOverPos(null); setDraggedRackId(null); };
  const isValidDrop = dragOverPos && !colCheck(dragOverPos.x, dragOverPos.y, dragOverPos.w, dragOverPos.h, draggedRackId ?? undefined);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-[432px] max-w-full">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-ink">Server Room — <span className="text-indigo">{activeView.plotId.toUpperCase()}</span></h2>
          <span className="text-[10px] text-ink-soft bg-surface-2 border border-border px-1.5 py-0.5 rounded">{plot.gridCols}x{plot.gridRows}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInventory(o => !o)}
            className="text-[11px] font-semibold px-3 py-1.5 bg-indigo hover:bg-indigo/90 text-white rounded-lg transition-colors cursor-pointer">
            {showInventory ? 'Close' : 'Inventory'}
          </button>
          <button onClick={() => useGameStore.getState().togglePanel('server')}
            className="text-[11px] font-semibold px-3 py-1.5 bg-green-soft text-green border border-green/30 rounded-lg hover:bg-green hover:text-white transition-colors cursor-pointer">
            Shop
          </button>
          {plotRacks.length > 0 && (
            <button
              onClick={() => useGameStore.getState().unplaceAllRacks(plot.id)}
              className="text-[11px] font-semibold px-3 py-1.5 bg-red-soft text-red border border-red/30 rounded-lg hover:bg-red hover:text-white transition-colors cursor-pointer"
            >
              Unplace All
            </button>
          )}
        </div>
      </div>

      <div className="relative pl-5 pb-5">
        <div ref={gridRef}
          className={`relative border-2 rounded-lg transition-colors box-border ${dragOverPos ? 'border-indigo bg-indigo-soft/30' : 'border-border bg-surface'}`}
          style={{ width: plot.gridCols * CELL_SIZE, height: plot.gridRows * CELL_SIZE }}
          onDrop={handleGridDrop} onDragOver={handleGridDragOver} onDragLeave={() => setDragOverPos(null)}>
          {Array.from({ length: plot.gridRows }, (_, row) =>
            Array.from({ length: plot.gridCols }, (_, col) => (
              <div key={`${row}-${col}`} className="absolute border border-border/30"
                style={{ left: col * CELL_SIZE, top: row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }} />
            ))
          )}
          {Array.from({ length: plot.gridCols }, (_, i) => (
            <div key={`cl${i}`} className="absolute -bottom-5 text-[9px] text-ink-soft font-mono text-center" style={{ left: i * CELL_SIZE, width: CELL_SIZE }}>{i}</div>
          ))}
          {Array.from({ length: plot.gridRows }, (_, i) => (
            <div key={`rl${i}`} className="absolute -left-5 text-[9px] text-ink-soft font-mono leading-none" style={{ top: i * CELL_SIZE + 2, width: 16, textAlign: 'right' }}>{i}</div>
          ))}

          {dragOverPos && (
            <div className={`absolute border-2 rounded-lg z-10 transition-all duration-100 ${isValidDrop ? 'border-indigo bg-indigo/20' : 'border-red bg-red/10'}`}
              style={{ left: dragOverPos.x * CELL_SIZE, top: dragOverPos.y * CELL_SIZE, width: dragOverPos.w * CELL_SIZE, height: dragOverPos.h * CELL_SIZE }} />
          )}

          {plotRacks.map(rack => {
            const coolingPct = rack.coolingCapacity > 0 ? (rack.coolingUsed / rack.coolingCapacity) * 100 : 0;
            const nodeCount = rack.slots.filter(s => s.node).length;
            return (
              <div key={rack.id} draggable
                onDragStart={(e) => handleRackDragStart(e, rack)}
                onDragEnd={handleRackDragEnd}
                onClick={() => { setSelectedRackId(rack.id); setShowInventory(true); }}
                className="absolute border-2 rounded-lg cursor-grab active:cursor-grabbing hover:border-indigo transition-colors group box-border"
                style={{
                  left: rack.gridX * CELL_SIZE, top: rack.gridY * CELL_SIZE,
                  width: rack.gridW * CELL_SIZE, height: rack.gridH * CELL_SIZE,
                  borderColor: coolingPct > 90 ? '#D1453B' : nodeCount === 0 ? 'var(--color-border)' : '#4F5EFF',
                  backgroundColor: coolingPct > 90 ? 'rgba(209,69,59,0.1)' : nodeCount === 0 ? 'var(--color-surface-2)' : 'rgba(79,94,255,0.08)',
                }}>
                <div className="p-1.5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-ink truncate">{rack.label}</span>
                      <button onClick={(e) => { e.stopPropagation(); unplaceRack(rack.id); }}
                        className="text-[8px] px-1 py-0.5 bg-surface-2 hover:bg-red-soft hover:text-red border border-border rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">Unplace</button>
                    </div>
                    <div className="flex gap-1.5 mt-0.5 text-[8px]">
                      <span className={nodeCount === 0 ? 'text-ink-soft' : 'text-green'}>{nodeCount}/{rack.slots.length}</span>
                      <span className={coolingPct > 90 ? 'text-red' : 'text-indigo'}>{Math.round(coolingPct)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex gap-0.5">
                      {rack.slots.slice(0, 4).map(s => (
                        <span key={s.index} className={`w-1.5 h-1.5 rounded-sm ${s.node ? 'bg-green/70' : 'bg-border'}`} />
                      ))}
                      {rack.slots.length > 4 && <span className="text-[7px] text-ink-soft">+{rack.slots.length - 4}</span>}
                    </div>
                    <span className="text-[8px] text-ink-soft font-mono">({rack.gridX},{rack.gridY})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-ink-soft bg-surface-2 border border-border px-3 py-1.5 rounded-lg w-[432px] max-w-full">
        <span>Placed: {plotRacks.length} racks</span>
        <span>Nodes: {plotRacks.reduce((s, r) => s + r.slots.filter(sl => sl.node).length, 0)}</span>
      </div>

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