import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Handshake, Target, CheckCircle, XCircle, BadgeDollarSign, Clock, AlertTriangle } from 'lucide-react';

function fmtCash(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
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

type Tab = 'offers' | 'history';

export function InvestorRelationsPanel() {
  const boardSatisfaction = useGameStore((s) => s.boardSatisfaction);
  const currentQuarter = useGameStore((s) => s.currentQuarter);
  const quarterlyTargets = useGameStore((s) => s.quarterlyTargets);
  const quarterlyHistory = useGameStore((s) => s.quarterlyHistory);
  const totalEquityGiven = useGameStore((s) => s.totalEquityGiven);
  const month = useGameStore((s) => s.month);
  const pendingFundingRounds = useGameStore((s) => s.pendingFundingRounds);
  const acceptFundingRound = useGameStore((s) => s.acceptFundingRound);
  const declineAllFundingRounds = useGameStore((s) => s.declineAllFundingRounds);
  const fundingRounds = useGameStore((s) => s.fundingRounds);
  const aiStakes = useGameStore((s) => s.aiStakes);
  const [tab, setTab] = useState<Tab>('offers');

  return (
    <div className="flex flex-col min-h-0" style={{ height: '100%' }}>
      {/* Always-visible top: Board satisfaction + equity + AI stakes */}
      <div className="shrink-0 space-y-1.5 mb-2">
        <div className="bg-surface-2 border border-border rounded-lg p-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Handshake className="w-3.5 h-3.5" style={{ color: satisfactionColor(boardSatisfaction) }} />
              <span className="font-semibold text-[10px]">Board</span>
            </div>
            <span className="text-[9px] font-bold" style={{ color: satisfactionColor(boardSatisfaction) }}>
              {boardSatisfaction}% — {satisfactionLabel(boardSatisfaction)}
            </span>
          </div>
          <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${boardSatisfaction}%`, backgroundColor: satisfactionColor(boardSatisfaction) }} />
          </div>
          <div className="flex justify-between text-[9px] text-ink-soft">
            <span>Q{currentQuarter} • M{month}</span>
            <span>Equity given: {totalEquityGiven}%</span>
          </div>
        </div>

        {/* AI Stakeholders summary */}
        {aiStakes.length > 0 && (
          <div className="space-y-0.5">
            <div className="text-[9px] text-ink-soft font-semibold uppercase tracking-wider">AI Stakeholders</div>
            {aiStakes.map(s => (
              <div key={s.aiId} className="flex items-center justify-between px-2 py-1 rounded bg-surface-2 border border-border text-[10px]">
                <span className="font-semibold truncate">{s.name}</span>
                <span className={`font-mono ${s.percentage >= 20 ? 'text-amber font-bold' : 'text-ink-soft'}`}>{s.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5">
        {tab === 'offers' && (
          <>
            {/* Quarter targets (always visible in Offers tab) */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-ink-soft">
                <Target className="w-3 h-3" />
                <span className="font-semibold text-[10px]">Q{currentQuarter} Targets</span>
              </div>
              {quarterlyTargets.length === 0 ? (
                <div className="text-center py-3 text-ink-soft border border-dashed border-border rounded-lg text-[10px]">Targets generated each quarter</div>
              ) : quarterlyTargets.map(t => {
                const pct = t.targetValue > 0 ? Math.min(100, Math.round((t.currentValue / t.targetValue) * 100)) : 0;
                const isMet = t.currentValue >= t.targetValue;
                return (
                  <div key={t.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-surface-2 border border-border">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-[10px]">{t.label}</span>
                        {isMet ? <CheckCircle className="w-2.5 h-2.5 text-green shrink-0" /> : <XCircle className="w-2.5 h-2.5 text-amber shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-ink-soft mt-0.5">
                        <span className={isMet ? 'text-green font-semibold' : ''}>{fmtCompact(t.currentValue)}</span>
                        <span>/ {fmtCompact(t.targetValue)}</span>
                        <span className={`ml-auto ${isMet ? 'text-green' : 'text-amber'}`}>{isMet ? `+${fmtCash(t.reward)}` : `-${t.penalty} sat`}</span>
                      </div>
                      <div className="w-full h-1 bg-surface rounded-full overflow-hidden mt-0.5">
                        <div className={`h-full rounded-full ${isMet ? 'bg-green' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Funding Offers + Demands */}
            {pendingFundingRounds.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-ink-soft">
                  <BadgeDollarSign className="w-3 h-3 text-green" />
                  <span className="font-semibold text-[10px] text-green">Pending ({pendingFundingRounds.length})</span>
                </div>
                {pendingFundingRounds.map((offer, idx) => (
                  <div key={offer.id} className={`rounded-lg p-2 border space-y-1 ${offer.type === 'demand' ? 'bg-red-soft/20 border-red/20' : 'bg-green-soft/30 border-green/20'}`}>
                    <div className="flex items-center gap-1">
                      {offer.type === 'demand' ? <AlertTriangle className="w-3 h-3 text-red shrink-0" /> : <BadgeDollarSign className="w-3 h-3 text-green shrink-0" />}
                      <span className={`font-semibold text-[10px] ${offer.type === 'demand' ? 'text-red' : 'text-green'}`}>{offer.aiName}</span>
                      {offer.type === 'demand' && <span className="text-[8px] px-1 py-[1px] rounded bg-red/20 text-red font-bold">DEMAND</span>}
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-ink-soft">{offer.type === 'demand' ? 'Forced dilution' : 'Offers'}</span>
                      <span className="font-semibold">{fmtCash(offer.amount)} for {offer.equityGiven}%</span>
                    </div>
                    {offer.type === 'demand' && (
                      <div className="text-[9px] text-red/80">Declining may lower board satisfaction</div>
                    )}
                    <button onClick={() => acceptFundingRound(idx)}
                      className={`w-full mt-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer text-white ${offer.type === 'demand' ? 'bg-red hover:bg-red/90' : 'bg-green hover:bg-green/90'}`}>
                      {offer.type === 'demand' ? 'Accept Demand' : 'Accept Offer'}
                    </button>
                  </div>
                ))}
                <button onClick={declineAllFundingRounds}
                  className="w-full px-2 py-1 bg-surface-2 border border-border rounded-lg text-[10px] font-semibold hover:bg-surface transition-colors cursor-pointer text-ink">
                  {pendingFundingRounds.some(o => o.type === 'demand') ? 'Reject All (may affect board)' : 'Decline All'}
                </button>
              </div>
            )}
            {pendingFundingRounds.length === 0 && (
              <div className="text-center py-4 text-ink-soft border border-dashed border-border rounded-lg text-[10px]">
                No pending offers or demands
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <div className="space-y-1.5">
            {/* Quarterly Reports */}
            {quarterlyHistory.length > 0 && (
              <div className="space-y-1">
                <div className="text-[9px] text-ink-soft font-semibold uppercase tracking-wider">Quarterly Reports</div>
                {[...quarterlyHistory].reverse().map(r => {
                  const metCount = r.targets.filter(t => t.met).length;
                  return (
                    <div key={r.quarter} className="px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Q{r.quarter}</span>
                        <span className={r.satisfactionDelta >= 0 ? 'text-green' : 'text-red'}>{r.satisfactionDelta >= 0 ? '+' : ''}{r.satisfactionDelta}%</span>
                      </div>
                      <span className="text-[9px] text-ink-soft">{metCount}/{r.targets.length} targets met · ${r.bonusCash} bonus</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Funding Round History */}
            {fundingRounds.length > 0 && (
              <div className="space-y-1">
                <div className="text-[9px] text-ink-soft font-semibold uppercase tracking-wider">Funding History</div>
                {[...fundingRounds].reverse().map(r => (
                  <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-2 border border-border">
                    <div>
                      <span className="font-semibold text-[10px]">Round {r.round}</span>
                      <span className="text-[9px] text-ink-soft ml-1.5">M{r.month}</span>
                      {r.id.startsWith('demand') && <span className="text-[8px] ml-1 px-1 py-[1px] rounded bg-red/20 text-red font-bold">DEMAND</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-green">{r.accepted ? `+${fmtCash(r.amount)}` : 'Declined'}</span>
                      {r.accepted && r.equityGiven > 0 && <span className="text-[9px] text-ink-soft">{r.equityGiven}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {quarterlyHistory.length === 0 && fundingRounds.length === 0 && (
              <div className="text-center py-4 text-ink-soft border border-dashed border-border rounded-lg text-[10px]">No history yet</div>
            )}
          </div>
        )}
      </div>

      {/* Sticky footer tabs */}
      <div className="flex gap-1 pt-2 border-t border-border sticky bottom-0 bg-surface shrink-0 mt-2">
        <button onClick={() => setTab('offers')}
          className={`flex items-center justify-center gap-1 flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${tab === 'offers' ? 'bg-indigo-soft text-indigo border border-indigo/20' : 'text-ink-soft hover:text-ink border border-transparent'}`}>
          <BadgeDollarSign className="w-3 h-3" />
          Offers
          {pendingFundingRounds.length > 0 && <span className="w-2 h-2 rounded-full bg-green animate-pulse" />}
        </button>
        <button onClick={() => setTab('history')}
          className={`flex items-center justify-center gap-1 flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${tab === 'history' ? 'bg-indigo-soft text-indigo border border-indigo/20' : 'text-ink-soft hover:text-ink border border-transparent'}`}>
          <Clock className="w-3 h-3" />
          History
        </button>
      </div>
    </div>
  );
}