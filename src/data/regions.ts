export interface ComplianceLaw {
  id: string;
  name: string;
  description: string;
  requiresFeature: string;
  requiresFeatureLevel: number;
  penalty: number;
  devCost: number;
}

export interface RegionDef {
  id: string;
  name: string;
  description: string;
  revenueMult: number;
  growthMult: number;
  entryCost: number;
  monthlyMaintenance: number;
  complianceRequired: ComplianceLaw[];
}

const GDPR: ComplianceLaw = { id: 'gdpr_right_to_delete', name: 'Right to Delete', description: 'Users can request account deletion — requires accounts feature', requiresFeature: 'user_profiles', requiresFeatureLevel: 3, penalty: 5000, devCost: 3000 };
const GDPR_COOKIE: ComplianceLaw = { id: 'gdpr_cookie_consent', name: 'Cookie Consent', description: 'Cookie consent banner — requires ad_platform', requiresFeature: 'ad_platform', requiresFeatureLevel: 1, penalty: 3000, devCost: 1500 };
const GDPR_DATA: ComplianceLaw = { id: 'gdpr_data_residency', name: 'Data Residency (GDPR)', description: 'User data stored in-region — requires database Lv.3', requiresFeature: 'database', requiresFeatureLevel: 3, penalty: 8000, devCost: 5000 };
const CCPA: ComplianceLaw = { id: 'ccpa_cookie_consent', name: 'CCPA Compliance', description: 'California privacy compliance — requires ad_platform', requiresFeature: 'ad_platform', requiresFeatureLevel: 1, penalty: 2500, devCost: 1000 };
const CCPA_DELETE: ComplianceLaw = { id: 'ccpa_right_to_delete', name: 'CCPA Deletion', description: 'Right to delete — requires user_profiles Lv.2', requiresFeature: 'user_profiles', requiresFeatureLevel: 2, penalty: 3000, devCost: 1500 };
const PIPL: ComplianceLaw = { id: 'pipl_data_residency', name: 'Data Residency (PIPL)', description: 'China data residency — requires database Lv.4', requiresFeature: 'database', requiresFeatureLevel: 4, penalty: 10000, devCost: 6000 };
const LGPD: ComplianceLaw = { id: 'lgpd_cookie_consent', name: 'LGPD Consent', description: 'Brazilian consent law — requires ad_platform', requiresFeature: 'ad_platform', requiresFeatureLevel: 1, penalty: 2000, devCost: 800 };
const PRIVACY_ACT: ComplianceLaw = { id: 'privacy_act_data', name: 'Privacy Act', description: 'AU data handling — requires database Lv.2', requiresFeature: 'database', requiresFeatureLevel: 2, penalty: 2000, devCost: 1200 };

export const REGIONS: RegionDef[] = [
  {
    id: 'north_america', name: 'North America', description: 'Mature market, high revenue, moderate regulation',
    revenueMult: 0.4, growthMult: 0.8, entryCost: 10000, monthlyMaintenance: 500,
    complianceRequired: [CCPA, CCPA_DELETE],
  },
  {
    id: 'europe', name: 'Europe', description: 'Large market, strict GDPR compliance required',
    revenueMult: 0.35, growthMult: 0.9, entryCost: 15000, monthlyMaintenance: 800,
    complianceRequired: [GDPR, GDPR_COOKIE, GDPR_DATA],
  },
  {
    id: 'asia', name: 'Asia', description: 'Massive potential, high growth, data residency demands',
    revenueMult: 0.3, growthMult: 1.3, entryCost: 8000, monthlyMaintenance: 400,
    complianceRequired: [PIPL],
  },
  {
    id: 'oceania', name: 'Oceania', description: 'Small but wealthy market, moderate regulation',
    revenueMult: 0.15, growthMult: 1.0, entryCost: 6000, monthlyMaintenance: 300,
    complianceRequired: [PRIVACY_ACT],
  },
  {
    id: 'south_america', name: 'South America', description: 'Growing market, light regulation',
    revenueMult: 0.2, growthMult: 1.2, entryCost: 5000, monthlyMaintenance: 200,
    complianceRequired: [LGPD],
  },
  {
    id: 'africa', name: 'Africa', description: 'High growth, minimal compliance burden',
    revenueMult: 0.1, growthMult: 1.5, entryCost: 3000, monthlyMaintenance: 100,
    complianceRequired: [],
  },
];

export function getRegionDef(id: string): RegionDef | undefined {
  return REGIONS.find(r => r.id === id);
}

export function calcRegionRevenueMult(expandedRegions: string[]) {
  return expandedRegions.reduce((sum, id) => {
    const def = getRegionDef(id);
    return sum + (def?.revenueMult ?? 0);
  }, 0);
}

export function calcRegionGrowthMult(expandedRegions: string[]) {
  if (expandedRegions.length === 0) return 1;
  return expandedRegions.reduce((sum, id) => {
    const def = getRegionDef(id);
    return sum + (def?.growthMult ?? 0);
  }, 0) / expandedRegions.length;
}

export function calcRegionMaintenance(expandedRegions: string[]) {
  return expandedRegions.reduce((sum, id) => {
    const def = getRegionDef(id);
    return sum + (def?.monthlyMaintenance ?? 0);
  }, 0);
}
