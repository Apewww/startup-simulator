import { LayoutGrid, Package } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import type { ComponentRequirement, PlatformFeature } from '../types';
import { getProductDef } from '../data/products';
import { getComponentDef } from '../data/components';

function FeatureCard({ feature }: { feature: PlatformFeature }) {
  const buildFeature = useGameStore((s) => s.buildFeature);
  const upgradeFeature = useGameStore((s) => s.upgradeFeature);
  const resources = useGameStore((s) => s.resources);
  const selectedProduct = useGameStore((s) => s.selectedProduct);
  const product = getProductDef(selectedProduct || '');
  const featDef = product?.features.find((f) => f.id === feature.id);

  const isBuilt = feature.level > 0;
  const nextLevel = feature.level + 1;
  const cost: ComponentRequirement[] = isBuilt
    ? (featDef?.requiredComponents.map((r) => ({ componentId: r.componentId, amount: r.amount * nextLevel })) || [])
    : (featDef?.requiredComponents || []);

  const canAfford = cost.every((req) => {
    const res = resources.find((r) => r.id === req.componentId);
    return res && res.quantity >= req.amount;
  });

  return (
    <div className="py-2 border-b border-surface-2 last:border-b-0">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink">{feature.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isBuilt ? 'bg-indigo-soft text-indigo border border-indigo/20' : 'bg-surface-2 text-ink-soft border border-border'}`}>{isBuilt ? `Lv.${feature.level}` : 'LOCKED'}</span>
        </div>
        {isBuilt && <span className="text-[11px] text-ink-soft font-mono">{feature.trafficGenerated} traffic</span>}
      </div>

      <div className="space-y-0.5 mb-1.5">
        {cost.map((req) => {
          const compDef = getComponentDef(req.componentId);
          const res = resources.find((r) => r.id === req.componentId);
          const have = res?.quantity || 0;
          const enough = have >= req.amount;
          return (
            <div key={req.componentId} className="flex items-center gap-2 text-[11px]">
              <span className={enough ? 'text-green' : 'text-red'}>{enough ? '✓' : '✗'}</span>
              <span className="text-ink-soft">{compDef?.name || req.componentId}</span>
              <span className="font-mono text-ink-soft">{have}/{req.amount}</span>
            </div>
          );
        })}
      </div>

      {isBuilt ? (
        <button
          onClick={() => upgradeFeature(feature.id)}
          disabled={!canAfford}
          className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            canAfford ? 'bg-amber-soft text-amber border border-amber/30 hover:bg-amber hover:text-white' : 'bg-surface-2 text-ink-soft border border-border cursor-not-allowed'
          }`}
        >
          Upgrade Lv.{nextLevel}
        </button>
      ) : (
        <button
          onClick={() => buildFeature(feature.id)}
          disabled={!canAfford}
          className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            canAfford ? 'bg-indigo text-white hover:bg-indigo/90' : 'bg-surface-2 text-ink-soft border border-border cursor-not-allowed'
          }`}
        >
          Build
        </button>
      )}
    </div>
  );
}

export function FeaturesPanel() {
  const { features, resources, selectedProduct } = useGameStore();
  const product = getProductDef(selectedProduct || '');

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Inventory</h3>
        {resources.length === 0 ? (
          <div className="text-center py-4 text-ink-soft border border-dashed border-border rounded-lg">
            <Package className="w-6 h-6 mx-auto mb-1 opacity-40" strokeWidth={1.5} />
            <p className="text-xs">No components yet.</p>
            <p className="text-[10px] mt-0.5">Assign tasks to employees to start production.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {resources.map((res) => (
              <div key={res.id} className="flex justify-between text-xs">
                <span className="text-ink-soft">{res.name}</span>
                <span className="font-mono text-green font-semibold">{res.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mb-1.5">{product?.name} — Features</h3>
        {features.length === 0 ? (
          <div className="text-center py-4 text-ink-soft border border-dashed border-border rounded-lg">
            <LayoutGrid className="w-6 h-6 mx-auto mb-1 opacity-40" strokeWidth={1.5} />
            <p className="text-xs">No features yet.</p>
            <p className="text-[10px] mt-0.5">Build components and use them to create features!</p>
          </div>
        ) : (
          <div>
            {features.map((f) => (
              <FeatureCard key={f.id} feature={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const featuresPanelMeta = { title: 'Fitur', icon: <LayoutGrid className="w-4 h-4 text-indigo" />, accent: '#4F5EFF' };