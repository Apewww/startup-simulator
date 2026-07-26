import { Globe, ShoppingCart, Search, SwitchCamera, XCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const PRODUCT_ICONS: Record<string, typeof Globe> = {
  social_media: Globe,
  ecommerce: ShoppingCart,
  search_engine: Search,
};

export function ProductOverview() {
  const products = useGameStore((s) => s.products);
  const activeProductId = useGameStore((s) => s.activeProductId);
  const month = useGameStore((s) => s.month);
  const competitors = useGameStore((s) => s.competitors);
  const switchProduct = useGameStore((s) => s.switchProduct);
  const closeProduct = useGameStore((s) => s.closeProduct);

  const entries = Object.entries(products);
  const totalUsers = entries.reduce((sum, [, p]) => sum + p.currentUsers, 0);

  function getRank(sector: string): number {
    const sameSector = competitors.filter(c => !c.delisted && c.sector === sector);
    const idx = sameSector.findIndex(c => c.userCount < totalUsers);
    return idx === -1 ? sameSector.length + 1 : idx + 1;
  }

  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">Products</h2>
        <span className="text-ink-soft text-[10px]">{entries.length} active</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-2 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-ink">{entries.length}</div>
          <div className="text-[9px] text-ink-soft">Products</div>
        </div>
        <div className="bg-surface-2 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-ink">{totalUsers >= 1_000_000 ? `${(totalUsers / 1_000_000).toFixed(1)}M` : totalUsers >= 1_000 ? `${(totalUsers / 1_000).toFixed(1)}K` : totalUsers}</div>
          <div className="text-[9px] text-ink-soft">Total Users</div>
        </div>
        <div className="bg-surface-2 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-ink">{month}</div>
          <div className="text-[9px] text-ink-soft">Months</div>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {entries.map(([id, p]) => {
          const Icon = PRODUCT_ICONS[p.sector];
          return (
            <div key={id} className={`rounded-xl border p-3 ${id === activeProductId ? 'border-indigo/40 bg-indigo/[0.03]' : 'border-border bg-surface-2'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {Icon ? <Icon className="w-4 h-4 text-indigo" strokeWidth={2} /> : null}
                  <span className="font-semibold text-ink text-sm">{p.name}</span>
                  {id === activeProductId && <span className="text-[9px] px-1.5 py-0.5 bg-indigo-soft text-indigo rounded font-medium">Active</span>}
                </div>
                <div className="flex gap-1">
                  {id !== activeProductId && (
                    <button onClick={() => switchProduct(id)} className="p-1 rounded-lg text-ink-soft hover:text-ink hover:bg-surface transition-colors cursor-pointer" title="Switch to product">
                      <SwitchCamera className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  )}
                  <button onClick={() => { if (confirm('Close this product?')) closeProduct(id); }} className="p-1 rounded-lg text-ink-soft hover:text-red hover:bg-red/10 transition-colors cursor-pointer" title="Close product">
                    <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-ink-soft">
                <span>Users: <strong className="text-ink">{p.currentUsers >= 1_000 ? `${(p.currentUsers / 1_000).toFixed(1)}K` : p.currentUsers}</strong></span>
                <span>Brand: <strong className="text-ink">{Math.round(p.brandScore)}%</strong></span>
                <span>Sector: <strong className="text-ink capitalize">{p.sector.replace('_', ' ')}</strong></span>
                <span>Age: <strong className="text-ink">{month - p.createdMonth} months</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
