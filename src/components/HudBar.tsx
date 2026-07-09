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
    <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 bg-[rgba(10,14,39,0.95)] border-b-2 border-[#7C3AED] shadow-[0_0_12px_#7C3AED55]">
      <h1 className="font-['Space_Grotesk'] text-lg tracking-wider text-[#A78BFA] neon-glow mr-2">
        STARTUP<span className="text-[#F97316]">SIM</span>
      </h1>

      <Stat label="CASH" value={formatCash(cash)} color={cash < 0 ? '#FF0000' : '#4ADE80'} always />
      <Stat label="USERS" value={trafficStats.users.toLocaleString()} color="#00FFFF" />
      <Stat label="RPS" value={trafficStats.rps.toLocaleString()} color="#FBBF24" />
      <Stat label="MONTH" value={String(month)} color="#E0E0E0" />
      <Stat label="DAY" value={`${(tick % TICKS_PER_MONTH) + 1}/${TICKS_PER_MONTH}`} color="#A78BFA" />
      {serverCost > 0 && <Stat label="SERVER/mo" value={formatCash(serverCost)} color="#FB923C" />}

      {bankruptWarning && (
        <span className="flex items-center gap-1 text-red-400 font-bold text-xs animate-pulse">
          <AlertTriangle className="w-4 h-4" /> BANKRUPT in {3 - negativeCashMonths}m
        </span>
      )}

      <div className="flex items-center gap-1 ml-auto flex-wrap">
        <button
          onClick={togglePause}
          className="flex items-center gap-1 px-3 min-h-[40px] md:min-h-0 md:py-1.5 rounded text-sm md:text-xs bg-blue-700 hover:bg-blue-600 text-white transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Pause className="w-4 h-4 md:w-3.5 md:h-3.5" />}
          {isPaused ? 'Play' : 'Pause'}
        </button>
        {([1, 2, 4] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-3 min-h-[40px] md:min-h-0 md:px-2.5 md:py-1.5 rounded text-sm md:text-xs font-['Space_Grotesk'] transition-colors cursor-pointer ${
              speed === s ? 'bg-[#7C3AED] text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {s}x
          </button>
        ))}
        <div className="w-px h-5 bg-gray-600 mx-1" />
        <button onClick={onSave} className="flex items-center gap-1 px-3 min-h-[40px] md:min-h-0 md:px-2.5 md:py-1.5 rounded text-sm md:text-xs bg-green-800 hover:bg-green-700 text-green-200 transition-colors cursor-pointer">
          <Save className="w-4 h-4 md:w-3.5 md:h-3.5" /> Save
        </button>
        {saveMsg && <span className="text-xs text-yellow-300 ml-1 animate-pulse w-full sm:w-auto mt-1 sm:mt-0">{saveMsg}</span>}
      </div>
    </div>
  );
}

function Stat({ label, value, color, always }: { label: string; value: string; color: string; always?: boolean }) {
  return (
    <div className={`flex flex-col leading-tight ${always ? '' : 'hidden sm:flex'}`}>
      <span className="text-[9px] font-['Space_Grotesk'] text-gray-500 tracking-widest">{label}</span>
      <span className="font-['Space_Grotesk'] text-sm" style={{ color, textShadow: `0 0 6px ${color}88` }}>
        {value}
      </span>
    </div>
  );
}
