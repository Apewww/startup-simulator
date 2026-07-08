import type { Employee } from './employee';
import type { ComponentResource } from './resource';
import type { ServerRack } from './server';
import type { PlatformFeature } from './feature';

export interface Company {
  cash: number;
  month: number;
  employees: Employee[];
  resources: ComponentResource[];
  racks: ServerRack[];
  features: PlatformFeature[];
}
