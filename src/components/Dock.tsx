import { useEffect } from 'react';
import { Users, LayoutGrid, Server, DollarSign } from 'lucide-react';
import { useGameStore, type PanelId } from '../store/gameStore';

export const DOCK_ITEMS: { id: PanelId; label: string; shortcut: string; Icon: typeof Users; accent: string }[] = [
  { id: 'employees', label: 'Team', shortcut: '1', Icon: Users, accent: '#2563EB' },
  { id: 'features', label: 'Build', shortcut: '2', Icon: LayoutGrid, accent: '#3B82F6' },
  { id: 'server', label: 'Server', shortcut: '3', Icon: Server, accent: '#2563EB' },
  { id: 'finance', label: 'Money', shortcut: '4', Icon: DollarSign, accent: '#16A34A' },
];

export function Dock() {
  const panelOpen = useGameStore((s) => s.panelOpen);
  const togglePanel = useGameStore((s) => s.togglePanel);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const item = DOCK_ITEMS.find((d) => d.shortcut === e.key);
      if (item) togglePanel(item.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePanel]);

  return (
    <nav
      className="flex gap-1 p-2 justify-around md:flex-col md:justify-start md:gap-3 md:p-3
                 fixed bottom-0 left-0 right-0 z-30 md:static md:bottom-auto
                 bg-bg-surface border-t-2 md:border-t-0 md:border-r-2 border-border"
    >
      {DOCK_ITEMS.map(({ id, label, shortcut, Icon, accent }) => {
        const active = panelOpen[id];
        return (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            title={`${label} (${shortcut})`}
            className={`relative flex flex-col items-center justify-center flex-1 md:flex-none
                        h-12 md:h-16 md:w-16 border transition-colors cursor-pointer`}
            style={{
              borderColor: active ? accent : '#3D4149',
              backgroundColor: active ? `${accent}1A` : 'transparent',
            }}
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: active ? accent : '#9CA3AF' }} strokeWidth={2} />
            <span
              className="text-[9px] md:text-[10px] mt-0.5 font-semibold"
              style={{ color: active ? accent : '#6B7280' }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-current
                           md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:-left-[14px] md:translate-x-0 md:w-0.5 md:h-8"
                style={{ color: accent }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}