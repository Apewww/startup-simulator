import Dexie, { type Table } from 'dexie';
import type { Employee, ComponentResource, PlatformFeature, ServerRack, Plot, RentedServer, ServerNode } from '../types';
import type { GameSpeed, GameScreen } from '../store/gameStore';

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
  plots: Plot[];
  rentedServers: RentedServer[];
  inventoryNodes: ServerNode[];
  activeView: { type: 'office' } | { type: 'server'; plotId: string };
  visitedPlots: string[];
  totalSalary: number;
  selectedProduct: string | null;
  isBankrupt: boolean;
  negativeCashMonths: number;
  screen: GameScreen;
}

export class GameDB extends Dexie {
  saves!: Table<GameSave, number>;

  constructor() {
    super('StartupSimulatorDB');
    this.version(1).stores({ saves: '++id, timestamp' });
    this.version(2).stores({ saves: '++id, timestamp' });
    this.version(3).stores({ saves: '++id, timestamp' });
  }
}

export const db = new GameDB();
