import { useState } from 'react';
import { Users, DollarSign, TrendingUp, LayoutGrid, Server, Clock, Coffee, Armchair, Droplets, Gift, Check, Lock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { MILESTONES, type PerkContext, type MilestoneDef } from '../data/milestones';
import { PERKS } from '../data/perks';
import { FurnitureShop } from './FurnitureShop';
import { FurnitureInventory } from './FurnitureInventory';

const ICONS: Record<string, typeof Users> = {
  Users, DollarSign, TrendingUp, LayoutGrid, Server, Clock, Coffee, Armchair, Droplets, Gift,
};

function earnedCount(m: MilestoneDef, earned: string[]): number {
  return earned.filter(id => id.startsWith(`${m.id}_`)).length;
}

function isEarned(m: MilestoneDef, earned: string[]): boolean {
  return m.repeatable ? earnedCount(m, earned) > 0 : earned.includes(m.id);
}

function MilestoneRow({ m, ctx, earned }: { m: MilestoneDef; ctx: PerkContext; earned: string[] }) {
  const Icon = ICONS[m.icon] ?? Gift;
  const done = isEarned(m, earned);

  let pct = 0;
  let label = '';
  if (m.repeatable) {
    const count = earnedCount(m, earned);
    const nextTarget = (count + 1) * 6;
    pct = Math.min(100, Math.round((ctx.month / nextTarget) * 100));
    label = `Earned ${count} / next at month ${nextTarget}`;
  } else if (m.getProgress) {
    const prog = m.getProgress(ctx);
    pct = Math.min(100, Math.round((prog.current / prog.target) * 100));
    label = `${prog.current} / ${prog.target}`;
  }

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${done ? 'bg-green-soft border-green/30' : 'bg-surface-2 border-border'}`}>
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${done ? 'bg-green text-white' : 'bg-ink/5 text-ink-soft'}`}>
        <Icon className="w-4.5 h-4.5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-ink truncate">{m.name}</span>
          {done && <Check className="w-3.5 h-3.5 text-green shrink-0" />}
          {m.repeatable && <span className="text-[9px] uppercase tracking-wider text-amber font-bold">Repeat</span>}
        </div>
        <div className="text-[10px] text-ink-soft truncate">{m.description}</div>
        {!done && (
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[9px] font-mono text-ink-soft shrink-0">{label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PerkRow({ perkId, points, owned, onUnlock }: { perkId: string; points: number; owned: boolean; onUnlock: (id: string) => void }) {
  const perk = PERKS.find(p => p.id === perkId)!;
  const Icon = ICONS[perk.icon] ?? Gift;
  const canBuy = !owned && points >= perk.cost;

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${owned ? 'bg-green-soft border-green/30' : 'bg-surface-2 border-border'}`}>
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${owned ? 'bg-green text-white' : 'bg-ink/5 text-ink-soft'}`}>
        <Icon className="w-4.5 h-4.5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-ink truncate">{perk.name}</span>
          <span className="text-[9px] uppercase tracking-wider text-amber font-bold">{perk.cost} pt</span>
        </div>
        <div className="text-[10px] text-ink-soft leading-snug">{perk.description}</div>
      </div>
      {owned ? (
        <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-green">
          <Check className="w-3.5 h-3.5" /> Owned
        </span>
      ) : (
        <button
          onClick={() => onUnlock(perk.id)}
          disabled={!canBuy}
          className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            canBuy ? 'bg-amber text-white hover:bg-amber/90' : 'bg-ink/5 text-ink-soft cursor-not-allowed'
          }`}
        >
          {points >= perk.cost ? 'Unlock' : <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Need {perk.cost}</span>}
        </button>
      )}
    </div>
  );
}

export function PerksPanel() {
  const [tab, setTab] = useState<'milestones' | 'unlock' | 'shop' | 'inventory'>('milestones');
  const perkPoints = useGameStore((s) => s.perkPoints);
  const earnedMilestones = useGameStore((s) => s.earnedMilestones);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const employees = useGameStore((s) => s.employees);
  const cash = useGameStore((s) => s.cash);
  const currentUsers = useGameStore((s) => s.currentUsers);
  const features = useGameStore((s) => s.features);
  const racks = useGameStore((s) => s.racks);
  const month = useGameStore((s) => s.month);
  const unlockPerk = useGameStore((s) => s.unlockPerk);

  const ctx: PerkContext = { employees, cash, currentUsers, features, racks, month };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between bg-amber-soft rounded-lg p-3 border border-amber/30">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber" />
          <span className="text-sm font-semibold text-amber">Perk Points</span>
        </div>
        <span className="text-2xl font-bold text-amber">{perkPoints}</span>
      </div>

      <div className="flex gap-1 bg-surface-2 rounded-lg p-1">
        <button
          onClick={() => setTab('milestones')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${tab === 'milestones' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
        >
          Milestones
        </button>
        <button
          onClick={() => setTab('unlock')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${tab === 'unlock' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
        >
          Unlock Perks
        </button>
        <button
          onClick={() => setTab('shop')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${tab === 'shop' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
        >
          Shop
        </button>
        <button
          onClick={() => setTab('inventory')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${tab === 'inventory' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
        >
          Inventory
        </button>
      </div>

      {tab === 'milestones' ? (
        <div className="flex flex-col gap-2">
          {MILESTONES.map((m) => (
            <MilestoneRow key={m.id} m={m} ctx={ctx} earned={earnedMilestones} />
          ))}
        </div>
      ) : tab === 'unlock' ? (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-ink-soft leading-snug">
            Spend Perk Points to unlock furniture. Unlocked items appear in the Furniture Shop tab.
          </p>
          {PERKS.map((p) => (
            <PerkRow key={p.id} perkId={p.id} points={perkPoints} owned={unlockedPerks.includes(p.id)} onUnlock={unlockPerk} />
          ))}
        </div>
      ) : tab === 'shop' ? (
        <FurnitureShop />
      ) : (
        <FurnitureInventory />
      )}
    </div>
  );
}
