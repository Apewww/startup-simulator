import { useEffect } from 'react';
import { Users, LayoutGrid, Server, DollarSign, UserCheck, Gift, Target, Landmark, BarChart3, Megaphone, Microscope, Handshake, Wallet, Bug, LayoutList, Globe } from 'lucide-react';
import { useGameStore, type PanelId } from '../store/gameStore';
import { soundManager } from '../systems/soundManager';

export const DOCK_ITEMS: { id: PanelId; label: string; shortcut: string; Icon: typeof Users; accent: string; category: string }[] = [
  { id: 'employees', label: 'Karyawan', shortcut: '1', Icon: Users, accent: '#6366F1', category: 'Tim' },
  { id: 'recruitment', label: 'Rekrutmen', shortcut: '5', Icon: UserCheck, accent: '#10B981', category: 'Tim' },
  { id: 'features', label: 'Fitur App', shortcut: '2', Icon: LayoutGrid, accent: '#3B82F6', category: 'Produk' },
  { id: 'server', label: 'Server Room', shortcut: '3', Icon: Server, accent: '#06B6D4', category: 'Infra' },
  { id: 'finance', label: 'Keuangan', shortcut: '4', Icon: DollarSign, accent: '#10B981', category: 'Finansial' },
  { id: 'perks', label: 'Perks Company', shortcut: '6', Icon: Gift, accent: '#F59E0B', category: 'Tim' },
  { id: 'adsales', label: 'Ad Sales', shortcut: '7', Icon: Target, accent: '#8B5CF6', category: 'Bisnis' },
  { id: 'banking', label: 'Perbankan', shortcut: '8', Icon: Landmark, accent: '#6366F1', category: 'Finansial' },
  { id: 'competitor', label: 'Kompetitor', shortcut: '9', Icon: BarChart3, accent: '#EC4899', category: 'Pasar' },
  { id: 'marketing', label: 'Marketing', shortcut: '0', Icon: Megaphone, accent: '#EF4444', category: 'Bisnis' },
  { id: 'research', label: 'R&D Lab', shortcut: '-', Icon: Microscope, accent: '#3B82F6', category: 'Produk' },
  { id: 'investor', label: 'Investor', shortcut: '=', Icon: Handshake, accent: '#F59E0B', category: 'Finansial' },
  { id: 'wealth', label: 'CEO Wealth', shortcut: '', Icon: Wallet, accent: '#10B981', category: 'Finansial' },
  { id: 'products', label: 'Portofolio', shortcut: '', Icon: LayoutList, accent: '#6366F1', category: 'Produk' },
  { id: 'regions', label: 'Ekspansi', shortcut: '', Icon: Globe, accent: '#10B981', category: 'Pasar' },
];

export function Dock() {
  const panelOpen = useGameStore((s) => s.panelOpen);
  const togglePanel = useGameStore((s) => s.togglePanel);
  const devMode = useGameStore((s) => s.devMode);
  const applicants = useGameStore((s) => s.applicants);

  const items = devMode
    ? [...DOCK_ITEMS, { id: 'dev' as PanelId, label: 'Dev Tools', shortcut: '', Icon: Bug, accent: '#EF4444', category: 'Dev' }]
    : DOCK_ITEMS;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const item = items.find((d) => d.shortcut === e.key);
      if (item) {
        soundManager.playClick();
        togglePanel(item.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePanel, items]);

  const handleToggle = (id: PanelId) => {
    soundManager.playClick();
    togglePanel(id);
  };

  return (
    <nav
      className="flex gap-1.5 p-2 justify-around overflow-x-auto md:flex-col md:justify-start md:overflow-y-auto md:gap-1.5 md:p-2.5 md:w-14
                 fixed bottom-0 left-0 right-0 z-30 md:static shrink-0 select-none
                 bg-slate-900/90 border-t md:border-t-0 md:border-r border-white/10 backdrop-blur-md shadow-2xl"
    >
      {items.map(({ id, label, shortcut, Icon, accent }) => {
        const active = panelOpen[id];
        const isRecruitment = id === 'recruitment';
        const badgeCount = isRecruitment ? applicants.length : 0;

        return (
          <button
            key={id}
            onClick={() => handleToggle(id)}
            title={`${label}${shortcut ? ` (Tombol: ${shortcut})` : ''}`}
            className={`relative flex items-center justify-center flex-1 md:flex-none w-auto md:w-9 h-9 rounded-xl transition-all duration-200 cursor-pointer group ${
              active
                ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/50 shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            {/* Left Active Indicator Bar for Desktop */}
            {active && (
              <span className="hidden md:block absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-500 shadow-glow" />
            )}

            <Icon className="w-4 h-4 transition-transform group-hover:scale-110" strokeWidth={2} style={{ color: active ? accent : undefined }} />

            {/* Notification Badge */}
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                {badgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}