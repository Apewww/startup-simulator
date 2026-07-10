import { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function PlayerSetup() {
  const [name, setName] = useState('');
  const initPlayer = useGameStore((s) => s.initPlayer);

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    initPlayer(trimmed);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-ink">
      <div className="text-center mb-10 space-y-3">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="w-3 h-3 rounded-sm bg-indigo" />
          <h1 className="text-4xl font-extrabold tracking-tight">Meet Your Startup</h1>
        </div>
        <p className="text-base text-ink-soft font-light">What should we call you, CEO?</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-soft text-indigo mx-auto">
            <User className="w-7 h-7" strokeWidth={1.5} />
          </div>

          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-ink text-center font-semibold placeholder:text-ink-soft outline-none focus:border-indigo transition-colors"
            autoFocus
          />

          <button onClick={handleStart} disabled={!name.trim()}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
              name.trim() ? 'bg-indigo text-white hover:bg-indigo/90' : 'bg-surface-2 text-ink-soft border border-border cursor-not-allowed'
            }`}>
            Start Your Journey <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-ink-soft text-center">You can change your role anytime from the Employees panel.</p>
      </div>
    </div>
  );
}