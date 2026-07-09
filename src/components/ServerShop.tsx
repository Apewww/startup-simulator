import { Server, Cpu, Database, Zap, Router, Snowflake, HardDrive, Cloud, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { RACK_TIERS, NODE_DEFS } from '../data/servers';
import type { NodeCategory, RentalType } from '../types';

const CATEGORY_ICON: Record<NodeCategory, typeof Cpu> = {
  web_server: Cpu,
  database: Database,
  caching: Zap,
  router: Router,
  cooling: Snowflake,
  storage: HardDrive,
};

const RENTALS: { type: RentalType; label: string; capacity: number; storage: number; cost: number; note: string }[] = [
  { type: 'vps', label: 'VPS', capacity: 150, storage: 50, cost: 40, note: 'Murah, SLA 99%' },
  { type: 'dedicated', label: 'Dedicated', capacity: 600, storage: 200, cost: 180, note: 'Kontrol penuh, SLA 99.9%' },
  { type: 'cloud', label: 'Cloud', capacity: 1000, storage: 500, cost: 300, note: 'Auto-scale, SLA 99.95%' },
];

function ShopCard({ title, sub, price, monthly, disabled, onClick, icon }: {
  title: string; sub: string; price: number; monthly?: number; disabled: boolean; onClick: () => void; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-left p-2.5 card hover:bg-surface-2 hover:border-indigo transition-colors disabled:opacity-40 cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-indigo">{icon}</span>
        <span className="text-xs font-bold text-ink">{title}</span>
      </div>
      <div className="text-[10px] text-ink-soft leading-snug">{sub}</div>
      <div className="text-[11px] mt-1 font-semibold text-indigo">
        ${price}{monthly !== undefined && <span className="text-ink-soft font-normal"> · ${monthly}/mo</span>}
      </div>
    </button>
  );
}

export function ServerShop({ onClose }: { onClose: () => void }) {
  const { cash, buyRack, buyNode, rentServer } = useGameStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-indigo uppercase tracking-wider">Server Shop</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-red-soft hover:text-red cursor-pointer text-ink-soft transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div>
        <div className="text-[10px] text-ink-soft mb-1.5 font-semibold">Racks</div>
        <div className="grid grid-cols-2 gap-1.5">
          {RACK_TIERS.map(def => (
            <ShopCard key={def.tier} title={def.label}
              sub={`${def.maxSlots} slots · ${def.gridW}x${def.gridH} · Cool ${def.coolingCapacity}`}
              price={def.price} monthly={def.monthlyCost} disabled={cash < def.price}
              onClick={() => buyRack(def.tier)} icon={<Server className="w-3.5 h-3.5" />} />
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-ink-soft mb-1.5 font-semibold">Nodes & Equipment</div>
        <div className="grid grid-cols-2 gap-1.5">
          {NODE_DEFS.map(def => {
            const Icon = CATEGORY_ICON[def.category];
            return (
              <ShopCard key={def.typeId} title={def.label} sub={def.description}
                price={def.price} monthly={def.monthlyCost} disabled={cash < def.price}
                onClick={() => buyNode(def.typeId)} icon={<Icon className="w-3.5 h-3.5" />} />
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-ink-soft mb-1.5 font-semibold">Cloud / Rental</div>
        <div className="grid grid-cols-2 gap-1.5">
          {RENTALS.map(r => (
            <ShopCard key={r.type} title={r.label}
              sub={`${r.capacity} RPS · ${r.storage} st · ${r.note}`}
              price={0} monthly={r.cost} disabled={false}
              onClick={() => rentServer(r.type)} icon={<Cloud className="w-3.5 h-3.5 text-green" />} />
          ))}
        </div>
      </div>
    </div>
  );
}