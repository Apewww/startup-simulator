
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
    <div className="scanlines relative min-h-screen bg-[#0A0E27] text-gray-100 p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-2 neon-glow text-[#A78BFA]">Startup Simulator</h1>
      <p className="text-gray-400 mb-8">Choose your product to begin</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {PRODUCTS.map((product) => {
          const Icon = PRODUCT_ICONS[product.id];
          return (
          <button
            key={product.id}
            onClick={() => selectProduct(product.id)}
            className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-left hover:border-[#7C3AED] hover:bg-gray-750 transition-all group cursor-pointer shadow-md hover:shadow-lg"
          >
            <Icon className="w-12 h-12 mb-4 text-[#7C3AED]" strokeWidth={1.75} />
            <h2 className="text-2xl font-semibold mb-1 group-hover:text-[#A78BFA] transition-colors">
              {product.name}
            </h2>
            <p className="text-sm text-gray-500 italic mb-4">"{product.tagline}"</p>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">{product.description}</p>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Features</h3>
              <div className="flex flex-wrap gap-1.5">
                {product.features.map((f) => (
                  <span
                    key={f.id}
                    className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded"
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
