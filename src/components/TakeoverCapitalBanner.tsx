import { useGameStore } from '../store/gameStore';
import { Building2 } from 'lucide-react';

export function TakeoverCapitalBanner() {
  const takeoverCapital = useGameStore((s) => s.takeoverCapital);
  const acquiredBy = useGameStore((s) => s.acquiredBy);

  if (!takeoverCapital || !acquiredBy) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-indigo/15 border border-indigo/30 rounded-lg text-[11px] shadow-lg">
      <Building2 className="w-4 h-4 shrink-0 text-indigo" />
      <span className="font-semibold text-indigo">
        Takeover Capital: ${takeoverCapital.toLocaleString()} (from {acquiredBy}) — start a new venture?
      </span>
    </div>
  );
}