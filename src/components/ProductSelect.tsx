import { Globe, ShoppingCart, Search } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { useGameStore } from '../store/gameStore';

const PRODUCT_ICONS: Record<string, typeof Globe> = {
  social_media: Globe,
  ecommerce: ShoppingCart,
  search_engine: Search,
};

export function ProductSelect() {
  const selectProduct = useGameStore((s) => s.selectProduct);

  return (
    <div className="min-h-screen bg-bg text-ink p-8 flex flex-col items-center justify-center">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-3 h-3 rounded-sm bg-indigo" />
        <h1 className="text-4xl font-extrabold tracking-tight">Startup Simulator</h1>
      </div>
      <p className="text-ink-soft mb-8">Choose your product to begin</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {PRODUCTS.map((product) => {
          const Icon = PRODUCT_ICONS[product.id];
          return (
          <button key={product.id} onClick={() => selectProduct(product.id)}
            className="card-hover p-6 text-left transition-colors cursor-pointer">
            <Icon className="w-12 h-12 mb-4 text-indigo" strokeWidth={1.75} />
            <h2 className="text-2xl font-bold mb-1 text-ink">{product.name}</h2>
            <p className="text-xs text-ink-soft italic mb-4">"{product.tagline}"</p>
            <p className="text-xs text-ink-soft mb-6 leading-relaxed">{product.description}</p>
            <div>
              <h3 className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-2">Features</h3>
              <div className="flex flex-wrap gap-1.5">
                {product.features.map((f) => (
                  <span key={f.id} className="text-[10px] px-2 py-0.5 bg-surface-2 text-ink-soft border border-border rounded">{f.name}</span>
                ))}
              </div>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}