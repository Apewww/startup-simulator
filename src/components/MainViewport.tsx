import { Monitor, Server } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { OfficeGrid } from './OfficeGrid';
import { ServerRoomView } from './ServerRoomView';

export function MainViewport() {
  const activeView = useGameStore((s) => s.activeView);
  const setActiveView = useGameStore((s) => s.setActiveView);

  return (
    <div className="relative flex-1 min-w-0 p-4 pb-32 md:pb-4">
      <div className="relative h-full bg-[rgba(10,14,39,0.5)] border border-[#7C3AED]/30 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        {/* Tab bar */}
        <div className="absolute top-3 left-4 z-10 flex gap-1">
          <button
            onClick={() => setActiveView({ type: 'office' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-['Space_Grotesk'] tracking-wider transition-colors cursor-pointer ${
              activeView.type === 'office'
                ? 'bg-[#7C3AED]/20 text-[#A78BFA] border-b-2 border-[#A78BFA]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            OFFICE FLOOR
          </button>
          {activeView.type === 'server' && (
            <button
              onClick={() => setActiveView({ type: 'office' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-['Space_Grotesk'] tracking-wider bg-[#7C3AED]/20 text-[#A78BFA] border-b-2 border-[#A78BFA] cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              SERVER ROOM — {activeView.plotId.toUpperCase()}
            </button>
          )}
        </div>

        <div className="h-full overflow-auto pt-12">
          {activeView.type === 'office' ? <OfficeGrid /> : <ServerRoomView />}
        </div>
      </div>
    </div>
  );
}
