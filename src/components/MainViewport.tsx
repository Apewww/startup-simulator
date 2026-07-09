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
    <div className="flex-1 p-5 overflow-auto flex flex-col gap-4 min-w-0">
      {/* Tab bar */}
      <div className="flex items-center gap-4 border-b border-border pb-0">
        <button
          onClick={() => setActiveView({ type: 'office' })}
          className={`flex items-center gap-1.5 pb-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-[1px] ${
            activeView.type === 'office'
              ? 'text-indigo border-indigo'
              : 'text-ink-soft border-transparent hover:text-ink'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          KANTOR
        </button>
        {visitedPlots.map(plotId => {
          const isActive = activeView.type === 'server' && activeView.plotId === plotId;
          return (
            <div key={plotId} className="flex items-center">
              <button
                onClick={() => setActiveView({ type: 'server', plotId })}
                className={`flex items-center gap-1.5 pb-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-[1px] ${isActive ? 'text-indigo border-indigo' : 'text-ink-soft border-transparent hover:text-ink'}`}
              >
                <Server className="w-3 h-3" />
                <span>{plotId.toUpperCase()}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); closeServerTab(plotId); }}
                className="ml-1 pb-2 text-[10px] text-ink-soft hover:text-red transition-colors cursor-pointer"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {activeView.type === 'office' ? <OfficeGrid /> : <ServerRoomView />}
    </div>
  );
}