import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ServerRack, ServerNode } from '../types';
import { ServerShop } from './ServerShop';
import { LandMap } from './LandMap';
import { Plus, Minus } from 'lucide-react';
import { getComplianceStatus } from '../systems/compliance';

function ComplianceBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 500) : 0;
  const displayPct = max > 0 ? Math.round((value / max) * 100) : 100;
  const color = displayPct >= 100 ? 'bg-green' : displayPct >= 50 ? 'bg-amber' : 'bg-red';
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-14 text-ink-soft font-semibold shrink-0">{label}</span>
      <div className="flex-1 bg-surface-2 rounded h-2 overflow-hidden">
        <div className={`h-full rounded transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`font-mono w-12 text-right ${displayPct >= 100 ? 'text-green' : displayPct >= 50 ? 'text-amber' : 'text-red'}`}>
        {value}/{max}
      </span>
    </div>
  );
}

function NodeSlot({ node, rackId, slotIndex }: { node: ServerNode | null; rackId: string; slotIndex: number }) {
  const sellNode = useGameStore(s => s.sellNode);
  const setNodeScale = useGameStore(s => s.setNodeScale);

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
    <div className="border border-border rounded-lg bg-surface-2 p-2 group">
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

      {(node.category === 'web_server' || node.category === 'database' || node.category === 'caching') && (
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] text-ink-soft">Scale {node.scaleLevel}/5</span>
          <div className="flex gap-1">
            <button
              onClick={() => setNodeScale(rackId, slotIndex, -1)}
              disabled={node.scaleLevel <= 1}
              className="p-0.5 rounded bg-surface-2 border border-border hover:bg-ink/5 disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-2.5 h-2.5 text-ink-soft" />
            </button>
            <button
              onClick={() => setNodeScale(rackId, slotIndex, 1)}
              disabled={node.scaleLevel >= 5}
              className="p-0.5 rounded bg-surface-2 border border-border hover:bg-ink/5 disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5 text-ink-soft" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RackCard({ rack }: { rack: ServerRack }) {
  const sellRack = useGameStore(s => s.sellRack);
  const clearRack = useGameStore(s => s.clearRack);

  const coolingPct = rack.coolingCapacity > 0
    ? Math.round((rack.coolingUsed / rack.coolingCapacity) * 100)
    : 0;
  const hasNodes = rack.slots.some(s => s.node !== null);

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

      <div className="flex gap-2">
        {hasNodes && (
          <button
            onClick={() => clearRack(rack.id)}
            className="text-[11px] font-semibold px-3 py-1.5 bg-surface-2 hover:bg-amber-soft hover:text-amber border border-border rounded-lg transition-colors cursor-pointer"
          >
            Clear Nodes
          </button>
        )}
        <button
          onClick={() => sellRack(rack.id)}
          disabled={hasNodes && rack.plotId !== null}
          className="text-[11px] font-semibold px-3 py-1.5 bg-surface-2 hover:bg-red-soft hover:text-red border border-border rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          title={hasNodes && rack.plotId !== null ? 'Clear nodes first' : `Sell rack (refund $${Math.floor(rack.price * 0.5)})`}
        >
          Sell
        </button>
      </div>
    </div>
  );
}

export function ServerPanel() {
  const rentedServers = useGameStore(s => s.rentedServers);
  const cancelRental = useGameStore(s => s.cancelRental);
  const features = useGameStore(s => s.features);
  const racks = useGameStore(s => s.racks);
  const [shopOpen, setShopOpen] = useState(false);

  const hasFeatures = features.some(f => f.level > 0);
  const compliance = hasFeatures ? getComplianceStatus(features, racks) : null;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-sm font-bold text-ink">Server Infrastructure</h2>
        <button
          onClick={() => setShopOpen(o => !o)}
          className="text-[11px] font-semibold px-3 py-1.5 bg-indigo hover:bg-indigo/90 text-white rounded-lg transition-colors cursor-pointer"
        >
          {shopOpen ? 'Close' : 'Shop'}
        </button>
      </div>

      {/* Compliance bars */}
      {compliance && (
        <div className="card p-3 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Server Compliance</span>
            <span className={`text-[10px] font-semibold ${compliance.overall === 'ok' ? 'text-green' : compliance.overall === 'partial' ? 'text-amber' : 'text-red'}`}>
              {compliance.overall === 'ok' ? 'OK' : compliance.overall === 'partial' ? 'Partial' : 'Critical'}
            </span>
          </div>
          <ComplianceBar label="Compute" value={compliance.compute.provided} max={compliance.compute.required} />
          <ComplianceBar label="Data" value={compliance.data.provided} max={compliance.data.required} />
          <ComplianceBar label="Network" value={compliance.network.provided} max={compliance.network.required} />
          <ComplianceBar label="Security" value={compliance.security.provided} max={compliance.security.provided || 1} />
          {compliance.overall !== 'ok' && (
            <div className="text-[10px] text-ink-soft pt-1 border-t border-border mt-1">
              {compliance.overall === 'critical' ? 'Service offline — insufficient hardware' : 'Users capped — upgrade hardware'}
            </div>
          )}
        </div>
      )}

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
            {rentedServers.map(r => {
              const loadColor = r.load > 90 ? 'bg-red' : r.load > 70 ? 'bg-amber' : 'bg-green';
              return (
                <div key={r.id} className="card px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold text-ink">{r.label}</span>
                      <span className="text-[11px] text-ink-soft ml-2">{r.capacityRps} RPS · {r.storage} st · {Math.round(r.uptime * 100)}%</span>
                    </div>
                    <button onClick={() => cancelRental(r.id)} className="text-[11px] text-red hover:text-red/80 font-semibold cursor-pointer">
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-border rounded h-1.5">
                      <div className={`h-1.5 rounded transition-all ${loadColor}`} style={{ width: `${Math.min(r.load, 100)}%` }} />
                    </div>
                    <span className={`text-[10px] font-mono ${r.load > 90 ? 'text-red' : 'text-ink-soft'}`}>{r.load}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
