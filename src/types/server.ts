export type NodeTypeId =
  | 'web_t1' | 'web_t2' | 'web_t3' | 'web_t4'
  | 'db_t1' | 'db_t2' | 'db_t3'
  | 'cache_t1' | 'cache_t2' | 'cache_t3'
  | 'cooling_fan' | 'industrial_fan' | 'liquid_cooling'
  | 'storage'
  | 'firewall_t1' | 'firewall_t2'
  | 'rate_limiter'
  | 'load_balancer';

export type NodeCategory = 'web_server' | 'database' | 'caching' | 'cooling' | 'storage' | 'security';

export type InternetProviderId = 'nusantara' | 'aerolink' | 'rakyat';

export interface InternetTierDef {
  id: string;
  speedMbps: number;
  network: number;
  rpsBonus: number;
  moodBonus: number;
  baseCost: number;
}

export interface InternetProviderDef {
  id: InternetProviderId;
  name: string;
  accent: string;
  tagline: string;
  strength: string;
  weakness: string;
  costMult: number;
  networkMult: number;
  rpsMult: number;
  moodMult: number;
  tiers: InternetTierDef[];
}

export interface InternetSubscription {
  id: string;
  providerId: InternetProviderId;
  tierId: string;
  providerName: string;
  speedMbps: number;
  network: number;
  rpsBonus: number;
  moodBonus: number;
  monthlyCost: number;
}

export interface ServerNode {
  id: string;
  typeId: NodeTypeId;
  label: string;
  category: NodeCategory;
  capacity: number;
  heat: number;
  power: number;
  price: number;
  monthlyCost: number;
  status: 'active' | 'overloaded' | 'overheating' | 'crashed' | 'offline';
  load: number;
  crashTicks: number;
  recoveryTicks: number;
  scaleLevel: number;
}

export type RackTier = 'basic' | 'advanced' | 'enterprise';

export interface RackSlot {
  index: number;
  node: ServerNode | null;
}

export interface ServerRack {
  id: string;
  tier: RackTier;
  label: string;
  plotId: string | null;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  slots: RackSlot[];
  maxSlots: number;
  coolingCapacity: number;
  coolingUsed: number;
  powerDraw: number;
  price: number;
  monthlyCost: number;
  isOverheating: boolean;
  overheatTicks: number;
  heatRatio: number;
  adjacentRackIds: string[];
}

export interface Plot {
  id: string;
  label: string;
  price: number;
  monthlyCost: number;
  rackIds: string[];
  gridCols: number;
  gridRows: number;
}

export type RentalType = 'vps' | 'dedicated' | 'cloud' | 'db';

export interface RentedServer {
  id: string;
  type: RentalType;
  label: string;
  capacityRps: number;
  storage: number;
  monthlyCost: number;
  uptime: number;
  load: number;
  scaleLevel: number;
  compute: number;
  data: number;
  network: number;
  dbCapacity: number;
}

export interface NodeDef {
  typeId: NodeTypeId;
  label: string;
  category: NodeCategory;
  capacity: number;
  heat: number;
  power: number;
  price: number;
  monthlyCost: number;
  compute: number;
  data: number;
  network: number;
  security: number;
  description: string;
}

export interface RackDef {
  tier: RackTier;
  label: string;
  maxSlots: number;
  coolingCapacity: number;
  price: number;
  monthlyCost: number;
  gridW: number;
  gridH: number;
  description: string;
}
