import { useGameStore } from '../store/gameStore';
import { Handshake, Target, DollarSign, CheckCircle, XCircle, BadgeDollarSign } from 'lucide-react';

function fmtCash(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
}

function satisfactionColor(n: number): string {
  if (n >= 70) return '#17A366';
  if (n >= 40) return '#B7791F';
  return '#D1453B';
}

function satisfactionLabel(n: number): string {
  if (n >= 80) return 'Happy';
  if (n >= 60) return 'Satisfied';
  if (n >= 40) return 'Concerned';
  if (n >= 20) return 'Unhappy';
  return 'Hostile';
}

export function InvestorRelationsPanel() {
  const boardSatisfaction = useGameStore((s) => s.boardSatisfaction);
  const currentQuarter = useGameStore((s) => s.currentQuarter);
  const quarterlyTargets = useGameStore((s) => s.quarterlyTargets);
  const quarterlyHistory = useGameStore((s) => s.quarterlyHistory);
  const termSheet = useGameStore((s) => s.termSheet);
  const totalEquityGiven = useGameStore((s) => s.totalEquityGiven);
  const acceptTermSheet = useGameStore((s) => s.acceptTermSheet);
  const declineTermSheet = useGameStore((s) => s.declineTermSheet);
  const month = useGameStore((s) => s.month);
  const pendingFundingRounds = useGameStore((s) => s.pendingFundingRounds);
  const acceptFundingRound = useGameStore((s) => s.acceptFundingRound);
  const declineAllFundingRounds = useGameStore((s) => s.declineAllFundingRounds);

  return (
    <div className="space-y-2 text-[11px]">
      {/* Board satisfaction */}
      <div className="bg-surface-2 border border-border rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Handshake className="w-3.5 h-3.5" style={{ color: satisfactionColor(boardSatisfaction) }} />
            <span className="font-semibold text-xs">Board Satisfaction</span>
          </div>
          <span className="text-[10px] font-bold" style={{ color: satisfactionColor(boardSatisfaction) }}>
            {boardSatisfaction}% — {satisfactionLabel(boardSatisfaction)}
          </span>
        </div>
        <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden border border-border/50">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${boardSatisfaction}%`, backgroundColor: satisfactionColor(boardSatisfaction) }} />
        </div>
        <div className="flex justify-between text-[9px] text-ink-soft">
          <span>Q{currentQuarter} • Month {month}</span>
          <span>Equity given: {totalEquityGiven}%</span>
        </div>
      </div>

      {/* Term sheet */}
      {termSheet && (
        <div className="bg-indigo-soft/60 border border-indigo/20 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-indigo" />
            <span className="font-semibold text-xs text-indigo">Term Sheet: {termSheet.investorName}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
            <span className="text-ink-soft">Amount:</span><span className="font-semibold text-right">{fmtCash(termSheet.amount)}</span>
            <span className="text-ink-soft">Equity:</span><span className="font-semibold text-right">{termSheet.equityGiven}%</span>
            <span className="text-ink-soft">Board Seats:</span><span className="font-semibold text-right">{termSheet.boardSeats}</span>
            <span className="text-ink-soft">Vesting:</span><span className="font-semibold text-right">{termSheet.vestingMonths}mo</span>
            <span className="text-ink-soft">Veto Rights:</span><span className="font-semibold text-right">{termSheet.vetoRights ? 'Yes' : 'No'}</span>
            <span className="text-ink-soft">Personality:</span><span className="font-semibold text-right capitalize">{termSheet.investorPersonality}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={acceptTermSheet}
              className="flex-1 px-2 py-1.5 bg-indigo text-white rounded-lg text-[10px] font-semibold hover:bg-indigo/90 transition-colors cursor-pointer">
              Accept
            </button>
            <button onClick={declineTermSheet}
              className="flex-1 px-2 py-1.5 bg-surface-2 border border-border rounded-lg text-[10px] font-semibold hover:bg-surface transition-colors cursor-pointer text-ink">
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Quarterly targets */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-ink-soft">
          <Target className="w-3 h-3" />
          <span className="font-semibold text-[10px]">Q{currentQuarter} Targets</span>
        </div>
        {quarterlyTargets.length === 0 && (
          <div className="text-center py-4 text-ink-soft border border-dashed border-border rounded-lg text-[10px]">
            Targets will be generated at the start of each quarter
          </div>
        )}
        {quarterlyTargets.map(t => {
          const pct = t.targetValue > 0 ? Math.min(100, Math.round((t.currentValue / t.targetValue) * 100)) : 0;
          const isMet = t.currentValue >= t.targetValue;
          return (
            <div key={t.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border">
              <div className="min-w-0 flex-1 mr-2">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[10px]">{t.label}</span>
                  {isMet && <CheckCircle className="w-2.5 h-2.5 text-green shrink-0" />}
                  {!isMet && t.currentValue > 0 && <XCircle className="w-2.5 h-2.5 text-amber shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-ink-soft mt-0.5">
                  <span className={isMet ? 'text-green font-semibold' : ''}>{fmtCompact(t.currentValue)}</span>
                  <span>/ {fmtCompact(t.targetValue)}</span>
                  <span className={`ml-auto ${isMet ? 'text-green' : 'text-amber'}`}>
                    {isMet ? `+${fmtCash(t.reward)}` : `-${t.penalty} sat`}
                  </span>
                </div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full ${isMet ? 'bg-green' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Funding Offers */}
      {pendingFundingRounds.length > 0 && (
        <div className="bg-green-soft/40 border border-green/20 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <BadgeDollarSign className="w-3.5 h-3.5 text-green" />
            <span className="font-semibold text-xs text-green">Funding Offers ({pendingFundingRounds.length} AI)</span>
          </div>
          {pendingFundingRounds.map((offer, idx) => (
            <div key={offer.id} className="bg-surface-2 border border-border rounded p-1.5 text-[10px] space-y-0.5">
              <div className="font-semibold text-ink">{offer.aiName}</div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Offers</span>
                <span className="font-semibold">{fmtCash(offer.amount)} for {offer.equityGiven}%</span>
              </div>
              <button onClick={() => acceptFundingRound(idx)}
                className="w-full mt-1 px-2 py-1 bg-green text-white rounded-lg text-[10px] font-semibold hover:bg-green/90 transition-colors cursor-pointer">
                Accept
              </button>
            </div>
          ))}
          <button onClick={declineAllFundingRounds}
            className="w-full px-2 py-1 bg-surface-2 border border-border rounded-lg text-[10px] font-semibold hover:bg-surface transition-colors cursor-pointer text-ink">
            Decline All
          </button>
        </div>
      )}

      {/* History */}
      {quarterlyHistory.length > 0 && (
        <details className="mt-1">
          <summary className="text-[10px] text-ink-soft cursor-pointer hover:text-ink font-semibold">
            Quarterly Reports ({quarterlyHistory.length})
          </summary>
          <div className="mt-1 space-y-1">
            {quarterlyHistory.map(r => {
              const metCount = r.targets.filter(t => t.met).length;
              return (
                <div key={r.quarter} className="px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Q{r.quarter}</span>
                    <span className={r.satisfactionDelta >= 0 ? 'text-green' : 'text-red'}>
                      {r.satisfactionDelta >= 0 ? '+' : ''}{r.satisfactionDelta}% · ${r.bonusCash}
                    </span>
                  </div>
                  <span className="text-[9px] text-ink-soft">{metCount}/{r.targets.length} targets met</span>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
