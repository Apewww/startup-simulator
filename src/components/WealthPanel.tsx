import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../data/achievements';
import { calcMaxWithdrawal, calcPlayerOwnership, getCurrentTitle, getNextAchievement } from '../systems/wealth';
import { ArrowUpFromLine, Trophy } from 'lucide-react';

function fmtCash(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

export function WealthPanel() {
  const cash = useGameStore((s) => s.cash);
  const personalCash = useGameStore((s) => s.personalCash);
  const lifetimeWithdrawn = useGameStore((s) => s.lifetimeWithdrawn);
  const unlockedTitles = useGameStore((s) => s.unlockedTitles);
  const totalEquityGiven = useGameStore((s) => s.totalEquityGiven);
  const withdrawPersonal = useGameStore((s) => s.withdrawPersonal);

  const [amount, setAmount] = useState('10000');

  const ownership = calcPlayerOwnership(totalEquityGiven);
  const maxWithdraw = calcMaxWithdrawal(cash, ownership);
  const currentTitle = getCurrentTitle(personalCash, unlockedTitles);
  const nextAchievement = getNextAchievement(personalCash, unlockedTitles);


  const withdrawAmount = Math.min(Math.max(0, Number(amount) || 0), maxWithdraw);

  return (
    <div className="space-y-2 text-[11px]">
      {/* Current title */}
      {currentTitle && (
        <div className="bg-indigo-soft/60 border border-indigo/20 rounded-lg p-2.5 text-center">
          <span className="text-lg">{currentTitle.icon}</span>
          <div className="font-bold text-xs text-indigo mt-0.5">{currentTitle.label}</div>
          <div className="text-[9px] text-ink-soft">Current Title</div>
        </div>
      )}

      {/* Personal wealth summary */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-surface-2 border border-border rounded-lg p-2">
          <div className="text-[9px] text-ink-soft">Personal Cash</div>
          <div className="font-bold text-sm text-green">{fmtCash(personalCash)}</div>
        </div>
        <div className="bg-surface-2 border border-border rounded-lg p-2">
          <div className="text-[9px] text-ink-soft">Ownership</div>
          <div className="font-bold text-sm" style={{ color: ownership > 50 ? '#17A366' : '#D1453B' }}>{ownership}%</div>
        </div>
        <div className="bg-surface-2 border border-border rounded-lg p-2">
          <div className="text-[9px] text-ink-soft">Company Cash</div>
          <div className="font-bold text-sm">{fmtCash(cash)}</div>
        </div>
        <div className="bg-surface-2 border border-border rounded-lg p-2">
          <div className="text-[9px] text-ink-soft">Lifetime Withdrawn</div>
          <div className="font-bold text-sm text-ink">{fmtCash(lifetimeWithdrawn)}</div>
        </div>
      </div>

      {/* Withdrawal */}
      <div className="bg-surface-2 border border-border rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <ArrowUpFromLine className="w-3 h-3 text-indigo" />
          <span className="font-semibold text-[10px]">Withdraw Funds</span>
        </div>
        <div className="flex gap-1.5">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min={0}
            max={maxWithdraw}
            className="flex-1 bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-ink outline-none focus:border-indigo transition-colors"
          />
          <button
            onClick={() => setAmount(maxWithdraw.toString())}
            className="px-2 py-1 bg-surface-2 border border-border rounded-md text-[10px] text-ink-soft hover:text-ink cursor-pointer"
          >
            Max
          </button>
        </div>
        <div className="flex justify-between text-[9px] text-ink-soft">
          <span>Max withdrawable: {fmtCash(maxWithdraw)}</span>
          <span>({ownership}% × {fmtCash(cash)})</span>
        </div>
        <button
          onClick={() => withdrawPersonal(withdrawAmount)}
          disabled={withdrawAmount <= 0}
          className="w-full px-3 py-1.5 bg-indigo text-white rounded-lg text-[10px] font-semibold hover:bg-indigo/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Withdraw {fmtCash(withdrawAmount)}
        </button>
      </div>

      {/* Next achievement progress */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-ink-soft">
          <Trophy className="w-3 h-3" />
          <span className="font-semibold text-[10px]">Achievements</span>
        </div>
        <div className="space-y-1">
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedTitles.includes(a.id);
            return (
              <div key={a.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${unlocked ? 'bg-green-soft/30 border-green/20' : 'bg-surface-2 border-border'}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{a.icon}</span>
                  <div className="min-w-0">
                    <div className={`text-[10px] font-semibold ${unlocked ? 'text-green' : 'text-ink-soft'}`}>
                      {a.label}
                      {nextAchievement?.id === a.id && !unlocked && (
                        <span className="ml-1.5 text-[8px] px-1 py-[1px] rounded-sm bg-amber-soft text-amber font-bold">NEXT</span>
                      )}
                    </div>
                    <div className="text-[8px] text-ink-soft">{fmtCash(a.requirement)}</div>
                  </div>
                </div>
                <div className="shrink-0">
                  {unlocked ? (
                    <span className="text-green text-[10px]">✓</span>
                  ) : (
                    <span className="text-ink-soft text-[9px]">
                      {personalCash >= a.requirement ? '🔓' : '🔒'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Win condition info */}
      <div className="text-center text-[9px] text-ink-soft pt-1 border-t border-border">
        Billionaire title = win condition
      </div>
    </div>
  );
}
