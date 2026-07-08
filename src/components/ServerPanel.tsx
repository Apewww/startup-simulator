import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RACK_TIERS, NODE_DEFS } from '../data/servers';
import type { RackTier, NodeTypeId, ServerRack, ServerNode } from '../types';

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

function RackCard({ rack }: { rack: ServerRack }) {
  const [showBuyNode, setShowBuyNode] = useState(false);
  const buyNode = useGameStore(s => s.buyNode);
  const sellRack = useGameStore(s => s.sellRack);
  const cash = useGameStore(s => s.cash);
  const hasNodes = rack.slots.some(s => s.node !== null);

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
          onClick={() => setShowBuyNode(!showBuyNode)}
          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded"
        >
          {showBuyNode ? 'Cancel' : '+ Add Node'}
        </button>
        <button
          onClick={() => sellRack(rack.id)}
          disabled={hasNodes}
          className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded disabled:opacity-40"
          title={hasNodes ? 'Remove all nodes first' : `Sell rack (refund $${Math.floor(rack.price * 0.5)})`}
        >
          Sell Rack
        </button>
      </div>

      {showBuyNode && (
        <div className="mt-3 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
          {NODE_DEFS.filter(n => {
            if (rack.slots.some(s => s.node?.typeId === 'router') && n.category === 'router') return false;
            return true;
          }).map(def => {
            const canAfford = cash >= def.price;
            const emptySlot = rack.slots.some(s => s.node === null);
            return (
              <button
                key={def.typeId}
                onClick={() => { buyNode(rack.id, def.typeId); setShowBuyNode(false); }}
                disabled={!canAfford || !emptySlot}
                className="text-xs text-left px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-40 border border-gray-600"
                title={def.description}
              >
                <div className="font-medium text-gray-200">{def.label}</div>
                <div className="text-gray-400">${def.price} · {def.heat}h · {def.power}pw · ${def.monthlyCost}/mo</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ServerPanel() {
  const racks = useGameStore(s => s.racks);
  const buyRack = useGameStore(s => s.buyRack);
  const cash = useGameStore(s => s.cash);
  const [showBuyRack, setShowBuyRack] = useState(false);

  return (
    <div className="bg-gray-850 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-100">Server Infrastructure</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{racks.length} rack{racks.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setShowBuyRack(!showBuyRack)}
            className="text-xs px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded"
          >
            {showBuyRack ? 'Cancel' : '+ Buy Rack'}
          </button>
        </div>
      </div>

      {showBuyRack && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          {RACK_TIERS.map(def => {
            const canAfford = cash >= def.price;
            return (
              <button
                key={def.tier}
                onClick={() => { buyRack(def.tier as RackTier); setShowBuyRack(false); }}
                disabled={!canAfford}
                className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 disabled:opacity-40"
              >
                <div className="font-semibold text-gray-200">{def.label}</div>
                <div className="text-xs text-gray-400">{def.maxSlots} slots · Cooling {def.coolingCapacity}</div>
                <div className="text-xs text-gray-400">${def.price} · ${def.monthlyCost}/mo</div>
                <div className="text-xs text-gray-500 mt-1">{def.description}</div>
              </button>
            );
          })}
        </div>
      )}

      {racks.length === 0 ? (
        <div className="text-center text-gray-500 py-8 border border-dashed border-gray-700 rounded">
          No server racks. Buy one to start hosting your platform.
        </div>
      ) : (
        <div className="space-y-4">
          {racks.map(rack => (
            <RackCard key={rack.id} rack={rack} />
          ))}
        </div>
      )}
    </div>
  );
}
