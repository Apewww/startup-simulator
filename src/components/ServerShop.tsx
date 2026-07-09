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
  { type: 'vps', label: 'VPS', capacity: 150, storage: 50, cost: 40, note: 'Murah, scale kecil, SLA 99%' },
  { type: 'dedicated', label: 'Dedicated', capacity: 600, storage: 200, cost: 180, note: 'Kontrol penuh, SLA 99.9%' },
  { type: 'cloud', label: 'Cloud Instance', capacity: 1000, storage: 500, cost: 300, note: 'Auto-scale, SLA 99.95%' },
];

function ShopCard({ title, sub, price, monthly, disabled, onClick, icon, accent }: {
  title: string; sub: string; price: number; monthly?: number; disabled: boolean; onClick: () => void; icon: React.ReactNode; accent: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-left p-3 rounded-xl border bg-gray-800/70 hover:bg-gray-700/70 border-gray-700 hover:border-[#7C3AED] transition-all disabled:opacity-40 cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: accent }}>{icon}</span>
        <span className="font-semibold text-sm text-gray-100">{title}</span>
      </div>
      <div className="text-[11px] text-gray-400 leading-snug">{sub}</div>
      <div className="text-xs mt-1.5" style={{ color: accent }}>
        ${price}{monthly !== undefined && <span className="text-gray-400"> · ${monthly}/mo</span>}
      </div>
    </button>
  );
}

export function ServerShop({ onClose }: { onClose: () => void }) {
  const { cash, buyRack, buyNode, rentServer } = useGameStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-['Space_Grotesk'] uppercase tracking-wider text-[#A78BFA]">Server Shop</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-300 cursor-pointer"><X className="w-4 h-4" /></button>
      </div>

      {/* Racks */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Racks (goes to inventory, drag to plot grid)</div>
        <div className="grid grid-cols-2 gap-2">
          {RACK_TIERS.map(def => (
            <ShopCard
              key={def.tier}
              title={def.label}
              sub={`${def.maxSlots} slots · ${def.gridW}x${def.gridH} cells · Cool ${def.coolingCapacity}`}
              price={def.price}
              monthly={def.monthlyCost}
              disabled={cash < def.price}
              onClick={() => buyRack(def.tier)}
              icon={<Server className="w-4 h-4" />}
              accent="#7C3AED"
            />
          ))}
        </div>
      </div>

      {/* Nodes -> inventory */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Nodes & Equipment (goes to inventory, drag to rack slots)</div>
        <div className="grid grid-cols-2 gap-2">
          {NODE_DEFS.map(def => {
            const Icon = CATEGORY_ICON[def.category];
            return (
              <ShopCard
                key={def.typeId}
                title={def.label}
                sub={def.description}
                price={def.price}
                monthly={def.monthlyCost}
                disabled={cash < def.price}
                onClick={() => buyNode(def.typeId)}
                icon={<Icon className="w-4 h-4" />}
                accent="#00FFFF"
              />
            );
          })}
        </div>
      </div>

      {/* Rental */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Cloud / Rental (no rack needed)</div>
        <div className="grid grid-cols-2 gap-2">
          {RENTALS.map(r => (
            <ShopCard
              key={r.type}
              title={r.label}
              sub={`${r.capacity} RPS · ${r.storage} st · ${r.note}`}
              price={0}
              monthly={r.cost}
              disabled={false}
              onClick={() => rentServer(r.type)}
              icon={<Cloud className="w-4 h-4" />}
              accent="#F97316"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
