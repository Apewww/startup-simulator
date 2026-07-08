import type { Employee } from './employee';
import type { ComponentResource } from './resource';
import type { ServerInstance } from './server';
import type { PlatformFeature } from './feature';

export interface Company {
  cash: number;
  month: number;
  employees: Employee[];
  resources: ComponentResource[];
  servers: ServerInstance[];
  features: PlatformFeature[];
}
