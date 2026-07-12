import { Server, Cpu, Database, Zap, Snowflake, HardDrive, Shield, Cloud, X, Wifi, Check } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { RACK_TIERS, NODE_DEFS } from '../data/servers';
import { INTERNET_PROVIDERS } from '../data/internet';
import type { NodeCategory, RentalType } from '../types';

const CATEGORY_ICON: Record<Exclude<NodeCategory, 'router'>, typeof Cpu> = {
  web_server: Cpu,
  database: Database,
  caching: Zap,
  cooling: Snowflake,
  storage: HardDrive,
  security: Shield,
};

const RENTALS: { type: RentalType; label: string; sub: string; cost: number }[] = [
  { type: 'vps', label: 'VPS', sub: '150 RPS · 50 st · SLA 99%', cost: 40 },
  { type: 'dedicated', label: 'Dedicated', sub: '600 RPS · 200 st · SLA 99.9%', cost: 180 },
  { type: 'cloud', label: 'Cloud', sub: '1000 RPS · 500 st · SLA 99.95%', cost: 300 },
  { type: 'db', label: 'DB Cluster', sub: '800 DB RPS · 200 st · SLA 99.9%', cost: 200 },
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
  const { cash, buyRack, buyNode, rentServer, internetSubscriptions, rentInternet, cancelInternet } = useGameStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-indigo uppercase tracking-wider">Server Shop</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-red-soft hover:text-red cursor-pointer text-ink-soft transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div>
        <div className="text-[10px] text-ink-soft mb-1.5 font-semibold">Rent Server (External, no plot needed)</div>
        <div className="grid grid-cols-2 gap-1.5">
          {RENTALS.map(r => (
            <ShopCard key={r.type} title={r.label}
              sub={r.sub}
              price={0} monthly={r.cost} disabled={false}
              onClick={() => rentServer(r.type)} icon={<Cloud className="w-3.5 h-3.5 text-green" />} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 text-[10px] text-ink-soft mb-1.5 font-semibold">
          <Wifi className="w-3 h-3 text-indigo" /> Internet Service (Sewa Layanan)
        </div>
        <div className="space-y-2">
          {INTERNET_PROVIDERS.map(p => (
            <div key={p.id} className="rounded-lg border p-2" style={{ borderColor: `${p.accent}55` }}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-bold" style={{ color: p.accent }}>{p.name}</span>
                <span className="text-[9px] text-ink-soft">{p.tagline}</span>
              </div>
              <div className="flex gap-2 text-[9px] mb-1.5">
                <span className="text-green">▲ {p.strength}</span>
                <span className="text-red">▼ {p.weakness}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {p.tiers.map(t => {
                  const active = internetSubscriptions.some(s => s.providerId === p.id && s.tierId === t.id);
                  const cost = Math.round(t.baseCost * p.costMult);
                  const net = Math.round(t.network * p.networkMult * 10) / 10;
                  const rps = Math.round(t.rpsBonus * p.rpsMult);
                  const mood = Math.round(t.moodBonus * p.moodMult * 100);
                  return (
                    <button
                      key={t.id}
                      onClick={() => rentInternet(p.id, t.id)}
                      disabled={active}
                      className={`text-left rounded-md border px-1.5 py-1 transition-colors ${active ? 'border-green/40 bg-green-soft cursor-default' : 'border-border bg-surface-2 hover:bg-surface cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-ink">{t.speedMbps} Mbps</span>
                        {active
                          ? <span className="text-[9px] text-green flex items-center gap-0.5"><Check className="w-2.5 h-2.5" />Aktif</span>
                          : <span className="text-[9px] text-indigo font-semibold">${cost}/mo</span>}
                      </div>
                      <div className="text-[8.5px] text-ink-soft leading-tight mt-0.5">
                        Net +{net} · +{rps} RPS · mood +{mood}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {internetSubscriptions.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="text-[9px] text-ink-soft font-semibold uppercase tracking-wider">Active Subscriptions</div>
            {internetSubscriptions.map(s => (
              <div key={s.id} className="flex items-center justify-between text-[10px] bg-surface-2 border border-border rounded-md px-1.5 py-1">
                <span className="text-ink">{s.providerName} · {s.speedMbps} Mbps <span className="text-ink-soft">(${s.monthlyCost}/mo)</span></span>
                <button onClick={() => cancelInternet(s.id)} className="text-red hover:text-red/70 cursor-pointer p-0.5" title="Cancel"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] text-ink-soft mb-1.5 font-semibold">Buy Rack</div>
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
        <div className="text-[10px] text-ink-soft mb-1.5 font-semibold">Buy Node & Equipment</div>
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
    </div>
  );
}
