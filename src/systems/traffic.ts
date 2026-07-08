import type { PlatformFeature } from '../types';

export interface TrafficStats {
  totalTraffic: number;
  users: number;
  rps: number;
}

export function getTrafficStats(features: PlatformFeature[]): TrafficStats {
  const totalTraffic = features.reduce(
    (sum, f) => sum + (f.level > 0 ? f.trafficGenerated : 0),
    0
  );
  const users = totalTraffic;
  const rps = totalTraffic;
  return { totalTraffic, users, rps };
}
