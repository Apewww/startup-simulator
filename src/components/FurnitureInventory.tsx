import { Coffee, Armchair, Droplets, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { FURNITURE } from '../data/furniture';

const ICONS: Record<string, typeof Coffee> = {
  Coffee, Armchair, Droplets,
};

const FURNITURE_BY_ID: Record<string, (typeof FURNITURE)[number]> = Object.fromEntries(
  FURNITURE.map((f) => [f.id, f]),
);

export function FurnitureInventory() {
  const furnitureInventory = useGameStore((s) => s.furnitureInventory);
  const furniture = useGameStore((s) => s.furniture);
  const placementFurnitureId = useGameStore((s) => s.placementFurnitureId);
  const startFurniturePlacement = useGameStore((s) => s.startFurniturePlacement);
  const cancelFurniturePlacement = useGameStore((s) => s.cancelFurniturePlacement);
  const unplaceFurniture = useGameStore((s) => s.unplaceFurniture);
  const sellFurnitureItem = useGameStore((s) => s.sellFurnitureItem);

  const owned = [...furnitureInventory, ...furniture];

  if (owned.length === 0) {
    return (
      <p className="text-[10px] text-ink-soft leading-snug">
        No furniture owned yet. Buy furniture in the "Shop" tab, then place it on the Office Grid.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {furnitureInventory.map((item) => {
        const def = FURNITURE_BY_ID[item.defId];
        if (!def) return null;
        const Icon = ICONS[def.icon] ?? Coffee;
        const isPlacing = placementFurnitureId === item.id;
        return (
          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-surface-2 border-border">
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-ink/5 text-ink-soft">
              <Icon className="w-4.5 h-4.5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-ink truncate">{def.name}</span>
                <span className="text-[9px] uppercase tracking-wider text-amber font-bold">In inventory</span>
              </div>
              <div className="text-[10px] text-ink-soft leading-snug">Click a {def.placement === 'desk' ? 'desk' : 'tile'} in the Office Grid to place.</div>
            </div>
            <button
              onClick={() => isPlacing ? cancelFurniturePlacement() : startFurniturePlacement(item.id)}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                isPlacing ? 'bg-indigo text-white' : 'bg-amber text-white hover:bg-amber/90'
              }`}
            >
              {isPlacing ? 'Cancel' : 'Place'}
            </button>
            <button
              onClick={() => sellFurnitureItem(item.id)}
              className="shrink-0 p-1.5 rounded-lg text-ink-soft hover:text-red cursor-pointer"
              title={`Sell ($${Math.floor(def.price * 0.5)} refund)`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {furniture.map((furn) => {
        const def = FURNITURE_BY_ID[furn.defId];
        if (!def) return null;
        const Icon = ICONS[def.icon] ?? Coffee;
        return (
          <div key={furn.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-surface-2 border-border">
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-ink/5 text-ink-soft">
              <Icon className="w-4.5 h-4.5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-ink truncate">{def.name}</span>
                <span className="text-[9px] uppercase tracking-wider text-green font-bold">Placed</span>
              </div>
              <div className="text-[10px] text-ink-soft leading-snug">At ({furn.gridX}, {furn.gridY}){def.placement === 'desk' ? ' — on a desk' : ''}. Click it on the grid to pick up.</div>
            </div>
            <button
              onClick={() => unplaceFurniture(furn.id)}
              className="shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-ink/5 text-ink-soft hover:text-ink cursor-pointer"
            >
              Pick up
            </button>
            <button
              onClick={() => sellFurnitureItem(furn.id)}
              className="shrink-0 p-1.5 rounded-lg text-ink-soft hover:text-red cursor-pointer"
              title={`Sell ($${Math.floor(def.price * 0.5)} refund)`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
