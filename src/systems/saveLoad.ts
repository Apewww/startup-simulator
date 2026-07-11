import { db } from '../db/gameDB';
import { useGameStore } from '../store/gameStore';

const GRID_COLS = 8;

export async function saveGame(): Promise<void> {
  const state = useGameStore.getState();
  await db.saves.put({
    id: 1,
    timestamp: Date.now(),
    tick: state.tick,
    speed: state.speed,
    cash: state.cash,
    month: state.month,
    employees: state.employees,
    resources: state.resources,
    features: state.features,
    racks: state.racks,
    plots: state.plots,
    rentedServers: state.rentedServers,
    inventoryNodes: state.inventoryNodes,
    activeView: state.activeView,
    visitedPlots: state.visitedPlots,
    totalSalary: state.totalSalary,
    selectedProduct: state.selectedProduct,
    isBankrupt: state.isBankrupt,
    negativeCashMonths: state.negativeCashMonths,
    screen: state.screen,
    cashFlowHistory: state.cashFlowHistory,
    fundingRounds: state.fundingRounds,
    pendingFunding: state.pendingFunding,
    sourcingCampaign: state.sourcingCampaign,
    applicants: state.applicants,
    selectedHrId: state.selectedHrId,
    currentUsers: state.currentUsers,
    events: state.events,
    officeGridCols: state.officeGridCols,
    officeGridRows: state.officeGridRows,
    perkPoints: state.perkPoints,
    earnedMilestones: state.earnedMilestones,
    unlockedPerks: state.unlockedPerks,
    furnitureInventory: state.furnitureInventory,
    furniture: state.furniture,
  });
}

export async function loadGame(): Promise<boolean> {
  const save = await db.saves.get(1);
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
    racks: save.racks,
    plots: save.plots ?? [],
    rentedServers: save.rentedServers ?? [],
    inventoryNodes: save.inventoryNodes ?? [],
    activeView: save.activeView ?? { type: 'office' },
    visitedPlots: save.visitedPlots ?? [],
    totalSalary: save.totalSalary,
    selectedProduct: save.selectedProduct,
    isBankrupt: save.isBankrupt,
    negativeCashMonths: save.negativeCashMonths,
    screen: save.screen ?? 'playing',
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
  });

  return true;
}

export async function hasSavedGame(): Promise<boolean> {
  const save = await db.saves.get(1);
  return !!save;
}
