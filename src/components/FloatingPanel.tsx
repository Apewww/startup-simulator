import { useState, type ReactNode } from 'react';
import { Minus, Maximize2, X } from 'lucide-react';
import { useGameStore, type PanelId } from '../store/gameStore';

interface FloatingPanelProps {
  id: PanelId;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  accent?: string;
}

export function FloatingPanel({ id, title, icon, children, accent = '#7C3AED' }: FloatingPanelProps) {
  const open = useGameStore((s) => s.panelOpen[id]);
  const togglePanel = useGameStore((s) => s.togglePanel);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  if (!open) return null;

  return (
    <>
      {/* Backdrop (mobile sheet only) */}
      <div
        onClick={() => togglePanel(id)}
        className="max-md:block hidden fixed inset-0 bg-black/50 z-40"
      />

      <div
        className={`relative flex flex-col glass-card rounded-2xl overflow-hidden panel-anim transition-all duration-200 ${
          maximized ? 'fixed inset-4 z-50' : 'w-full'
        }
        max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85vh] max-md:rounded-t-2xl max-md:rounded-b-none max-md:w-auto max-md:z-50`}
        style={{ borderColor: `${accent}55`, boxShadow: `0 8px 30px ${accent}33` }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b cursor-pointer select-none"
          style={{ borderColor: `${accent}33`, background: `${accent}14` }}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-['Space_Grotesk'] font-semibold text-sm tracking-wide" style={{ color: accent }}>
              {title.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized((m) => !m)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 cursor-pointer" title="Minimize">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={() => setMaximized((m) => !m)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 cursor-pointer" title="Maximize">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={() => togglePanel(id)} className="p-1.5 rounded-lg hover:bg-red-500/30 text-red-300 cursor-pointer" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <div className="p-4 overflow-y-auto" style={{ maxHeight: maximized ? 'calc(100% - 48px)' : '70vh' }}>
            {children}
          </div>
        )}
      </div>
    </>
  );
}
