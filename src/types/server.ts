export type NodeCategory = 'web_server' | 'database' | 'caching' | 'cooling' | 'storage' | 'security';
export type NodeTypeId = string;

export interface NodeDef {
  typeId: string;
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

export interface ServerNode {
  id: string;
  typeId: string;
  label: string;
  category: NodeCategory;
  capacity: number;       // RPS capacity (web), connections (db), cache ops (caching), or heat reduction (cooling)
  heat: number;           // Heat generated per tick
  power: number;          // Power consumed (monthly cost multiplier)
  price: number;
  monthlyCost: number;
  status: 'active' | 'crashed' | 'maintenance' | 'overheating' | 'overloaded' | 'offline';
  load: number;           // 0-1 load ratio
  crashTicks: number;     // Remaining ticks until auto-recovery
  recoveryTicks: number;  // Ticks taken to recover
  scaleLevel: number;     // Hardware upgrade level (1–5)
}

export type RackTier = 'starter' | 'medium' | 'enterprise' | 'basic' | 'advanced';

export interface RackDef {
  tier: RackTier;
  label: string;
  gridW: number;
  gridH: number;
  maxSlots: number;
  price: number;
  monthlyCost: number;
  coolingCapacity: number;
  description: string;
}

export interface RackSlot {
  index: number;          // 0..maxSlots-1
  node: ServerNode | null;
}

export interface ServerRack {
  id: string;
  plotId: string | null;  // null = in inventory
  label: string;
  tier: RackTier;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  maxSlots: number;
  slots: RackSlot[];
  price: number;
  monthlyCost: number;
  coolingCapacity: number; // Max heat capacity this rack's cooling can dissipate
  coolingUsed: number;     // Current total heat from nodes
  powerDraw: number;
  isOverheating: boolean;
  isCritical: boolean;
  overheatTicks: number;
  heatRatio: number;
  adjacentRackIds: string[];
  assignedProductId: string | null;
}

export interface Plot {
  id: string;
  label: string;
  price: number;
  monthlyCost: number;
  rackIds: string[];
  gridCols: number;
  gridRows: number;
  tier?: number;
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
  status: 'active' | 'crashed' | 'maintenance' | 'offline';
  crashTicks: number;
  assignedProductId: string | null;
}

export type InternetProviderId = string;

export interface InternetTierDef {
  id: string;
  bandwidthMbps: number;
  speedMbps: number;
  monthlyCost: number;
  baseCost: number;
  network: number;
  rpsBonus: number;
  moodBonus: number;
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
  providerName: string;
  tierId: string;
  bandwidthMbps: number;
  speedMbps: number;
  monthlyCost: number;
  network: number;
  rpsBonus: number;
  moodBonus: number;
}
