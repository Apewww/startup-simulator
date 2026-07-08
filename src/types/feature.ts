export interface ComponentRequirement {
  componentId: string;
  amount: number;
}

export interface PlatformFeature {
  id: string;
  name: string;
  level: number;
  requiredComponents: ComponentRequirement[];
  trafficGenerated: number;
}
