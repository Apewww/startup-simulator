import { Play, Pause, Save, AlertTriangle, Handshake, Moon, Sun, TrendingUp, TrendingDown, Activity, Shield, Circle, Star, Wifi } from 'lucide-react';
import { useGameStore, TICKS_PER_MONTH, TICKS_PER_DAY } from '../store/gameStore';
import type { MonetizationStrategy } from '../store/gameStore';
import { getPlatformStats } from '../systems/platform';
import { calculateRevenue, MOOD_BASELINE } from '../systems/monetization';
import { calcMonthlyServerCost } from '../systems/server';
import { getComplianceStatus } from '../systems/compliance';

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const MON_TAG: Record<MonetizationStrategy, { label: string; tip: string }> = {
  none: { label: 'NONE', tip: 'No Ads (legacy)' },
  text_ads: { label: 'ADS·TEXT', tip: 'Text Ads' },
  video_ads: { label: 'ADS·VIDEO', tip: 'Video Ads (+churn)' },
  targeted_ads: { label: 'ADS·TARGET', tip: 'Targeted Ads (×1.5 bila synergy & Data ≥100%)' },
  freemium: { label: 'FREEMIUM', tip: 'Freemium 5% user @ $3' },
  subscription: { label: 'SUB', tip: 'Subscription $2.50/user (growth ×0.65)' },
};

function formatCash(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US')}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toString();
}

interface HudBarProps {
  onSave: () => void;
  saveMsg: string;
  onToggleTheme: () => void;
  darkMode: boolean;
}

export function HudBar({ onSave, saveMsg, onToggleTheme, darkMode }: HudBarProps) {
  const { tick, isPaused, speed, cash, month, features, racks, rentedServers, totalSalary, togglePause, setSpeed, negativeCashMonths, pendingFunding, currentUsers, events, selectedProduct, employees, activeMonetization, userMood, internetSubscriptions } = useGameStore();
  const platformStats = getPlatformStats(features, events, selectedProduct);
  const bankruptWarning = negativeCashMonths > 0;

  const day = Math.floor((tick % TICKS_PER_MONTH) / TICKS_PER_DAY) + 1;
  const displayMonth = (month % 12) + 1;
  const year = Math.floor(month / 12) + 1;
  const dayName = DAY_NAMES[(day - 1) % 7];
  const hour = Math.floor((tick % TICKS_PER_DAY) * (24 / TICKS_PER_DAY));
  const timeStr = `${String(hour).padStart(2, '0')}:00`;

  const monthlyRevenue = calculateRevenue(currentUsers, features, racks);
  const monthlyServerCost = calcMonthlyServerCost(racks, rentedServers);
  const monthlyNet = monthlyRevenue.total - (totalSalary + monthlyServerCost);
  const profitable = monthlyNet >= 0;
  const CashArrow = profitable ? TrendingUp : TrendingDown;
  const cashColor = profitable ? 'text-green' : 'text-red';

  const healthPct = Math.round(platformStats.cohesionScore * 100);
  const healthColor = healthPct > 70 ? 'bg-green' : healthPct > 40 ? 'bg-amber' : 'bg-red';
  const activeEvent = events.length > 0;
  const hasDdos = events.some(e => e.type === 'ddos');

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

        {/* Supervision indicator */}
        {employees.some(e => e.supervisedBy) && (
          <span className="flex items-center gap-1 text-[10px] text-indigo font-semibold shrink-0" title="Supervision active — devs under lead get production boost">
            <Star className="w-3 h-3" strokeWidth={2.5} /> +{employees.filter(e => e.supervisedBy).length}
          </span>
        )}

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
        {activeEvent && (
          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold shrink-0 ${hasDdos ? 'bg-red-soft text-red border border-red/30 animate-pulse' : 'bg-amber-soft text-amber border border-amber/30'}`}>
            <Activity className="w-3 h-3" />
            {events[0]?.name || 'Event'}
          </span>
        )}

        <div className="flex-1" />

        {/* Platform Health */}
        {features.some(f => f.level > 0) && (
          <div className="flex items-center gap-1.5" title={`Platform Health: ${healthPct}%`}>
            <Shield className="w-3 h-3 text-ink-soft" />
            <div className="w-14 h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${healthColor}`} style={{ width: `${healthPct}%` }} />
            </div>
            <span className="text-[10px] text-ink-soft font-mono">{healthPct}%</span>
          </div>
        )}

        {/* Compliance status dot */}
        {features.some(f => f.level > 0) && (() => {
          const comp = getComplianceStatus(features, racks, rentedServers, internetSubscriptions);
          const dotColor = comp.overall === 'ok' ? 'text-green' : comp.overall === 'partial' ? 'text-amber' : 'text-red';
          const dotLabel = comp.overall === 'ok' ? 'Hardware OK' : comp.overall === 'partial' ? `Partial (${Math.round(Math.min(comp.userCap, 1) * 100)}% cap)` : 'Critical — no service';
          return (
            <span className={`flex items-center gap-1 text-[10px] ${dotColor}`} title={dotLabel}>
              <Circle className="w-2 h-2 fill-current" />{comp.overall === 'ok' ? 'HW OK' : comp.overall === 'partial' ? 'HW ⚠' : 'HW ✗'}
            </span>
          );
        })()}

        {/* Monetization strategy indicator */}
        {features.some(f => f.level > 0) && (() => {
          const m = MON_TAG[activeMonetization];
          return (
            <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${activeMonetization === 'none' ? 'text-ink-soft border-border' : 'text-green border-green/30 bg-green-soft'}`} title={`Monetization: ${m.tip}`}>
              {m.label}
            </span>
          );
        })()}

        {/* User mood indicator */}
        {features.some(f => f.level > 0) && (() => {
          const moodEmoji = userMood >= MOOD_BASELINE ? '😊' : userMood >= 60 ? '😐' : '😠';
          const moodColor = userMood >= MOOD_BASELINE ? 'text-green' : userMood >= 60 ? 'text-amber' : 'text-red';
          const moodLabel = userMood >= MOOD_BASELINE ? 'Users happy' : userMood >= 60 ? 'Users uneasy' : 'Users unhappy';
          return (
            <span className={`flex items-center gap-1 text-[10px] ${moodColor}`} title={`User Mood: ${moodLabel} (${Math.round(userMood)}/100) — affects churn`}>
              {moodEmoji}
            </span>
          );
        })()}

        {/* Internet service indicator */}
        {internetSubscriptions.length > 0 && (() => {
          const top = internetSubscriptions.reduce((a, b) => (b.speedMbps > a.speedMbps ? b : a));
          const tip = internetSubscriptions.map(s => `${s.providerName} ${s.speedMbps} Mbps ($${s.monthlyCost}/mo)`).join('\n');
          return (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-indigo/30 bg-indigo-soft text-indigo" title={`Internet:\n${tip}`}>
              <Wifi className="w-2.5 h-2.5" />{top.speedMbps}M
            </span>
          );
        })()}

        {/* Right — stats */}
        <div className="flex items-center gap-4 text-ink-soft">
          <span className="font-mono font-semibold text-ink">{timeStr}</span>
          <span className="font-mono font-semibold text-ink" title={`${currentUsers} current / ${platformStats.targetUsers} target`}>
            {formatCompact(currentUsers)}
          </span>
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
