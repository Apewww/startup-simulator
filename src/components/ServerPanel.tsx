import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ServerRack, ServerNode } from '../types';
import { ServerShop } from './ServerShop';
import { LandMap } from './LandMap';

function NodeSlot({ node, rackId, slotIndex }: { node: ServerNode | null; rackId: string; slotIndex: number }) {
  const sellNode = useGameStore(s => s.sellNode);

  if (!node) {
    return (
      <div className="border-2 border-dashed border-border p-2 text-center text-text-muted text-xs">
        Empty Slot
      </div>
    );
  }

  const loadColor = node.load > 90 ? 'bg-danger' : node.load > 70 ? 'bg-orange-500' : 'bg-profit';
  const statusColors: Record<string, string> = {
    active: 'text-profit',
    overloaded: 'text-orange-400',
    overheating: 'text-orange-400',
    crashed: 'text-danger',
    offline: 'text-text-muted',
  };

  return (
    <div className="border-2 border-border bg-bg-card">
      <div className="flex justify-between items-start mb-1 p-2">
        <div>
          <span className="text-sm font-medium text-text-primary">{node.label}</span>
          <span className={`text-xs ml-2 ${statusColors[node.status]}`}>
            {node.status}
          </span>
        </div>
        <button
          onClick={() => sellNode(rackId, slotIndex)}
          className="text-xs text-danger hover:text-danger/80"
          title={`Sell (refund $${Math.floor(node.price * 0.5)})`}
        >
          sell
        </button>
      </div>

      {node.category === 'web_server' || node.category === 'database' ? (
        <div className="mt-1 px-2 pb-2">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Load</span>
            <span>{node.load}%</span>
          </div>
          <div className="w-full bg-bg-base h-2 mt-0.5">
            <div
              className={`h-2 transition-all ${loadColor}`}
              style={{ width: `${Math.min(node.load, 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 mt-1 text-xs text-text-muted px-2 pb-2">
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
  const coolingColor = coolingPct > 90 ? 'text-danger' : coolingPct > 70 ? 'text-orange-400' : 'text-steel';

  return (
    <div className={`border-2 p-4 ${rack.isOverheating ? 'border-danger bg-danger/10' : 'border-border bg-bg-card'}`}>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{rack.label}</h3>
          <span className="text-xs text-text-muted">{rack.tier} · {rack.maxSlots} slots</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={coolingColor}>
            Cooling: {rack.coolingUsed}/{rack.coolingCapacity}
          </span>
          <span className="text-text-muted">{rack.powerDraw}pw</span>
          {rack.isOverheating && (
            <span className="text-danger font-bold">OVERHEAT!</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {rack.slots.map(slot => (
          <NodeSlot key={slot.index} node={slot.node} rackId={rack.id} slotIndex={slot.index} />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => sellRack(rack.id)}
          disabled={rack.slots.some(s => s.node !== null)}
          className="text-xs px-3 py-1.5 bg-bg-hover hover:bg-bg-card text-text-secondary border border-border disabled:opacity-40 cursor-pointer"
          title={rack.slots.some(s => s.node !== null) ? 'Remove all nodes first' : `Sell rack (refund $${Math.floor(rack.price * 0.5)})`}
        >
          Sell Rack
        </button>
      </div>
    </div>
  );
}

export function ServerPanel() {
  const rentedServers = useGameStore(s => s.rentedServers);
  const cancelRental = useGameStore(s => s.cancelRental);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-text-primary">Server Infrastructure</h2>
        <button
          onClick={() => setShopOpen(o => !o)}
          className="text-xs px-3 py-1.5 bg-primary hover:bg-steel text-white transition-colors cursor-pointer"
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
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
          Rented (External) · {rentedServers.length}
        </div>
        {rentedServers.length === 0 ? (
          <div className="text-xs text-text-muted border-2 border-dashed border-border p-3">
            No external servers. Rent VPS/Dedicated/Cloud from the Shop — no cooling or crash risk.
          </div>
        ) : (
          <div className="space-y-2">
            {rentedServers.map(r => (
              <div key={r.id} className="flex items-center justify-between border-2 border-profit/40 bg-bg-card px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-text-primary">{r.label}</span>
                  <span className="text-xs text-text-muted ml-2">{r.capacityRps} RPS · {r.storage} st · SLA {Math.round(r.uptime * 100)}%</span>
                </div>
                <button onClick={() => cancelRental(r.id)} className="text-xs text-danger hover:text-danger/80 cursor-pointer">
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