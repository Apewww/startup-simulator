import type { PlatformFeature } from '../types';
import { getRegionDef, type ComplianceLaw } from '../data/regions';

export interface ComplianceCheck {
  law: ComplianceLaw;
  compliant: boolean;
  reason: string;
}

export function checkCompliance(law: ComplianceLaw, features: PlatformFeature[]): ComplianceCheck {
  if (law.requiresFeature === 'database') {
    // Database capability from server nodes, not a PlatformFeature
    const dbFeatureLevel = features.find(f => f.id === 'database')?.level ?? 0;
    return {
      law,
      compliant: dbFeatureLevel >= law.requiresFeatureLevel,
      reason: dbFeatureLevel >= law.requiresFeatureLevel ? '' : `Requires database Lv.${law.requiresFeatureLevel} (current: Lv.${dbFeatureLevel})`,
    };
  }
  const feat = features.find(f => f.id === law.requiresFeature);
  if (!feat) {
    return { law, compliant: false, reason: `Feature "${law.requiresFeature}" not built` };
  }
  return {
    law,
    compliant: feat.level >= law.requiresFeatureLevel,
    reason: feat.level >= law.requiresFeatureLevel ? '' : `Requires ${feat.name} Lv.${law.requiresFeatureLevel} (current: Lv.${feat.level})`,
  };
}

export function checkRegionCompliance(regionId: string, features: PlatformFeature[]): ComplianceCheck[] {
  const def = getRegionDef(regionId);
  if (!def) return [];
  return def.complianceRequired.map(law => checkCompliance(law, features));
}

export function calcTotalPenalties(regionIds: string[], features: PlatformFeature[]): number {
  let total = 0;
  for (const id of regionIds) {
    const checks = checkRegionCompliance(id, features);
    for (const c of checks) {
      if (!c.compliant) total += c.law.penalty;
    }
  }
  return total;
}
