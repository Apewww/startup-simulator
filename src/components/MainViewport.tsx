import { Monitor, Server, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { OfficeGrid } from './OfficeGrid';
import { ServerRoomView } from './ServerRoomView';

export function MainViewport() {
  const activeView = useGameStore((s) => s.activeView);
  const setActiveView = useGameStore((s) => s.setActiveView);
  const visitedPlots = useGameStore((s) => s.visitedPlots);

  const closeServerTab = (plotId: string) => {
    const next = visitedPlots.filter(p => p !== plotId);
    useGameStore.setState({ visitedPlots: next });
    if (activeView.type === 'server' && activeView.plotId === plotId) {
      setActiveView({ type: 'office' });
    }
  };

  return (
    <div className="relative flex-1 min-w-0 p-4 pb-32 md:pb-4">
      <div className="relative h-full bg-[rgba(10,14,39,0.5)] border border-[#7C3AED]/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
        {/* Tab bar — bungkus tanpa overflow hidden */}
        <div className="flex items-center shrink-0 px-4 pt-2.5 gap-0 border-b border-[#7C3AED]/20">
          <button
            onClick={() => setActiveView({ type: 'office' })}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-['Space_Grotesk'] tracking-wider transition-colors cursor-pointer rounded-t-md ${
              activeView.type === 'office'
                ? 'bg-[#7C3AED]/15 text-[#A78BFA] border-b-2 border-[#A78BFA] -mb-[1px]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            OFFICE FLOOR
          </button>
          {visitedPlots.map(plotId => {
            const isActive = activeView.type === 'server' && activeView.plotId === plotId;
            return (
              <div key={plotId} className={`flex items-center rounded-t-md transition-colors ${
                isActive
                  ? 'bg-[#7C3AED]/15 border-b-2 border-[#A78BFA] -mb-[1px]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}>
                <button
                  onClick={() => setActiveView({ type: 'server', plotId })}
                  className={`flex items-center gap-1.5 pl-2.5 pr-1 py-2 text-xs font-['Space_Grotesk'] tracking-wider cursor-pointer transition-colors ${isActive ? 'text-[#A78BFA]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Server className="w-3 h-3" />
                  <span>{plotId.toUpperCase()}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); closeServerTab(plotId); }}
                  className="pr-2 py-2 text-[10px] hover:text-red-300 transition-colors cursor-pointer"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          {activeView.type === 'office' ? <OfficeGrid /> : <ServerRoomView />}
        </div>
      </div>
    </div>
  );
}
