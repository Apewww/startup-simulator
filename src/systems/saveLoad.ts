import { db, type GameSave } from '../db/gameDB';
import { useGameStore } from '../store/gameStore';
import { deduplicateNames, computeRankings } from './competitor';
import { getDefaultPricingTier } from '../types/monetization';

function serialize(): Omit<GameSave, 'id' | 'timestamp'> {
  const s = useGameStore.getState();
  return {
    tick: s.tick,
    speed: s.speed,
    cash: s.cash,
    month: s.month,
    employees: s.employees,
    resources: s.resources,
    features: s.features,
    racks: s.racks,
    plots: s.plots,
    rentedServers: s.rentedServers,
    inventoryNodes: s.inventoryNodes,
    activeView: s.activeView,
    visitedPlots: s.visitedPlots,
    totalSalary: s.totalSalary,
    selectedProduct: s.activeProductId && s.products[s.activeProductId] ? s.products[s.activeProductId].sector : s.activeProductId,
    activeProductId: s.activeProductId,
    products: s.products,
    activeMonetization: s.activeMonetization,
    userMood: s.userMood,
    internetSubscriptions: s.internetSubscriptions,
    isBankrupt: s.isBankrupt,
    negativeCashMonths: s.negativeCashMonths,
    screen: s.screen,
    companyName: s.companyName,
    cashFlowHistory: s.cashFlowHistory,
    fundingRounds: s.fundingRounds,
    sourcingCampaign: s.sourcingCampaign,
    applicants: s.applicants,
    selectedHrId: s.selectedHrId,
    currentUsers: s.currentUsers,
    events: s.events,
    officeTier: s.officeTier,
    officeGridCols: s.officeGridCols,
    officeGridRows: s.officeGridRows,
    perkPoints: s.perkPoints,
    earnedMilestones: s.earnedMilestones,
    unlockedPerks: s.unlockedPerks,
    furnitureInventory: s.furnitureInventory,
    furniture: s.furniture,
    placementFurnitureId: s.placementFurnitureId,
    activePricingTier: s.activePricingTier,
    loan: s.loan,
    creditScore: s.creditScore,
    missedPaymentTicks: s.missedPaymentTicks,
    autoRenewEnabled: s.autoRenewEnabled,
    campaignCostThisMonth: s.campaignCostThisMonth,
    competitors: s.competitors,
    marketingCampaigns: s.marketingCampaigns,
    brandScore: s.brandScore,
    nextCompetitorCheck: s.nextCompetitorCheck,
    devMode: s.devMode,
    activeResearch: s.activeResearch,
    unlockedTechs: s.unlockedTechs,
    unlockedLevels: s.unlockedLevels,
    boardSatisfaction: s.boardSatisfaction,
    currentQuarter: s.currentQuarter,
    quarterlyTargets: s.quarterlyTargets,
    quarterlyHistory: s.quarterlyHistory,
    termSheet: s.termSheet,
    totalEquityGiven: s.totalEquityGiven,
    personalCash: s.personalCash,
    lifetimeWithdrawn: s.lifetimeWithdrawn,
    unlockedTitles: s.unlockedTitles,
    victoryAchieved: s.victoryAchieved,
    totalDividendsReceived: s.totalDividendsReceived,
    takeoverCapital: s.takeoverCapital,
    acquiredBy: s.acquiredBy,
    wealthLog: s.wealthLog,
    aiStakes: s.aiStakes,
    pendingFundingRounds: s.pendingFundingRounds,
    activeProductValuation: s.activeProductValuation,
    lastWithdrawMonth: s.lastWithdrawMonth,
    monthsAtRankOne: s.monthsAtRankOne,
    endgameUnlocked: s.endgameUnlocked,
    completedGame: s.completedGame,
    newGamePlus: s.newGamePlus,
    newGamePlusTitle: s.newGamePlusTitle,
  };
}

export async function saveGame(slotId?: number): Promise<number> {
  const data = serialize();
  const current = slotId ?? useGameStore.getState().currentSlotId ?? undefined;
  const id = await db.saves.put({
    ...(current ? { id: current } : {}),
    ...data,
    timestamp: Date.now(),
  } as GameSave);
  useGameStore.setState({ currentSlotId: id });
  return id;
}

export async function loadGame(slotId: number): Promise<boolean> {
  const save = await db.saves.get(slotId);
  if (!save) return false;

  const currentProducts = save.products ?? {};
  const activeProd = save.activeProductId && currentProducts[save.activeProductId]
    ? currentProducts[save.activeProductId]
    : Object.values(currentProducts)[0];

  const prodType = activeProd ? activeProd.sector : (save.selectedProduct ?? 'social_media');
  const activePricingTier = save.activePricingTier ?? getDefaultPricingTier(prodType);

  const employees = (save.employees ?? []).map(e => ({
    ...e,
    supervisedBy: e.supervisedBy || undefined,
  }));

  const compState = deduplicateNames(save.competitors ?? []);
  const rankedCompState = computeRankings(compState);

  const rawActiveView = save.activeView as any;
  const activeView = (rawActiveView && (rawActiveView.type === 'cityMap' || rawActiveView.type === 'office' || rawActiveView.type === 'server'))
    ? rawActiveView
    : { type: 'cityMap' };

  useGameStore.setState({
    tick: save.tick,
    speed: save.speed ?? 1,
    cash: save.cash,
    month: save.month,
    employees,
    resources: save.resources ?? [],
    features: save.features ?? [],
    racks: save.racks ?? [],
    plots: save.plots ?? [],
    rentedServers: save.rentedServers ?? [],
    inventoryNodes: save.inventoryNodes ?? [],
    activeView,
    visitedPlots: save.visitedPlots ?? [],
    totalSalary: save.totalSalary ?? 0,
    activeProductId: save.activeProductId ?? (activeProd ? activeProd.id : null),
    activeProductTypeId: prodType,
    products: currentProducts,
    activeMonetization: save.activeMonetization ?? 'none',
    userMood: save.userMood ?? 80,
    internetSubscriptions: save.internetSubscriptions ?? [],
    isBankrupt: save.isBankrupt ?? false,
    negativeCashMonths: save.negativeCashMonths ?? 0,
    screen: save.screen ?? 'playing',
    companyName: save.companyName ?? '',
    cashFlowHistory: save.cashFlowHistory ?? [],
    fundingRounds: save.fundingRounds ?? [],
    sourcingCampaign: save.sourcingCampaign ?? null,
    applicants: save.applicants ?? [],
    selectedHrId: save.selectedHrId ?? null,
    currentUsers: save.currentUsers ?? 0,
    events: save.events ?? [],
    officeTier: save.officeTier ?? 1,
    officeGridCols: save.officeGridCols ?? 4,
    officeGridRows: save.officeGridRows ?? 4,
    perkPoints: save.perkPoints ?? 0,
    earnedMilestones: save.earnedMilestones ?? [],
    unlockedPerks: save.unlockedPerks ?? [],
    furnitureInventory: save.furnitureInventory ?? [],
    furniture: save.furniture ?? [],
    placementFurnitureId: save.placementFurnitureId ?? null,
    activePricingTier,
    loan: save.loan ?? null,
    creditScore: save.creditScore ?? 50,
    missedPaymentTicks: save.missedPaymentTicks ?? 0,
    autoRenewEnabled: save.autoRenewEnabled ?? true,
    campaignCostThisMonth: save.campaignCostThisMonth ?? 0,
    competitors: rankedCompState,
    marketingCampaigns: save.marketingCampaigns ?? [],
    brandScore: save.brandScore ?? 10,
    nextCompetitorCheck: save.nextCompetitorCheck ?? 600,
    devMode: save.devMode ?? false,
    currentSlotId: save.id,
    activeResearch: save.activeResearch ?? null,
    unlockedTechs: save.unlockedTechs ?? [],
    unlockedLevels: save.unlockedLevels ?? {},
    boardSatisfaction: save.boardSatisfaction ?? 50,
    currentQuarter: save.currentQuarter ?? 1,
    quarterlyTargets: save.quarterlyTargets ?? [],
    quarterlyHistory: save.quarterlyHistory ?? [],
    termSheet: save.termSheet ?? null,
    totalEquityGiven: save.totalEquityGiven ?? 0,
    personalCash: save.personalCash ?? 0,
    lifetimeWithdrawn: save.lifetimeWithdrawn ?? 0,
    unlockedTitles: save.unlockedTitles ?? [],
    victoryAchieved: save.victoryAchieved ?? false,
    totalDividendsReceived: save.totalDividendsReceived ?? 0,
    takeoverCapital: save.takeoverCapital ?? 0,
    acquiredBy: save.acquiredBy ?? null,
    wealthLog: save.wealthLog ?? [],
    aiStakes: save.aiStakes ?? [],
    pendingFundingRounds: save.pendingFundingRounds ?? [],
    activeProductValuation: save.activeProductValuation ?? 0,
    lastWithdrawMonth: save.lastWithdrawMonth ?? -1,
    monthsAtRankOne: save.monthsAtRankOne ?? 0,
    endgameUnlocked: save.endgameUnlocked ?? false,
    completedGame: save.completedGame ?? false,
    newGamePlus: save.newGamePlus ?? false,
    newGamePlusTitle: save.newGamePlusTitle ?? null,
  });

  return true;
}

export interface SaveSlotInfo {
  id: number;
  timestamp: number;
  month: number;
  cash: number;
  currentUsers: number;
  selectedProduct: string | null;
  tick: number;
  companyName?: string;
  playerName?: string;
}

export async function listSaves(): Promise<SaveSlotInfo[]> {
  const saves = await db.saves.toArray();
  return saves
    .map(s => ({
      id: s.id,
      timestamp: s.timestamp,
      month: s.month,
      cash: s.cash,
      currentUsers: s.currentUsers,
      selectedProduct: s.selectedProduct ?? null,
      tick: s.tick,
      companyName: s.companyName,
      playerName: (s as any).playerName || (s as any).ceoName,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteSave(slotId: number): Promise<void> {
  await db.saves.delete(slotId);
  const current = useGameStore.getState().currentSlotId;
  if (current === slotId) {
    useGameStore.setState({ currentSlotId: null });
  }
}

export async function nextFreeSlot(): Promise<number> {
  const saves = await db.saves.toArray();
  const used = new Set(saves.map(s => s.id));
  for (let i = 1; i <= 10; i++) {
    if (!used.has(i)) return i;
  }
  return Math.max(...used) + 1;
}
