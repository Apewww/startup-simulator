import { useEffect } from 'react';
import { Users, LayoutGrid, Server, DollarSign } from 'lucide-react';
import { useGameStore, type PanelId } from '../store/gameStore';

const DOCK_ITEMS: { id: PanelId; label: string; shortcut: string; Icon: typeof Users; accent: string }[] = [
  { id: 'employees', label: 'Team', shortcut: '1', Icon: Users, accent: '#3B82F6' },
  { id: 'features', label: 'Build', shortcut: '2', Icon: LayoutGrid, accent: '#A78BFA' },
  { id: 'server', label: 'Server', shortcut: '3', Icon: Server, accent: '#00FFFF' },
  { id: 'finance', label: 'Money', shortcut: '4', Icon: DollarSign, accent: '#F97316' },
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
                 bg-[rgba(10,14,39,0.97)] border-t-2 md:border-t-0 md:border-r-2 border-[#7C3AED]
                 shadow-[0_-2px_14px_#7C3AED55] md:shadow-[2px_0_14px_#7C3AED44]"
    >
      {DOCK_ITEMS.map(({ id, label, shortcut, Icon, accent }) => {
        const active = panelOpen[id];
        return (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            title={`${label} (${shortcut})`}
            className={`relative flex flex-col items-center justify-center flex-1 md:flex-none
                        h-12 md:h-16 md:w-16 rounded-xl border transition-all duration-200 cursor-pointer`}
            style={{
              borderColor: active ? accent : '#334155',
              background: active ? `${accent}22` : 'transparent',
              boxShadow: active ? `0 0 12px ${accent}88` : 'none',
            }}
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: active ? accent : '#94A3B8' }} strokeWidth={2} />
            <span
              className="text-[9px] md:text-[10px] mt-0.5 font-['Space_Grotesk'] font-medium"
              style={{ color: active ? accent : '#64748B' }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full
                           md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:-left-[14px] md:translate-x-0 md:w-1 md:h-8 md:rounded-r"
                style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
