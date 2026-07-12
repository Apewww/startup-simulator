import { useEffect } from 'react';
import { Users, LayoutGrid, Server, DollarSign, UserCheck, Gift, Target } from 'lucide-react';
import { useGameStore, type PanelId } from '../store/gameStore';

export const DOCK_ITEMS: { id: PanelId; label: string; shortcut: string; Icon: typeof Users; accent: string }[] = [
  { id: 'employees', label: 'Team', shortcut: '1', Icon: Users, accent: '#4F5EFF' },
  { id: 'recruitment', label: 'Hire', shortcut: '5', Icon: UserCheck, accent: '#17A366' },
  { id: 'features', label: 'Build', shortcut: '2', Icon: LayoutGrid, accent: '#4F5EFF' },
  { id: 'server', label: 'Server', shortcut: '3', Icon: Server, accent: '#4F5EFF' },
  { id: 'finance', label: 'Money', shortcut: '4', Icon: DollarSign, accent: '#4F5EFF' },
  { id: 'perks', label: 'Perks', shortcut: '6', Icon: Gift, accent: '#B7791F' },
  { id: 'adsales', label: 'Ad Sales', shortcut: '7', Icon: Target, accent: '#4F5EFF' },
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
      className="flex gap-1 p-2 justify-around md:flex-col md:justify-start md:gap-2 md:p-3 md:pt-4
                 fixed bottom-0 left-0 right-0 z-30 md:static
                 bg-surface border-t md:border-t-0 md:border-r border-border"
    >
      {DOCK_ITEMS.map(({ id, label, shortcut, Icon }) => {
        const active = panelOpen[id];
        return (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            title={`${label} (${shortcut})`}
            className={`flex items-center justify-center flex-1 md:flex-none w-auto md:w-11 h-11 rounded-[10px] transition-colors cursor-pointer ${
              active ? 'bg-indigo-soft text-indigo' : 'text-ink-soft hover:text-ink hover:bg-surface-2'
            }`}
          >
            <Icon className="w-[19px] h-[19px]" strokeWidth={2} />
          </button>
        );
      })}
    </nav>
  );
}