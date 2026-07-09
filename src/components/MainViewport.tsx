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
      <div className="relative h-full bg-bg-surface border-2 border-border flex flex-col">
        {/* Tab bar */}
        <div className="flex items-center shrink-0 px-4 pt-2.5 gap-0 border-b-2 border-border">
          <button
            onClick={() => setActiveView({ type: 'office' })}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold tracking-wider transition-colors cursor-pointer ${
              activeView.type === 'office'
                ? 'bg-bg-card text-primary border-b-2 border-primary -mb-[1px]'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            OFFICE FLOOR
          </button>
          {visitedPlots.map(plotId => {
            const isActive = activeView.type === 'server' && activeView.plotId === plotId;
            return (
              <div key={plotId} className={`flex items-center transition-colors ${
                isActive
                  ? 'bg-bg-card border-b-2 border-primary -mb-[1px]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}>
                <button
                  onClick={() => setActiveView({ type: 'server', plotId })}
                  className={`flex items-center gap-1.5 pl-2.5 pr-1 py-2 text-xs font-semibold tracking-wider cursor-pointer transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <Server className="w-3 h-3" />
                  <span>{plotId.toUpperCase()}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); closeServerTab(plotId); }}
                  className="pr-2 py-2 text-[10px] hover:text-danger transition-colors cursor-pointer"
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