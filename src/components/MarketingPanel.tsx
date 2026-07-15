import { useGameStore } from '../store/gameStore';
import { TICKS_PER_DAY } from '../constants';
import { MARKETING_CAMPAIGNS, getCampaignDef } from '../data/marketing';
import { Megaphone, X, TrendingUp } from 'lucide-react';

export function MarketingPanel() {
  const cash = useGameStore((s) => s.cash);
  const brandScore = useGameStore((s) => s.brandScore);
  const marketingCampaigns = useGameStore((s) => s.marketingCampaigns);
  const startCampaign = useGameStore((s) => s.startCampaign);
  const cancelCampaign = useGameStore((s) => s.cancelCampaign);

  const activeCampaign = marketingCampaigns.find(c => c.active);

  function fmtCash(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${Math.round(n).toLocaleString('en-US')}`;
  }

  return (
    <div>
      {/* Brand Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Brand Score</span>
          <span className="text-xs font-bold font-mono">{Math.round(brandScore)}/100</span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${brandScore}%`,
              backgroundColor: brandScore > 60 ? '#17A366' : brandScore > 30 ? '#B7791F' : '#D1453B',
            }}
          />
        </div>
      </div>

      {/* Active Campaign */}
      {activeCampaign && (() => {
        const def = getCampaignDef(activeCampaign.type);
        const progress = activeCampaign.durationTicks > 0
          ? (activeCampaign.ticksElapsed / activeCampaign.durationTicks) * 100
          : 0;
        const daysLeft = Math.ceil((activeCampaign.durationTicks - activeCampaign.ticksElapsed) / TICKS_PER_DAY);
        return (
          <div className="mb-3 p-2.5 bg-green-soft border border-green/20 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-green" />
                <span className="text-xs font-bold text-green">{def?.name ?? activeCampaign.type}</span>
              </div>
              <button
                onClick={() => cancelCampaign(activeCampaign.id)}
                className="p-1 rounded hover:bg-red-soft hover:text-red text-ink-soft transition-colors cursor-pointer"
                title="Cancel campaign"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-green rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-ink-soft">
              <span>+{activeCampaign.brandGain} brand over {daysLeft > 0 ? `${daysLeft}d` : 'finalizing'}</span>
            </div>
          </div>
        );
      })()}

      {/* Campaign History */}
      {marketingCampaigns.filter(c => !c.active).length > 0 && (
        <details className="mb-3">
          <summary className="text-[10px] text-ink-soft cursor-pointer hover:text-ink font-semibold">
            Past Campaigns ({marketingCampaigns.filter(c => !c.active).length})
          </summary>
          <div className="mt-1 space-y-0.5">
            {marketingCampaigns.filter(c => !c.active).map(c => {
              const def = getCampaignDef(c.type);
              return (
                <div key={c.id} className="flex items-center justify-between px-2 py-1 text-[10px] text-ink-soft">
                  <span>{def?.name ?? c.type}</span>
                  <span>+{c.brandGain} brand</span>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Available Campaigns */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Available Campaigns</div>
        {MARKETING_CAMPAIGNS.map(def => {
          const canAfford = cash >= def.cost;
          const isRunning = activeCampaign?.type === def.type;
          return (
            <div
              key={def.type}
              className={`p-2.5 rounded-lg border text-[11px] ${
                isRunning ? 'bg-green-soft border-green/20' : canAfford ? 'border-border hover:bg-surface-2' : 'border-border opacity-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink">{def.name}</div>
                  <div className="text-[10px] text-ink-soft mt-0.5">{def.description}</div>
                  <div className="flex gap-3 mt-1.5 text-[10px] text-ink-soft">
                    <span>+{def.brandGain} brand</span>
                    <span>{def.durationDays}d</span>
                    <span>{fmtCash(def.cost)}</span>
                    {def.growthBonus > 0 && <span className="flex items-center gap-0.5 text-green"><TrendingUp className="w-2.5 h-2.5" />+{Math.round(def.growthBonus * 100)}% growth</span>}
                    {def.churnReduction > 0 && <span className="text-green">-{Math.round(def.churnReduction * 100)}% churn</span>}
                    {def.moodBonus > 0 && <span className="text-indigo">+{def.moodBonus} mood</span>}
                  </div>
                </div>
                <button
                  onClick={() => startCampaign(def.type)}
                  disabled={!canAfford || !!activeCampaign}
                  className="ml-2 px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-indigo text-white hover:bg-indigo/90"
                >
                  {isRunning ? 'Active' : activeCampaign ? 'Full' : 'Start'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
