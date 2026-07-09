import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ServerRack, ServerNode } from '../types';
import { ServerShop } from './ServerShop';
import { LandMap } from './LandMap';

function NodeSlot({ node, rackId, slotIndex }: { node: ServerNode | null; rackId: string; slotIndex: number }) {
  const sellNode = useGameStore(s => s.sellNode);

  if (!node) {
    return (
      <div className="border border-dashed border-border rounded-lg p-2 text-center text-ink-soft text-[11px]">
        Empty Slot
      </div>
    );
  }

  const loadColor = node.load > 90 ? 'bg-red' : node.load > 70 ? 'bg-amber' : 'bg-green';
  const statusColors: Record<string, string> = {
    active: 'text-green',
    overloaded: 'text-amber',
    overheating: 'text-amber',
    crashed: 'text-red',
    offline: 'text-ink-soft',
  };

  return (
    <div className="border border-border rounded-lg bg-surface-2 p-2">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-ink">{node.label}</span>
          <span className={`text-[10px] ${statusColors[node.status]}`}>{node.status}</span>
        </div>
        <button
          onClick={() => sellNode(rackId, slotIndex)}
          className="text-[10px] text-red hover:text-red/80 font-semibold"
          title={`Sell (refund $${Math.floor(node.price * 0.5)})`}
        >
          jual
        </button>
      </div>

      {node.category === 'web_server' || node.category === 'database' ? (
        <div className="mt-1">
          <div className="flex justify-between text-[10px] text-ink-soft mb-0.5">
            <span>Load</span><span>{node.load}%</span>
          </div>
          <div className="w-full bg-border rounded h-1.5">
            <div className={`h-1.5 rounded transition-all ${loadColor}`} style={{ width: `${Math.min(node.load, 100)}%` }} />
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 mt-1 text-[10px] text-ink-soft">
        {node.heat > 0 && <span>Heat: {node.heat}</span>}
        <span>Power: {node.power}</span>
        <span>$ {node.monthlyCost}/mo</span>
      </div>
    </div>
  );
}

export function RackCard({ rack }: { rack: ServerRack }) {
  const sellRack = useGameStore(s => s.sellRack);

  const coolingPct = rack.coolingCapacity > 0
    ? Math.round((rack.coolingUsed / rack.coolingCapacity) * 100)
    : 0;

  return (
    <div className={`card p-4 ${rack.isOverheating ? 'border-red bg-red-soft' : ''}`}>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-bold text-ink">{rack.label}</h3>
          <span className="text-[11px] text-ink-soft">{rack.tier} · {rack.maxSlots} slots</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className={coolingPct > 90 ? 'text-red font-semibold' : 'text-ink-soft'}>
            Cool: {rack.coolingUsed}/{rack.coolingCapacity}
          </span>
          <span className="text-ink-soft">{rack.powerDraw}pw</span>
          {rack.isOverheating && <span className="text-red font-bold">OVERHEAT!</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {rack.slots.map(slot => (
          <NodeSlot key={slot.index} node={slot.node} rackId={rack.id} slotIndex={slot.index} />
        ))}
      </div>

      <button
        onClick={() => sellRack(rack.id)}
        disabled={rack.slots.some(s => s.node !== null)}
        className="text-[11px] font-semibold px-3 py-1.5 bg-surface-2 hover:bg-red-soft hover:text-red border border-border rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
        title={rack.slots.some(s => s.node !== null) ? 'Remove all nodes first' : `Sell rack (refund $${Math.floor(rack.price * 0.5)})`}
      >
        Sell Rack
      </button>
    </div>
  );
}

export function ServerPanel() {
  const rentedServers = useGameStore(s => s.rentedServers);
  const cancelRental = useGameStore(s => s.cancelRental);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-ink">Server Infrastructure</h2>
        <button
          onClick={() => setShopOpen(o => !o)}
          className="text-[11px] font-semibold px-3 py-1.5 bg-indigo hover:bg-indigo/90 text-white rounded-lg transition-colors cursor-pointer"
        >
          {shopOpen ? 'Close Shop' : 'Shop'}
        </button>
      </div>

      {shopOpen ? (
        <ServerShop onClose={() => setShopOpen(false)} />
      ) : (
        <LandMap />
      )}

      {/* Rented external servers */}
      <div>
        <div className="text-[11px] font-semibold text-ink-soft mb-1.5">Rented (External) · {rentedServers.length}</div>
        {rentedServers.length === 0 ? (
          <div className="text-xs text-ink-soft p-3 border border-dashed border-border rounded-lg text-center">
            No external servers. Rent from Shop.
          </div>
        ) : (
          <div className="space-y-1.5">
            {rentedServers.map(r => (
              <div key={r.id} className="flex items-center justify-between card px-3 py-2">
                <div>
                  <span className="text-xs font-semibold text-ink">{r.label}</span>
                  <span className="text-[11px] text-ink-soft ml-2">{r.capacityRps} RPS · {r.storage} st · {Math.round(r.uptime * 100)}%</span>
                </div>
                <button onClick={() => cancelRental(r.id)} className="text-[11px] text-red hover:text-red/80 font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}