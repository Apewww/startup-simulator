import { useState } from 'react';
import { CompetitorPanel } from './CompetitorPanel';
import { StockMarketPanel } from './StockMarketPanel';
import { BarChart3, TrendingUp } from 'lucide-react';

type Tab = 'leaderboard' | 'stocks';

export function MarketPanel() {
  const [tab, setTab] = useState<Tab>('leaderboard');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {tab === 'leaderboard' ? <CompetitorPanel /> : <StockMarketPanel />}
      </div>
      {/* Footer tabs */}
      <div className="flex gap-1 pt-2 border-t border-border mt-2">
        <button onClick={() => setTab('leaderboard')}
          className={`flex items-center justify-center gap-1 flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            tab === 'leaderboard' ? 'bg-indigo-soft text-indigo border border-indigo/20' : 'text-ink-soft hover:text-ink border border-transparent'
          }`}>
          <BarChart3 className="w-3 h-3" />
          Leaderboard
        </button>
        <button onClick={() => setTab('stocks')}
          className={`flex items-center justify-center gap-1 flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            tab === 'stocks' ? 'bg-indigo-soft text-indigo border border-indigo/20' : 'text-ink-soft hover:text-ink border border-transparent'
          }`}>
          <TrendingUp className="w-3 h-3" />
          Stocks
        </button>
      </div>
    </div>
  );
}