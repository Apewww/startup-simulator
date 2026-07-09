import { X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { DOCK_ITEMS } from './Dock';

export function PanelTaskbar() {
  const panelOpen = useGameStore((s) => s.panelOpen);
  const panelMinimized = useGameStore((s) => s.panelMinimized);
  const toggleMinimize = useGameStore((s) => s.toggleMinimize);
  const togglePanel = useGameStore((s) => s.togglePanel);

  const openItems = DOCK_ITEMS.filter((d) => panelOpen[d.id]);
  if (openItems.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface border-t-2 border-border overflow-x-auto">
      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest hidden sm:inline">
        Windows
      </span>
      {openItems.map(({ id, label, accent }) => {
        const isMin = panelMinimized[id];
        return (
          <div
            key={id}
            className="flex items-center gap-1 pl-3 pr-1.5 py-1 border-2 cursor-pointer transition-colors"
            style={{
              borderColor: isMin ? '#3D4149' : accent,
              backgroundColor: isMin ? 'transparent' : `${accent}1A`,
            }}
            onClick={() => toggleMinimize(id)}
            title={isMin ? 'Restore' : 'Minimize'}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: isMin ? '#9CA3AF' : accent }}
            >
              {label}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); togglePanel(id); }}
              className="p-0.5 bg-bg-card hover:bg-danger hover:text-white text-text-muted transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}