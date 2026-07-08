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
    totalSalary: state.totalSalary,
    selectedProduct: state.selectedProduct,
    isBankrupt: state.isBankrupt,
    negativeCashMonths: state.negativeCashMonths,
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
    totalSalary: save.totalSalary,
    selectedProduct: save.selectedProduct,
    isBankrupt: save.isBankrupt,
    negativeCashMonths: save.negativeCashMonths,
  });

  return true;
}

export async function hasSavedGame(): Promise<boolean> {
  const save = await db.saves.get(1);
  return !!save;
}
