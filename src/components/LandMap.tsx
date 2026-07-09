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
          <MapPin className="w-4 h-4 text-[#F97316]" />
          <span className="text-xs font-['Space_Grotesk'] uppercase tracking-wider text-gray-400">
            Data Center Land ({plots.length})
          </span>
        </div>
        <button
          onClick={() => buyPlot()}
          disabled={cash < 1500}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Buy Plot ($1500)
        </button>
      </div>

      {plots.length === 0 ? (
        <div className="text-center text-gray-500 py-6 border border-dashed border-gray-700 rounded-lg text-sm">
          No land yet. Buy a plot to build your own data center.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {plots.map(plot => {
            const plotRacks = racks.filter(r => r.plotId === plot.id);
            const totalNodes = plotRacks.reduce((s, r) => s + r.slots.filter(sl => sl.node).length, 0);
            return (
              <div key={plot.id} className="rounded-xl border border-[#7C3AED]/40 bg-gray-800/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-100">{plot.label}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                      {plot.gridCols}x{plot.gridRows}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">
                      {plotRacks.length} racks · {totalNodes} nodes
                    </span>
                    <span className="text-[10px] text-gray-500">${plot.monthlyCost}/mo</span>
                    <button
                      onClick={() => setActiveView({ type: 'server', plotId: plot.id })}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </button>
                  </div>
                </div>
                {plotRacks.length === 0 ? (
                  <div className="text-xs text-gray-500 py-2 text-center border border-dashed border-gray-700 rounded">
                    Empty — buy racks & nodes from Inventory
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {plotRacks.map(rack => {
                      const nodeCount = rack.slots.filter(s => s.node).length;
                      const coolingPct = rack.coolingCapacity > 0 ? Math.round((rack.coolingUsed / rack.coolingCapacity) * 100) : 0;
                      return (
                        <div key={rack.id}
                          className={`text-[10px] px-2 py-1 rounded border cursor-default ${
                            rack.isOverheating
                              ? 'border-red-500/50 bg-red-900/20 text-red-300'
                              : nodeCount === 0
                                ? 'border-gray-700/50 bg-gray-800/80 text-gray-400'
                                : 'border-[#7C3AED]/40 bg-[#7C3AED]/10 text-gray-300'
                          }`}>
                          <div className="font-medium">{rack.label}</div>
                          <div className="flex gap-2 text-[9px] opacity-70">
                            <span>{nodeCount}/{rack.maxSlots}</span>
                            <span className={coolingPct > 90 ? 'text-red-400' : ''}>{coolingPct}%</span>
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
