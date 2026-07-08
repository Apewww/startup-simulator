export type EmployeeRole = 'Developer' | 'Designer' | 'Lead_Developer' | 'SysAdmin';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  level: number;
  salary: number;
  happiness: number;
  speed: number;
  currentTask: string | null;
  taskProgress: number;
  resignTicks: number;
}
