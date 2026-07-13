import { useGameStore } from '../store/gameStore';
import type { ComponentRequirement, PlatformFeature, FeatureGroup } from '../types';
import type { MonetizationStrategy } from '../store/gameStore';
import { getProductDef } from '../data/products';
import { getComponentDef } from '../data/components';
import { calculateRevenue, getMonetizationMods, getAdPlatformLevel, getMoodTarget, MOOD_BASELINE } from '../systems/monetization';
import { getPlatformStats, hasActiveSynergy } from '../systems/platform';
import { getComplianceStatus } from '../systems/compliance';
import { getPricingTiers, getPricingTier } from '../types/monetization';
import { LayoutGrid, Package, Zap, ToggleLeft, ToggleRight, ChevronDown, Server, DollarSign, Sliders } from 'lucide-react';

function fmtCash(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

interface StratDef {
  id: MonetizationStrategy;
  label: string;
  desc: string;
}

const MONETIZATION_STRATEGIES: StratDef[] = [
  { id: 'none', label: 'No Ads (Legacy)', desc: 'Ads flat $2/100 + subscription lama bila gateway aktif' },
  { id: 'text_ads', label: 'Text Ads', desc: 'Tier Ads linear berbasis level Ad Platform' },
  { id: 'video_ads', label: 'Video Ads', desc: 'Tier Ads + churn +0.0001/tick' },
  { id: 'targeted_ads', label: 'Targeted Ads', desc: 'Ads ×1.5 saat synergy aktif & Data ≥100%' },
  { id: 'freemium', label: 'Freemium', desc: '5% user premium @ $3, tanpa penalti' },
  { id: 'subscription', label: 'Subscription', desc: 'Full subscription $2.50/user, growth ×0.65' },
];

function MonetizationStrategySection() {
  const {
    activeMonetization, setMonetizationStrategy,
    currentUsers, features, racks, rentedServers, internetSubscriptions, selectedProduct, events, userMood, activePricingTier,
  } = useGameStore();

  const adPlatformLevel = getAdPlatformLevel(features);
  const paymentGatewayActive = features.some(f => f.id === 'payment_gateway' && f.level > 0 && f.enabled);
  const hasBusinessLv3 = features.some(f => f.group === 'business' && f.level >= 3 && f.enabled);
  const synergyActive = hasActiveSynergy(features, selectedProduct);
  const compliance = features.some(f => f.level > 0)
    ? getComplianceStatus(features, racks, rentedServers, internetSubscriptions)
    : null;
  const dataRatio = compliance?.data.ratio ?? 1;
  const platformStats = getPlatformStats(features, events, selectedProduct);

  function getAvailability(id: MonetizationStrategy): { ok: boolean; reason: string } {
    switch (id) {
      case 'none': return { ok: true, reason: '' };
      case 'text_ads':
      case 'video_ads':
        return adPlatformLevel >= 1
          ? { ok: true, reason: '' }
          : { ok: false, reason: 'Butuh fitur Ad Platform Lv.1' };
      case 'targeted_ads':
        if (adPlatformLevel < 5) return { ok: false, reason: 'Butuh Ad Platform Lv.5' };
        if (!synergyActive) return { ok: false, reason: 'Butuh Synergy Pair aktif' };
        if (dataRatio < 1) return { ok: false, reason: 'Butuh Data compliance ≥100%' };
        return { ok: true, reason: '' };
      case 'freemium':
        return hasBusinessLv3
          ? { ok: true, reason: '' }
          : { ok: false, reason: 'Butuh ≥1 fitur Business Lv.3' };
      case 'subscription':
        return paymentGatewayActive
          ? { ok: true, reason: '' }
          : { ok: false, reason: 'Butuh Payment Gateway aktif' };
    }
  }

  function preview(id: MonetizationStrategy) {
    const pricingMult = getPricingTier(activePricingTier, selectedProduct)?.revenueMult ?? 1;
    const rev = calculateRevenue(
      currentUsers, features, racks,
      platformStats.cohesionScore * (compliance?.revenueMult ?? 1),
      platformStats.synergyRevenueBonus,
      { strategy: id, productId: selectedProduct, dataRatio, synergyActive, pricingRevenueMult: pricingMult },
    );
    return { total: rev.total, mods: getMonetizationMods(id) };
  }

  return (
    <div className="border border-border rounded-lg p-2 bg-surface">
      <div className="flex items-center gap-1.5 mb-1.5">
        <DollarSign className="w-3.5 h-3.5 text-green" />
        <h3 className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Monetization Strategy</h3>
      </div>
      <div className="space-y-1">
        {MONETIZATION_STRATEGIES.map((s) => {
          const { ok, reason } = getAvailability(s.id);
          const isActive = activeMonetization === s.id;
          const { total, mods } = preview(s.id);
          const moodTarget = getMoodTarget(s.id, synergyActive, dataRatio);
          const moodDiff = moodTarget - MOOD_BASELINE;
          const moodChip = moodDiff > 0
            ? { text: `mood ▲`, cls: 'bg-green-soft text-green border-green/20' }
            : moodDiff < 0
              ? { text: `mood ▼`, cls: 'bg-red-soft text-red border-red/20' }
              : { text: 'mood ◆', cls: 'bg-surface text-ink-soft border-border' };
          return (
            <button
              key={s.id}
              type="button"
              disabled={!ok}
              onClick={() => setMonetizationStrategy(s.id)}
              className={`w-full text-left rounded-lg border px-2 py-1.5 transition-colors cursor-pointer ${isActive ? 'border-indigo bg-indigo-soft' : ok ? 'border-border bg-surface-2 hover:bg-surface' : 'border-border bg-surface-2 opacity-50 cursor-not-allowed'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-semibold ${isActive ? 'text-indigo' : 'text-ink'}`}>{s.label}</span>
                <span className="text-[10px] font-mono text-green font-semibold">{fmtCash(total)}/mo</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-[9px] text-ink-soft">{ok ? s.desc : reason}</span>
                <span className="flex gap-1 shrink-0">
                  {isActive && (
                    <span className="text-[9px] px-1 rounded bg-indigo-soft text-indigo border border-indigo/20 font-semibold">{userMood >= 80 ? '😊' : userMood >= 60 ? '😐' : '😠'} {Math.round(userMood)}</span>
                  )}
                  <span className={`text-[9px] px-1 rounded border font-semibold ${moodChip.cls}`}>{moodChip.text}</span>
                  {mods.growthMult !== 1 && (
                    <span className="text-[9px] px-1 rounded bg-red-soft text-red border border-red/20 font-semibold">growth ×{mods.growthMult}</span>
                  )}
                  {mods.churnDelta !== 0 && (
                    <span className="text-[9px] px-1 rounded bg-amber-soft text-amber border border-amber/20 font-semibold">
                      {mods.churnDelta > 0 ? '+' : ''}{mods.churnDelta}
                    </span>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const HARDWARE_RATES: Record<FeatureGroup, { compute: number; data: number; network: number }> = {
  core: { compute: 0.5, data: 0.3, network: 0.3 },
  business: { compute: 0.3, data: 0.3, network: 0 },
  engagement: { compute: 0.3, data: 0, network: 0.3 },
};

const GROUP_LABEL: Record<FeatureGroup, { label: string; color: string }> = {
  core: { label: 'CORE', color: 'text-indigo bg-indigo-soft border-indigo/20' },
  business: { label: 'BIZ', color: 'text-amber bg-amber-soft border-amber/20' },
  engagement: { label: 'ENG', color: 'text-green bg-green-soft border-green/20' },
};

function FeatureCard({ feature }: { feature: PlatformFeature }) {
  const buildFeature = useGameStore((s) => s.buildFeature);
  const upgradeFeature = useGameStore((s) => s.upgradeFeature);
  const toggleFeature = useGameStore((s) => s.toggleFeature);
  const downgradeFeature = useGameStore((s) => s.downgradeFeature);
  const resources = useGameStore((s) => s.resources);
  const selectedProduct = useGameStore((s) => s.selectedProduct);
  const features = useGameStore((s) => s.features);
  const product = getProductDef(selectedProduct || '');
  const featDef = product?.features.find((f) => f.id === feature.id);

  const isBuilt = feature.level > 0;
  const isDisabled = isBuilt && !feature.enabled;
  const nextLevel = feature.level + 1;
  const cost: ComponentRequirement[] = isBuilt
    ? (featDef?.requiredComponents.map((r) => ({ componentId: r.componentId, amount: r.amount * nextLevel })) || [])
    : (featDef?.requiredComponents || []);

  const canAfford = cost.every((req) => {
    const res = resources.find((r) => r.id === req.componentId);
    return res && res.quantity >= req.amount;
  });

  const groupMeta = GROUP_LABEL[feature.group] || GROUP_LABEL.engagement;

  // Check synergy
  let synergyActive = false;
  let synergyDesc = '';
  if (product?.synergies) {
    for (const s of product.synergies) {
      if (s.featureA !== feature.id && s.featureB !== feature.id) continue;
      const a = features.find(f => f.id === s.featureA);
      const b = features.find(f => f.id === s.featureB);
      if (!a || !b) continue;
      if (!a.enabled || !b.enabled) continue;
      if (a.level >= s.minLevel && b.level >= s.minLevel && Math.abs(a.level - b.level) <= s.maxLevelGap) {
        synergyActive = true;
        synergyDesc = s.description;
        break;
      }
    }
  }

  return (
    <div className={`py-2 border-b border-surface-2 last:border-b-0 ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${groupMeta.color}`}>{groupMeta.label}</span>
          <span className="text-xs font-semibold text-ink">{feature.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isBuilt ? 'bg-indigo-soft text-indigo border border-indigo/20' : 'bg-surface-2 text-ink-soft border border-border'}`}>{isBuilt ? `Lv.${feature.level}` : 'LOCKED'}</span>
          {isDisabled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-soft text-red border border-red/20 font-semibold">DISABLED</span>}
          {synergyActive && (
            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-soft text-purple border border-purple/20">
              <Zap className="w-2.5 h-2.5" /> Synergy
            </span>
          )}
        </div>
        {isBuilt && <span className="text-[11px] text-ink-soft font-mono">{feature.trafficGenerated} traffic</span>}
      </div>

      <div className="space-y-0.5 mb-1">
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

      {/* Hardware requirement */}
      <div className="flex items-center gap-2.5 text-[10px] text-ink-soft mb-1.5 border-t border-surface-2 pt-1">
        <Server className="w-3 h-3" />
        <span>CPU <strong className="text-ink">{(HARDWARE_RATES[feature.group].compute * nextLevel).toFixed(1)}</strong></span>
        <span>Data <strong className="text-ink">{(HARDWARE_RATES[feature.group].data * nextLevel).toFixed(1)}</strong></span>
        <span>Net <strong className="text-ink">{(HARDWARE_RATES[feature.group].network * nextLevel).toFixed(1)}</strong></span>
      </div>

      {synergyActive && <div className="text-[10px] text-purple mb-1">{synergyDesc}</div>}

      <div className="flex items-center gap-1.5">
        {isBuilt ? (
          <>
            <button onClick={() => toggleFeature(feature.id)}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer bg-surface-2 border border-border hover:bg-surface text-ink">
              {feature.enabled ? <ToggleRight className="w-3.5 h-3.5 text-green" /> : <ToggleLeft className="w-3.5 h-3.5 text-red" />}
              {feature.enabled ? 'On' : 'Off'}
            </button>
            <button onClick={() => upgradeFeature(feature.id)} disabled={!canAfford}
              className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${canAfford ? 'bg-amber-soft text-amber border border-amber/30 hover:bg-amber hover:text-white' : 'bg-surface-2 text-ink-soft border border-border cursor-not-allowed'}`}>
              Upgrade Lv.{nextLevel}
            </button>
            {feature.level > 1 && (
              <button onClick={() => downgradeFeature(feature.id)}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer bg-surface-2 border border-border text-ink-soft hover:text-red hover:border-red/30">
                <ChevronDown className="w-3 h-3 inline" /> Downgrade
              </button>
            )}
          </>
        ) : (
          <button onClick={() => buildFeature(feature.id)} disabled={!canAfford}
            className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${canAfford ? 'bg-indigo text-white hover:bg-indigo/90' : 'bg-surface-2 text-ink-soft border border-border cursor-not-allowed'}`}>
            Build
          </button>
        )}
      </div>
    </div>
  );
}

export function FeaturesPanel() {
  const { features, resources, selectedProduct } = useGameStore();
  const product = getProductDef(selectedProduct || '');

function PricingSliderSection() {
  const { activePricingTier, setPricingTier, selectedProduct } = useGameStore();
  const tiers = getPricingTiers(selectedProduct);
  if (tiers.length === 0) return null;

  return (
    <div className="border border-border rounded-lg p-2 bg-surface">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sliders className="w-3.5 h-3.5 text-amber" />
        <h3 className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Pricing</h3>
      </div>
      <div className="space-y-1">
        {tiers.map(t => {
          const isActive = activePricingTier === t.id;
          const isDefault = t === tiers[0];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setPricingTier(t.id)}
              className={`w-full text-left rounded-lg border px-2 py-1.5 transition-colors cursor-pointer ${isActive ? 'border-amber bg-amber-soft' : 'border-border bg-surface-2 hover:bg-surface'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-semibold ${isActive ? 'text-amber' : 'text-ink'}`}>{t.label}</span>
                <span className={`text-[10px] font-mono font-semibold ${t.revenueMult >= 1 ? 'text-green' : 'text-red'}`}>×{t.revenueMult}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-[9px] text-ink-soft">{isDefault ? 'Balanced' : t.growthMult < 1 ? 'Aggressive' : 'Premium'}</span>
                <span className="flex gap-1 shrink-0">
                  <span className={`text-[9px] px-1 rounded border font-semibold ${t.growthMult < 1 ? 'bg-red-soft text-red border-red/20' : 'bg-green-soft text-green border-green/20'}`}>
                    growth ×{t.growthMult}
                  </span>
                  <span className={`text-[9px] px-1 rounded border font-semibold ${t.moodTarget < 70 ? 'bg-red-soft text-red border-red/20' : 'bg-green-soft text-green border-green/20'}`}>
                    mood {t.moodTarget}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

  return (
    <div className="space-y-3">
      <MonetizationStrategySection />

      <PricingSliderSection />

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
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">{product?.name} — Features</h3>
          {product?.synergies && product.synergies.length > 0 && (
            <span className="text-[10px] text-ink-soft">
              <Zap className="w-3 h-3 inline align-text-top text-purple" /> {product.synergies.length} synergy pair{product.synergies.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="text-[10px] text-ink-soft mb-1.5 flex gap-2">
          <span className="text-indigo font-semibold">● CORE</span>
          <span className="text-amber font-semibold">● BIZ</span>
          <span className="text-green font-semibold">● ENG</span>
        </div>
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
