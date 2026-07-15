import { useGameStore } from '../store/gameStore';
import type { CompetitorSector } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SECTOR_COLORS: Record<CompetitorSector, string> = {
  social_media: '#4F5EFF',
  ecommerce: '#17A366',
  search_engine: '#B7791F',
};

const SECTOR_LABELS: Record<CompetitorSector, string> = {
  social_media: 'Social Media',
  ecommerce: 'E-Commerce',
  search_engine: 'Search Engine',
};

function fmtValuation(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function fmtUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
}

export function CompetitorPanel() {
  const competitors = useGameStore((s) => s.competitors);
  const currentUsers = useGameStore((s) => s.currentUsers);
  const selectedProduct = useGameStore((s) => s.selectedProduct);
  const features = useGameStore((s) => s.features);

  const activeCompetitors = competitors.filter(c => !c.delisted);
  const playerValuation = currentUsers * 100;
  const hasFeatures = features.some(f => f.level > 0);

  // Build a merged ranked list: player + competitors
  const allEntries: { id: string; name: string; sector: CompetitorSector; valuation: number; userCount: number; growthRate: number; personality: string; isPlayer: boolean }[] = [];

  if (hasFeatures) {
    allEntries.push({
      id: 'player',
      name: 'You',
      sector: (selectedProduct as CompetitorSector) ?? 'social_media',
      valuation: playerValuation,
      userCount: currentUsers,
      growthRate: 0,
      personality: 'balanced',
      isPlayer: true,
    });
  }

  for (const c of activeCompetitors) {
    allEntries.push({
      id: c.id,
      name: c.name,
      sector: c.sector,
      valuation: c.valuation,
      userCount: c.userCount,
      growthRate: c.growthRate,
      personality: c.personality,
      isPlayer: false,
    });
  }

  allEntries.sort((a, b) => b.valuation - a.valuation);

  const top50 = allEntries.slice(0, 50);

  return (
    <div className="space-y-1">
      {!hasFeatures && (
        <div className="text-center py-6 text-ink-soft border border-dashed border-border rounded-lg text-xs">
          Build features first to enter the market
        </div>
      )}

      {top50.map((entry, idx) => {
        const trend = entry.growthRate > 0.03 ? 'up' : entry.growthRate < -0.01 ? 'down' : 'flat';
        return (
          <div
            key={entry.id}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] ${
              entry.isPlayer ? 'bg-indigo-soft border border-indigo/20' : 'hover:bg-surface-2'
            } ${entry.personality === 'aggressive' ? 'border-l-2 border-l-red/50' : ''}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-5 text-center font-bold shrink-0 ${idx < 3 && !entry.isPlayer ? 'text-amber' : 'text-ink-soft'}`}>
                {idx === 0 && !entry.isPlayer ? '🥇' : idx === 1 && !entry.isPlayer ? '🥈' : idx === 2 && !entry.isPlayer ? '🥉' : `#${idx + 1}`}
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SECTOR_COLORS[entry.sector] }} />
                <span className="font-semibold truncate max-w-[80px]">{entry.name}</span>
                <span className="text-[9px] text-ink-soft shrink-0 hidden sm:inline">{SECTOR_LABELS[entry.sector]}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-ink-soft font-mono w-12 text-right">{fmtUsers(entry.userCount)}</span>
              <span className="font-mono font-semibold w-16 text-right">{fmtValuation(entry.valuation)}</span>
              {entry.isPlayer ? null : trend === 'up' ? <TrendingUp className="w-3 h-3 text-green shrink-0" /> : trend === 'down' ? <TrendingDown className="w-3 h-3 text-red shrink-0" /> : <Minus className="w-3 h-3 text-ink-soft shrink-0" />}
            </div>
          </div>
        );
      })}

      {/* Delisted */}
      {competitors.some(c => c.delisted) && (
        <details className="mt-2">
          <summary className="text-[10px] text-ink-soft cursor-pointer hover:text-ink font-semibold">
            Delisted ({competitors.filter(c => c.delisted).length})
          </summary>
          <div className="mt-1 space-y-0.5">
            {competitors.filter(c => c.delisted).map(comp => (
              <div key={comp.id} className="flex items-center justify-between px-2 py-1 text-[10px] text-ink-soft">
                <span>{comp.name}</span>
                <span>{SECTOR_LABELS[comp.sector]}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
