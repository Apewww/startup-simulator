import { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../systems/soundManager';

export function PlayerSetup() {
  const [ceoName, setCeoName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const initPlayer = useGameStore((s) => s.initPlayer);
  const setActiveView = useGameStore((s) => s.setActiveView);

  const handleStart = () => {
    const trimmedCeo = ceoName.trim();
    if (!trimmedCeo) return;
    soundManager.playSuccess();
    initPlayer(trimmedCeo, companyName.trim() || undefined);
    setActiveView({ type: 'cityMap' });
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-white select-none overflow-hidden">
      <img
        src="/assets/main_menu_bg_1785636947437.png"
        alt="Setup Background"
        className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xs scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

      <div className="relative z-10 text-center mb-8 space-y-3">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-sm bg-indigo-500" />
          <h1 className="text-4xl font-black tracking-tight drop-shadow-md text-white">Setup Startup Anda</h1>
        </div>
        <p className="text-sm text-slate-300 font-light max-w-sm mx-auto">Masukkan Nama Perusahaan dan Nama Anda sebagai CEO</p>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-4">
        <div className="card p-6 space-y-4 bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-2xl shadow-xl">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 mx-auto shadow-inner">
            <User className="w-8 h-8" strokeWidth={1.5} />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Perusahaan</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Contoh: TechCorp Inc."
                maxLength={30}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white text-center font-bold placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama CEO (Anda)</label>
              <input
                type="text"
                value={ceoName}
                onChange={e => setCeoName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
                placeholder="Nama Anda..."
                maxLength={20}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white text-center font-bold placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!ceoName.trim()}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-black tracking-wide transition-all duration-200 cursor-pointer shadow-lg ${
              ceoName.trim()
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white hover:scale-[1.02]'
                : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            Mulai Perjalanan Tech Empire <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
