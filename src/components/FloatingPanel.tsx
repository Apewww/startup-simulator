import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Minus, Maximize2, X } from 'lucide-react';
import { useGameStore, type PanelId } from '../store/gameStore';
import { soundManager } from '../systems/soundManager';

let zCounter = 40;

const PANEL_ACCENTS: Record<PanelId, { border: string; badge: string }> = {
  employees: { border: 'border-purple-500/30', badge: 'bg-purple-500/10 text-purple-400' },
  features: { border: 'border-indigo-500/30', badge: 'bg-indigo-500/10 text-indigo-400' },
  server: { border: 'border-cyan-500/30', badge: 'bg-cyan-500/10 text-cyan-400' },
  finance: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400' },
  recruitment: { border: 'border-blue-500/30', badge: 'bg-blue-500/10 text-blue-400' },
  perks: { border: 'border-amber-500/30', badge: 'bg-amber-500/10 text-amber-400' },
  adsales: { border: 'border-rose-500/30', badge: 'bg-rose-500/10 text-rose-400' },
  banking: { border: 'border-teal-500/30', badge: 'bg-teal-500/10 text-teal-400' },
  competitor: { border: 'border-orange-500/30', badge: 'bg-orange-500/10 text-orange-400' },
  marketing: { border: 'border-yellow-500/30', badge: 'bg-yellow-500/10 text-yellow-400' },
  research: { border: 'border-sky-500/30', badge: 'bg-sky-500/10 text-sky-400' },
  investor: { border: 'border-violet-500/30', badge: 'bg-violet-500/10 text-violet-400' },
  wealth: { border: 'border-amber-500/30', badge: 'bg-amber-500/10 text-amber-400' },
  products: { border: 'border-indigo-500/30', badge: 'bg-indigo-500/10 text-indigo-400' },
  regions: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400' },
  dev: { border: 'border-pink-500/30', badge: 'bg-pink-500/10 text-pink-400' },
};

interface FloatingPanelProps {
  id: PanelId;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  accent?: string;
  index?: number;
}

export function FloatingPanel({ id, title, icon, children, index = 0 }: FloatingPanelProps) {
  const open = useGameStore((s) => s.panelOpen[id]);
  const minimized = useGameStore((s) => s.panelMinimized[id]);
  const maximizedPanel = useGameStore((s) => s.maximizedPanel);
  const togglePanel = useGameStore((s) => s.togglePanel);
  const toggleMinimize = useGameStore((s) => s.toggleMinimize);
  const setMaximizedPanel = useGameStore((s) => s.setMaximizedPanel);

  const isMaximized = maximizedPanel === id;

  const randX = useRef(80 + Math.floor(Math.random() * Math.max(100, window.innerWidth - 420)));
  const randY = useRef(80 + Math.floor(Math.random() * Math.max(100, window.innerHeight - 300)));
  const [pos, setPos] = useState({ x: randX.current, y: randY.current });
  const [z, setZ] = useState(30 + index);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (maximizedPanel && !isMaximized && open && !minimized) {
      const rightBoundary = window.innerWidth - 440;
      if (pos.x >= rightBoundary) {
        setPos({
          x: 80 + Math.floor(Math.random() * Math.max(100, rightBoundary - 80 - 320)),
          y: 80 + Math.floor(Math.random() * (window.innerHeight - 300)),
        });
      }
    }
  }, [maximizedPanel, isMaximized, open, minimized, pos.x]);

  if (!open || (minimized && !isMaximized)) return null;

  const bringToFront = () => setZ(++zCounter);

  const handleMaximize = () => {
    soundManager.playClick();
    const { maximizedPanel: current } = useGameStore.getState();
    if (current === id) {
      useGameStore.setState({ maximizedPanel: null });
      setPos({ x: Math.max(20, window.innerWidth - 340 - index * 30), y: 90 + index * 30 });
    } else {
      if (current && current !== id) {
        useGameStore.setState((s) => ({
          panelMinimized: { ...s.panelMinimized, [current]: true },
          maximizedPanel: id,
        }));
      } else {
        setMaximizedPanel(id);
      }
    }
  };

  const handleClose = () => {
    soundManager.playClick();
    togglePanel(id);
  };

  const handleMinimizeToggle = () => {
    soundManager.playClick();
    toggleMinimize(id);
  };

  const onPointerDownHeader = (e: React.PointerEvent) => {
    if (window.matchMedia('(max-width: 767px)').matches || isMaximized) return;
    bringToFront();
    const startX = e.clientX;
    const startY = e.clientY;
    drag.current = { dx: startX - pos.x, dy: startY - pos.y };

    const onMove = (ev: PointerEvent) => {
      if (!drag.current) return;
      const nx = Math.max(0, Math.min(window.innerWidth - 320, ev.clientX - drag.current.dx));
      const ny = Math.max(0, Math.min(window.innerHeight - 80, ev.clientY - drag.current.dy));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const accentTheme = PANEL_ACCENTS[id] || { border: 'border-indigo-500/30', badge: 'bg-indigo-500/10 text-indigo-400' };

  return (
    <div
      onPointerDown={bringToFront}
      className={`flex flex-col overflow-hidden rounded-xl game-panel-frame pointer-events-auto border transition-all duration-200 ease-out
        max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85vh] max-md:rounded-t-2xl max-md:rounded-b-none
        ${accentTheme.border}
        ${isMaximized
          ? 'fixed right-0 top-[43px] bottom-10 w-[420px] xl:w-[480px] z-50 rounded-none rounded-l-xl border-r-0 max-md:inset-0 max-md:!w-auto max-md:rounded-none max-md:border-r'
          : 'absolute w-[320px] xl:w-[340px]'}`}
      style={{
        left: isMaximized ? undefined : pos.x,
        top: isMaximized ? undefined : pos.y,
        zIndex: z,
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Game Panel Title Bar */}
      <div
        onPointerDown={onPointerDownHeader}
        className="flex items-center justify-between px-3.5 py-2.5 game-header-glow cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md ${accentTheme.badge}`}>
            {icon}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-ink">{title}</span>
        </div>
        <div className="flex items-center gap-1 text-ink-soft text-xs">
          <button onClick={handleMinimizeToggle} className="p-1 rounded hover:bg-surface-2 transition-colors cursor-pointer" title="Minimize">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleMaximize} className="p-1 rounded hover:bg-surface-2 transition-colors cursor-pointer" title={isMaximized ? 'Restore' : 'Maximize'}>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleClose} className="p-1 rounded hover:bg-red-soft hover:text-red transition-colors cursor-pointer" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Game Panel Content */}
      <div className="px-3.5 py-3 overflow-y-auto text-xs" style={{ maxHeight: isMaximized ? 'calc(100% - 48px)' : 'clamp(280px, 60vh, 70vh)' }}>
        {children}
      </div>
    </div>
  );
}