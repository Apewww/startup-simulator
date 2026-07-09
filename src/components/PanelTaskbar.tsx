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
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(10,14,39,0.95)] border-t border-[#7C3AED]/40 overflow-x-auto">
      <span className="text-[10px] font-['Space_Grotesk'] text-gray-500 uppercase tracking-widest hidden sm:inline">
        Windows
      </span>
      {openItems.map(({ id, label, accent }) => {
        const isMin = panelMinimized[id];
        return (
          <div
            key={id}
            className="flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-lg border cursor-pointer transition-all"
            style={{
              borderColor: isMin ? '#334155' : accent,
              background: isMin ? 'transparent' : `${accent}22`,
            }}
            onClick={() => toggleMinimize(id)}
            title={isMin ? 'Restore' : 'Minimize'}
          >
            <span
              className="text-xs font-['Space_Grotesk'] font-medium"
              style={{ color: isMin ? '#94A3B8' : accent }}
            >
              {label}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); togglePanel(id); }}
              className="p-0.5 rounded hover:bg-red-500/30 text-gray-400 hover:text-red-300 cursor-pointer"
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
