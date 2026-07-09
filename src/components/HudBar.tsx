import { Play, Pause, Save, AlertTriangle, Handshake, Moon, Sun } from 'lucide-react';
import { useGameStore, TICKS_PER_MONTH } from '../store/gameStore';
import { getTrafficStats } from '../systems/traffic';

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
  const { tick, isPaused, speed, cash, month, features, togglePause, setSpeed, negativeCashMonths, pendingFunding } = useGameStore();
  const trafficStats = getTrafficStats(features);
  const bankruptWarning = negativeCashMonths > 0;

  return (
    <div className="flex items-center h-[52px] px-5 gap-7 bg-surface border-b border-border shrink-0">
      <div className="flex items-center gap-2 font-extrabold text-[15px] tracking-tight">
        <span className="w-2 h-2 rounded-sm bg-indigo" />
        STARTUP SIM
      </div>

      <Stat label="Cash" value={formatCash(cash)} color="green" always />
      <Stat label="Users" value={trafficStats.users.toLocaleString()} />
      <Stat label="RPS" value={trafficStats.rps.toLocaleString()} />
      <Stat label="Bulan / Hari" value={`M${month} · D${(tick % TICKS_PER_MONTH) + 1}/${TICKS_PER_MONTH}`} />

      {bankruptWarning && (
        <span className="flex items-center gap-1 text-red text-sm font-bold">
          <AlertTriangle className="w-4 h-4" /> BANKRUPT in {3 - negativeCashMonths}m
        </span>
      )}

      {pendingFunding && (
        <button
          onClick={() => useGameStore.getState().togglePanel('finance')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-soft border border-green/30 rounded-lg text-green text-xs font-semibold animate-pulse cursor-pointer"
        >
          <Handshake className="w-3.5 h-3.5" />
          Funding Offer
        </button>
      )}

      <div className="flex-1" />

      <div className="flex gap-1 bg-surface-2 border border-border rounded-lg p-[3px]">
        <button onClick={togglePause}
          className={`border-none bg-transparent px-[10px] py-[5px] text-xs font-semibold rounded-md cursor-pointer font-sans ${isPaused ? 'bg-indigo text-white' : 'text-ink-soft'}`}>
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
        </button>
        {([1, 2, 4] as const).map((s) => (
          <button key={s} onClick={() => setSpeed(s)}
            className={`border-none bg-transparent px-[10px] py-[5px] text-xs font-semibold rounded-md cursor-pointer font-sans ${speed === s ? 'bg-indigo text-white' : 'text-ink-soft'}`}>
            {s}x
          </button>
        ))}
      </div>

      <button onClick={onToggleTheme} className="bg-surface text-ink-soft border border-border hover:bg-surface-2 transition-colors px-3 py-2 rounded-lg cursor-pointer font-sans" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
        {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>
      <button onClick={onSave} className="bg-ink text-white border-none px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer font-sans">
        <Save className="w-3.5 h-3.5 inline-block mr-1" /> Simpan
      </button>
      {saveMsg && <span className="text-xs text-green ml-1">{saveMsg}</span>}
    </div>
  );
}

function Stat({ label, value, color, always }: { label: string; value: string; color?: string; always?: boolean }) {
  return (
    <div className={`flex flex-col gap-[1px] ${always ? '' : 'hidden sm:flex'}`}>
      <span className="text-[10px] text-ink-soft uppercase tracking-[.06em] font-semibold">{label}</span>
      <span className={`text-sm font-bold font-mono ${color === 'green' ? 'text-green' : 'text-ink'}`}>{value}</span>
    </div>
  );
}