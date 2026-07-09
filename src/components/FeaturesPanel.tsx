import { LayoutGrid } from 'lucide-react';
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
    <div className="bg-gray-800/70 rounded p-3 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-semibold text-white">{feature.name}</span>
          <span className="ml-2 text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">Lv.{feature.level}</span>
        </div>
        <span className="text-sm text-gray-400">{isBuilt ? `${feature.trafficGenerated} traffic` : 'Locked'}</span>
      </div>

      <div className="space-y-1 mb-3">
        {cost.map((req) => {
          const compDef = getComponentDef(req.componentId);
          const res = resources.find((r) => r.id === req.componentId);
          const have = res?.quantity || 0;
          const enough = have >= req.amount;
          return (
            <div key={req.componentId} className="flex items-center gap-2 text-xs">
              <span className={enough ? 'text-green-400' : 'text-red-400'}>{enough ? '✓' : '✗'}</span>
              <span className="text-gray-400">{compDef?.name || req.componentId}</span>
              <span className="font-mono text-gray-500">{have}/{req.amount}</span>
            </div>
          );
        })}
      </div>

      {isBuilt ? (
        <button
          onClick={() => upgradeFeature(feature.id)}
          disabled={!canAfford}
          className={`text-xs px-3 py-1.5 rounded transition-colors cursor-pointer ${
            canAfford ? 'bg-amber-700 hover:bg-amber-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Upgrade to Lv.{nextLevel}
        </button>
      ) : (
        <button
          onClick={() => buildFeature(feature.id)}
          disabled={!canAfford}
          className={`text-xs px-3 py-1.5 rounded transition-colors cursor-pointer ${
            canAfford ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
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
    <div className="space-y-4">
      <div>
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Inventory</h3>
        {resources.length === 0 ? (
          <p className="text-gray-500 text-sm">No components produced yet.</p>
        ) : (
          <div className="space-y-1">
            {resources.map((res) => (
              <div key={res.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{res.name}</span>
                <span className="font-mono text-yellow-400">{res.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2">{product?.name} — Features</h3>
        {features.length === 0 ? (
          <p className="text-gray-500 text-sm">No features yet.</p>
        ) : (
          <div className="space-y-2">
            {features.map((f) => (
              <FeatureCard key={f.id} feature={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const featuresPanelMeta = { title: 'Features', icon: <LayoutGrid className="w-4 h-4 text-[#A78BFA]" />, accent: '#A78BFA' };
