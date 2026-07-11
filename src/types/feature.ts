export type FeatureGroup = 'core' | 'business' | 'engagement';

export interface ComponentRequirement {
  componentId: string;
  amount: number;
}

export interface PlatformFeature {
  id: string;
  name: string;
  level: number;
  group: FeatureGroup;
  requiredComponents: ComponentRequirement[];
  trafficGenerated: number;
  enabled: boolean;
}
