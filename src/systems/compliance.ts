import type { PlatformFeature, ServerRack, RentedServer, FeatureGroup } from '../types';
import { getNodeDef } from '../data/servers';

const COMPUTE_RATES: Record<FeatureGroup, number> = { core: 0.5, business: 0.3, engagement: 0.3 };
const DATA_RATES: Record<FeatureGroup, number> = { core: 0.3, business: 0.3, engagement: 0 };
const NETWORK_RATES: Record<FeatureGroup, number> = { core: 0.3, business: 0, engagement: 0.3 };

export interface ComplianceRatio {
  provided: number;
  required: number;
  ratio: number;
}

export interface ComplianceStatus {
  compute: ComplianceRatio;
  data: ComplianceRatio;
  network: ComplianceRatio;
  security: ComplianceRatio;
  overall: 'critical' | 'partial' | 'ok';
  userCap: number;
  revenueMult: number;
  rpsPenalty: number;
}

export function calcRequirements(features: PlatformFeature[]): { compute: number; data: number; network: number } {
  let compute = 0;
  let data = 0;
  let network = 0;
  for (const f of features) {
    if (f.level <= 0) continue;
    compute += COMPUTE_RATES[f.group] * f.level;
    data += DATA_RATES[f.group] * f.level;
    network += NETWORK_RATES[f.group] * f.level;
  }
  return { compute, data, network };
}

export function calcProvidedPoints(racks: ServerRack[], rentedServers: RentedServer[] = []): { compute: number; data: number; network: number; security: number } {
  let compute = 0;
  let data = 0;
  let network = 0;
  let security = 0;
  for (const rack of racks) {
    if (rack.plotId === null) continue;
    for (const slot of rack.slots) {
      const node = slot.node;
      if (!node || node.status === 'crashed' || node.status === 'offline') continue;
      const def = getNodeDef(node.typeId);
      if (!def) continue;
      compute += def.compute;
      data += def.data;
      network += def.network;
      security += def.security;
    }
  }
  for (const r of rentedServers) {
    compute += r.compute;
    data += r.data;
    network += r.network;
  }
  return { compute, data, network, security };
}

export function getComplianceStatus(features: PlatformFeature[], racks: ServerRack[], rentedServers?: RentedServer[]): ComplianceStatus {
  const req = calcRequirements(features);
  const prov = calcProvidedPoints(racks, rentedServers);

  const computeRatio = req.compute > 0 ? Math.min(prov.compute / req.compute, 5) : 1;
  const dataRatio = req.data > 0 ? Math.min(prov.data / req.data, 5) : 1;
  const networkRatio = req.network > 0 ? Math.min(prov.network / req.network, 5) : 1;

  const userCap = Math.min(
    computeRatio < 0.5 ? 0 : computeRatio >= 1 ? 1 : computeRatio,
    dataRatio < 0.5 ? 0 : dataRatio >= 1 ? 1 : dataRatio,
  );
  const revenueMult = Math.min(
    computeRatio < 0.5 ? 0 : computeRatio >= 1 ? 1 : computeRatio,
    dataRatio < 0.5 ? 0 : dataRatio >= 1 ? 1 : dataRatio,
  );

  const rpsPenalty = networkRatio < 1 ? 1 + (1 - networkRatio) * 0.5 : 1;

  let overall: 'critical' | 'partial' | 'ok' = 'ok';
  if (computeRatio < 0.5 || dataRatio < 0.5) overall = 'critical';
  else if (computeRatio < 1 || dataRatio < 1 || networkRatio < 1) overall = 'partial';

  return {
    compute: { provided: prov.compute, required: req.compute, ratio: computeRatio },
    data: { provided: prov.data, required: req.data, ratio: dataRatio },
    network: { provided: prov.network, required: req.network, ratio: networkRatio },
    security: { provided: prov.security, required: 0, ratio: prov.security > 0 ? 1 : 0 },
    overall, userCap, revenueMult, rpsPenalty,
  };
}
