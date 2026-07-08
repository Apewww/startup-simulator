import Dexie, { type Table } from 'dexie';
import type { Employee, ComponentResource, PlatformFeature, ServerRack } from '../types';
import type { GameSpeed } from '../store/gameStore';

export interface GameSave {
  id: number;
  timestamp: number;
  tick: number;
  speed: GameSpeed;
  cash: number;
  month: number;
  employees: Employee[];
  resources: ComponentResource[];
  features: PlatformFeature[];
  racks: ServerRack[];
  totalSalary: number;
  selectedProduct: string | null;
  isBankrupt: boolean;
  negativeCashMonths: number;
}

export class GameDB extends Dexie {
  saves!: Table<GameSave, number>;

  constructor() {
    super('StartupSimulatorDB');
    this.version(1).stores({
      saves: '++id, timestamp',
    });
  }
}

export const db = new GameDB();
