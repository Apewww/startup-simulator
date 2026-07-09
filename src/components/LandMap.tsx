import { Plus, MapPin, ExternalLink } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function LandMap() {
  const plots = useGameStore((s) => s.plots);
  const racks = useGameStore((s) => s.racks);
  const buyPlot = useGameStore((s) => s.buyPlot);
  const setActiveView = useGameStore((s) => s.setActiveView);
  const cash = useGameStore((s) => s.cash);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Data Center Land ({plots.length})
          </span>
        </div>
        <button
          onClick={() => buyPlot()}
          disabled={cash < 1500}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-profit hover:bg-green-600 text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Buy Plot ($1500)
        </button>
      </div>

      {plots.length === 0 ? (
        <div className="text-center text-text-muted py-6 border-2 border-dashed border-border text-sm">
          No land yet. Buy a plot to build your own data center.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {plots.map(plot => {
            const plotRacks = racks.filter(r => r.plotId === plot.id);
            const totalNodes = plotRacks.reduce((s, r) => s + r.slots.filter(sl => sl.node).length, 0);
            return (
              <div key={plot.id} className="border-2 border-primary/40 bg-bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{plot.label}</span>
                    <span className="text-[10px] text-text-muted bg-bg-surface px-1.5 py-0.5 border border-border">
                      {plot.gridCols}x{plot.gridRows}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">
                      {plotRacks.length} racks · {totalNodes} nodes
                    </span>
                    <span className="text-[10px] text-text-muted">${plot.monthlyCost}/mo</span>
                    <button
                      onClick={() => setActiveView({ type: 'server', plotId: plot.id })}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-primary hover:bg-steel text-white transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </button>
                  </div>
                </div>
                {plotRacks.length === 0 ? (
                  <div className="text-xs text-text-muted py-2 text-center border-2 border-dashed border-border">
                    Empty — buy racks & nodes from Inventory
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {plotRacks.map(rack => {
                      const nodeCount = rack.slots.filter(s => s.node).length;
                      const coolingPct = rack.coolingCapacity > 0 ? Math.round((rack.coolingUsed / rack.coolingCapacity) * 100) : 0;
                      return (
                        <div key={rack.id}
                          className={`text-[10px] px-2 py-1 border-2 ${
                            rack.isOverheating
                              ? 'border-danger bg-danger/10 text-danger'
                              : nodeCount === 0
                                ? 'border-border bg-bg-surface text-text-muted'
                                : 'border-primary/40 bg-primary/10 text-text-secondary'
                          }`}>
                          <div className="font-medium">{rack.label}</div>
                          <div className="flex gap-2 text-[9px] opacity-70">
                            <span>{nodeCount}/{rack.maxSlots}</span>
                            <span className={coolingPct > 90 ? 'text-danger' : ''}>{coolingPct}%</span>
                            <span>{rack.powerDraw}pw</span>
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