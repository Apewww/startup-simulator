export type NodeTypeId =
  | 'web_t1' | 'web_t2' | 'web_t3'
  | 'db_t1' | 'db_t2'
  | 'cache_t1' | 'cache_t2'
  | 'router'
  | 'cooling_fan' | 'industrial_fan' | 'liquid_cooling'
  | 'storage'
  | 'firewall_t1' | 'firewall_t2'
  | 'rate_limiter'
  | 'load_balancer';

export type NodeCategory = 'web_server' | 'database' | 'caching' | 'router' | 'cooling' | 'storage' | 'security';

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

export type RentalType = 'vps' | 'dedicated' | 'cloud';

export interface RentedServer {
  id: string;
  type: RentalType;
  label: string;
  capacityRps: number;
  storage: number;
  monthlyCost: number;
  uptime: number;
  load: number;
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
