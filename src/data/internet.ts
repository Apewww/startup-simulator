import type { InternetProviderDef, InternetProviderId, InternetSubscription, InternetTierDef } from '../types';

// Ladder kecepatan bersama (data value berkesinambungan). Tiap provider memodifikasi
// via multiplier, sehingga "paket 100/300/500/1G/2G" tiap provider punya nilai efektif sendiri.
export const INTERNET_TIERS: InternetTierDef[] = [
  { id: '100', speedMbps: 100, network: 1, rpsBonus: 150, moodBonus: 0.02, baseCost: 40 },
  { id: '300', speedMbps: 300, network: 2.5, rpsBonus: 400, moodBonus: 0.03, baseCost: 90 },
  { id: '500', speedMbps: 500, network: 4, rpsBonus: 700, moodBonus: 0.04, baseCost: 160 },
  { id: '1000', speedMbps: 1000, network: 7, rpsBonus: 1200, moodBonus: 0.05, baseCost: 280 },
  { id: '2000', speedMbps: 2000, network: 11, rpsBonus: 2000, moodBonus: 0.06, baseCost: 480 },
];

export const INTERNET_PROVIDERS: InternetProviderDef[] = [
  {
    id: 'nusantara',
    name: 'NusantaraNet',
    accent: '#17A366',
    tagline: 'Akses rakyat, terjangkau & stabil',
    strength: 'Termurah & uptime paling stabil (SLA 99.9%)',
    weakness: 'Speed cap 500 Mbps, bonus RPS kecil',
    costMult: 0.8, networkMult: 1, rpsMult: 0.7, moodMult: 0.9,
    tiers: INTERNET_TIERS.filter(t => t.speedMbps <= 500),
  },
  {
    id: 'aerolink',
    name: 'AeroLink',
    accent: '#4F5EFF',
    tagline: 'Premium, kencang untuk skala besar',
    strength: 'Speed tertinggi (sampai 2 Gbps) & bonus RPS terbesar',
    weakness: 'Mahal & mood netral (kesan korporat)',
    costMult: 1.4, networkMult: 1.2, rpsMult: 1.4, moodMult: 0.3,
    tiers: INTERNET_TIERS,
  },
  {
    id: 'rakyat',
    name: 'RakyatFiber',
    accent: '#F59E0B',
    tagline: 'Fiber komunitas, user paling suka',
    strength: 'Bonus mood / user-satisfaction terbesar',
    weakness: 'Bonus RPS sedang, max 1 Gbps',
    costMult: 1.0, networkMult: 1.0, rpsMult: 1.0, moodMult: 1.6,
    tiers: INTERNET_TIERS.filter(t => t.speedMbps <= 1000),
  },
];

export function getInternetProvider(id: InternetProviderId): InternetProviderDef | undefined {
  return INTERNET_PROVIDERS.find(p => p.id === id);
}

export function getInternetTier(provider: InternetProviderDef, tierId: string): InternetTierDef | undefined {
  return provider.tiers.find(t => t.id === tierId);
}

let internetCounter = 0;

export function makeInternetSubscription(providerId: InternetProviderId, tierId: string): InternetSubscription | null {
  const p = getInternetProvider(providerId);
  const t = p && getInternetTier(p, tierId);
  if (!p || !t) return null;
  internetCounter++;
  return {
    id: `net-${internetCounter}`,
    providerId,
    tierId,
    providerName: p.name,
    speedMbps: t.speedMbps,
    network: Math.round(t.network * p.networkMult * 10) / 10,
    rpsBonus: Math.round(t.rpsBonus * p.rpsMult),
    moodBonus: Math.round(t.moodBonus * p.moodMult * 1000) / 1000,
    monthlyCost: Math.round(t.baseCost * p.costMult),
  };
}
