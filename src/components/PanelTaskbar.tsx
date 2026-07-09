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
    <div className="h-10 bg-surface border-t border-border flex items-center gap-2 px-4 shrink-0">
      {openItems.map(({ id, label }) => {
        const isMin = panelMinimized[id];
        return (
          <div
            key={id}
            className={`flex items-center gap-1 px-3 py-[6px] rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
              isMin
                ? 'bg-surface-2 text-ink-soft border-border'
                : 'bg-indigo-soft text-indigo border-transparent'
            }`}
            onClick={() => toggleMinimize(id)}
            title={isMin ? 'Restore' : 'Minimize'}
          >
            <span>{label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); togglePanel(id); }}
              className="ml-1 rounded hover:bg-red-soft hover:text-red transition-colors cursor-pointer"
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