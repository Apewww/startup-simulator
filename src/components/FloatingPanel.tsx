import { useEffect, useRef, useState, type ReactNode } from 'react';
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

export function FloatingPanel({ id, title, icon, children, index = 0 }: FloatingPanelProps) {
  const open = useGameStore((s) => s.panelOpen[id]);
  const minimized = useGameStore((s) => s.panelMinimized[id]);
  const maximizedPanel = useGameStore((s) => s.maximizedPanel);
  const togglePanel = useGameStore((s) => s.togglePanel);
  const toggleMinimize = useGameStore((s) => s.toggleMinimize);
  const setMaximizedPanel = useGameStore((s) => s.setMaximizedPanel);

  const isMaximized = maximizedPanel === id;

  const randX = useRef(80 + Math.floor(Math.random() * (window.innerWidth - 420)));
  const randY = useRef(80 + Math.floor(Math.random() * (window.innerHeight - 300)));
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
  }, [maximizedPanel]);

  if (!open || (minimized && !isMaximized)) return null;

  const bringToFront = () => setZ(++zCounter);

  const handleMaximize = () => {
    const { maximizedPanel: current } = useGameStore.getState();
    if (current === id) {
      useGameStore.setState({ maximizedPanel: null });
      setPos({ x: window.innerWidth - 340 - index * 30, y: 90 + index * 30 });
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

  return (
    <div
      onPointerDown={bringToFront}
      className={`flex flex-col overflow-hidden rounded-xl shadow-[0_12px_32px_-8px_rgba(20,30,60,0.15)] pointer-events-auto border
        max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85vh] max-md:rounded-t-2xl max-md:rounded-b-none
        ${isMaximized ? 'fixed right-0 top-[52px] bottom-10 w-[420px] z-50 rounded-none rounded-l-xl max-md:inset-0 max-md:!w-auto max-md:rounded-none' : 'absolute w-[300px]'}`}
      style={{
        left: isMaximized ? undefined : pos.x,
        top: isMaximized ? undefined : pos.y,
        zIndex: z,
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div
        onPointerDown={onPointerDownHeader}
        className="flex items-center justify-between px-[14px] py-[11px] border-b cursor-grab active:cursor-grabbing select-none"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold text-ink">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink-soft text-xs">
          <button onClick={() => toggleMinimize(id)} className="p-1 rounded hover:bg-ink/5 transition-colors cursor-pointer" title="Minimize">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleMaximize} className="p-1 rounded hover:bg-ink/5 transition-colors cursor-pointer" title={isMaximized ? 'Restore' : 'Maximize'}>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => togglePanel(id)} className="p-1 rounded hover:bg-red-soft hover:text-red transition-colors cursor-pointer" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-[14px] py-3 overflow-y-auto text-xs" style={{ maxHeight: isMaximized ? 'calc(100% - 48px)' : 'clamp(280px, 60vh, 70vh)' }}>
        {children}
      </div>
    </div>
  );
}