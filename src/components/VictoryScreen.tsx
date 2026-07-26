import { Trophy, Play, ArrowRight, Home } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getCurrentTitle } from '../systems/wealth';
import { ACHIEVEMENTS } from '../data/achievements';
import { getAllObtained } from '../systems/globalAchievements';

function formatCash(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US')}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toString();
}

export function VictoryScreen() {
  const { month, cash, employees, racks, currentUsers, personalCash, unlockedTitles, companyName, restartGame, setScreen, startNewGamePlus } = useGameStore();
  const title = getCurrentTitle(personalCash, unlockedTitles);
  const titleDef = ACHIEVEMENTS.find(a => a.id === title);
  const globalAchievements = getAllObtained();
  const completedCount = Object.keys(globalAchievements).length;

  const handleNewGamePlus = () => {
    startNewGamePlus(title ?? 'hustler');
  };

  const handleMainMenu = () => {
    restartGame();
  };

  const handleContinue = () => {
    setScreen('playing');
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="card border-2 border-amber p-10 max-w-lg text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-amber" strokeWidth={1.5} />
        <h1 className="text-3xl font-bold text-amber mb-1">Congratulations!</h1>
        <p className="text-ink-soft mb-2">You've successfully completed Startup Simulator.</p>
        {companyName && (
          <p className="text-sm text-indigo font-semibold mb-4">{companyName}</p>
        )}

        {/* Title badge */}
        {titleDef && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-soft border border-amber/30 rounded-lg mb-6">
            <span className="text-2xl">{titleDef.icon}</span>
            <span className="text-sm font-bold text-amber">{titleDef.label}</span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <div className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Survived</div>
            <div className="text-lg font-bold text-ink">{month} months</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Team</div>
            <div className="text-lg font-bold text-ink">{employees.length} people</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Peak Users</div>
            <div className="text-lg font-bold text-ink">{formatCompact(currentUsers)}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Servers</div>
            <div className="text-lg font-bold text-ink">{racks.length} racks</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Company Cash</div>
            <div className="text-lg font-bold text-green">{formatCash(cash)}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider">Personal Wealth</div>
            <div className="text-lg font-bold text-green">{formatCash(personalCash)}</div>
          </div>
        </div>

        {/* Achievements summary */}
        <div className="text-xs text-ink-soft mb-6">
          <span className="font-semibold text-ink">{completedCount}</span> achievement{completedCount !== 1 ? 's' : ''} unlocked globally
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button onClick={handleNewGamePlus}
            className="w-full px-6 py-3 bg-amber hover:bg-amber/90 text-white font-semibold rounded-[10px] transition-all duration-200 hover:translate-y-[-1px] cursor-pointer flex items-center justify-center gap-2">
            <Play className="w-4 h-4" /> New Game+
          </button>
          <div className="flex gap-2">
            <button onClick={handleContinue}
              className="flex-1 px-4 py-3 bg-indigo hover:bg-indigo/90 text-white font-semibold rounded-[10px] transition-all duration-200 hover:translate-y-[-1px] cursor-pointer flex items-center justify-center gap-2">
              <ArrowRight className="w-4 h-4" /> Continue Playing
            </button>
            <button onClick={handleMainMenu}
              className="flex-1 px-4 py-3 bg-surface-2 hover:bg-surface-2/80 text-ink font-semibold rounded-[10px] border border-border transition-all duration-200 hover:translate-y-[-1px] cursor-pointer flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
