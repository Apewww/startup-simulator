import { Globe, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { REGIONS, calcRegionRevenueMult, calcRegionGrowthMult, calcRegionMaintenance, getRegionDef } from '../data/regions';
import { checkRegionCompliance, calcTotalPenalties } from '../systems/regulatory';

export function RegionPanel() {
  const products = useGameStore((s) => s.products);
  const activeProductId = useGameStore((s) => s.activeProductId);
  const cash = useGameStore((s) => s.cash);
  const activeProduct = activeProductId ? products[activeProductId] : null;

  if (!activeProduct) return <div className="p-3 text-xs text-ink-soft">No active product</div>;

  const expanded = activeProduct.expandedRegions;
  const regionMult = calcRegionRevenueMult(expanded);
  const growthMult = calcRegionGrowthMult(expanded);
  const monthlyMaintenance = calcRegionMaintenance(expanded);
  const penalties = calcTotalPenalties(expanded, activeProduct.features);

  return (
    <div className="p-3 space-y-3 text-xs">
      <h2 className="font-bold text-ink">Global Expansion</h2>
      <p className="text-[10px] text-ink-soft">Expand your product to new regions. Each region boosts revenue but requires compliance.</p>

      {expanded.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-2 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green">+{(regionMult * 100).toFixed(0)}%</div>
            <div className="text-[9px] text-ink-soft">Revenue Bonus</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-ink">{growthMult.toFixed(2)}x</div>
            <div className="text-[9px] text-ink-soft">Growth</div>
          </div>
          {penalties > 0 ? (
            <div className="bg-red/10 rounded-lg p-2 text-center border border-red/20">
              <div className="text-lg font-bold text-red">${penalties.toLocaleString()}</div>
              <div className="text-[9px] text-red/80">Penalties/mo</div>
            </div>
          ) : (
            <div className="bg-surface-2 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-ink">${monthlyMaintenance.toLocaleString()}</div>
              <div className="text-[9px] text-ink-soft">Maintenance/mo</div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {REGIONS.map((region) => {
          const isExpanded = expanded.includes(region.id);
          const checks = isExpanded ? checkRegionCompliance(region.id, activeProduct.features) : [];
          const regionPenalty = calcTotalPenalties([region.id], activeProduct.features);
          const canAfford = cash >= region.entryCost;

          return (
            <div key={region.id} className={`rounded-xl border p-3 ${isExpanded ? 'border-indigo/40' : 'border-border bg-surface-2'}`}>
              <RegionHeader regionId={region.id} isExpanded={isExpanded} />

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-ink-soft mb-2">
                <span>Revenue: <strong className="text-ink">+{(region.revenueMult * 100).toFixed(0)}%</strong></span>
                <span>Growth: <strong className="text-ink">{region.growthMult}x</strong></span>
                {isExpanded && <span>Maintenance: <strong className="text-ink">${region.monthlyMaintenance.toLocaleString()}/mo</strong></span>}
              </div>

              {isExpanded ? (
                <div className="space-y-1 mb-2">
                  {checks.length === 0 && <div className="text-[10px] text-green flex items-center gap-1"><CheckCircle className="w-3 h-3" />No compliance required</div>}
                  {checks.map((c, i) => (
                    <div key={i} className={`text-[10px] flex items-center gap-1 ${c.compliant ? 'text-green' : 'text-red'}`}>
                      {c.compliant ? <CheckCircle className="w-3 h-3 shrink-0" /> : <AlertTriangle className="w-3 h-3 shrink-0" />}
                      <span>{c.law.name}: {c.compliant ? 'Compliant' : c.reason} {!c.compliant && <span className="text-red/80">(-${c.law.penalty.toLocaleString()}/mo)</span>}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex justify-end">
                {isExpanded ? (
                  <button
                    onClick={() => useGameStore.getState().addNotification('Use withdrawFromRegion to exit', 'info')}
                    className="text-[10px] text-red hover:text-red/80 font-semibold px-2 py-1 rounded-lg hover:bg-red/10 transition-colors cursor-pointer"
                  >
                    Withdraw
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const s = useGameStore.getState();
                      if (s.cash < region.entryCost) { s.addNotification(`Need $${region.entryCost.toLocaleString()} to expand`, 'warning'); return; }
                      const prod = s.products[s.activeProductId!];
                      if (!prod) return;
                      const newRegions = [...prod.expandedRegions, region.id];
                      s.products[s.activeProductId!] = { ...prod, expandedRegions: newRegions };
                      useGameStore.setState({ cash: s.cash - region.entryCost, products: { ...s.products } });
                      s.addNotification(`Expanded to ${region.name}!`, 'success');
                    }}
                    disabled={!canAfford}
                    className={`text-[10px] font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      canAfford ? 'bg-indigo hover:bg-indigo/90 text-white' : 'bg-surface-2 text-ink-soft border border-border cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? `Expand ($${region.entryCost.toLocaleString()})` : `Need $${region.entryCost.toLocaleString()}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegionHeader({ regionId, isExpanded }: { regionId: string; isExpanded: boolean }) {
  const def = getRegionDef(regionId);
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <Globe className={`w-4 h-4 ${isExpanded ? 'text-indigo' : 'text-ink-soft'}`} strokeWidth={1.75} />
      <span className="font-semibold text-ink text-sm">{def?.name ?? regionId}</span>
      {isExpanded && <span className="text-[9px] px-1.5 py-0.5 bg-green/10 text-green border border-green/20 rounded font-medium">Expanded</span>}
      <span className="text-[9px] text-ink-soft ml-auto">{def?.description}</span>
    </div>
  );
}
