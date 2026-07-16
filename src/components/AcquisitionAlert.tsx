import { useGameStore } from '../store/gameStore';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export function AcquisitionAlert() {
  const distressActive = useGameStore((s) => s.distressActive);
  const distressTicks = useGameStore((s) => s.distressTicks);

  if (!distressActive) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-red/15 border border-red/30 rounded-lg text-[11px] text-red shadow-lg animate-pulse">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="font-semibold">DISTRESS — Hostile takeover risk active ({distressTicks}tick)</span>
      <ShieldCheck className="w-3 h-3 shrink-0 opacity-60" />
    </div>
  );
}