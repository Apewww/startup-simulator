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

  const handleNewGame = () => {
    setScreen('select');
  };

  const handleLoadGame = async () => {
    if (await loadGame()) {
    }
  };

  const handleQuit = () => {
    try {
      getCurrentWindow().close().catch(() => window.close());
    } catch {
      window.close();
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-8 text-text-primary">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-6xl font-bold tracking-tight text-text-primary">
          Startup Simulator
        </h1>
        <p className="text-xl text-text-secondary font-light">Build your tech empire from scratch</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={handleNewGame}
          className="group flex items-center justify-between px-6 py-4 flat-card-hover transition-colors cursor-pointer"
        >
          <span className="text-lg font-medium text-text-primary">New Game</span>
          <Play className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" />
        </button>

        <button
          onClick={handleLoadGame}
          disabled={!canLoad}
          className={`group flex items-center justify-between px-6 py-4 border transition-colors ${
            canLoad 
              ? 'flat-card hover:border-steel cursor-pointer border-border hover:border-steel' 
              : 'bg-bg-surface border-border opacity-50 cursor-not-allowed'
          }`}
        >
          <span className={`text-lg font-medium ${canLoad ? 'text-text-primary' : 'text-text-muted'}`}>
            Load Game
          </span>
          <Loader className={`w-5 h-5 ${canLoad ? 'text-text-secondary group-hover:text-steel transition-colors' : 'text-text-muted'}`} />
        </button>

        <button
          onClick={handleQuit}
          className="group flex items-center justify-between px-6 py-4 flat-card-hover transition-colors cursor-pointer mt-4"
        >
          <span className="text-lg font-medium text-text-primary">Keluar</span>
          <Power className="w-5 h-5 text-text-secondary group-hover:text-danger transition-colors" />
        </button>
      </div>
      
      <div className="absolute bottom-6 text-sm text-text-muted font-mono">
        v1.1.4
      </div>
    </div>
  );
}