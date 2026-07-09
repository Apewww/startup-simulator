import { db } from '../db/gameDB';
import { useGameStore } from '../store/gameStore';

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
  });
}

export async function loadGame(): Promise<boolean> {
  const save = await db.saves.get(1);
  if (!save) return false;

  useGameStore.setState({
    tick: save.tick,
    speed: save.speed,
    cash: save.cash,
    month: save.month,
    employees: save.employees,
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
  });

  return true;
}

export async function hasSavedGame(): Promise<boolean> {
  const save = await db.saves.get(1);
  return !!save;
}
