import { useState, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { NODE_DEFS, RACK_TIERS } from '../data/servers';
import type { ServerRack } from '../types';
import { Minus, Maximize2, X, GripVertical } from 'lucide-react';

const CELL_SIZE = 72;
const CATEGORY_COLORS: Record<string, string> = {
  web_server: '#3B82F6',
  database: '#D97706',
  caching: '#22C55E',
  router: '#8B5CF6',
  cooling: '#2563EB',
  storage: '#EC4899',
};

let zCounter = 100;

function InventoryPanel({ onClose }: { onClose: () => void }) {
  const racks = useGameStore((s) => s.racks);
  const inventoryNodes = useGameStore((s) => s.inventoryNodes);

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
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 320, ev.clientX - drag.current.dx)),
        y: Math.max(0, Math.min(window.innerHeight - 200, ev.clientY - drag.current.dy)),
      });
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
    const el = e.currentTarget.closest('.drag-item') as HTMLElement;
    if (el) setTimeout(() => el.style.opacity = '0.3', 0);
  };
  const handleNodeDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget.closest('.drag-item') as HTMLElement;
    if (el) el.style.opacity = '';
  };

  const body = (
    <div className="space-y-3">

      {/* Unplaced Racks */}
      {unplacedRacks.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary" />
            RACKS ({unplacedRacks.length}) <span className="text-text-muted font-normal normal-case">drag to grid</span>
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto custom-scroll pr-1">
            {unplacedRacks.map(rack => {
              const nodeCount = rack.slots.filter(s => s.node).length;
              return (
                <div key={rack.id} draggable
                  onDragStart={(e) => handleRackDragStart(e, rack.id)}
                  onDragEnd={handleRackDragEnd}
                  className="drag-item flex items-center gap-2 px-2.5 py-2 bg-bg-card border-2 border-border text-xs text-text-primary cursor-grab active:cursor-grabbing hover:border-primary hover:bg-bg-hover transition-colors group">
                  <GripVertical className="w-3 h-3 text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{rack.label}</div>
                    <div className="text-[9px] text-text-muted">{rack.gridW}x{rack.gridH} · {rack.maxSlots} slots · ${rack.monthlyCost}/mo</div>
                    {nodeCount > 0 && <div className="text-[8px] text-primary/70">{nodeCount} node(s) inside</div>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); useGameStore.getState().sellRack(rack.id); }}
                    className="text-[9px] px-1.5 py-0.5 bg-danger/20 hover:bg-danger/50 text-danger transition-colors cursor-pointer shrink-0"
                    title={`Sell rack (refund $${Math.floor(rack.price * 0.5)}${nodeCount > 0 ? ` + nodes refund` : ''})`}>
                    Sell
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {unplacedRacks.length === 0 && (
        <div className="text-[10px] text-text-muted text-center border-2 border-dashed border-border/40 py-2">
          No racks in inventory. Buy from Server Shop.
        </div>
      )}

      {/* Hint to use Server Shop for nodes */}
      <div className="text-[10px] text-center text-text-secondary border-2 border-primary/20 bg-primary/5 py-2 px-3">
        <span className="text-steel font-medium">Nodes</span> and <span className="text-primary font-medium">Racks</span> can also be bought from <span className="text-profit font-medium">Server Shop</span>
      </div>

      {/* Inventory Nodes */}
      {inventoryNodes.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-steel mb-1.5 flex items-center gap-1.5">
            <span className="w-1 h-1 bg-steel" />
            NODES ({inventoryNodes.length}) <span className="text-text-muted font-normal normal-case">drag to rack slot</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto custom-scroll pr-1">
            {inventoryNodes.map(node => (
              <div key={node.id} draggable
                onDragStart={(e) => handleNodeDragStart(e, node.id)}
                onDragEnd={handleNodeDragEnd}
                className="drag-item flex items-center gap-2 px-2.5 py-2 bg-bg-card border-2 border-border text-xs text-text-primary cursor-grab active:cursor-grabbing hover:border-steel hover:bg-bg-hover transition-colors group">
                <span className="w-2 h-2 shrink-0" style={{ backgroundColor: CATEGORY_COLORS[node.category] || '#666' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{node.label}</div>
                  <div className="text-[9px] text-text-muted">{node.heat}h · {node.power}pw · ${node.monthlyCost}/mo</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); const s = useGameStore.getState(); const refund = Math.floor(node.price * 0.5); s.addLog(`Sold ${node.label} (refund $${refund})`); useGameStore.setState({ inventoryNodes: s.inventoryNodes.filter(n => n.id !== node.id), cash: s.cash + refund }); }}
                  className="text-[10px] text-danger/50 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {inventoryNodes.length === 0 && (
        <div className="text-[10px] text-text-muted text-center border-2 border-dashed border-border/40 py-2">
          No nodes in inventory. Buy from Server Shop.
        </div>
      )}
    </div>
  );

  if (minimized) return null;

  return (
    <div onPointerDown={bringToFront}
      className={`fixed border-2 shadow-lg overflow-hidden pointer-events-auto z-50
        max-md:!left-0 max-md:!right-0 max-md:!bottom-0 max-md:!top-auto max-md:max-h-[85vh] max-md:rounded-b-none
        ${maximized ? '!fixed !inset-4' : ''}`}
      style={{
        left: maximized ? undefined : pos.x,
        top: maximized ? undefined : pos.y,
        width: maximized ? undefined : 'clamp(300px, 28vw, 380px)',
        zIndex: z,
        borderColor: '#2563EB',
        backgroundColor: '#23272E',
      }}>
      {/* Header */}
      <div onPointerDown={onPointerDownHeader}
        className="flex items-center justify-between px-3 py-2 border-b-2 cursor-grab active:cursor-grabbing select-none"
        style={{ borderColor: '#2563EB', background: '#2563EB14' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 bg-primary shrink-0" />
          <span className="font-semibold text-xs tracking-wide text-primary truncate">INVENTORY</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => setMinimized(true)} className="p-1 bg-bg-card hover:bg-bg-hover text-text-secondary transition-colors cursor-pointer" title="Minimize">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setMaximized(m => !m)} className="p-1 bg-bg-card hover:bg-bg-hover text-text-secondary transition-colors cursor-pointer" title="Maximize">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 bg-bg-card hover:bg-danger hover:text-white text-text-secondary transition-colors cursor-pointer" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 overflow-y-auto custom-scroll"
        style={{ maxHeight: maximized ? 'calc(100% - 44px)' : 'clamp(300px, 55vh, 70vh)' }}>
        {body}
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
  const handleNodeDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('application/node-id', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-bg-surface border-2 border-primary/40 shadow-2xl w-[520px] max-h-[85vh] overflow-y-auto custom-scroll"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{rack.label}</h3>
            <div className="text-[11px] text-text-muted mt-0.5 flex flex-wrap gap-x-3">
              <span className="text-text-muted">{rack.tier} · {rack.maxSlots} slots</span>
              <span className="text-steel">Cool {rack.coolingUsed}/{rack.coolingCapacity}</span>
              <span className="text-orange-400">{rack.powerDraw}pw</span>
              {rack.isOverheating && <span className="text-danger">OVERHEAT!</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white text-xl cursor-pointer">&times;</button>
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
                  className={`border-2 min-h-[72px] transition-all duration-200 ${
                    slot.node
                      ? 'border-border bg-bg-card'
                      : isDragOver
                        ? 'border-steel bg-steel/10'
                        : 'border-dashed border-border/60 bg-bg-card/50 hover:border-border'
                  } ${justPlaced ? 'border-profit shadow-[0_0_12px_rgba(34,197,94,0.3)]' : ''}`}>
                  {slot.node ? (
                    <div className="p-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 shrink-0" style={{ backgroundColor: CATEGORY_COLORS[slot.node.category] || '#666' }} />
                          <span className="text-sm font-medium text-text-primary truncate">{slot.node.label}</span>
                          {slot.node.status !== 'active' && (
                            <span className={`text-[9px] px-1 py-0.5 border ${
                              slot.node.status === 'overloaded' ? 'bg-orange-900/60 text-orange-300 border-orange-500/30' :
                              slot.node.status === 'overheating' ? 'bg-orange-900/60 text-orange-300 border-orange-500/30' :
                              slot.node.status === 'crashed' ? 'bg-danger/10 text-danger border-danger/30' :
                              'bg-bg-card text-text-muted border-border'
                            }`}>{slot.node.status}</span>
                          )}
                        </div>
                        <button onClick={() => unequipNode(rack.id, slot.index)}
                          className="text-[10px] text-text-muted hover:text-white cursor-pointer shrink-0 ml-1" title="Unequip node (return to inventory)">✕</button>
                      </div>
                      <div className="flex gap-3 mt-1.5 text-[10px] text-text-muted">
                        {slot.node.heat > 0 && <span>Heat: {slot.node.heat}</span>}
                        <span>Power: {slot.node.power}pw</span>
                        <span>$ {slot.node.monthlyCost}/mo</span>
                      </div>
                      {(slot.node.category === 'web_server' || slot.node.category === 'database') && (
                        slot.node.load > 0 ? (
                          <div className="mt-2">
                            <div className="flex justify-between text-[9px] text-text-muted mb-0.5">
                              <span>Load</span><span>{Math.round(slot.node.load)}%</span>
                            </div>
                            <div className="w-full bg-bg-base h-1.5">
                              <div className={`h-1.5 transition-all ${
                                slot.node.load > 90 ? 'bg-danger' : slot.node.load > 70 ? 'bg-orange-500' : 'bg-profit'
                              }`} style={{ width: `${Math.min(slot.node.load, 100)}%` }} />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-[9px] text-text-muted">Idle</div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center h-full min-h-[64px] px-2 transition-colors ${
                      isDragOver ? 'text-steel' : 'text-text-muted'
                    }`}>
                      <span className="text-[10px] font-mono">Slot {slot.index + 1}</span>
                      <span className="text-[9px] mt-0.5">Drop node here</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {inventoryNodes.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-border">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">DRAG FROM INVENTORY</div>
              <div className="flex flex-wrap gap-1.5">
                {inventoryNodes.map(node => (
                  <div key={node.id} draggable
                    onDragStart={(e) => handleNodeDragStart(e, node.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-bg-card border-2 border-border text-[10px] text-text-primary cursor-grab active:cursor-grabbing hover:border-steel transition-colors">
                    <span className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: CATEGORY_COLORS[node.category] || '#666' }} />
                    {node.label}
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

  const checkCollision = (x: number, y: number, w: number, h: number, excludeId?: string) => {
    return racks.some(r =>
      r.id !== excludeId && r.plotId === plot.id &&
      x < r.gridX + r.gridW && x + w > r.gridX &&
      y < r.gridY + r.gridH && y + h > r.gridY
    );
  };

  const getRackFromData = useCallback((e: React.DragEvent) => {
    const id = e.dataTransfer.getData('application/rack-id');
    return id ? racks.find(r => r.id === id) : null;
  }, [racks]);

  const handleGridDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('application/rack-id') &&
        !e.dataTransfer.types.includes('text/plain')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rack = getRackFromData(e);
    if (!rack) return;
    if (draggedRackId !== rack.id) setDraggedRackId(rack.id);
    const pos = getGridPos(e.clientX, e.clientY);
    if (!pos) return;
    const w = rack.gridW, h = rack.gridH;
    if (pos.x + w > plot.gridCols || pos.y + h > plot.gridRows) return;
    setDragOverPos({ x: pos.x, y: pos.y, w, h });
  };

  const handleGridDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverPos(null);
    }
  };

  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPos(null);
    const rack = getRackFromData(e);
    if (!rack) return;
    const pos = getGridPos(e.clientX, e.clientY);
    if (!pos) return;
    if (pos.x + rack.gridW > plot.gridCols || pos.y + rack.gridH > plot.gridRows) return;
    if (checkCollision(pos.x, pos.y, rack.gridW, rack.gridH, rack.id)) return;
    if (rack.plotId === plot.id) {
      moveRack(rack.id, pos.x, pos.y);
    } else {
      placeRack(rack.id, plot.id, pos.x, pos.y);
    }
  };

  const handleRackDragStart = (e: React.DragEvent, rack: ServerRack) => {
    e.dataTransfer.setData('application/rack-id', rack.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedRackId(rack.id);
  };

  const handleRackDragEnd = () => { setDragOverPos(null); setDraggedRackId(null); };

  const isValidDrop = dragOverPos &&
    !checkCollision(dragOverPos.x, dragOverPos.y, dragOverPos.w, dragOverPos.h);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between w-[432px] max-w-full px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">
            Server Room — <span className="text-primary">{activeView.plotId.toUpperCase()}</span>
          </h2>
          <span className="text-[10px] text-text-muted bg-bg-card border border-border px-2 py-0.5">
            {plot.gridCols}x{plot.gridRows}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInventory(o => !o)}
            className="text-xs px-3 py-1.5 bg-primary hover:bg-steel text-white transition-colors cursor-pointer">
            {showInventory ? 'Close' : 'Inventory'}
          </button>
          <button onClick={() => useGameStore.getState().togglePanel('server')}
            className="text-xs px-3 py-1.5 bg-profit/20 hover:bg-profit/40 text-profit border-2 border-profit/40 transition-colors cursor-pointer"
            title="Open Server Shop">
            Shop
          </button>
        </div>
      </div>

      {/* Grid wrapper with padding for axis labels */}
      <div className="relative pl-5 pb-5">
        <div ref={gridRef}
          className={`relative border-2 transition-colors duration-150 ${
            dragOverPos ? 'border-steel bg-steel/5' : 'border-border bg-bg-surface'
          }`}
          style={{ width: plot.gridCols * CELL_SIZE, height: plot.gridRows * CELL_SIZE }}
          onDrop={handleGridDrop}
          onDragOver={handleGridDragOver}
          onDragLeave={handleGridDragLeave}>
          {Array.from({ length: plot.gridRows }, (_, row) =>
            Array.from({ length: plot.gridCols }, (_, col) => (
              <div key={`${row}-${col}`}
                className="absolute border border-border/20"
                style={{ left: col * CELL_SIZE, top: row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }} />
            ))
          )}
          {Array.from({ length: plot.gridCols }, (_, i) => (
            <div key={`cl${i}`} className="absolute -bottom-5 text-[9px] text-text-muted font-mono text-center" style={{ left: i * CELL_SIZE, width: CELL_SIZE }}>{i}</div>
          ))}
          {Array.from({ length: plot.gridRows }, (_, i) => (
            <div key={`rl${i}`} className="absolute -left-5 text-[9px] text-text-muted font-mono leading-none" style={{ top: i * CELL_SIZE + 2, width: 16, textAlign: 'right' }}>{i}</div>
          ))}

          {/* Drop preview */}
          {dragOverPos && (
            <div className={`absolute border-2 z-10 transition-all duration-100 ${
              isValidDrop ? 'border-steel bg-steel/20' : 'border-danger bg-danger/10'
            }`}
              style={{ left: dragOverPos.x * CELL_SIZE, top: dragOverPos.y * CELL_SIZE, width: dragOverPos.w * CELL_SIZE, height: dragOverPos.h * CELL_SIZE }} />
          )}

          {/* Racks */}
          {plotRacks.map(rack => {
            const coolingPct = rack.coolingCapacity > 0 ? (rack.coolingUsed / rack.coolingCapacity) * 100 : 0;
            const nodeCount = rack.slots.filter(s => s.node).length;
            const allSlots = rack.slots.length;
            return (
              <div key={rack.id} draggable
                onDragStart={(e) => handleRackDragStart(e, rack)}
                onDragEnd={handleRackDragEnd}
                onClick={() => setSelectedRackId(rack.id)}
                className="absolute border-2 cursor-grab active:cursor-grabbing hover:border-primary transition-colors group"
                style={{
                  left: rack.gridX * CELL_SIZE, top: rack.gridY * CELL_SIZE,
                  width: rack.gridW * CELL_SIZE, height: rack.gridH * CELL_SIZE,
                  borderColor: coolingPct > 90 ? '#DC2626' : nodeCount === 0 ? '#3D4149' : '#2563EB',
                  backgroundColor: coolingPct > 90 ? 'rgba(220,38,38,0.15)' : nodeCount === 0 ? 'rgba(45,49,56,0.5)' : 'rgba(37,99,235,0.15)',
                }}>
                <div className="p-1.5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-text-primary truncate">{rack.label}</span>
                      <button onClick={(e) => { e.stopPropagation(); unplaceRack(rack.id); }}
                        className="text-[8px] px-1.5 py-0.5 bg-bg-hover hover:bg-bg-card text-text-secondary border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer whitespace-nowrap"
                        title="Remove from grid (back to inventory)">Unplace</button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[8px]">
                      <span className={nodeCount === 0 ? 'text-text-muted' : 'text-profit'}>{nodeCount}/{allSlots}</span>
                      <span className={coolingPct > 90 ? 'text-danger' : 'text-steel'}>{Math.round(coolingPct)}%</span>
                      <span className="text-text-muted">{rack.powerDraw}pw</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex gap-0.5">
                      {rack.slots.slice(0, 4).map(s => (
                        <span key={s.index} className={`w-1.5 h-1.5 ${s.node ? 'bg-profit/70' : 'bg-text-muted/30'}`} />
                      ))}
                      {allSlots > 4 && <span className="text-[7px] text-text-muted">+{allSlots - 4}</span>}
                    </div>
                    <span className="text-[8px] text-text-muted font-mono">({rack.gridX},{rack.gridY})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-[10px] text-text-muted bg-bg-card border border-border px-3 py-1.5 w-[432px] max-w-full">
        <span>Placed: {plotRacks.length} racks</span>
        <span>Nodes: {plotRacks.reduce((s, r) => s + r.slots.filter(sl => sl.node).length, 0)}</span>
      </div>

      {selectedRackId && <RackSlotView rackId={selectedRackId} onClose={() => setSelectedRackId(null)} />}
      {showInventory && <InventoryPanel onClose={() => setShowInventory(false)} />}
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