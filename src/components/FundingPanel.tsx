import { Handshake, TrendingUp, Banknote } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getTrafficStats } from '../systems/traffic';
import { calculateRevenue } from '../systems/monetization';

export function FundingPanel() {
  const { fundingRounds, pendingFunding, acceptFunding, declineFunding, features, month } = useGameStore();
  const traffic = getTrafficStats(features);
  const revenue = features.length > 0 ? calculateRevenue(traffic.users, features, []) : { total: 0 };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <Handshake className="w-4 h-4 text-indigo" />
        <span className="text-xs font-bold text-ink">Funding Rounds</span>
        <span className="text-[10px] text-ink-soft ml-auto">{fundingRounds.length} rounds</span>
      </div>

      {pendingFunding ? (
        <div className="card border-2 border-indigo/40 bg-indigo-soft/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-green" />
            <span className="text-sm font-bold text-green">${pendingFunding.amount.toLocaleString()}</span>
            <span className="text-[11px] text-ink-soft">for {pendingFunding.equityGiven}% equity</span>
          </div>
          <div className="text-[11px] text-ink-soft">
            Round {pendingFunding.round} · Month {pendingFunding.month}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={acceptFunding}
              className="flex-1 px-3 py-1.5 bg-green hover:bg-green/90 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Accept
            </button>
            <button
              onClick={declineFunding}
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

      <div className="pt-1">
        <div className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">Eligibility</div>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-ink-soft">Users</span>
            <span className="font-mono text-ink">{traffic.users.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Revenue</span>
            <span className="font-mono text-ink">${revenue.total}/mo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Months active</span>
            <span className="font-mono text-ink">{month}</span>
          </div>
          {fundingRounds.length > 0 ? (
            <div className="flex justify-between">
              <span className="text-ink-soft">Last round</span>
              <span className="font-mono text-ink">Month {fundingRounds[fundingRounds.length - 1].month}</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-ink-soft">Next offer in</span>
              <span className="font-mono text-ink">6 months</span>
            </div>
          )}
        </div>
      </div>

      {fundingRounds.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">History</div>
          <div className="space-y-1">
            {fundingRounds.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1 px-2 bg-surface-2 border border-border rounded-lg">
                <div>
                  <span className="text-xs font-semibold text-ink">Round {r.round}</span>
                  <span className="text-[10px] text-ink-soft ml-2">M{r.month}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-green">{r.accepted ? `+$${r.amount.toLocaleString()}` : 'Declined'}</span>
                  {r.accepted && <span className="text-[10px] text-ink-soft">{r.equityGiven}% equity</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}