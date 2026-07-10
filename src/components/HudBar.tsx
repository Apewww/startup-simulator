import { Play, Pause, Save, AlertTriangle, Handshake, Moon, Sun, TrendingUp, TrendingDown } from 'lucide-react';
import { useGameStore, TICKS_PER_MONTH, TICKS_PER_DAY } from '../store/gameStore';
import { getTrafficStats } from '../systems/traffic';

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

interface HudBarProps {
  onSave: () => void;
  saveMsg: string;
  onToggleTheme: () => void;
  darkMode: boolean;
}

export function HudBar({ onSave, saveMsg, onToggleTheme, darkMode }: HudBarProps) {
  const { tick, isPaused, speed, cash, month, features, togglePause, setSpeed, negativeCashMonths, pendingFunding, cashFlowHistory } = useGameStore();
  const trafficStats = getTrafficStats(features);
  const bankruptWarning = negativeCashMonths > 0;

  const day = Math.floor((tick % TICKS_PER_MONTH) / TICKS_PER_DAY) + 1;
  const displayMonth = (month % 12) + 1;
  const year = Math.floor(month / 12) + 1;
  const dayName = DAY_NAMES[(day - 1) % 7];
  const hour = Math.floor((tick % TICKS_PER_DAY) * (24 / TICKS_PER_DAY));
  const timeStr = `${String(hour).padStart(2, '0')}:00`;

  const lastNet = cashFlowHistory[cashFlowHistory.length - 1]?.net;
  const profitable = lastNet === undefined ? true : lastNet >= 0;
  const CashArrow = profitable ? TrendingUp : TrendingDown;
  const cashColor = profitable ? 'text-green' : 'text-red';

  return (
    <div className="shrink-0 bg-surface border-b border-border">
      {/* Progress bar — full width */}
      <div className="h-1 bg-surface-2">
        <div className="h-full bg-indigo transition-all duration-300" style={{ width: `${((tick % TICKS_PER_MONTH) / TICKS_PER_MONTH) * 100}%` }} />
      </div>

      {/* Info bar */}
      <div className="flex items-center h-[38px] px-4 gap-3 text-[11px]">
        {/* Left — date */}
        <div className="flex items-center gap-1.5 font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-sm bg-indigo" />
          <span className="text-ink">{dayName} — Day {day}, Month {displayMonth}, Year {year}</span>
        </div>

        {/* Alerts */}
        {bankruptWarning && (
          <span className="flex items-center gap-1 text-red text-xs font-bold shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" /> BANKRUPT in {3 - negativeCashMonths}m
          </span>
        )}
        {pendingFunding && (
          <button onClick={() => useGameStore.getState().togglePanel('finance')}
            className="flex items-center gap-1 px-2 py-1 bg-green-soft border border-green/30 rounded-lg text-green text-[10px] font-semibold animate-pulse cursor-pointer shrink-0">
            <Handshake className="w-3 h-3" /> Funding
          </button>
        )}

        <div className="flex-1" />

        {/* Right — stats */}
        <div className="flex items-center gap-4 text-ink-soft">
          <span className="font-mono font-semibold text-ink">{timeStr}</span>
          <span className="font-mono font-semibold text-ink">{trafficStats.users.toLocaleString()}</span>
          <span className={`flex items-center gap-0.5 font-mono font-bold ${cashColor}`}>
            <CashArrow className="w-3 h-3" strokeWidth={2.5} />
            {formatCash(cash)}
          </span>
        </div>

        {/* Speed controls */}
        <div className="flex gap-0.5 bg-surface-2 border border-ink/10 rounded-md p-[2px]">
          <button onClick={togglePause}
            className={`border-none px-[7px] py-[3px] text-[10px] font-semibold rounded cursor-pointer font-sans transition-colors ${isPaused ? 'bg-indigo text-white' : 'text-ink bg-transparent hover:bg-ink/[0.06]'}`}>
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
          {([1, 2, 4] as const).map((s) => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`border-none px-[7px] py-[3px] text-[10px] font-semibold rounded cursor-pointer font-sans transition-colors ${speed === s ? 'bg-indigo text-white' : 'text-ink bg-transparent hover:bg-ink/[0.06]'}`}>
              {s}x
            </button>
          ))}
        </div>

        {/* Theme + Save */}
        <button onClick={onToggleTheme} className="text-ink-soft hover:text-ink transition-colors cursor-pointer p-1" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onSave} className="bg-indigo text-white border-none px-3 py-1.5 rounded-md text-[10px] font-semibold cursor-pointer font-sans flex items-center gap-1">
          <Save className="w-3 h-3" /> Simpan
        </button>
        {saveMsg && <span className="text-[10px] text-green">{saveMsg}</span>}
      </div>
    </div>
  );
}