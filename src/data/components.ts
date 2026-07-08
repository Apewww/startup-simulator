import type { EmployeeRole } from '../types';

export interface ComponentDef {
  id: string;
  name: string;
  baseTicks: number;
  producedBy: EmployeeRole;
}

export const COMPONENTS: ComponentDef[] = [
  { id: 'ui_component', name: 'UI Component', baseTicks: 20, producedBy: 'Designer' },
  { id: 'graphics_component', name: 'Graphics Component', baseTicks: 25, producedBy: 'Designer' },
  { id: 'backend_code', name: 'Backend Code', baseTicks: 20, producedBy: 'Developer' },
  { id: 'network_module', name: 'Network Module', baseTicks: 30, producedBy: 'Developer' },
];

export function getComponentDef(id: string): ComponentDef | undefined {
  return COMPONENTS.find(c => c.id === id);
}
