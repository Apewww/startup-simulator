import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { calcPlayerOwnership } from '../systems/wealth';
import type { CompetitorSector } from '../types';
import { TrendingUp, Building2 } from 'lucide-react';

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

export function StockMarketPanel({ search = '' }: { search?: string }) {
  const competitors = useGameStore((s) => s.competitors);
  const personalCash = useGameStore((s) => s.personalCash);
  const totalEquityGiven = useGameStore((s) => s.totalEquityGiven);
  const currentUsers = useGameStore((s) => s.currentUsers);
  const buyShares = useGameStore((s) => s.buyShares);
  const sellShares = useGameStore((s) => s.sellShares);
  const buybackShares = useGameStore((s) => s.buybackShares);
  const [buyAmounts, setBuyAmounts] = useState<Record<string, string>>({});
  const [sellAmounts, setSellAmounts] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [buybackPct, setBuybackPct] = useState('10');

  const activeCompetitors = competitors
    .filter(c => !c.delisted && c.valuation > 0)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const playerOwnership = calcPlayerOwnership(totalEquityGiven);
  const aiOwnership = 100 - playerOwnership;
  const companyVal = Math.max(1, currentUsers * 80);
  const buybackCost = Math.round(companyVal * (Math.min(Number(buybackPct) || 0, aiOwnership) / 100) * 1.2);

  function handleBuy(compId: string) {
    const amount = parseInt(buyAmounts[compId] || '0');
    if (amount <= 0) return;
    buyShares(compId, amount);
    setBuyAmounts(prev => ({ ...prev, [compId]: '' }));
  }

  function handleSell(compId: string) {
    const amount = parseInt(sellAmounts[compId] || '0');
    if (amount <= 0) return;
    sellShares(compId, amount);
    setSellAmounts(prev => ({ ...prev, [compId]: '' }));
  }

  function getPlayerOwnership(comp: typeof activeCompetitors[0]): number {
    return comp.ownership?.find(o => o.ownerId === 'player')?.percentage ?? 0;
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Market</span>
        <span className="text-[10px] text-ink-soft font-mono">Wealth: {fmtCash(personalCash)}</span>
      </div>

      {/* Player's own company buyback section */}
      {aiOwnership > 0 && (
        <div className="bg-indigo-soft/40 border border-indigo/20 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-indigo" />
            <span className="font-semibold text-[10px]">Your Company Shares</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-ink-soft">You hold</span>
            <span className="font-mono font-semibold text-green">{playerOwnership}%</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-ink-soft">External / AI hold</span>
            <span className="font-mono font-semibold text-red">{aiOwnership}%</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-green transition-all" style={{ width: `${playerOwnership}%` }} />
            <div className="h-full rounded-full bg-red transition-all -mt-1.5" style={{ width: `${aiOwnership}%`, marginLeft: `${playerOwnership}%` }} />
          </div>
          {aiOwnership > 0 && (
            <div className="flex gap-1.5 pt-1">
              <input type="number" min={1} max={aiOwnership} value={buybackPct}
                onChange={e => setBuybackPct(e.target.value)}
                className="w-16 bg-surface border border-border rounded px-1.5 py-1 text-[10px] font-mono text-ink outline-none focus:border-indigo" />
              <button onClick={() => buybackShares(Number(buybackPct) || 0)}
                disabled={personalCash < buybackCost}
                className="flex-1 px-2 py-1 bg-indigo text-white text-[10px] font-semibold rounded hover:bg-indigo/90 transition-colors cursor-pointer disabled:opacity-40">
                Buy back {Number(buybackPct) || 0}% for {fmtCash(buybackCost)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI competitor shares */}
      {activeCompetitors.map(comp => {
        const playerPct = getPlayerOwnership(comp);
        const isSelected = selectedId === comp.id;
        return (
          <div key={comp.id}>
            <div onClick={() => setSelectedId(isSelected ? null : comp.id)}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg border border-border hover:bg-surface-2 cursor-pointer text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: SECTOR_COLORS[comp.sector] }} />
                <span className="font-semibold truncate">{comp.name}</span>
                <TrendingUp className="w-3 h-3 text-green shrink-0" />
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="font-mono text-[10px] text-ink-soft">${comp.sharePrice}</span>
                <span className="font-mono font-semibold w-14 text-right">{fmtCash(comp.valuation)}</span>
                {playerPct > 0 && <span className="text-[9px] text-indigo font-semibold">{playerPct.toFixed(1)}%</span>}
              </div>
            </div>
            {isSelected && (
              <div className="mt-1 mb-1.5 px-3 py-2 bg-surface-2 rounded-lg border border-border space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-ink-soft">
                  <span>Price per share</span>
                  <span className="font-mono font-semibold text-ink">${comp.sharePrice}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-ink-soft">
                  <span>Valuation</span>
                  <span className="font-mono font-semibold text-ink">{fmtCash(comp.valuation)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-ink-soft">
                  <span>Total shares</span>
                  <span className="font-mono font-semibold text-ink">{comp.totalShares.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-ink-soft">
                  <div className="flex justify-between mb-0.5">
                    <span>Your ownership</span>
                    <span className="font-mono font-semibold text-indigo">{playerPct.toFixed(2)}%</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo transition-all" style={{ width: `${playerPct}%` }} />
                  </div>
                  <div className="flex justify-between mt-0.5 text-[8px]">
                    <span>Available: {(100 - playerPct).toFixed(1)}%</span>
                    <span className="text-indigo">{playerPct.toFixed(1)}% owned</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <div className="flex-1 flex gap-1">
                    <input type="number" min={1} max={comp.totalShares} placeholder="Buy"
                      value={buyAmounts[comp.id] ?? ''}
                      onChange={e => setBuyAmounts(p => ({ ...p, [comp.id]: e.target.value }))}
                      className="w-full bg-surface border border-border rounded px-1.5 py-1 text-[10px] font-mono text-ink outline-none focus:border-green" />
                    <button onClick={() => handleBuy(comp.id)}
                      className="px-2 py-1 bg-green/20 text-green text-[10px] font-semibold rounded hover:bg-green/30 transition-colors cursor-pointer shrink-0">Buy</button>
                  </div>
                  {playerPct > 0 && (
                    <div className="flex-1 flex gap-1">
                      <input type="number" min={1} max={comp.totalShares} placeholder="Sell"
                        value={sellAmounts[comp.id] ?? ''}
                        onChange={e => setSellAmounts(p => ({ ...p, [comp.id]: e.target.value }))}
                        className="w-full bg-surface border border-border rounded px-1.5 py-1 text-[10px] font-mono text-ink outline-none focus:border-red" />
                      <button onClick={() => handleSell(comp.id)}
                        className="px-2 py-1 bg-red/20 text-red text-[10px] font-semibold rounded hover:bg-red/30 transition-colors cursor-pointer shrink-0">Sell</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}