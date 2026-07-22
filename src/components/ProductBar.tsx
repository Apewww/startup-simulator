import { useState } from 'react';
import { Globe, ShoppingCart, Search, Plus } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { PRODUCTS } from '../data/products';

const PRODUCT_ICONS: Record<string, typeof Globe> = {
  social_media: Globe,
  ecommerce: ShoppingCart,
  search_engine: Search,
};

export function ProductBar() {
  const products = useGameStore((s) => s.products);
  const activeProductId = useGameStore((s) => s.activeProductId);
  const switchProduct = useGameStore((s) => s.switchProduct);
  const createProduct = useGameStore((s) => s.createProduct);
  const [showNewMenu, setShowNewMenu] = useState(false);

  const entries = Object.entries(products);

  if (entries.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 bg-surface border-b border-border overflow-x-auto shrink-0">
      {entries.map(([id, p]) => (
        <button
          key={id}
          onClick={() => switchProduct(id)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
            id === activeProductId
              ? 'bg-indigo-soft text-indigo shadow-sm'
              : 'text-ink-soft hover:text-ink hover:bg-surface-2'
          }`}
        >
          {PRODUCT_ICONS[p.sector] ? (
            <span className="w-3.5 h-3.5">{PRODUCT_ICONS[p.sector]({ className: 'w-full h-full', strokeWidth: 2 }) as any}</span>
          ) : null}
          <span>{p.name}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowNewMenu(!showNewMenu)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer ml-1"
          title="New Product"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>New</span>
        </button>

        {showNewMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNewMenu(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[180px]">
              {PRODUCTS.map((product) => {
                const Icon = PRODUCT_ICONS[product.id];
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      createProduct(product.id);
                      setShowNewMenu(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-indigo shrink-0" strokeWidth={1.75} />
                    <span>{product.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
