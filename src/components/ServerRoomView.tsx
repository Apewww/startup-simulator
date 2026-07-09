import { useState, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { NODE_DEFS, RACK_TIERS } from '../data/servers';
import type { ServerRack } from '../types';
import { Minus, Maximize2, X, GripVertical } from 'lucide-react';

const CELL_SIZE = 72;
const CATEGORY_COLORS: Record<string, string> = {
  web_server: '#22D3EE',
  database: '#F59E0B',
  caching: '#10B981',
  router: '#8B5CF6',
  cooling: '#60A5FA',
  storage: '#F472B6',
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
          <div className="text-[10px] font-['Space_Grotesk'] uppercase tracking-wider text-[#A78BFA] mb-1.5 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#A78BFA]" />
            RACKS ({unplacedRacks.length}) <span className="text-gray-500 font-normal normal-case">drag to grid</span>
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto custom-scroll pr-1">
            {unplacedRacks.map(rack => {
              const nodeCount = rack.slots.filter(s => s.node).length;
              return (
                <div key={rack.id} draggable
                  onDragStart={(e) => handleRackDragStart(e, rack.id)}
                  onDragEnd={handleRackDragEnd}
                  className="drag-item flex items-center gap-2 px-2.5 py-2 bg-gray-800/80 border border-gray-600/60 rounded text-xs text-gray-200 cursor-grab active:cursor-grabbing hover:border-[#A78BFA]/60 hover:bg-gray-800 transition-all group">
                  <GripVertical className="w-3 h-3 text-gray-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{rack.label}</div>
                    <div className="text-[9px] text-gray-500">{rack.gridW}x{rack.gridH} · {rack.maxSlots} slots · ${rack.monthlyCost}/mo</div>
                    {nodeCount > 0 && <div className="text-[8px] text-cyan-400/70">{nodeCount} node(s) inside</div>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); useGameStore.getState().sellRack(rack.id); }}
                    className="text-[9px] px-1.5 py-0.5 bg-red-900/30 hover:bg-red-700/50 text-red-300 rounded transition-colors cursor-pointer shrink-0"
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
        <div className="text-[10px] text-gray-500 text-center border border-dashed border-gray-700/40 rounded-lg py-2">
          No racks in inventory. Buy from Server Shop.
        </div>
      )}

      {/* Hint to use Server Shop for nodes */}
      <div className="text-[10px] text-center text-gray-400 border border-[#00FFFF]/20 bg-[#00FFFF]/5 rounded-lg py-2 px-3">
        <span className="text-cyan-300 font-medium">Nodes</span> and <span className="text-[#A78BFA] font-medium">Racks</span> can also be bought from <span className="text-[#F97316] font-medium">Server Shop</span>
      </div>

      {/* Inventory Nodes */}
      {inventoryNodes.length > 0 && (
        <div>
          <div className="text-[10px] font-['Space_Grotesk'] uppercase tracking-wider text-cyan-400 mb-1.5 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
            NODES ({inventoryNodes.length}) <span className="text-gray-500 font-normal normal-case">drag to rack slot</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto custom-scroll pr-1">
            {inventoryNodes.map(node => (
              <div key={node.id} draggable
                onDragStart={(e) => handleNodeDragStart(e, node.id)}
                onDragEnd={handleNodeDragEnd}
                className="drag-item flex items-center gap-2 px-2.5 py-2 bg-gray-800/80 border border-gray-600/60 rounded text-xs text-gray-200 cursor-grab active:cursor-grabbing hover:border-cyan-500/60 hover:bg-gray-800 transition-all group">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[node.category] || '#666' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{node.label}</div>
                  <div className="text-[9px] text-gray-500">{node.heat}h · {node.power}pw · ${node.monthlyCost}/mo</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); const s = useGameStore.getState(); const refund = Math.floor(node.price * 0.5); s.addLog(`Sold ${node.label} (refund $${refund})`); useGameStore.setState({ inventoryNodes: s.inventoryNodes.filter(n => n.id !== node.id), cash: s.cash + refund }); }}
                  className="text-[10px] text-red-400/50 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {inventoryNodes.length === 0 && (
        <div className="text-[10px] text-gray-500 text-center border border-dashed border-gray-700/40 rounded-lg py-2">
          No nodes in inventory. Buy from Server Shop.
        </div>
      )}
    </div>
  );

  if (minimized) return null;

  return (
    <div onPointerDown={bringToFront}
      className={`fixed rounded-xl overflow-hidden transition-[box-shadow,transform] duration-200 pointer-events-auto z-50
        max-md:!left-0 max-md:!right-0 max-md:!bottom-0 max-md:!top-auto max-md:max-h-[85vh] max-md:rounded-b-none
        ${maximized ? '!fixed !inset-4' : ''}`}
      style={{
        left: maximized ? undefined : pos.x,
        top: maximized ? undefined : pos.y,
        width: maximized ? undefined : 'clamp(300px, 28vw, 380px)',
        zIndex: z,
        border: `1px solid #7C3AED55`,
        boxShadow: `0 10px 40px #7C3AED40`,
        background: '#0F0A1E',
      }}>
      {/* Header */}
      <div onPointerDown={onPointerDownHeader}
        className="flex items-center justify-between px-3 py-2 border-b cursor-grab active:cursor-grabbing select-none"
        style={{ borderColor: '#7C3AED33', background: '#7C3AED14' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#A78BFA] shrink-0" />
          <span className="font-['Space_Grotesk'] font-semibold text-xs tracking-wide text-[#A78BFA] truncate">INVENTORY</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => setMinimized(true)} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 cursor-pointer" title="Minimize">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setMaximized(m => !m)} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 cursor-pointer" title="Maximize">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-red-500/30 text-red-300 cursor-pointer" title="Close">
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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-[#7C3AED]/40 rounded-xl shadow-2xl w-[520px] max-h-[85vh] overflow-y-auto custom-scroll"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{rack.label}</h3>
            <div className="text-[11px] text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
              <span className="text-gray-500">{rack.tier} · {rack.maxSlots} slots</span>
              <span className="text-cyan-400">Cool {rack.coolingUsed}/{rack.coolingCapacity}</span>
              <span className="text-yellow-400">{rack.powerDraw}pw</span>
              {rack.isOverheating && <span className="text-red-400 animate-pulse">OVERHEAT!</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl cursor-pointer">&times;</button>
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
                  className={`relative border-2 rounded-lg min-h-[72px] transition-all duration-200 ${
                    slot.node
                      ? 'border-gray-600 bg-gray-800'
                      : isDragOver
                        ? 'border-cyan-400 bg-cyan-900/30 shadow-[0_0_24px_rgba(34,211,238,0.2)]'
                        : 'border-dashed border-gray-600/60 bg-gray-850/50 hover:border-gray-500'
                  } ${justPlaced ? 'animate-pulse border-green-400 shadow-[0_0_24px_rgba(74,222,128,0.3)]' : ''}`}>
                  {slot.node ? (
                    <div className="p-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[slot.node.category] || '#666' }} />
                          <span className="text-sm font-medium text-gray-200 truncate">{slot.node.label}</span>
                          {slot.node.status !== 'active' && (
                            <span className={`text-[9px] px-1 py-0.5 rounded ${
                              slot.node.status === 'overloaded' ? 'bg-yellow-900/60 text-yellow-300' :
                              slot.node.status === 'overheating' ? 'bg-orange-900/60 text-orange-300' :
                              slot.node.status === 'crashed' ? 'bg-red-900/60 text-red-300' :
                              'bg-gray-700 text-gray-400'
                            }`}>{slot.node.status}</span>
                          )}
                        </div>
                        <button onClick={() => unequipNode(rack.id, slot.index)}
                          className="text-[10px] text-gray-400 hover:text-white cursor-pointer shrink-0 ml-1" title="Unequip node (return to inventory)">✕</button>
                      </div>
                      <div className="flex gap-3 mt-1.5 text-[10px] text-gray-500">
                        {slot.node.heat > 0 && <span>🔥 {slot.node.heat}</span>}
                        <span>⚡ {slot.node.power}pw</span>
                        <span>💰 ${slot.node.monthlyCost}/mo</span>
                      </div>
                      {(slot.node.category === 'web_server' || slot.node.category === 'database') && (
                        slot.node.load > 0 ? (
                          <div className="mt-2">
                            <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
                              <span>Load</span><span>{Math.round(slot.node.load)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded h-1.5">
                              <div className={`h-1.5 rounded transition-all ${
                                slot.node.load > 90 ? 'bg-red-500' : slot.node.load > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`} style={{ width: `${Math.min(slot.node.load, 100)}%` }} />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-[9px] text-gray-600">Idle</div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center h-full min-h-[64px] px-2 transition-colors ${
                      isDragOver ? 'text-cyan-300' : 'text-gray-500'
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
            <div className="mt-4 pt-4 border-t border-gray-700/30">
              <div className="text-[10px] font-['Space_Grotesk'] uppercase tracking-wider text-gray-400 mb-2">DRAG FROM INVENTORY</div>
              <div className="flex flex-wrap gap-1.5">
                {inventoryNodes.map(node => (
                  <div key={node.id} draggable
                    onDragStart={(e) => handleNodeDragStart(e, node.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-200 cursor-grab active:cursor-grabbing hover:border-cyan-500/60 transition-all">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[node.category] || '#666' }} />
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
          <h2 className="text-sm font-semibold text-gray-100">
            Server Room — <span className="text-[#A78BFA]">{activeView.plotId.toUpperCase()}</span>
          </h2>
          <span className="text-[10px] text-gray-500 bg-gray-800/80 px-2 py-0.5 rounded">
            {plot.gridCols}x{plot.gridRows}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInventory(o => !o)}
            className="text-xs px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded cursor-pointer transition-colors">
            {showInventory ? 'Close' : 'Inventory'}
          </button>
          <button onClick={() => useGameStore.getState().togglePanel('server')}
            className="text-xs px-3 py-1.5 bg-[#F97316]/20 hover:bg-[#F97316]/40 text-orange-300 border border-[#F97316]/40 rounded cursor-pointer transition-colors"
            title="Open Server Shop">
            Shop
          </button>
        </div>
      </div>

      {/* Grid wrapper with padding for axis labels */}
      <div className="relative pl-5 pb-5">
        <div ref={gridRef}
          className={`relative border-2 rounded-xl transition-colors duration-150 ${
            dragOverPos ? 'border-cyan-500/60 bg-cyan-900/10' : 'border-[#7C3AED]/30 bg-gray-900/50'
          }`}
          style={{ width: plot.gridCols * CELL_SIZE, height: plot.gridRows * CELL_SIZE }}
          onDrop={handleGridDrop}
          onDragOver={handleGridDragOver}
          onDragLeave={handleGridDragLeave}>
          {Array.from({ length: plot.gridRows }, (_, row) =>
            Array.from({ length: plot.gridCols }, (_, col) => (
              <div key={`${row}-${col}`}
                className="absolute border border-[#7C3AED]/5"
                style={{ left: col * CELL_SIZE, top: row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }} />
            ))
          )}
          {Array.from({ length: plot.gridCols }, (_, i) => (
            <div key={`cl${i}`} className="absolute -bottom-5 text-[9px] text-gray-600 font-mono text-center" style={{ left: i * CELL_SIZE, width: CELL_SIZE }}>{i}</div>
          ))}
          {Array.from({ length: plot.gridRows }, (_, i) => (
            <div key={`rl${i}`} className="absolute -left-5 text-[9px] text-gray-600 font-mono leading-none" style={{ top: i * CELL_SIZE + 2, width: 16, textAlign: 'right' }}>{i}</div>
          ))}

          {/* Drop preview */}
          {dragOverPos && (
            <div className={`absolute border-2 rounded-lg z-10 transition-all duration-100 ${
              isValidDrop ? 'border-cyan-400 bg-cyan-500/20' : 'border-red-500/60 bg-red-500/10'
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
                className="absolute border-2 rounded-lg cursor-grab active:cursor-grabbing hover:border-[#A78BFA] transition-all group"
                style={{
                  left: rack.gridX * CELL_SIZE, top: rack.gridY * CELL_SIZE,
                  width: rack.gridW * CELL_SIZE, height: rack.gridH * CELL_SIZE,
                  borderColor: coolingPct > 90 ? '#EF4444' : nodeCount === 0 ? '#6B7280' : '#A78BFA',
                  backgroundColor: coolingPct > 90 ? 'rgba(239,68,68,0.15)' : nodeCount === 0 ? 'rgba(107,114,128,0.1)' : 'rgba(124,58,237,0.2)',
                }}>
                <div className="p-1.5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-gray-200 truncate">{rack.label}</span>
                      <button onClick={(e) => { e.stopPropagation(); unplaceRack(rack.id); }}
                        className="text-[8px] px-1.5 py-0.5 bg-gray-700/50 hover:bg-gray-600 text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer whitespace-nowrap"
                        title="Remove from grid (back to inventory)">Unplace</button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[8px]">
                      <span className={nodeCount === 0 ? 'text-gray-600' : 'text-green-400'}>{nodeCount}/{allSlots}</span>
                      <span className={coolingPct > 90 ? 'text-red-400' : 'text-cyan-400'}>{Math.round(coolingPct)}%</span>
                      <span className="text-gray-500">{rack.powerDraw}pw</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex gap-0.5">
                      {rack.slots.slice(0, 4).map(s => (
                        <span key={s.index} className={`w-1.5 h-1.5 rounded-sm ${s.node ? 'bg-green-500/70' : 'bg-gray-700'}`} />
                      ))}
                      {allSlots > 4 && <span className="text-[7px] text-gray-600">+{allSlots - 4}</span>}
                    </div>
                    <span className="text-[8px] text-gray-600 font-mono">({rack.gridX},{rack.gridY})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-[10px] text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-lg w-[432px] max-w-full">
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
