import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../data/achievements';
import { calcMaxWithdrawal, calcPlayerOwnership, getCurrentTitle, getNextAchievement } from '../systems/wealth';
import { ArrowUpFromLine, ArrowDownToLine, Trophy, History, Briefcase } from 'lucide-react';
import { PortfolioPanel } from './PortfolioPanel';

type Tab = 'withdraw' | 'deposit' | 'history' | 'portfolio' | 'achievements';

const TABS: { id: Tab; label: string; icon: typeof Trophy }[] = [
  { id: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
  { id: 'history', label: 'History', icon: History },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'achievements', label: 'Titles', icon: Trophy },
];

function fmtCash(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function fmtDate(month: number): string {
  const y = Math.floor(month / 12) + 1;
  const m = (month % 12) + 1;
  return `Y${y}M${m}`;
}

function iconForType(type: string): string {
  switch (type) {
    case 'withdraw': return '↑';
    case 'deposit': return '↓';
    case 'dividend': return '📊';
    case 'stock_buy': return '📈';
    case 'stock_sell': return '💵';
    default: return '•';
  }
}

function colorForType(type: string): string {
  switch (type) {
    case 'withdraw': return '#D1453B';
    case 'deposit': return '#17A366';
    case 'dividend': return '#4F5EFF';
    case 'stock_buy': return '#B7791F';
    case 'stock_sell': return '#17A366';
    default: return '#6B7280';
  }
}

export function WealthPanel() {
  const cash = useGameStore((s) => s.cash);
  const personalCash = useGameStore((s) => s.personalCash);
  const lifetimeWithdrawn = useGameStore((s) => s.lifetimeWithdrawn);
  const unlockedTitles = useGameStore((s) => s.unlockedTitles);
  const totalEquityGiven = useGameStore((s) => s.totalEquityGiven);
  const withdrawPersonal = useGameStore((s) => s.withdrawPersonal);
  const depositToCompany = useGameStore((s) => s.depositToCompany);
  const wealthLog = useGameStore((s) => s.wealthLog);
  const month = useGameStore((s) => s.month);

  const [activeTab, setActiveTab] = useState<Tab>('withdraw');
  const [amount, setAmount] = useState('10000');

  const ownership = calcPlayerOwnership(totalEquityGiven);
  const maxWithdraw = calcMaxWithdrawal(cash, ownership);
  const currentTitle = getCurrentTitle(personalCash, unlockedTitles);
  const nextAchievement = getNextAchievement(personalCash, unlockedTitles);

  const withdrawAmount = Math.min(Math.max(0, Number(amount) || 0), maxWithdraw);
  const depositAmount = Math.min(Math.max(0, Number(amount) || 0), personalCash);

  return (
    <div className="space-y-2 text-[11px]">
      {/* Current title */}
      {currentTitle && (
        <div className="bg-indigo-soft/60 border border-indigo/20 rounded-lg p-2 text-center">
          <span className="text-base">{currentTitle.icon}</span>
          <div className="font-bold text-xs text-indigo mt-0.5">{currentTitle.label}</div>
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
          <div className="text-[9px] text-ink-soft">Lifetime Net</div>
          <div className="font-bold text-sm text-ink">{fmtCash(lifetimeWithdrawn)}</div>
        </div>
      </div>

      {/* Tabs — grid 3 kolom */}
      <div className="grid grid-cols-3 gap-1">
        {TABS.map(tab => {
          const isLastRow = tab.id === 'portfolio' || tab.id === 'achievements';
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${isLastRow && tab.id === 'achievements' ? 'col-span-1' : ''} ${
                activeTab === tab.id ? 'bg-indigo-soft text-indigo border border-indigo/20' : 'text-ink-soft hover:text-ink border border-transparent'
              }`}>
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'withdraw' && (
        <div className="bg-surface-2 border border-border rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ArrowUpFromLine className="w-3 h-3 text-red" />
            <span className="font-semibold text-[10px]">Withdraw to Personal</span>
          </div>
          <div className="flex gap-1.5">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0} max={maxWithdraw}
              className="flex-1 bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-ink outline-none focus:border-indigo transition-colors" />
            <button onClick={() => setAmount(maxWithdraw.toString())}
              className="px-2 py-1 bg-surface-2 border border-border rounded-md text-[10px] text-ink-soft hover:text-ink cursor-pointer">Max</button>
          </div>
          <div className="flex justify-between text-[9px] text-ink-soft">
            <span>Max: {fmtCash(maxWithdraw)}</span>
            <span>({ownership}% × {fmtCash(cash)})</span>
          </div>
          <button onClick={() => withdrawPersonal(withdrawAmount)} disabled={withdrawAmount <= 0}
            className="w-full px-3 py-1.5 bg-indigo text-white rounded-lg text-[10px] font-semibold hover:bg-indigo/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            Withdraw {fmtCash(withdrawAmount)}
          </button>
        </div>
      )}

      {activeTab === 'deposit' && (
        <div className="bg-surface-2 border border-border rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ArrowDownToLine className="w-3 h-3 text-green" />
            <span className="font-semibold text-[10px]">Deposit to Company</span>
          </div>
          <div className="flex gap-1.5">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0} max={personalCash}
              className="flex-1 bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-ink outline-none focus:border-green transition-colors" />
            <button onClick={() => setAmount(personalCash.toString())}
              className="px-2 py-1 bg-surface-2 border border-border rounded-md text-[10px] text-ink-soft hover:text-ink cursor-pointer">Max</button>
          </div>
          <div className="text-[9px] text-ink-soft">Max deposit: {fmtCash(personalCash)}</div>
          <button onClick={() => depositToCompany(depositAmount)} disabled={depositAmount <= 0}
            className="w-full px-3 py-1.5 bg-green text-white rounded-lg text-[10px] font-semibold hover:bg-green/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            Deposit {fmtCash(depositAmount)}
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {wealthLog.length === 0 ? (
            <div className="text-center py-4 text-ink-soft text-[10px]">No wealth activity yet</div>
          ) : (
            [...wealthLog].reverse().map((e, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1 rounded bg-surface-2 border border-border text-[10px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span style={{ color: colorForType(e.type) }}>{iconForType(e.type)}</span>
                  <span className="text-ink-soft capitalize">{e.type.replace('_', ' ')}</span>
                  <span className="text-[8px] text-ink-soft">{fmtDate(e.month)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-semibold" style={{ color: e.amount >= 0 ? '#17A366' : '#D1453B' }}>
                    {e.amount >= 0 ? '+' : ''}{fmtCash(e.amount)}
                  </span>
                  <span className="text-[8px] text-ink-soft">{fmtCash(e.personalCash)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'portfolio' && (
        <PortfolioPanel />
      )}

      {activeTab === 'achievements' && (
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
                  {unlocked ? <span className="text-green text-[10px]">✓</span>
                    : <span className="text-ink-soft text-[9px]">{personalCash >= a.requirement ? '🔓' : '🔒'}</span>}
                </div>
              </div>
            );
          })}
          <div className="text-center text-[9px] text-ink-soft pt-1 border-t border-border">Billionaire = win condition</div>
        </div>
      )}
    </div>
  );
}
