import { Plus, MapPin } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { RackCard } from './ServerPanel';

export function LandMap() {
  const plots = useGameStore((s) => s.plots);
  const racks = useGameStore((s) => s.racks);
  const buyPlot = useGameStore((s) => s.buyPlot);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plots.map(plot => {
            const plotRacks = racks.filter(r => r.plotId === plot.id);
            return (
              <div key={plot.id} className="rounded-xl border border-[#7C3AED]/40 bg-gray-800/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-100">{plot.label}</span>
                  <span className="text-[10px] text-gray-500">${plot.monthlyCost}/mo</span>
                </div>
                {plotRacks.length === 0 ? (
                  <div className="text-xs text-gray-500 py-3 text-center border border-dashed border-gray-700 rounded">
                    Empty — buy a rack in the Shop
                  </div>
                ) : (
                  <div className="space-y-2">
                    {plotRacks.map(rack => (
                      <RackCard key={rack.id} rack={rack} />
                    ))}
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
