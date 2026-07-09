import { Plus, MapPin, ExternalLink } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function LandMap() {
  const plots = useGameStore((s) => s.plots);
  const racks = useGameStore((s) => s.racks);
  const buyPlot = useGameStore((s) => s.buyPlot);
  const setActiveView = useGameStore((s) => s.setActiveView);
  const cash = useGameStore((s) => s.cash);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo" />
          <span className="text-[11px] font-semibold text-ink-soft">Data Center ({plots.length})</span>
        </div>
        <button
          onClick={() => buyPlot()}
          disabled={cash < 1500}
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-green hover:bg-green/90 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-3 h-3" /> Plot ($1500)
        </button>
      </div>

      {plots.length === 0 ? (
        <div className="text-center text-ink-soft py-5 border border-dashed border-border rounded-lg text-xs">
          No land yet. Buy a plot to build your data center.
        </div>
      ) : (
        <div className="space-y-1.5">
          {plots.map(plot => {
            const plotRacks = racks.filter(r => r.plotId === plot.id);
            const totalNodes = plotRacks.reduce((s, r) => s + r.slots.filter(sl => sl.node).length, 0);
            return (
              <div key={plot.id} className="card p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-ink">{plot.label}</span>
                    <span className="text-[9px] text-ink-soft bg-surface-2 px-1 py-0.5 border border-border rounded">{plot.gridCols}x{plot.gridRows}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-ink-soft">{plotRacks.length} racks · {totalNodes} nodes</span>
                    <button
                      onClick={() => setActiveView({ type: 'server', plotId: plot.id })}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-indigo hover:bg-indigo/90 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </button>
                  </div>
                </div>
                {plotRacks.length === 0 ? (
                  <div className="text-[11px] text-ink-soft py-2 text-center border border-dashed border-border rounded">Empty</div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {plotRacks.map(rack => {
                      const nodeCount = rack.slots.filter(s => s.node).length;
                      const coolingPct = rack.coolingCapacity > 0 ? Math.round((rack.coolingUsed / rack.coolingCapacity) * 100) : 0;
                      return (
                        <div key={rack.id}
                          className={`text-[9px] px-2 py-1 rounded-lg border ${
                            rack.isOverheating ? 'border-red bg-red-soft text-red' :
                            nodeCount === 0 ? 'border-border bg-surface-2 text-ink-soft' :
                            'border-indigo/30 bg-indigo-soft text-ink'
                          }`}>
                          <div className="font-semibold">{rack.label}</div>
                          <div className="flex gap-1.5 opacity-70">
                            <span>{nodeCount}/{rack.maxSlots}</span>
                            <span className={coolingPct > 90 ? 'text-red' : ''}>{coolingPct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}