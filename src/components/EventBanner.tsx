import { useGameStore } from '../store/gameStore';
import { Shield, Skull, TrendingUp, Activity, Zap } from 'lucide-react';

const EVENT_ICONS = {
  ddos: Shield,
  traffic_spike: TrendingUp,
  server_outage: Skull,
  pr_crisis: Activity,
  viral_growth: Zap,
};

const EVENT_COLORS = {
  ddos: 'border-red/30 bg-red-soft text-red',
  traffic_spike: 'border-green/30 bg-green-soft text-green',
  server_outage: 'border-red/40 bg-red-soft text-red',
  pr_crisis: 'border-amber/30 bg-amber-soft text-amber',
  viral_growth: 'border-green/40 bg-green-soft text-green',
};

export function EventBanner() {
  const events = useGameStore((s) => s.events);

  if (events.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-1.5 pointer-events-none">
      {events.map((ev) => {
        const Icon = EVENT_ICONS[ev.type];
        const colorClass = EVENT_COLORS[ev.type];
        const pct = Math.round((ev.tickLeft / ev.duration) * 100);
        return (
          <div
            key={ev.id}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg shadow-[0_4px_16px_-4px_rgba(20,30,60,0.12)] backdrop-blur-sm pointer-events-auto ${colorClass}`}
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold">{ev.name}</span>
              <span className="text-[10px] opacity-75">{ev.description}</span>
            </div>
            <div className="ml-2 flex items-center gap-1.5">
              <div className="w-12 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-current" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-mono">{ev.tickLeft}t</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
