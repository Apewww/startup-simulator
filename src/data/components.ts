import type { EmployeeRole } from '../types';

export interface ComponentDef {
  id: string;
  name: string;
  baseTicks: number;
  producedBy: EmployeeRole;
  minLevel: number;
}

export const COMPONENTS: ComponentDef[] = [
  { id: 'ui_component', name: 'UI Component', baseTicks: 400, producedBy: 'Designer', minLevel: 1 },
  { id: 'graphics_component', name: 'Graphics Component', baseTicks: 500, producedBy: 'Designer', minLevel: 2 },
  { id: 'brand_identity', name: 'Brand Identity', baseTicks: 700, producedBy: 'Designer', minLevel: 3 },
  { id: 'backend_code', name: 'Backend Code', baseTicks: 400, producedBy: 'Developer', minLevel: 1 },
  { id: 'network_module', name: 'Network Module', baseTicks: 600, producedBy: 'Developer', minLevel: 2 },
  { id: 'security_protocol', name: 'Security Protocol', baseTicks: 800, producedBy: 'Developer', minLevel: 3 },
];

export function getComponentDef(id: string): ComponentDef | undefined {
  return COMPONENTS.find(c => c.id === id);
}
