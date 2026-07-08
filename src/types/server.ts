export type ServerType = 'Web_Server' | 'Database_Server' | 'Caching_Server';

export interface ServerInstance {
  id: string;
  type: ServerType;
  capacity: number;
  load: number;
  monthlyCost: number;
}
