import { Play, Pause, Save, AlertTriangle } from 'lucide-react';
import { useGameStore, TICKS_PER_MONTH } from '../store/gameStore';
import { getTrafficStats } from '../systems/traffic';
import { calcMonthlyServerCost } from '../systems/server';

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

interface HudBarProps {
  onSave: () => void;
  saveMsg: string;
}

export function HudBar({ onSave, saveMsg }: HudBarProps) {
  const { tick, isPaused, speed, cash, month, racks, rentedServers, features, togglePause, setSpeed, negativeCashMonths } = useGameStore();
  const trafficStats = getTrafficStats(features);
  const serverCost = (racks.length > 0 || rentedServers.length > 0) ? calcMonthlyServerCost(racks, rentedServers) : 0;
  const bankruptWarning = negativeCashMonths > 0;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 bg-bg-surface border-b-2 border-border">
      <h1 className="text-lg tracking-wider text-text-primary font-semibold mr-2">
        STARTUP<span className="text-primary">SIM</span>
      </h1>

      <Stat label="CASH" value={formatCash(cash)} color={cash < 0 ? '#DC2626' : '#22C55E'} always />
      <Stat label="USERS" value={trafficStats.users.toLocaleString()} color="#3B82F6" />
      <Stat label="RPS" value={trafficStats.rps.toLocaleString()} color="#D97706" />
      <Stat label="MONTH" value={String(month)} color="#F0F0F0" />
      <Stat label="DAY" value={`${(tick % TICKS_PER_MONTH) + 1}/${TICKS_PER_MONTH}`} color="#9CA3AF" />
      {serverCost > 0 && <Stat label="SERVER/mo" value={formatCash(serverCost)} color="#D97706" />}

      {bankruptWarning && (
        <span className="flex items-center gap-1 text-danger font-bold text-xs">
          <AlertTriangle className="w-4 h-4" /> BANKRUPT in {3 - negativeCashMonths}m
        </span>
      )}

      <div className="flex items-center gap-1 ml-auto flex-wrap">
        <button
          onClick={togglePause}
          className="flex items-center gap-1 px-3 min-h-[40px] md:min-h-0 md:py-1.5 text-sm md:text-xs bg-primary hover:bg-steel text-white transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Pause className="w-4 h-4 md:w-3.5 md:h-3.5" />}
          {isPaused ? 'Play' : 'Pause'}
        </button>
        {([1, 2, 4] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-3 min-h-[40px] md:min-h-0 md:px-2.5 md:py-1.5 text-sm md:text-xs font-mono transition-colors cursor-pointer border ${
              speed === s ? 'bg-primary text-white border-primary' : 'bg-bg-card text-text-secondary border-border hover:bg-bg-hover'
            }`}
          >
            {s}x
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={onSave} className="flex items-center gap-1 px-3 min-h-[40px] md:min-h-0 md:px-2.5 md:py-1.5 text-sm md:text-xs bg-profit hover:bg-green-600 text-white transition-colors cursor-pointer">
          <Save className="w-4 h-4 md:w-3.5 md:h-3.5" /> Save
        </button>
        {saveMsg && <span className="text-xs text-profit ml-1 w-full sm:w-auto mt-1 sm:mt-0">{saveMsg}</span>}
      </div>
    </div>
  );
}

function Stat({ label, value, color, always }: { label: string; value: string; color: string; always?: boolean }) {
  return (
    <div className={`flex flex-col leading-tight ${always ? '' : 'hidden sm:flex'}`}>
      <span className="text-[9px] font-mono text-text-muted tracking-widest">{label}</span>
      <span className="font-mono text-sm" style={{ color }}>
        {value}
      </span>
    </div>
  );
}