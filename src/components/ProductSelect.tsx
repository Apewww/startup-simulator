import { useState } from 'react';
import { PRODUCTS } from '../data/products';
import { useGameStore } from '../store/gameStore';
import { loadGame } from '../systems/saveLoad';

const PRODUCT_ICONS: Record<string, string> = {
  social_media: '🌐',
  ecommerce: '🛒',
  search_engine: '🔍',
};

export function ProductSelect() {
  const selectProduct = useGameStore((s) => s.selectProduct);
  const [loadMsg, setLoadMsg] = useState('');

  const handleLoad = async () => {
    const ok = await loadGame();
    setLoadMsg(ok ? 'Game loaded!' : 'No save file found');
    setTimeout(() => setLoadMsg(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4">
        <button onClick={handleLoad} className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-blue-200 rounded text-sm transition-colors">Load Saved Game</button>
        {loadMsg && <span className="ml-2 text-xs text-yellow-300">{loadMsg}</span>}
      </div>
      <h1 className="text-4xl font-bold mb-2">Startup Simulator</h1>
      <p className="text-gray-400 mb-8">Choose your product to begin</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            onClick={() => selectProduct(product.id)}
            className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-left hover:border-blue-500 hover:bg-gray-750 transition-all group"
          >
            <div className="text-5xl mb-4">{PRODUCT_ICONS[product.id]}</div>
            <h2 className="text-2xl font-semibold mb-1 group-hover:text-blue-400 transition-colors">
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
        ))}
      </div>
    </div>
  );
}
