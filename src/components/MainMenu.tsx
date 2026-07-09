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
      // screen is set to 'playing' internally by loadGame
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
    <div className="scanlines min-h-screen bg-[#0A0E27] flex flex-col items-center justify-center p-8 text-gray-100">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-6xl font-bold tracking-tight text-[#A78BFA] neon-glow">
          Startup Simulator
        </h1>
        <p className="text-xl text-gray-400 font-light">Build your tech empire from scratch</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={handleNewGame}
          className="group flex items-center justify-between px-6 py-4 bg-gray-800/80 hover:bg-[#7C3AED]/20 border border-gray-700 hover:border-[#7C3AED] rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_#7c3aed40]"
        >
          <span className="text-lg font-medium group-hover:text-white transition-colors">New Game</span>
          <Play className="w-5 h-5 text-gray-400 group-hover:text-[#A78BFA] transition-colors" />
        </button>

        <button
          onClick={handleLoadGame}
          disabled={!canLoad}
          className={`group flex items-center justify-between px-6 py-4 rounded-xl transition-all border ${
            canLoad 
              ? 'bg-gray-800/80 hover:bg-[#00FFFF]/10 border-gray-700 hover:border-[#00FFFF] cursor-pointer shadow-lg hover:shadow-[0_0_20px_#00ffff40]' 
              : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
          }`}
        >
          <span className={`text-lg font-medium ${canLoad ? 'group-hover:text-white transition-colors' : 'text-gray-500'}`}>
            Load Game
          </span>
          <Loader className={`w-5 h-5 ${canLoad ? 'text-gray-400 group-hover:text-[#00FFFF] transition-colors' : 'text-gray-600'}`} />
        </button>

        <button
          onClick={handleQuit}
          className="group flex items-center justify-between px-6 py-4 bg-gray-800/80 hover:bg-red-900/20 border border-gray-700 hover:border-red-500/50 rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_#ef444440] mt-4"
        >
          <span className="text-lg font-medium group-hover:text-white transition-colors">Keluar</span>
          <Power className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
        </button>
      </div>
      
      <div className="absolute bottom-6 text-sm text-gray-600 font-mono">
        v1.1.4
      </div>
    </div>
  );
}
