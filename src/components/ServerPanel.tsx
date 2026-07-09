import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ServerRack, ServerNode } from '../types';
import { ServerShop } from './ServerShop';
import { LandMap } from './LandMap';

function NodeSlot({ node, rackId, slotIndex }: { node: ServerNode | null; rackId: string; slotIndex: number }) {
  const sellNode = useGameStore(s => s.sellNode);

  if (!node) {
    return (
      <div className="border border-dashed border-gray-600 rounded p-2 text-center text-gray-500 text-xs">
        Empty Slot
      </div>
    );
  }

  const loadColor = node.load > 90 ? 'bg-red-500' : node.load > 70 ? 'bg-yellow-500' : 'bg-green-500';
  const statusColors: Record<string, string> = {
    active: 'text-green-400',
    overloaded: 'text-yellow-400',
    overheating: 'text-orange-400',
    crashed: 'text-red-400',
    offline: 'text-gray-500',
  };

  return (
    <div className="border border-gray-600 rounded p-2 bg-gray-750">
      <div className="flex justify-between items-start mb-1">
        <div>
          <span className="text-sm font-medium text-gray-200">{node.label}</span>
          <span className={`text-xs ml-2 ${statusColors[node.status]}`}>
            {node.status}
          </span>
        </div>
        <button
          onClick={() => sellNode(rackId, slotIndex)}
          className="text-xs text-red-400 hover:text-red-300"
          title={`Sell (refund $${Math.floor(node.price * 0.5)})`}
        >
          sell
        </button>
      </div>

      {node.category === 'web_server' || node.category === 'database' ? (
        <div className="mt-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Load</span>
            <span>{node.load}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2 mt-0.5">
            <div
              className={`h-2 rounded transition-all ${loadColor}`}
              style={{ width: `${Math.min(node.load, 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 mt-1 text-xs text-gray-500">
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
  const coolingColor = coolingPct > 90 ? 'text-red-400' : coolingPct > 70 ? 'text-yellow-400' : 'text-cyan-400';

  return (
    <div className={`border rounded-lg p-4 ${rack.isOverheating ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-800'}`}>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">{rack.label}</h3>
          <span className="text-xs text-gray-400">{rack.tier} · {rack.maxSlots} slots</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={coolingColor}>
            Cooling: {rack.coolingUsed}/{rack.coolingCapacity}
          </span>
          <span className="text-gray-400">{rack.powerDraw}pw</span>
          {rack.isOverheating && (
            <span className="text-red-400 font-bold animate-pulse">OVERHEAT!</span>
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
          className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded disabled:opacity-40 cursor-pointer"
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
        <h2 className="text-xl font-bold text-gray-100">Server Infrastructure</h2>
        <button
          onClick={() => setShopOpen(o => !o)}
          className="text-xs px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded cursor-pointer"
        >
          {shopOpen ? 'Close Shop' : '🛒 Shop'}
        </button>
      </div>

      {shopOpen ? (
        <ServerShop onClose={() => setShopOpen(false)} />
      ) : (
        <LandMap />
      )}

      {/* Rented external servers */}
      <div>
        <div className="text-xs font-['Space_Grotesk'] uppercase tracking-wider text-gray-400 mb-2">
          Rented (External) · {rentedServers.length}
        </div>
        {rentedServers.length === 0 ? (
          <div className="text-xs text-gray-500 border border-dashed border-gray-700 rounded p-3">
            No external servers. Rent VPS/Dedicated/Cloud from the Shop — no cooling or crash risk.
          </div>
        ) : (
          <div className="space-y-2">
            {rentedServers.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-[#F97316]/40 bg-gray-800/50 px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-gray-200">{r.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{r.capacityRps} RPS · {r.storage} st · SLA {Math.round(r.uptime * 100)}%</span>
                </div>
                <button onClick={() => cancelRental(r.id)} className="text-xs text-red-400 hover:text-red-300 cursor-pointer">
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
