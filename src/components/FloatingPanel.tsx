import { useRef, useState, type ReactNode } from 'react';
import { Minus, Maximize2, X } from 'lucide-react';
import { useGameStore, type PanelId } from '../store/gameStore';

let zCounter = 40;

interface FloatingPanelProps {
  id: PanelId;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  accent?: string;
  index?: number;
}

export function FloatingPanel({ id, title, icon, children, accent = '#2563EB', index = 0 }: FloatingPanelProps) {
  const open = useGameStore((s) => s.panelOpen[id]);
  const minimized = useGameStore((s) => s.panelMinimized[id]);
  const togglePanel = useGameStore((s) => s.togglePanel);
  const toggleMinimize = useGameStore((s) => s.toggleMinimize);

  const [pos, setPos] = useState({ x: 24 + index * 28, y: 24 + index * 28 });
  const [z, setZ] = useState(30 + index);
  const [maximized, setMaximized] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  if (!open || minimized) return null;

  const bringToFront = () => setZ(++zCounter);

  const onPointerDownHeader = (e: React.PointerEvent) => {
    if (window.matchMedia('(max-width: 767px)').matches) return;
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

  return (
    <div
      onPointerDown={bringToFront}
      className={`absolute border-2 shadow-lg overflow-hidden panel-anim pointer-events-auto
        max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:w-auto max-md:max-h-[85vh] max-md:rounded-t-2xl max-md:rounded-b-none
        ${maximized ? 'fixed inset-4 z-50 max-md:inset-4' : ''}`}
      style={{
        left: maximized ? undefined : pos.x,
        top: maximized ? undefined : pos.y,
        width: maximized ? undefined : 'clamp(320px, 34vw, 440px)',
        zIndex: z,
        borderColor: accent,
        backgroundColor: '#23272E',
      }}
    >
      <div
        onPointerDown={onPointerDownHeader}
        className="flex items-center justify-between px-4 py-2.5 border-b-2 cursor-grab active:cursor-grabbing select-none"
        style={{ borderColor: accent, backgroundColor: `${accent}14` }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm tracking-wide" style={{ color: accent }}>
            {title.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => toggleMinimize(id)} className="p-1.5 bg-bg-card hover:bg-bg-hover text-text-secondary transition-colors cursor-pointer" title="Minimize">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => setMaximized((m) => !m)} className="p-1.5 bg-bg-card hover:bg-bg-hover text-text-secondary transition-colors cursor-pointer" title="Maximize">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={() => togglePanel(id)} className="p-1.5 bg-bg-card hover:bg-danger hover:text-white text-text-secondary transition-colors cursor-pointer" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto" style={{ maxHeight: maximized ? 'calc(100% - 48px)' : 'clamp(280px, 60vh, 70vh)' }}>
        {children}
      </div>
    </div>
  );
}