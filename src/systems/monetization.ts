import type { PlatformFeature, ServerRack } from '../types';

export interface RevenueBreakdown {
  ads: number;
  subscription: number;
  total: number;
  hasSubscription: boolean;
  uptimePenalty: number;
}

function hasActivePaymentGateway(features: PlatformFeature[]): boolean {
  return features.some(f => f.id === 'payment_gateway' && f.level > 0);
}

function hasCrashedNodes(racks: ServerRack[]): boolean {
  return racks.some(r => r.slots.some(s => s.node?.status === 'crashed'));
}

export function calculateAdsRevenue(users: number, racks: ServerRack[]): number {
  const penalty = hasCrashedNodes(racks) ? 0.5 : 1.0;
  return Math.round((users / 100) * 2 * penalty);
}

export function calculateSubscriptionRevenue(users: number, features: PlatformFeature[]): number {
  if (!hasActivePaymentGateway(features)) return 0;
  return Math.round(users * 2);
}

export function calculateRevenue(users: number, features: PlatformFeature[], racks: ServerRack[]): RevenueBreakdown {
  const penalty = hasCrashedNodes(racks) ? 0.5 : 1.0;
  const ads = Math.round((users / 100) * 2 * penalty);
  const hasSubscription = hasActivePaymentGateway(features);
  const subscription = hasSubscription ? Math.round(users * 2) : 0;
  return { ads, subscription, total: ads + subscription, hasSubscription, uptimePenalty: penalty };
}
