import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { CompetitorSector } from '../types';
import { Flame, ChevronDown, ChevronUp } from 'lucide-react';

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

const DEFAULT_TOP = 20;
const NEIGHBOR_RADIUS = 3;

function fmtValuation(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function fmtUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
}

function TrendArrow({ growthRate }: { growthRate: number }) {
  if (growthRate > 0.03) return <span className="text-green text-[9px]">▲</span>;
  if (growthRate < -0.01) return <span className="text-red text-[9px]">▼</span>;
  return <span className="text-ink-soft text-[9px]">—</span>;
}

function EntryRow({ entry, rank, isMaximized }: { entry: any; rank: number; isMaximized: boolean }) {
  const trend = entry.growthRate > 0.03 ? 'up' : entry.growthRate < -0.01 ? 'down' : 'flat';
  const isHot = entry.hotSectorBadgeTicks > 0;
  const isNew = entry.newBadgeTicks > 0 && !entry.isPlayer;

  const bgColor = rank === 1 ? 'bg-amber-soft/60 border-amber/20'
    : rank === 2 ? 'bg-surface-2 border-border'
    : rank === 3 ? 'bg-surface-2 border-border'
    : isNew ? 'bg-blue-soft/40 border-blue/20'
    : isHot && !isNew ? 'bg-orange-soft/40 border-orange/20'
    : entry.isPlayer ? 'bg-indigo-soft border-indigo/20'
    : 'border-transparent hover:bg-surface-2';

  return (
    <div className={`flex items-center justify-between px-2 rounded-lg border ${rank === 1 ? 'py-2 text-xs' : 'py-1.5 text-[11px]'} ${bgColor} ${entry.personality === 'aggressive' && rank > 3 && !isNew && !isHot ? 'border-l-2 border-l-red/50' : ''}`}>
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className={`w-5 text-center font-bold shrink-0 ${rank === 1 ? 'text-base' : rank === 2 ? 'text-sm' : rank === 3 ? 'text-sm' : 'text-[11px]'}`}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : (
            <span className="text-[11px] text-ink-soft">#{rank}</span>
          )}
        </span>
        <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: SECTOR_COLORS[entry.sector] }} />
        <span className={`font-semibold truncate ${rank === 1 ? 'font-bold' : ''}`}>{entry.name}</span>
        {isMaximized && <span className="text-[8px] px-1 py-[1px] rounded-sm font-semibold shrink-0 leading-none" style={{ backgroundColor: SECTOR_COLORS[entry.sector] + '20', color: SECTOR_COLORS[entry.sector] }}>{SECTOR_LABELS[entry.sector]}</span>}
        {entry.isPlayer && <span className="text-[9px] text-indigo font-semibold shrink-0">(You)</span>}
        {isNew && <span className="text-[8px] px-1 py-[1px] rounded-sm bg-green-soft text-green font-bold shrink-0 leading-none">NEW</span>}
        {isHot && <Flame className="w-3 h-3 text-orange-500 shrink-0" />}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className="text-[10px] text-ink-soft font-mono w-12 text-right">{fmtUsers(entry.userCount)}</span>
        <span className={`font-mono text-right ${rank <= 3 ? 'font-bold' : 'font-semibold'} w-16 ${trend === 'up' ? 'text-green' : trend === 'down' ? 'text-red' : ''}`}>{fmtValuation(entry.valuation)}</span>
        <TrendArrow growthRate={entry.growthRate} />
      </div>
    </div>
  );
}

export function CompetitorPanel() {
  const competitors = useGameStore((s) => s.competitors);
  const currentUsers = useGameStore((s) => s.currentUsers);
  const selectedProduct = useGameStore((s) => s.selectedProduct);
  const companyName = useGameStore((s) => s.companyName);
  const maximizedPanel = useGameStore((s) => s.maximizedPanel);
  const isMaximized = maximizedPanel === 'competitor';
  const [showAll, setShowAll] = useState(false);

  const activeCompetitors = competitors.filter(c => !c.delisted);
  // ponytail: proper player valuation via formula when revenue/cohesion available in panel
  const playerValuation = currentUsers > 0 ? currentUsers * 80 : 0;

  const allEntries: any[] = [];

  if (currentUsers > 0) {
    allEntries.push({
      id: 'player', name: companyName || 'You',
      sector: (selectedProduct as CompetitorSector) ?? 'social_media',
      valuation: playerValuation, userCount: currentUsers,
      growthRate: 0, personality: 'balanced',
      isPlayer: true, hotSectorBadgeTicks: 0, newBadgeTicks: 0,
    });
  }
  for (const c of activeCompetitors) {
    allEntries.push({ id: c.id, name: c.name, sector: c.sector, valuation: c.valuation, userCount: c.userCount, growthRate: c.growthRate, personality: c.personality, isPlayer: false, hotSectorBadgeTicks: c.hotSectorBadgeTicks, newBadgeTicks: c.newBadgeTicks });
  }
  allEntries.sort((a, b) => b.valuation - a.valuation);

  const playerEntry = currentUsers > 0 ? allEntries.find(e => e.isPlayer) : null;
  const playerRank = playerEntry ? allEntries.indexOf(playerEntry) + 1 : null;
  const totalActive = allEntries.length;

  // Determine which entries to show
  let visibleEntries: { entry: any; rank: number }[];
  if (showAll) {
    visibleEntries = allEntries.map((e, i) => ({ entry: e, rank: i + 1 }));
  } else {
    const top = allEntries.slice(0, DEFAULT_TOP).map((e, i) => ({ entry: e, rank: i + 1 }));
    visibleEntries = top;
    // If player outside top 20, add player + neighbors
    if (playerEntry && playerRank && playerRank > DEFAULT_TOP) {
      const start = Math.max(DEFAULT_TOP, playerRank - NEIGHBOR_RADIUS - 1);
      const end = Math.min(totalActive, playerRank + NEIGHBOR_RADIUS);
      // Add separator then player neighborhood
      visibleEntries.push({ entry: null, rank: -1 } as any); // separator
      for (let i = start; i < end; i++) {
        visibleEntries.push({ entry: allEntries[i], rank: i + 1 });
      }
    }
  }

  return (
    <div className="space-y-1">
      {currentUsers === 0 && (
        <div className="text-center py-6 text-ink-soft border border-dashed border-border rounded-lg text-xs">
          Get users first to enter the market
        </div>
      )}

      <div className={`${!showAll ? 'max-h-[400px] overflow-y-auto' : ''} space-y-1`}>
        {visibleEntries.map((item, idx) => {
          if (!item.entry) {
            // Separator
            return (
              <div key={`sep-${idx}`} className="flex items-center gap-2 px-2 py-1">
                <span className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-ink-soft font-semibold shrink-0">··· #{playerRank} ···</span>
                <span className="flex-1 h-px bg-border" />
              </div>
            );
          }
          return <EntryRow key={item.entry.id} entry={item.entry} rank={item.rank} isMaximized={isMaximized} />;
        })}
      </div>

      {totalActive > DEFAULT_TOP && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] text-ink-soft hover:text-ink font-semibold transition-colors cursor-pointer rounded-lg hover:bg-surface-2"
        >
          {showAll ? <><ChevronUp className="w-3 h-3" /> Show Top {DEFAULT_TOP}</> : <><ChevronDown className="w-3 h-3" /> Show All ({totalActive} ranked)</>}
        </button>
      )}

      {/* Player outside top 20 — alternative sticky bottom (when not in showAll mode) */}
      {!showAll && currentUsers > 0 && playerEntry && playerRank && playerRank > DEFAULT_TOP && (
        <div className="sticky bottom-0 mt-2 pt-2 border-t border-border bg-surface">
          <EntryRow entry={playerEntry} rank={playerRank} isMaximized={isMaximized} />
        </div>
      )}

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
