import { useEffect, useState } from 'react';
import { Play, Trash2, Power, Clock, DollarSign, Trophy, X, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { listSaves, deleteSave, loadGame, type SaveSlotInfo } from '../systems/saveLoad';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ACHIEVEMENTS } from '../data/achievements';
import { isAchievementObtained } from '../systems/globalAchievements';
import { soundManager } from '../systems/soundManager';

function fmtCash(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US')}`;
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

const PRODUCT_LABELS: Record<string, string> = {
  social_media: 'Social Media',
  ecommerce: 'E-Commerce',
  search_engine: 'Search Engine',
};

export function MainMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const restartGame = useGameStore((s) => s.restartGame);
  const newGamePlus = useGameStore((s) => s.newGamePlus);
  const newGamePlusTitle = useGameStore((s) => s.newGamePlusTitle);
  const [saves, setSaves] = useState<SaveSlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);

  const refresh = () => {
    setLoading(true);
    listSaves().then(s => { setSaves(s); setLoading(false); });
  };

  useEffect(refresh, []);

  const handleNewGame = async () => {
    soundManager.playSuccess();
    restartGame();
    setScreen('select');
  };

  const handleLoad = (id: number) => {
    soundManager.playSuccess();
    loadGame(id).then(ok => { if (ok) setScreen('playing'); });
  };

  const handleDelete = async (id: number) => {
    soundManager.playClick();
    await deleteSave(id);
    refresh();
  };

  const handleQuit = () => {
    soundManager.playClick();
    try { getCurrentWindow().close().catch(() => window.close()); } catch { window.close(); }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none overflow-hidden">
      {/* Background Game Asset Cover Image */}
      <img
        src="/assets/main_menu_bg_1785636947437.png"
        alt="Tech Startup Simulator Cover"
        className="absolute inset-0 w-full h-full object-cover opacity-50 blur-xs scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

      {/* Main Title & Game Banner */}
      <div className="relative z-10 text-center mb-8 max-w-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 backdrop-blur-md text-xs font-bold uppercase tracking-widest shadow-md">
          <Sparkles className="w-3.5 h-3.5" /> 2D Isometric Edition • v0.2.0
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight drop-shadow-xl text-white">
          STARTUP <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">SIMULATOR</span>
        </h1>

        {newGamePlus && (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold" title={`NG+ ${newGamePlusTitle ?? ''}`}>
            🏆 NEW GAME+ UNLOCKED
          </div>
        )}

        <p className="text-sm text-slate-300 font-light max-w-md mx-auto">
          Bangun kekaisaran software milik Anda dari garasi kecil hingga menjadi raksasa teknologi dengan Data Center Hyperscale!
        </p>
      </div>

      {/* Main Menu Action Panel */}
      <div className="relative z-10 w-full max-w-md space-y-4">
        <button
          onClick={handleNewGame}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-lg rounded-2xl shadow-lg border border-indigo-400/40 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-indigo-500/25"
        >
          <span className="flex items-center gap-2">+ MAIN GAME BARU</span>
          <Play className="w-6 h-6 fill-current" />
        </button>

        {/* Saved Games Box */}
        <div className="card p-4 bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              SAVE GAME TERSIMPAN {!loading && `(${saves.length})`}
            </span>
            <button
              onClick={() => { soundManager.playClick(); setShowAchievements(true); }}
              className="flex items-center gap-1 text-xs text-amber-400 font-semibold hover:underline cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" /> Achievements
            </button>
          </div>

          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400 animate-pulse">Loading saved slots...</div>
          ) : saves.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-white/10 rounded-xl">
              Belum ada file save game. Klik "Main Game Baru" untuk memulai!
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {saves.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleLoad(s.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-400/60 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                      {s.companyName || 'Startup'} {s.playerName && <span className="text-[10px] text-slate-400 font-normal">({s.playerName})</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5 text-emerald-400" />{fmtCash(s.cash)}</span>
                      <span>• Month {s.month}</span>
                      {s.selectedProduct && <span>• {PRODUCT_LABELS[s.selectedProduct] || s.selectedProduct}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{fmtDate(s.timestamp)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                      title="Delete save file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quit Button */}
        <button
          onClick={handleQuit}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-slate-300 hover:text-red-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
        >
          <Power className="w-4 h-4" /> Keluar dari Game
        </button>
      </div>

      {/* Global Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="card p-6 max-w-lg w-full bg-slate-900 border border-white/10 shadow-2xl rounded-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Trophy className="w-5 h-5" /> Global Achievements
              </div>
              <button onClick={() => setShowAchievements(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {ACHIEVEMENTS.map(ach => {
                const obtained = isAchievementObtained(ach.id);
                return (
                  <div key={ach.id} className={`p-3 rounded-xl border text-xs ${obtained ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/5 opacity-50'}`}>
                    <div className="font-bold text-white flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span>{ach.icon}</span> {ach.label}</span>
                      {obtained && <span className="text-[10px] text-amber-400 font-bold">UNLOCKED</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{ach.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
