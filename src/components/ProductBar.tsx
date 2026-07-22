import { useState } from 'react';
import { Globe, ShoppingCart, Search, Plus } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { NewProductModal } from './NewProductModal';

const PRODUCT_ICONS: Record<string, typeof Globe> = {
  social_media: Globe,
  ecommerce: ShoppingCart,
  search_engine: Search,
};

export function ProductBar() {
  const products = useGameStore((s) => s.products);
  const activeProductId = useGameStore((s) => s.activeProductId);
  const switchProduct = useGameStore((s) => s.switchProduct);
  const [showModal, setShowModal] = useState(false);

  const entries = Object.entries(products);

  if (entries.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 bg-surface border-b border-border overflow-x-auto shrink-0">
      {entries.map(([id, p]) => {
        const Icon = PRODUCT_ICONS[p.sector];
        return (
        <button
          key={id}
          onClick={() => switchProduct(id)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
            id === activeProductId
              ? 'bg-indigo-soft text-indigo shadow-sm'
              : 'text-ink-soft hover:text-ink hover:bg-surface-2'
          }`}
        >
          {Icon ? <Icon className="w-3.5 h-3.5" strokeWidth={2} /> : null}
          <span>{p.name}</span>
        </button>
        );
      })}

      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer ml-1"
        title="New Product"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span>New</span>
      </button>

      {showModal && <NewProductModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
