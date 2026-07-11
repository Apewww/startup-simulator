import { Coffee, Armchair, Droplets } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { FURNITURE } from '../data/furniture';

const ICONS: Record<string, typeof Coffee> = {
  Coffee, Armchair, Droplets,
};

export function FurnitureShop() {
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const cash = useGameStore((s) => s.cash);
  const furnitureInventory = useGameStore((s) => s.furnitureInventory);
  const furniture = useGameStore((s) => s.furniture);
  const buyFurniture = useGameStore((s) => s.buyFurniture);

  const shoppable = FURNITURE.filter((f) => unlockedPerks.includes(f.unlockPerk));

  if (shoppable.length === 0) {
    return (
      <p className="text-[10px] text-ink-soft leading-snug">
        No furniture unlocked yet. Spend Perk Points in the "Unlock Perks" tab to unlock furniture.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-ink-soft leading-snug">
        Buy furniture into your inventory. Manage placement & selling in the "Inventory" tab.
      </p>
      {shoppable.map((f) => {
        const Icon = ICONS[f.icon] ?? Coffee;
        const inInv = furnitureInventory.filter((i) => i.defId === f.id).length;
        const placed = furniture.filter((p) => p.defId === f.id).length;
        const canAfford = cash >= f.price;
        return (
          <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-surface-2 border-border">
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-ink/5 text-ink-soft">
              <Icon className="w-4.5 h-4.5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-ink truncate">{f.name}</span>
                {(inInv > 0 || placed > 0) && (
                  <span className="text-[9px] uppercase tracking-wider text-green font-bold">
                    {inInv > 0 ? `${inInv} in inventory` : `Placed ${placed}`}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-ink-soft leading-snug">{f.description}</div>
              <div className="text-[11px] mt-0.5 font-semibold text-indigo">${f.price}</div>
            </div>
            <button
              onClick={() => buyFurniture(f.id)}
              disabled={!canAfford}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                canAfford ? 'bg-indigo text-white hover:bg-indigo/90' : 'bg-ink/5 text-ink-soft cursor-not-allowed'
              }`}
            >
              Buy
            </button>
          </div>
        );
      })}
    </div>
  );
}
