import { Monitor } from 'lucide-react';
import { OfficeGrid } from './OfficeGrid';

export function MainViewport() {
  return (
    <div className="relative flex-1 min-w-0 p-4 pb-32 md:pb-4">
      <div className="relative h-full bg-[rgba(10,14,39,0.5)] border border-[#7C3AED]/30 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
          <Monitor className="w-4 h-4 text-[#A78BFA]" />
          <span className="font-['Space_Grotesk'] text-xs tracking-wider text-[#A78BFA]">OFFICE FLOOR</span>
        </div>

        <div className="h-full overflow-auto pt-10">
          <OfficeGrid />
        </div>
      </div>
    </div>
  );
}
