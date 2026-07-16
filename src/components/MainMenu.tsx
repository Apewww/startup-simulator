import { useEffect, useState } from 'react';
import { Play, Trash2, Power, Clock, Users, DollarSign, Trophy, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { listSaves, deleteSave, loadGame, type SaveSlotInfo } from '../systems/saveLoad';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ACHIEVEMENTS } from '../data/achievements';
import { getAllObtained } from '../systems/globalAchievements';

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

function fmtRequirement(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export function MainMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const restartGame = useGameStore((s) => s.restartGame);
  const [saves, setSaves] = useState<SaveSlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);

  const refresh = () => {
    setLoading(true);
    listSaves().then(s => { setSaves(s); setLoading(false); });
  };

  useEffect(refresh, []);

  const handleNewGame = async () => {
    restartGame();
    setScreen('select');
  };

  const handleLoad = (id: number) => {
    loadGame(id).then(ok => { if (ok) setScreen('playing'); });
  };

  const handleDelete = async (id: number) => {
    await deleteSave(id);
    refresh();
  };

  const handleQuit = () => {
    try { getCurrentWindow().close().catch(() => window.close()); } catch { window.close(); }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-ink">
      <div className="text-center mb-10 space-y-3">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="w-3 h-3 rounded-sm bg-indigo" />
          <h1 className="text-5xl font-extrabold tracking-tight">Startup Simulator</h1>
        </div>
        <p className="text-base text-ink-soft font-light">Build your tech empire from scratch</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <button onClick={handleNewGame}
          className="w-full flex items-center justify-between px-5 py-4 card-hover border border-indigo/20 rounded-xl transition-all duration-200 cursor-pointer hover:translate-x-0.5 bg-indigo/5">
          <span className="text-base font-bold text-indigo">+ New Game</span>
          <Play className="w-5 h-5 text-indigo" />
        </button>

        <div className="space-y-2">
          <div className="text-[11px] text-ink-soft font-semibold uppercase tracking-wider px-1">
            Saved Games {!loading && `(${saves.length})`}
          </div>

          {loading ? (
            <div className="text-center py-6 text-sm text-ink-soft">Loading...</div>
          ) : saves.length === 0 ? (
            <div className="text-center py-6 text-sm text-ink-soft border border-dashed border-border rounded-xl">
              No saved games yet
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
              {saves.map(save => {
                const product = save.selectedProduct ? PRODUCT_LABELS[save.selectedProduct] ?? save.selectedProduct : null;
                return (
                  <div key={save.id}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-indigo/30 hover:bg-indigo/5 transition-all cursor-pointer"
                    onClick={() => handleLoad(save.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-xs font-bold text-ink-soft shrink-0">
                      {save.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-ink truncate">{product ?? 'Unknown'}</span>
                        <span className="text-[11px] font-mono font-bold text-ink-soft">Month {save.month + 1}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-ink-soft mt-0.5">
                        <span className="flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" />{fmtCash(save.cash)}</span>
                        {save.currentUsers > 0 && <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{save.currentUsers.toLocaleString()}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{fmtDate(save.timestamp)}</span>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDelete(save.id); }}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-soft hover:text-red text-ink-soft transition-all cursor-pointer"
                      title="Delete save">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <hr className="border-border" />

        <button onClick={() => setShowAchievements(true)}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 cursor-pointer hover:translate-x-0.5 text-ink-soft hover:text-amber hover:bg-amber/5">
          <span className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Achievements
          </span>
          <span className="text-xs text-ink-soft">{ACHIEVEMENTS.length}</span>
        </button>

        <hr className="border-border" />

        <button onClick={handleQuit}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 cursor-pointer hover:translate-x-0.5 text-ink-soft hover:text-red hover:bg-red/5">
          <span className="text-sm font-semibold">Keluar</span>
          <Power className="w-4 h-4" />
        </button>
      </div>

      {/* Achievements popup */}
      {showAchievements && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowAchievements(false)}>
          <div className="bg-surface border border-border rounded-xl p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber" />
                <h2 className="text-base font-bold text-ink">Achievements</h2>
              </div>
              <button onClick={() => setShowAchievements(false)}
                className="p-1 rounded-lg hover:bg-surface-2 text-ink-soft hover:text-ink transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {(() => {
                const globalObtained = getAllObtained();
                return ACHIEVEMENTS.map(a => {
                  const titleIcons: Record<string, string> = {
                    hustler: '💼', founder: '🏗️', tycoon: '💰', mogul: '👑',
                    millionaire: '💎', multi_millionaire: '🔷', billionaire: '🌟',
                  };
                  const icon = titleIcons[a.id] ?? '🏆';
                  const obtained = a.id in globalObtained;
                  return (
                    <div key={a.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${obtained ? 'bg-green-soft/30 border-green/20' : 'bg-surface-2 border-border'}`}>
                      <span className="text-xl shrink-0 w-8 text-center">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-xs ${obtained ? 'text-green' : 'text-ink'}`}>
                          {a.label}
                          {obtained && <span className="ml-1.5 text-[9px]">✓</span>}
                        </div>
                        <div className="text-[9px] text-ink-soft mt-0.5">{a.description}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[9px] text-ink-soft">{fmtRequirement(a.requirement)}</div>
                        <div className="text-[8px] font-semibold">
                          {obtained
                            ? <span className="text-green">Obtained</span>
                            : <span className="text-ink-soft">—</span>}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="text-center text-[9px] text-ink-soft mt-4">
              Achievements are saved globally across all save games
            </div>
            <button onClick={() => setShowAchievements(false)}
              className="mt-3 w-full px-4 py-2.5 bg-indigo text-white rounded-lg text-xs font-semibold hover:bg-indigo/90 transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-ink-soft font-mono mt-6">v2.0</div>
    </div>
  );
}
