import { useGameStore } from '../store/gameStore';
import type { CompetitorSector } from '../types';

const SECTOR_COLORS: Record<CompetitorSector, string> = {
  social_media: '#4F5EFF',
  ecommerce: '#17A366',
  search_engine: '#B7791F',
};

function fmtCash(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

export function PortfolioPanel() {
  const competitors = useGameStore((s) => s.competitors);
  const totalDividendsReceived = useGameStore((s) => s.totalDividendsReceived);

  const investments = competitors.filter(c => !c.delisted && c.ownership.some(o => o.ownerId === 'player'));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Your Holdings</span>
        <span className="text-[10px] text-ink-soft font-mono">Dividends: {fmtCash(totalDividendsReceived)}</span>
      </div>
      {investments.length === 0 ? (
        <div className="text-center py-6 text-ink-soft text-xs border border-dashed border-border rounded-lg">
          No investments yet. Buy shares in the Stock Market.
        </div>
      ) : (
        investments.map(comp => {
          const stake = comp.ownership.find(o => o.ownerId === 'player')!;
          const estMonthlyDividend = Math.round(comp.monthlyRevenue * (stake.percentage / 100));
          return (
            <div key={comp.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg border border-border hover:bg-surface-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: SECTOR_COLORS[comp.sector] }} />
                <span className="font-semibold truncate">{comp.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] text-indigo font-semibold">{stake.percentage.toFixed(2)}%</span>
                <span className="text-[10px] text-ink-soft font-mono w-14 text-right">{fmtCash(comp.valuation)}</span>
                <span className="text-[9px] text-green font-mono">+{fmtCash(estMonthlyDividend)}/mo</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}