import { useEffect, useState } from 'react';
import { Power, Play, Loader } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { hasSavedGame, loadGame } from '../systems/saveLoad';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function MainMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    hasSavedGame().then(setCanLoad);
  }, []);

  const handleNewGame = () => setScreen('select');

  const handleLoadGame = async () => { if (await loadGame()) {} };

  const handleQuit = () => {
    try { getCurrentWindow().close().catch(() => window.close()); } catch { window.close(); }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-ink">
      <div className="text-center mb-16 space-y-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="w-3 h-3 rounded-sm bg-indigo" />
          <h1 className="text-5xl font-extrabold tracking-tight">Startup Simulator</h1>
        </div>
        <p className="text-lg text-ink-soft font-light">Build your tech empire from scratch</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button onClick={handleNewGame}
          className="group flex items-center justify-between px-6 py-4 card-hover transition-all duration-200 cursor-pointer hover:translate-x-0.5">
          <span className="text-base font-semibold text-ink">New Game</span>
          <Play className="w-5 h-5 text-ink-soft group-hover:text-indigo transition-colors" />
        </button>
        <button onClick={handleLoadGame} disabled={!canLoad}
          className={`group flex items-center justify-between px-6 py-4 border rounded-[10px] transition-all duration-200 ${
            canLoad ? 'card hover:border-indigo hover:translate-x-0.5 cursor-pointer' : 'bg-surface-2 border-border opacity-50 cursor-not-allowed'}`}>
          <span className={`text-base font-semibold ${canLoad ? 'text-ink' : 'text-ink-soft'}`}>Load Game</span>
          <Loader className={`w-5 h-5 ${canLoad ? 'text-ink-soft group-hover:text-indigo transition-colors' : 'text-ink-soft'}`} />
        </button>
        <button onClick={handleQuit}
          className="group flex items-center justify-between px-6 py-4 card-hover transition-all duration-200 cursor-pointer mt-2 hover:translate-x-0.5">
          <span className="text-base font-semibold text-ink">Keluar</span>
          <Power className="w-5 h-5 text-ink-soft group-hover:text-red transition-colors" />
        </button>
      </div>

      <div className="absolute bottom-6 text-xs text-ink-soft font-mono">v1.3.2</div>
    </div>
  );
}