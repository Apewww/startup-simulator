import { create } from 'zustand';
import type { Employee, EmployeeRole, ComponentResource, PlatformFeature, ComponentRequirement, ServerRack, RackTier, NodeTypeId, ServerNode } from '../types';
import { getComponentDef, COMPONENTS } from '../data/components';
import { getProductDef } from '../data/products';
import { getNodeDef, getRackDef } from '../data/servers';
import { calculateNodeLoads, calcMonthlyServerCost } from '../systems/server';
import { getTrafficStats } from '../systems/traffic';
import { calculateRevenue } from '../systems/monetization';

export type GameSpeed = 1 | 2 | 4;
export const TICKS_PER_MONTH = 30;

interface GameState {
  tick: number;
  isPaused: boolean;
  speed: GameSpeed;
  cash: number;
  month: number;
  employees: Employee[];
  resources: ComponentResource[];
  features: PlatformFeature[];
  racks: ServerRack[];
  totalSalary: number;
  selectedProduct: string | null;
  devMode: boolean;
  isBankrupt: boolean;
  negativeCashMonths: number;
  togglePause: () => void;
  setSpeed: (speed: GameSpeed) => void;
  incrementTick: () => void;
  addCash: (amount: number) => void;
  hireEmployee: (role: EmployeeRole) => void;
  assignTask: (employeeId: string, componentId: string) => void;
  selectProduct: (productId: string) => void;
  buildFeature: (featureId: string) => void;
  upgradeFeature: (featureId: string) => void;
  buyRack: (tier: RackTier) => void;
  buyNode: (rackId: string, typeId: NodeTypeId) => void;
  sellNode: (rackId: string, slotIndex: number) => void;
  sellRack: (rackId: string) => void;
  toggleDevMode: () => void;
  addResources: (componentId: string, amount: number) => void;
  completeTask: (employeeId: string) => void;
  unlockAllFeatures: () => void;
  fillRack: (rackId: string, typeId: NodeTypeId) => void;
  restartGame: () => void;
}

function calcTotalSalary(employees: Employee[]): number {
  return employees.reduce((sum, emp) => sum + emp.salary, 0);
}

const EMPLOYEE_NAMES: Record<EmployeeRole, string[]> = {
  Developer: ['Alice', 'Charlie', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'],
  Designer: ['Bob', 'Diana', 'Fiona', 'George', 'Helen', 'Isaac', 'Julia', 'Kevin'],
  Lead_Developer: ['Mallory', 'Oscar', 'Peggy', 'Sam', 'Uma', 'Walter'],
  SysAdmin: ['Trent', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zane'],
};

let rackCounter = 0;
let nodeCounter = 0;

export const useGameStore = create<GameState>((set, get) => ({
  tick: 0,
  isPaused: false,
  speed: 1,
  cash: 10000,
  month: 0,
  employees: [],
  resources: [],
  features: [],
  racks: [],
  totalSalary: 0,
  selectedProduct: null,
  devMode: false,
  isBankrupt: false,
  negativeCashMonths: 0,

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setSpeed: (speed) => set({ speed }),

  hireEmployee: (role: EmployeeRole) => {
    const state = get();
    const roleNames = EMPLOYEE_NAMES[role] || ['Unknown'];
    const roleCount = state.employees.filter(e => e.role === role).length;
    const name = roleNames[roleCount % roleNames.length];
    const id = `emp-${state.employees.length + 1}`;

    const newEmp: Employee = {
      id, name, role, level: 1, salary: 500,
      happiness: 80, speed: 1, currentTask: null, taskProgress: 0,
      resignTicks: 0,
    };

    const updated = [...state.employees, newEmp];
    set({ employees: updated, totalSalary: calcTotalSalary(updated) });
  },

  assignTask: (employeeId: string, componentId: string) => {
    set((state) => ({
      employees: state.employees.map(emp =>
        emp.id === employeeId
          ? { ...emp, currentTask: componentId, taskProgress: 0 }
          : emp
      ),
    }));
  },

  incrementTick: () => {
    const state = get();
    const { tick, employees, resources, features, racks } = state;
    const newTick = tick + 1;
    const newMonth = Math.floor(newTick / TICKS_PER_MONTH);
    const oldMonth = Math.floor(tick / TICKS_PER_MONTH);

    const newResources = resources.map(r => ({ ...r }));
    const resignedIds: string[] = [];
    const newEmployees = employees
      .map(emp => {
        const def = emp.currentTask ? getComponentDef(emp.currentTask) : undefined;
        let newHappiness = emp.happiness;
        let newProgress = emp.taskProgress;
        let newCurrentTask = emp.currentTask;
        let newResignTicks = emp.resignTicks;

        if (emp.currentTask && def) {
          newProgress = emp.taskProgress + emp.speed;
          if (newProgress >= def.baseTicks) {
            const existing = newResources.find(r => r.id === def.id);
            if (existing) {
              existing.quantity += 1;
            } else {
              newResources.push({ id: def.id, name: def.name, quantity: 1 });
            }
            newProgress = 0;
            newCurrentTask = null;
          }
        }

        if (newCurrentTask !== null) {
          newHappiness -= 1;
        } else {
          newHappiness -= 0.2;
        }
        newHappiness = Math.max(0, Math.min(100, newHappiness));

        let newSpeed: number;
        if (newHappiness < 30) {
          newSpeed = emp.level * 0.5;
        } else if (newHappiness >= 80) {
          newSpeed = emp.level * 1.2;
        } else {
          newSpeed = emp.level;
        }

        if (newHappiness < 15) {
          newResignTicks += 1;
        } else {
          newResignTicks = 0;
        }

        if (newResignTicks >= 10 && Math.random() < 0.2) {
          resignedIds.push(emp.id);
          return null;
        }

        return {
          ...emp,
          happiness: newHappiness,
          speed: newSpeed,
          currentTask: newCurrentTask,
          taskProgress: newProgress,
          resignTicks: newResignTicks,
        };
      })
      .filter((emp): emp is Employee => emp !== null);

    const trafficStats = getTrafficStats(features);
    const updatedRacks = calculateNodeLoads(racks, trafficStats.rps);

    let cashChange = 0;
    let newTotalSalary = state.totalSalary;
    let newNegativeCashMonths = state.negativeCashMonths;
    if (newMonth > oldMonth) {
      newTotalSalary = calcTotalSalary(newEmployees);
      const serverCost = calcMonthlyServerCost(updatedRacks);
      const revenue = calculateRevenue(trafficStats.users, features, updatedRacks);
      cashChange = revenue.total - (newTotalSalary + serverCost);

      const cashAfter = state.cash + cashChange;
      if (cashAfter < 0) {
        newNegativeCashMonths += 1;
      } else {
        newNegativeCashMonths = 0;
      }
    }

    const isBankrupt = newNegativeCashMonths >= 3;

    set({
      tick: newTick,
      month: newMonth,
      cash: state.cash + cashChange,
      totalSalary: newTotalSalary,
      employees: newEmployees,
      resources: newResources,
      racks: updatedRacks,
      negativeCashMonths: newNegativeCashMonths,
      isBankrupt,
    });
  },

  addCash: (amount) => set((state) => ({ cash: state.cash + amount })),

  selectProduct: (productId: string) => {
    const product = getProductDef(productId);
    if (!product) return;
    const features: PlatformFeature[] = product.features.map((f) => ({
      id: f.id, name: f.name, level: 0,
      requiredComponents: f.requiredComponents, trafficGenerated: 0,
    }));
    set({ selectedProduct: productId, features });
  },

  buildFeature: (featureId: string) => {
    const state = get();
    const product = getProductDef(state.selectedProduct || '');
    if (!product) return;

    const featDef = product.features.find(f => f.id === featureId);
    const feature = state.features.find(f => f.id === featureId);
    if (!featDef || !feature || feature.level > 0) return;

    for (const req of featDef.requiredComponents) {
      const res = state.resources.find(r => r.id === req.componentId);
      if (!res || res.quantity < req.amount) return;
    }

    const newResources = state.resources.map(r => {
      const req = featDef.requiredComponents.find(req => req.componentId === r.id);
      return req ? { ...r, quantity: r.quantity - req.amount } : r;
    });

    const newFeatures = state.features.map(f =>
      f.id === featureId
        ? { ...f, level: 1, trafficGenerated: featDef.baseTraffic }
        : f
    );

    set({ resources: newResources, features: newFeatures });
  },

  upgradeFeature: (featureId: string) => {
    const state = get();
    const product = getProductDef(state.selectedProduct || '');
    if (!product) return;

    const featDef = product.features.find(f => f.id === featureId);
    const feature = state.features.find(f => f.id === featureId);
    if (!featDef || !feature || feature.level < 1) return;

    const nextLevel = feature.level + 1;
    const upgradeCost: ComponentRequirement[] = featDef.requiredComponents.map(r => ({
      componentId: r.componentId,
      amount: r.amount * nextLevel,
    }));

    for (const req of upgradeCost) {
      const res = state.resources.find(r => r.id === req.componentId);
      if (!res || res.quantity < req.amount) return;
    }

    const newResources = state.resources.map(r => {
      const req = upgradeCost.find(req => req.componentId === r.id);
      return req ? { ...r, quantity: r.quantity - req.amount } : r;
    });

    const newFeatures = state.features.map(f =>
      f.id === featureId
        ? { ...f, level: nextLevel, trafficGenerated: featDef.baseTraffic * nextLevel }
        : f
    );

    set({ resources: newResources, features: newFeatures });
  },

  buyRack: (tier: RackTier) => {
    const state = get();
    const def = getRackDef(tier);
    if (!def) return;
    if (state.cash < def.price) return;

    rackCounter++;
    const slots = Array.from({ length: def.maxSlots }, (_, i) => ({ index: i, node: null }));

    const newRack: ServerRack = {
      id: `rack-${rackCounter}`,
      tier: def.tier,
      label: def.label,
      slots,
      maxSlots: def.maxSlots,
      coolingCapacity: def.coolingCapacity,
      coolingUsed: 0,
      powerDraw: 0,
      price: def.price,
      monthlyCost: def.monthlyCost,
      isOverheating: false,
      overheatTicks: 0,
    };

    set({ cash: state.cash - def.price, racks: [...state.racks, newRack] });
  },

  buyNode: (rackId: string, typeId: NodeTypeId) => {
    const state = get();
    const def = getNodeDef(typeId);
    if (!def) return;
    if (state.cash < def.price) return;

    const rackIndex = state.racks.findIndex(r => r.id === rackId);
    if (rackIndex === -1) return;

    const rack = state.racks[rackIndex];
    const emptySlot = rack.slots.find(s => s.node === null);
    if (!emptySlot) return;

    nodeCounter++;
    const newNode: ServerNode = {
      id: `node-${nodeCounter}`,
      typeId: def.typeId,
      label: def.label,
      category: def.category,
      capacity: def.capacity,
      heat: def.heat,
      power: def.power,
      price: def.price,
      monthlyCost: def.monthlyCost,
      status: 'active',
      load: 0,
      crashTicks: 0,
      recoveryTicks: 0,
    };

    const newRacks = state.racks.map((r, idx) => {
      if (idx !== rackIndex) return r;
      const newSlots = r.slots.map(s => s.index === emptySlot.index ? { ...s, node: newNode } : s);
      return { ...r, slots: newSlots };
    });

    set({ cash: state.cash - def.price, racks: newRacks });
  },

  sellNode: (rackId: string, slotIndex: number) => {
    const state = get();
    const rackIndex = state.racks.findIndex(r => r.id === rackId);
    if (rackIndex === -1) return;

    const node = state.racks[rackIndex].slots[slotIndex]?.node;
    if (!node) return;

    const refund = Math.floor(node.price * 0.5);
    const newRacks = state.racks.map((r, idx) => {
      if (idx !== rackIndex) return r;
      const newSlots = r.slots.map(s => s.index === slotIndex ? { ...s, node: null } : s);
      return { ...r, slots: newSlots };
    });

    set({ cash: state.cash + refund, racks: newRacks });
  },

  sellRack: (rackId: string) => {
    const state = get();
    const rack = state.racks.find(r => r.id === rackId);
    if (!rack) return;

    const hasNodes = rack.slots.some(s => s.node !== null);
    if (hasNodes) return;

    const refund = Math.floor(rack.price * 0.5);
    set({ cash: state.cash + refund, racks: state.racks.filter(r => r.id !== rackId) });
  },

  toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),

  addResources: (componentId: string, amount: number) => {
    set((state) => {
      const existing = state.resources.find(r => r.id === componentId);
      if (existing) {
        return { resources: state.resources.map(r => r.id === componentId ? { ...r, quantity: r.quantity + amount } : r) };
      }
      const def = getComponentDef(componentId);
      if (!def) return state;
      return { resources: [...state.resources, { id: def.id, name: def.name, quantity: amount }] };
    });
  },

  completeTask: (employeeId: string) => {
    set((state) => ({
      employees: state.employees.map(emp => {
        if (emp.id !== employeeId || !emp.currentTask) return emp;
        const def = getComponentDef(emp.currentTask);
        if (!def) return emp;
        return { ...emp, taskProgress: def.baseTicks, currentTask: null };
      }),
    }));
  },

  unlockAllFeatures: () => {
    const state = get();
    const product = getProductDef(state.selectedProduct || '');
    if (!product) return;

    const newFeatures = state.features.map(f => {
      const featDef = product.features.find(pf => pf.id === f.id);
      if (!featDef || f.level > 0) return f;
      return { ...f, level: 1, trafficGenerated: featDef.baseTraffic };
    });
    set({ features: newFeatures });
  },

  fillRack: (rackId: string, typeId: NodeTypeId) => {
    const state = get();
    const def = getNodeDef(typeId);
    if (!def) return;

    const rackIndex = state.racks.findIndex(r => r.id === rackId);
    if (rackIndex === -1) return;

    const rack = state.racks[rackIndex];
    const emptySlots = rack.slots.filter(s => s.node === null);
    if (emptySlots.length === 0) return;

    const newRacks = state.racks.map((r, idx) => {
      if (idx !== rackIndex) return r;
      const newSlots = r.slots.map(s => {
        if (s.node !== null) return s;
        nodeCounter++;
        return {
          ...s,
          node: {
            id: `node-${nodeCounter}`,
            typeId: def.typeId,
            label: def.label,
            category: def.category,
            capacity: def.capacity,
            heat: def.heat,
            power: def.power,
            price: def.price,
            monthlyCost: def.monthlyCost,
            status: 'active' as const,
            load: 0,
            crashTicks: 0,
            recoveryTicks: 0,
          },
        };
      });
      return { ...r, slots: newSlots };
    });

    set({ racks: newRacks });
  },

  restartGame: () => {
    set({
      tick: 0, isPaused: false, speed: 1, cash: 10000, month: 0,
      employees: [], resources: [], features: [], racks: [],
      totalSalary: 0, selectedProduct: null, devMode: false,
      isBankrupt: false, negativeCashMonths: 0,
    });
  },
}));

export function getComponentsByRole(role: EmployeeRole) {
  return COMPONENTS.filter(c => c.producedBy === role);
}
