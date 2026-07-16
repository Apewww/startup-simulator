import { useEffect, useState } from 'react';
import { Play, Trash2, Power, Clock, Users, DollarSign, Trophy } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { listSaves, deleteSave, loadGame, type SaveSlotInfo } from '../systems/saveLoad';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { ACHIEVEMENTS } from '../data/achievements';
import type { AchievementDef } from '../types/wealth';

function formatCash(n: number): string {
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
  const [saves, setSaves] = useState<SaveSlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementDef | null>(null);

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
        {/* New Game */}
        <button onClick={handleNewGame}
          className="w-full flex items-center justify-between px-5 py-4 card-hover border border-indigo/20 rounded-xl transition-all duration-200 cursor-pointer hover:translate-x-0.5 bg-indigo/5">
          <span className="text-base font-bold text-indigo">+ New Game</span>
          <Play className="w-5 h-5 text-indigo" />
        </button>

        {/* Save Slots */}
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
                    {/* Slot number */}
                    <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-xs font-bold text-ink-soft shrink-0">
                      {save.id}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-ink truncate">{product ?? 'Unknown'}</span>
                        <span className="text-[11px] font-mono font-bold text-ink-soft">Month {save.month + 1}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-ink-soft mt-0.5">
                        <span className="flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" />{formatCash(save.cash)}</span>
                        {save.currentUsers > 0 && <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{save.currentUsers.toLocaleString()}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{fmtDate(save.timestamp)}</span>
                      </div>
                    </div>

                    {/* Delete */}
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

        {/* Quit */}
        <button onClick={handleQuit}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 cursor-pointer hover:translate-x-0.5 text-ink-soft hover:text-red hover:bg-red/5">
          <span className="text-sm font-semibold">Keluar</span>
          <Power className="w-4 h-4" />
        </button>
      </div>

      {/* Achievements */}
      <div className="w-full">
        <div className="flex items-center gap-1.5 px-1 py-1.5 text-xs text-ink-soft font-semibold">
          <Trophy className="w-3 h-3" /> Achievements ({ACHIEVEMENTS.length})
        </div>
        <div className="grid grid-cols-4 gap-1.5 px-1 pb-2">
          {ACHIEVEMENTS.map(a => (
            <button key={a.id}
              onClick={() => setSelectedAchievement(a)}
              className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-indigo/30 hover:bg-indigo/5 transition-all cursor-pointer">
              <span className="text-base leading-none">{a.icon}</span>
              <span className="text-[8px] text-ink-soft font-semibold leading-tight text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Achievement popup */}
      {selectedAchievement && (() => {
        const titleMap: Record<string, string> = {
          hustler: '💼', founder: '🏗️', tycoon: '💰', mogul: '👑',
          millionaire: '💎', multi_millionaire: '🔷', billionaire: '🌟',
        };
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setSelectedAchievement(null)}>
            <div className="bg-surface border border-border rounded-xl p-5 max-w-xs w-full shadow-xl"
              onClick={e => e.stopPropagation()}>
              <div className="text-center mb-3">
                <span className="text-3xl block mb-1">{titleMap[selectedAchievement.id] ?? '🏆'}</span>
                <h3 className="text-sm font-bold text-ink">{selectedAchievement.label}</h3>
              </div>
              <p className="text-[11px] text-ink-soft text-center mb-3">{selectedAchievement.description}</p>
              <div className="bg-surface-2 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-ink-soft mb-0.5">Requirement</div>
                <div className="font-semibold text-xs text-ink">
                  {selectedAchievement.requirement >= 1_000_000
                    ? `$${(selectedAchievement.requirement / 1_000_000).toFixed(1)}M`
                    : `$${(selectedAchievement.requirement / 1_000).toFixed(0)}K`} personal wealth
                </div>
              </div>
              <button onClick={() => setSelectedAchievement(null)}
                className="mt-3 w-full px-3 py-2 bg-indigo text-white rounded-lg text-[10px] font-semibold hover:bg-indigo/90 transition-colors cursor-pointer">
                Close
              </button>
            </div>
          </div>
        );
      })()}

      <div className="text-xs text-ink-soft font-mono">v2.0</div>
    </div>
  );
}
