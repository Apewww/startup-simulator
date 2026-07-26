import { Handshake, TrendingUp, Banknote } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function FundingPanel() {
  const fundingRounds = useGameStore((s) => s.fundingRounds);
  const pendingFundingRounds = useGameStore((s) => s.pendingFundingRounds);
  const acceptFundingRound = useGameStore((s) => s.acceptFundingRound);
  const declineAllFundingRounds = useGameStore((s) => s.declineAllFundingRounds);
  const month = useGameStore((s) => s.month);

  const offer = pendingFundingRounds.length > 0 ? pendingFundingRounds[0] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <Handshake className="w-4 h-4 text-indigo" />
        <span className="text-xs font-bold text-ink">Funding Rounds</span>
        <span className="text-[10px] text-ink-soft ml-auto">{fundingRounds.length} rounds</span>
      </div>

      {offer ? (
        <div className="card border-2 border-indigo/40 bg-indigo-soft/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-green" />
            <span className="text-sm font-bold text-green">${offer.amount.toLocaleString()}</span>
            <span className="text-[11px] text-ink-soft">for {offer.equityGiven}% equity</span>
          </div>
          <div className="text-[11px] text-ink-soft">
            {offer.aiName} · Month {month}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => acceptFundingRound(0)}
              className="flex-1 px-3 py-1.5 bg-green hover:bg-green/90 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Accept
            </button>
            <button
              onClick={declineAllFundingRounds}
              className="flex-1 px-3 py-1.5 bg-surface-2 hover:bg-red-soft hover:text-red border border-border text-xs font-semibold rounded-lg transition-colors cursor-pointer text-ink-soft"
            >
              Decline
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-ink-soft border border-dashed border-border rounded-lg">
          <TrendingUp className="w-6 h-6 mx-auto mb-1 opacity-40" strokeWidth={1.5} />
          <p className="text-xs">No pending offers.</p>
          <p className="text-[10px] mt-0.5">Grow your users & revenue to attract investors.</p>
        </div>
      )}
    </div>
  );
}