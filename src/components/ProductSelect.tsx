
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
    <div className="min-h-screen bg-bg-base text-text-primary p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-2 text-text-primary">Startup Simulator</h1>
      <p className="text-text-secondary mb-8">Choose your product to begin</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {PRODUCTS.map((product) => {
          const Icon = PRODUCT_ICONS[product.id];
          return (
          <button
            key={product.id}
            onClick={() => selectProduct(product.id)}
            className="flat-card-hover p-6 text-left transition-colors cursor-pointer"
          >
            <Icon className="w-12 h-12 mb-4 text-primary" strokeWidth={1.75} />
            <h2 className="text-2xl font-semibold mb-1 text-text-primary group-hover:text-primary transition-colors">
              {product.name}
            </h2>
            <p className="text-sm text-text-muted italic mb-4">"{product.tagline}"</p>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">{product.description}</p>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Features</h3>
              <div className="flex flex-wrap gap-1.5">
                {product.features.map((f) => (
                  <span
                    key={f.id}
                    className="text-xs px-2 py-0.5 bg-bg-card text-text-secondary border border-border"
                  >
                    {f.name}
                  </span>
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