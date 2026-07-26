import { Globe, ShoppingCart, Search, X } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { useGameStore } from '../store/gameStore';

const PRODUCT_ICONS: Record<string, typeof Globe> = {
  social_media: Globe,
  ecommerce: ShoppingCart,
  search_engine: Search,
};

interface Props {
  onClose: () => void;
}

export function NewProductModal({ onClose }: Props) {
  const createProduct = useGameStore((s) => s.createProduct);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6 max-w-2xl w-full pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">New Product</h2>
            <button onClick={onClose} className="text-ink-soft hover:text-ink transition-colors cursor-pointer">
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
          <p className="text-xs text-ink-soft mb-5">Launch a new venture. Shared resources (cash, servers, employees) are pooled across all products.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRODUCTS.map((product) => {
              const Icon = PRODUCT_ICONS[product.id];
              return (
                <button
                  key={product.id}
                  onClick={() => { createProduct(product.id); onClose(); }}
                  className="card-hover p-4 text-left transition-colors cursor-pointer rounded-xl border border-border hover:border-indigo/30"
                >
                  <Icon className="w-8 h-8 mb-3 text-indigo" strokeWidth={1.75} />
                  <h3 className="text-sm font-bold mb-0.5 text-ink">{product.name}</h3>
                  <p className="text-[10px] text-ink-soft italic mb-3">"{product.tagline}"</p>
                  <div className="flex flex-wrap gap-1">
                    {product.features.slice(0, 4).map((f) => (
                      <span key={f.id} className="text-[9px] px-1.5 py-0.5 bg-surface-2 text-ink-soft border border-border rounded">{f.name}</span>
                    ))}
                    {product.features.length > 4 && (
                      <span className="text-[9px] px-1.5 py-0.5 text-ink-soft">+{product.features.length - 4}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
