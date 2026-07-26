import type { GameEvent, InternetSubscription, PlatformFeature, ProductPortfolioState, RentedServer, ServerRack } from '../types';
import { getPlatformStats } from './platform';
import { getComplianceStatus } from './compliance';

export const SHARED_INFRA_POOL = '__shared__';

export function infraPoolKey(assignedProductId: string | null): string {
  return assignedProductId ?? SHARED_INFRA_POOL;
}

export function infraServesProduct(assignedProductId: string | null, productId: string): boolean {
  return assignedProductId === null || assignedProductId === productId;
}

export function poolIncomingRps(poolKey: string, productRps: Record<string, number>): number {
  if (poolKey === SHARED_INFRA_POOL) {
    return Object.values(productRps).reduce((sum, rps) => sum + rps, 0);
  }
  return productRps[poolKey] ?? 0;
}

export function computeProductAdjustedRps(
  features: PlatformFeature[],
  sector: string,
  events: GameEvent[],
  racks: ServerRack[],
  rentedServers: RentedServer[],
  internetSubs: InternetSubscription[],
  researchServerEfficiency: number,
): number {
  if (!features.some(f => f.level > 0)) return 0;

  const platformStats = getPlatformStats(features, events, sector);
  const compliance = getComplianceStatus(features, racks, rentedServers, internetSubs);
  const computeLoadMult = Math.max(1, compliance.compute.required / Math.max(compliance.compute.provided, 0.1));
  const dataLoadMult = Math.max(1, compliance.data.required / Math.max(compliance.data.provided, 0.1));
  const adjustedRps = Math.round(platformStats.effectiveRps * computeLoadMult * dataLoadMult);
  return Math.round(adjustedRps / researchServerEfficiency);
}

export function buildProductRpsMap(
  products: Record<string, ProductPortfolioState>,
  events: GameEvent[],
  racks: ServerRack[],
  rentedServers: RentedServer[],
  internetSubs: InternetSubscription[],
  researchServerEfficiency: number,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const [pid, prod] of Object.entries(products)) {
    const rps = computeProductAdjustedRps(
      prod.features,
      prod.sector,
      events,
      racks,
      rentedServers,
      internetSubs,
      researchServerEfficiency,
    );
    if (rps > 0) map[pid] = rps;
  }
  return map;
}

export function hasWebCapacityForProduct(
  productId: string,
  racks: ServerRack[],
  rentedServers: RentedServer[],
): boolean {
  const rackHasWeb = racks.some(r =>
    infraServesProduct(r.assignedProductId, productId) &&
    r.slots.some(s =>
      s.node?.category === 'web_server' &&
      (s.node.status === 'active' || s.node.status === 'overloaded'),
    ),
  );
  const rentalHasWeb = rentedServers.some(r =>
    infraServesProduct(r.assignedProductId, productId) && r.capacityRps > 0,
  );
  return rackHasWeb || rentalHasWeb;
}
