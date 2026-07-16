import { db, type GameSave } from '../db/gameDB';
import { useGameStore } from '../store/gameStore';
import { deduplicateNames, computeRankings } from './competitor';

const GRID_COLS = 8;

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
    selectedProduct: s.selectedProduct,
    activeMonetization: s.activeMonetization,
    userMood: s.userMood,
    internetSubscriptions: s.internetSubscriptions,
    isBankrupt: s.isBankrupt,
    negativeCashMonths: s.negativeCashMonths,
    screen: s.screen,
    companyName: s.companyName,
    cashFlowHistory: s.cashFlowHistory,
    fundingRounds: s.fundingRounds,
    pendingFunding: s.pendingFunding,
    sourcingCampaign: s.sourcingCampaign,
    applicants: s.applicants,
    selectedHrId: s.selectedHrId,
    currentUsers: s.currentUsers,
    events: s.events,
    officeGridCols: s.officeGridCols,
    officeGridRows: s.officeGridRows,
    perkPoints: s.perkPoints,
    earnedMilestones: s.earnedMilestones,
    unlockedPerks: s.unlockedPerks,
    furnitureInventory: s.furnitureInventory,
    furniture: s.furniture,
    adLeads: s.adLeads,
    adCampaigns: s.adCampaigns,
    adSalesUnlockNotified: s.adSalesUnlockNotified,
    activePricingTier: s.activePricingTier,
    loan: s.loan,
    creditScore: s.creditScore,
    missedPaymentTicks: s.missedPaymentTicks,
    autoRenewEnabled: s.autoRenewEnabled,
    campaignCostThisMonth: s.campaignCostThisMonth,
    competitors: s.competitors,
    marketingCampaigns: s.marketingCampaigns,
    brandScore: s.brandScore,
    activeResearch: s.activeResearch,
    unlockedTechs: s.unlockedTechs,
    boardSatisfaction: s.boardSatisfaction,
    currentQuarter: s.currentQuarter,
    quarterlyTargets: s.quarterlyTargets,
    quarterlyHistory: s.quarterlyHistory,
    termSheet: s.termSheet,
    totalEquityGiven: s.totalEquityGiven,
  };
}

export async function saveGame(slotId?: number): Promise<void> {
  const state = useGameStore.getState();
  const id = slotId ?? state.currentSlotId ?? (await nextFreeSlot());
  const data = serialize();
  await db.saves.put({ id, timestamp: Date.now(), ...data });
  useGameStore.setState({ currentSlotId: id });
}

export async function loadGame(slotId: number): Promise<boolean> {
  const save = await db.saves.get(slotId);
  if (!save) return false;

  const employees = save.employees.map(emp => {
    if (emp.gridX === undefined && emp.gridY === undefined) {
      const dk = (emp as any).deskIndex ?? 0;
      return { ...emp, gridX: dk % GRID_COLS, gridY: Math.floor(dk / GRID_COLS) };
    }
    return emp;
  });

  useGameStore.setState({
    tick: save.tick,
    speed: save.speed,
    cash: save.cash,
    month: save.month,
    employees,
    resources: save.resources,
    features: save.features,
    racks: (save.racks ?? []).map(r => ({
      ...r,
      slots: r.slots.map(s => (s.node && (s.node as { typeId?: string }).typeId === 'router') ? { ...s, node: null } : s),
    })),
    plots: save.plots ?? [],
    rentedServers: (save.rentedServers ?? []).map(r => ({ ...r, dbCapacity: r.dbCapacity ?? 0 })),
    inventoryNodes: save.inventoryNodes ?? [],
    activeView: save.activeView ?? { type: 'office' },
    visitedPlots: save.visitedPlots ?? [],
    totalSalary: save.totalSalary,
    selectedProduct: save.selectedProduct,
    activeMonetization: save.activeMonetization ?? 'none',
    userMood: save.userMood ?? 80,
    internetSubscriptions: (save.internetSubscriptions ?? []).map(s => ({ ...s })),
    isBankrupt: save.isBankrupt,
    negativeCashMonths: save.negativeCashMonths,
    screen: save.screen ?? 'playing',
    companyName: (save as any).companyName ?? '',
    cashFlowHistory: save.cashFlowHistory ?? [],
    fundingRounds: save.fundingRounds ?? [],
    pendingFunding: save.pendingFunding ?? null,
    sourcingCampaign: save.sourcingCampaign ?? null,
    applicants: save.applicants ?? [],
    selectedHrId: save.selectedHrId ?? null,
    currentUsers: save.currentUsers ?? 0,
    events: save.events ?? [],
    officeGridCols: save.officeGridCols ?? 8,
    officeGridRows: save.officeGridRows ?? 8,
    perkPoints: save.perkPoints ?? 0,
    earnedMilestones: save.earnedMilestones ?? [],
    unlockedPerks: save.unlockedPerks ?? [],
    furnitureInventory: save.furnitureInventory ?? [],
    furniture: save.furniture ?? [],
    adLeads: save.adLeads ?? [],
    adCampaigns: save.adCampaigns ?? [],
    adSalesUnlockNotified: save.adSalesUnlockNotified ?? false,
    activePricingTier: save.activePricingTier ?? '',
    loan: save.loan ?? null,
    creditScore: save.creditScore ?? 50,
    missedPaymentTicks: save.missedPaymentTicks ?? 0,
    autoRenewEnabled: save.autoRenewEnabled ?? true,
    campaignCostThisMonth: save.campaignCostThisMonth ?? 0,
    competitors: save.competitors ?? [],
    marketingCampaigns: save.marketingCampaigns ?? [],
    brandScore: save.brandScore ?? 10,
    activeResearch: (save as any).activeResearch ?? null,
    unlockedTechs: (save as any).unlockedTechs ?? [],
    boardSatisfaction: (save as any).boardSatisfaction ?? 50,
    currentQuarter: (save as any).currentQuarter ?? 1,
    quarterlyTargets: (save as any).quarterlyTargets ?? [],
    quarterlyHistory: (save as any).quarterlyHistory ?? [],
    termSheet: (save as any).termSheet ?? null,
    totalEquityGiven: (save as any).totalEquityGiven ?? 0,
    currentSlotId: slotId,
  });

  // Fix duplicate names & rankings from corrupted old saves
  const competitors = useGameStore.getState().competitors;
  if (competitors.length > 0) {
    const fixed = computeRankings(deduplicateNames(competitors));
    useGameStore.setState({ competitors: fixed });
  }

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
      selectedProduct: s.selectedProduct,
      tick: s.tick,
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
