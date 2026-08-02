import Dexie, { type Table } from 'dexie';
import type { Employee, ComponentResource, PlatformFeature, ServerRack, Plot, RentedServer, ServerNode, FundingRound, SourcingCampaign, Applicant, GameEvent, PlacedFurniture, FurnitureInventoryItem, InternetSubscription, AdLead, AdCampaign, CompetitorProduct, MarketingCampaign, WealthEntry, ProductPortfolioState } from '../types';
import type { GameSpeed, GameScreen, MonthlySnapshot } from '../store/gameStore';
import type { MonetizationStrategy } from '../types';
import type { ActiveResearch } from '../types/research';
import type { BoardTarget, QuarterlyReport, TermSheet, AiFundingOffer } from '../types/investorRelations';

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
  activeView: { type: 'cityMap' } | { type: 'office' } | { type: 'server'; plotId: string };
  visitedPlots: string[];
  totalSalary: number;
  // v2.0
  activeProductId?: string | null;
  selectedProduct?: string | null;
  products?: Record<string, ProductPortfolioState>;
  activeMonetization?: MonetizationStrategy;
  userMood?: number;
  internetSubscriptions?: InternetSubscription[];
  isBankrupt: boolean;
  negativeCashMonths: number;
  screen: GameScreen;
  companyName?: string;
  cashFlowHistory: MonthlySnapshot[];
  fundingRounds: FundingRound[];
  pendingFunding?: FundingRound | null;
  sourcingCampaign: SourcingCampaign | null;
  applicants: Applicant[];
  selectedHrId: string | null;
  currentUsers: number;
  events: GameEvent[];
  officeTier?: number;
  officeGridCols?: number;
  officeGridRows?: number;
  perkPoints?: number;
  earnedMilestones?: string[];
  unlockedPerks?: string[];
  furnitureInventory?: FurnitureInventoryItem[];
  furniture?: PlacedFurniture[];
  placementFurnitureId?: string | null;
  adLeads?: AdLead[];
  adCampaigns?: AdCampaign[];
  adSalesUnlockNotified?: boolean;
  activePricingTier?: string;
  loan?: import('../types/monetization').BusinessLoan | null;
  creditScore?: number;
  missedPaymentTicks?: number;
  autoRenewEnabled?: boolean;
  campaignCostThisMonth?: number;
  competitors?: CompetitorProduct[];
  marketingCampaigns?: MarketingCampaign[];
  brandScore?: number;
  nextCompetitorCheck?: number;
  devMode?: boolean;
  // R&D
  activeResearch?: ActiveResearch | null;
  unlockedTechs?: string[];
  unlockedLevels?: Record<string, number>;
  // Investor
  boardSatisfaction?: number;
  currentQuarter?: number;
  quarterlyTargets?: BoardTarget[];
  quarterlyHistory?: QuarterlyReport[];
  termSheet?: TermSheet | null;
  totalEquityGiven?: number;
  // Wealth
  personalCash?: number;
  lifetimeWithdrawn?: number;
  unlockedTitles?: string[];
  victoryAchieved?: boolean;
  totalDividendsReceived?: number;
  takeoverCapital?: number;
  acquiredBy?: string | null;
  wealthLog?: WealthEntry[];
  aiStakes?: { aiId: string; name: string; percentage: number }[];
  pendingFundingRounds?: AiFundingOffer[];
  activeProductValuation?: number;
  lastWithdrawMonth?: number;
  monthsAtRankOne?: number;
  endgameUnlocked?: boolean;
  completedGame?: boolean;
  newGamePlus?: boolean;
  newGamePlusTitle?: string | null;
}

export class GameDatabase extends Dexie {
  saves!: Table<GameSave, number>;

  constructor() {
    super('StartupSimulatorDB');
    this.version(1).stores({
      saves: 'id, timestamp',
    });
    this.version(2).stores({
      saves: 'id, timestamp',
    });
    this.version(3).stores({
      saves: 'id, timestamp',
    });
    this.version(4).stores({
      saves: 'id, timestamp',
    });
  }
}

export const db = new GameDatabase();
