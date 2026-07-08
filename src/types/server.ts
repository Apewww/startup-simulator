export type NodeTypeId =
  | 'web_t1' | 'web_t2' | 'web_t3'
  | 'db_t1' | 'db_t2'
  | 'cache_t1' | 'cache_t2'
  | 'router'
  | 'cooling_fan' | 'industrial_fan'
  | 'storage';

export type NodeCategory = 'web_server' | 'database' | 'caching' | 'router' | 'cooling' | 'storage';

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
  description: string;
}
