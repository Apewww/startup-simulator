import { Play, Pause, Save, AlertTriangle, Handshake, Moon, Sun, TrendingUp, TrendingDown, Activity, Shield, Circle, Star, Wifi, Megaphone, DollarSign, Users, Clock, Wallet } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { TICKS_PER_MONTH, TICKS_PER_DAY } from '../constants';
import type { MonetizationStrategy } from '../types';
import { getPlatformStats } from '../systems/platform';
import { calculateRevenue, MOOD_BASELINE } from '../systems/monetization';
import { calcMonthlyServerCost } from '../systems/server';
import { getComplianceStatus } from '../systems/compliance';
import { getPricingTier } from '../types/monetization';
import { soundManager } from '../systems/soundManager';

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const MON_TAG: Record<MonetizationStrategy, { label: string; tip: string }> = {
  none: { label: 'FREE', tip: 'Tidak Ada Iklan / Monetisasi' },
  text_ads: { label: 'ADS·TEXT', tip: 'Iklan Teks' },
  video_ads: { label: 'ADS·VIDEO', tip: 'Iklan Video (+churn)' },
  targeted_ads: { label: 'ADS·TARGET', tip: 'Iklan Target (×1.5 bila Data ≥100%)' },
  freemium: { label: 'FREEMIUM', tip: 'Freemium (5% user @ $3)' },
  subscription: { label: 'SUBSCRIPTION', tip: 'Langganan ($2.50/user)' },
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
  const {
    tick, isPaused, speed, cash, month, features, racks, rentedServers,
    totalSalary, togglePause, setSpeed, negativeCashMonths, currentUsers,
    events, activeProductTypeId, employees, activeMonetization, userMood,
    internetSubscriptions, activePricingTier, adCampaigns, loan, brandScore,
    personalCash, unlockedTitles
  } = useGameStore();

  const platformStats = getPlatformStats(features, events, activeProductTypeId);
  const bankruptWarning = negativeCashMonths > 0;

  const day = Math.floor((tick % TICKS_PER_MONTH) / TICKS_PER_DAY) + 1;
  const displayMonth = (month % 12) + 1;
  const year = Math.floor(month / 12) + 1;
  const dayName = DAY_NAMES[(day - 1) % 7];
  const hour = Math.floor((tick % TICKS_PER_DAY) * (24 / TICKS_PER_DAY));
  const timeStr = `${String(hour).padStart(2, '0')}:00`;

  const pricingMult = getPricingTier(activePricingTier, activeProductTypeId)?.revenueMult ?? 1;
  const monthlyRevenue = calculateRevenue(currentUsers, features, racks, 1, 0, { strategy: activeMonetization, productId: activeProductTypeId, dataRatio: 1, synergyActive: false, pricingRevenueMult: pricingMult });
  const campaignMonthly = adCampaigns.filter(c => c.status === 'active').reduce((s, c) => s + c.revenuePerTick, 0) * TICKS_PER_MONTH;
  const loanPayment = loan?.status === 'active' ? loan.monthlyPayment : 0;
  const monthlyServerCost = calcMonthlyServerCost(racks, rentedServers);
  const monthlyNet = monthlyRevenue.total + campaignMonthly - (totalSalary + monthlyServerCost + loanPayment);
  const profitable = monthlyNet >= 0;
  const CashArrow = profitable ? TrendingUp : TrendingDown;
  const cashColor = profitable ? 'text-emerald-400' : 'text-rose-400';

  const healthPct = Math.round(platformStats.cohesionScore * 100);
  const healthColor = healthPct > 70 ? 'bg-emerald-500' : healthPct > 40 ? 'bg-amber-500' : 'bg-rose-500';
  const activeEvent = events.length > 0;
  const hasDdos = events.some(e => e.type === 'ddos');

  const handlePause = () => {
    soundManager.playClick();
    togglePause();
  };

  const handleSpeed = (s: 1 | 2 | 4) => {
    soundManager.playClick();
    setSpeed(s);
  };

  const handleSaveClick = () => {
    soundManager.playSuccess();
    onSave();
  };

  return (
    <div className="shrink-0 bg-slate-900/95 border-b border-white/10 select-none shadow-md backdrop-blur-md relative z-40 text-white">
      {/* Month Tick Progress Bar */}
      <div className="h-1 w-full bg-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-200"
          style={{ width: `${((tick % TICKS_PER_MONTH) / TICKS_PER_MONTH) * 100}%` }}
        />
      </div>

      {/* Main HUD Bar */}
      <div className="flex items-center justify-between h-11 px-3 gap-2 text-xs overflow-x-auto">
        {/* Left Section: Financial & Date Stats */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cash & Monthly Flow Pill Card */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-xl shadow-inner">
            <div className="flex items-center gap-1 font-black text-sm text-emerald-400">
              <DollarSign className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{formatCash(cash)}</span>
            </div>
            <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/5 ${cashColor}`} title="Estimasi Net Cash Flow Bulanan">
              <CashArrow className="w-3 h-3" />
              <span>{profitable ? '+' : ''}{formatCash(monthlyNet)}/bln</span>
            </div>
          </div>

          {/* Active Users & Mood Pill Card */}
          {features.some(f => f.level > 0) && (
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-1 font-bold text-slate-200" title={`Active Users: ${currentUsers.toLocaleString()}`}>
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>{formatCompact(currentUsers)} Users</span>
              </div>
              <div
                className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  userMood >= MOOD_BASELINE ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : userMood >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
                title={`User Mood: ${Math.round(userMood)}%`}
              >
                <span>{userMood >= MOOD_BASELINE ? '😊' : userMood >= 60 ? '😐' : '😠'}</span>
                <span>{Math.round(userMood)}%</span>
              </div>
            </div>
          )}

          {/* Infrastructure Health & Compliance Dot */}
          {features.some(f => f.level > 0) && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-[11px]" title={`Platform Health: ${healthPct}%`}>
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <div className="w-10 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${healthColor}`} style={{ width: `${healthPct}%` }} />
              </div>
              {(() => {
                const comp = getComplianceStatus(features, racks, rentedServers, internetSubscriptions);
                const dotColor = comp.overall === 'ok' ? 'text-emerald-400' : comp.overall === 'partial' ? 'text-amber-400' : 'text-rose-400';
                return (
                  <span className={`text-[10px] font-bold ${dotColor}`} title={comp.overall === 'ok' ? 'HW Capacities OK' : 'HW Capacity Warning'}>
                    <Circle className="w-2 h-2 fill-current inline mr-0.5" />
                    {comp.overall === 'ok' ? 'OK' : `${Math.round(Math.min(comp.userCap, 1) * 100)}%`}
                  </span>
                );
              })()}
            </div>
          )}

          {/* Monetization Badge */}
          {features.some(f => f.level > 0) && (() => {
            const m = MON_TAG[activeMonetization];
            return (
              <span className={`hidden xl:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-lg border ${activeMonetization === 'none' ? 'text-slate-400 border-white/10 bg-white/5' : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'}`} title={m.tip}>
                {m.label}
              </span>
            );
          })()}

          {/* Brand Score */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg" title={`Brand Power: ${Math.round(brandScore)}/100`}>
            <Megaphone className="w-3 h-3 text-amber-400" />
            <span>{Math.round(brandScore)}</span>
          </div>

          {/* Personal Wealth */}
          {personalCash > 0 && (() => {
            const currentTitle = unlockedTitles.length > 0 ? unlockedTitles[unlockedTitles.length - 1] : null;
            const titleIcons: Record<string, string> = { hustler: '💼', founder: '🏗️', tycoon: '💰', mogul: '👑', millionaire: '💎', multi_millionaire: '🔷', billionaire: '🌟' };
            const icon = currentTitle ? titleIcons[currentTitle] ?? '' : '';
            return (
              <div className="hidden xl:flex items-center gap-1 text-[11px] font-bold text-emerald-300 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg" title="Kekayaan Pribadi CEO">
                <Wallet className="w-3 h-3 text-emerald-400" />
                <span>{icon}{formatCash(personalCash)}</span>
              </div>
            );
          })()}

          {/* Internet Speed */}
          {internetSubscriptions.length > 0 && (() => {
            const top = internetSubscriptions.reduce((a, b) => (b.speedMbps > a.speedMbps ? b : a));
            return (
              <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-[11px] font-bold text-indigo-300">
                <Wifi className="w-3 h-3 text-indigo-400" />
                <span>{top.speedMbps} Mbps</span>
              </div>
            );
          })()}
        </div>

        {/* Center Section: Date & Time Display */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>{dayName}, Hari {day}</span>
            <span className="text-slate-500">•</span>
            <span>Bulan {displayMonth}</span>
            <span className="text-slate-500">•</span>
            <span>Tahun {year}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px] bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/5">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Right Section: Game Speed Controls & Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Supervision Indicator */}
          {employees.some(e => e.supervisedBy) && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 rounded-lg text-[10px] text-indigo-300 font-bold" title="Supervision aktif oleh Lead Dev">
              <Star className="w-3 h-3 text-indigo-400" /> +{employees.filter(e => e.supervisedBy).length} Lead
            </span>
          )}

          {/* Pending Funding Offer */}
          {useGameStore.getState().pendingFundingRounds.length > 0 && (
            <button
              onClick={() => { soundManager.playClick(); useGameStore.getState().togglePanel('investor'); }}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-[10px] font-extrabold animate-pulse cursor-pointer"
            >
              <Handshake className="w-3.5 h-3.5" /> Offer Funding!
            </button>
          )}

          {/* Active Events / DDoS Alert */}
          {activeEvent && (
            <span className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold ${hasDdos ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
              <Activity className="w-3.5 h-3.5" />
              <span>{events[0]?.name?.slice(0, 14) || 'Event'}</span>
            </span>
          )}

          {/* Bankruptcy Warning */}
          {bankruptWarning && (
            <span className="flex items-center gap-1 px-2 py-1 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-[10px] font-black animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> KRISIS CASH {3 - negativeCashMonths}m
            </span>
          )}

          {/* Speed Controls Widget */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={handlePause}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isPaused
                  ? 'bg-indigo-600 text-white shadow-md border border-indigo-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={isPaused ? 'Lanjutkan Game (Space)' : 'Jeda Game (Space)'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            </button>

            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleSpeed(s)}
                className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  speed === s && !isPaused
                    ? 'bg-indigo-600 text-white shadow-md border border-indigo-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/5"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md border border-indigo-400/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Simpan
          </button>

          {saveMsg && <span className="text-xs font-bold text-emerald-400 animate-fade-in">{saveMsg}</span>}
        </div>
      </div>
    </div>
  );
}
