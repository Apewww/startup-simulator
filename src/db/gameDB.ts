import Dexie, { type Table } from 'dexie';
import type { Employee, ComponentResource, PlatformFeature, ServerRack, Plot, RentedServer, ServerNode, FundingRound, SourcingCampaign, Applicant, GameEvent, PlacedFurniture, FurnitureInventoryItem, InternetSubscription, AdLead, AdCampaign } from '../types';
import type { GameSpeed, GameScreen, MonthlySnapshot, MonetizationStrategy } from '../store/gameStore';

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
  activeMonetization?: MonetizationStrategy;
  userMood?: number;
  internetSubscriptions?: InternetSubscription[];
  isBankrupt: boolean;
  negativeCashMonths: number;
  screen: GameScreen;
  cashFlowHistory: MonthlySnapshot[];
  fundingRounds: FundingRound[];
  pendingFunding: FundingRound | null;
  sourcingCampaign: SourcingCampaign | null;
  applicants: Applicant[];
  selectedHrId: string | null;
  currentUsers: number;
  events: GameEvent[];
  officeGridCols?: number;
  officeGridRows?: number;
  perkPoints?: number;
  earnedMilestones?: string[];
  unlockedPerks?: string[];
  furnitureInventory?: FurnitureInventoryItem[];
  furniture?: PlacedFurniture[];
  adLeads?: AdLead[];
  adCampaigns?: AdCampaign[];
  adSalesUnlockNotified?: boolean;
  activePricingTier?: string;
  loan?: import('../types/monetization').BusinessLoan | null;
  creditScore?: number;
  missedPaymentTicks?: number;
  autoRenewEnabled?: boolean;
}

export class GameDB extends Dexie {
  saves!: Table<GameSave, number>;

  constructor() {
    super('StartupSimulatorDB');
    this.version(1).stores({ saves: '++id, timestamp' });
    this.version(2).stores({ saves: '++id, timestamp' });
    this.version(3).stores({ saves: '++id, timestamp' });
    this.version(4).stores({ saves: '++id, timestamp' });
    this.version(5).stores({ saves: '++id, timestamp' });
    this.version(6).stores({ saves: '++id, timestamp' });
    this.version(7).stores({ saves: '++id, timestamp' });
    this.version(8).stores({ saves: '++id, timestamp' });
    this.version(9).stores({ saves: '++id, timestamp' });
    this.version(10).stores({ saves: '++id, timestamp' });
    this.version(11).stores({ saves: '++id, timestamp' });
    this.version(12).stores({ saves: '++id, timestamp' });
    this.version(13).stores({ saves: '++id, timestamp' });
    this.version(14).stores({ saves: '++id, timestamp' });
  }
}

export const db = new GameDB();
