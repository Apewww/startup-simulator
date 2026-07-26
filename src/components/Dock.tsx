import { useEffect } from 'react';
import { Users, LayoutGrid, Server, DollarSign, UserCheck, Gift, Target, Landmark, BarChart3, Megaphone, Microscope, Handshake, Wallet, Bug, LayoutList, Globe } from 'lucide-react';
import { useGameStore, type PanelId } from '../store/gameStore';

export const DOCK_ITEMS: { id: PanelId; label: string; shortcut: string; Icon: typeof Users; accent: string }[] = [
  { id: 'employees', label: 'Team', shortcut: '1', Icon: Users, accent: '#4F5EFF' },
  { id: 'recruitment', label: 'Hire', shortcut: '5', Icon: UserCheck, accent: '#17A366' },
  { id: 'features', label: 'Build', shortcut: '2', Icon: LayoutGrid, accent: '#4F5EFF' },
  { id: 'server', label: 'Server', shortcut: '3', Icon: Server, accent: '#4F5EFF' },
  { id: 'finance', label: 'Money', shortcut: '4', Icon: DollarSign, accent: '#4F5EFF' },
  { id: 'perks', label: 'Perks', shortcut: '6', Icon: Gift, accent: '#B7791F' },
  { id: 'adsales', label: 'Ad Sales', shortcut: '7', Icon: Target, accent: '#4F5EFF' },
  { id: 'banking', label: 'Bank', shortcut: '8', Icon: Landmark, accent: '#4F5EFF' },
  { id: 'competitor', label: 'Market', shortcut: '9', Icon: BarChart3, accent: '#B7791F' },
  { id: 'marketing', label: 'Brand', shortcut: '0', Icon: Megaphone, accent: '#D1453B' },
  { id: 'research', label: 'R&D', shortcut: '-', Icon: Microscope, accent: '#4F5EFF' },
  { id: 'investor', label: 'Board', shortcut: '=', Icon: Handshake, accent: '#4F5EFF' },
  { id: 'wealth', label: 'Wealth', shortcut: '', Icon: Wallet, accent: '#17A366' },
  { id: 'products', label: 'Products', shortcut: '', Icon: LayoutList, accent: '#4F5EFF' },
  { id: 'regions', label: 'Global', shortcut: '', Icon: Globe, accent: '#17A366' },
];

export function Dock() {
  const panelOpen = useGameStore((s) => s.panelOpen);
  const togglePanel = useGameStore((s) => s.togglePanel);
  const devMode = useGameStore((s) => s.devMode);

  const items = devMode
    ? [...DOCK_ITEMS, { id: 'dev' as PanelId, label: 'Dev', shortcut: '', Icon: Bug, accent: '#D1453B' }]
    : DOCK_ITEMS;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const item = items.find((d) => d.shortcut === e.key);
      if (item) togglePanel(item.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePanel, items]);

  return (
    <nav
      className="flex gap-1 p-2 justify-around overflow-x-auto md:flex-col md:justify-start md:overflow-y-auto md:gap-2 md:p-3 md:pt-4
                 fixed bottom-0 left-0 right-0 z-30 md:static
                 bg-surface border-t md:border-t-0 md:border-r border-border"
    >
      {items.map(({ id, label, shortcut, Icon }) => {
        const active = panelOpen[id];
        return (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
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