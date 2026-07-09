import { create } from 'zustand';
import type { Employee, EmployeeRole, ComponentResource, PlatformFeature, ComponentRequirement, ServerRack, RackTier, NodeTypeId, ServerNode, Plot, RentedServer, RentalType } from '../types';
import { getComponentDef, COMPONENTS } from '../data/components';
import { getProductDef } from '../data/products';
import { getNodeDef, getRackDef } from '../data/servers';
import { calculateNodeLoads, calcMonthlyServerCost } from '../systems/server';
import { getTrafficStats } from '../systems/traffic';
import { calculateRevenue } from '../systems/monetization';

export type GameSpeed = 1 | 2 | 4;
export const TICKS_PER_MONTH = 30;

export type PanelId = 'employees' | 'features' | 'server' | 'finance';
export type PanelOpenState = Record<PanelId, boolean>;
export type GameScreen = 'menu' | 'select' | 'playing';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

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
  plots: Plot[];
  rentedServers: RentedServer[];
  totalSalary: number;
  selectedProduct: string | null;
  devMode: boolean;
  inventoryNodes: ServerNode[];
  activeView: { type: 'office' } | { type: 'server', plotId: string };
  visitedPlots: string[];
  gameLog: string[];
  notifications: Notification[];
  isBankrupt: boolean;
  negativeCashMonths: number;
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  panelOpen: PanelOpenState;
  panelMinimized: PanelOpenState;
  togglePanel: (id: PanelId) => void;
  toggleMinimize: (id: PanelId) => void;
  selectedEmployeeId: string | null;
  focusEmployee: (id: string | null) => void;
  togglePause: () => void;
  setSpeed: (speed: GameSpeed) => void;
  incrementTick: () => void;
  addCash: (amount: number) => void;
  hireEmployee: (role: EmployeeRole) => void;
  assignTask: (employeeId: string, componentId: string) => void;
  selectProduct: (productId: string) => void;
  buildFeature: (featureId: string) => void;
  upgradeFeature: (featureId: string) => void;
  buyPlot: () => void;
  buyRack: (tier: RackTier) => void;
  placeRack: (rackId: string, plotId: string, x: number, y: number) => void;
  moveRack: (rackId: string, x: number, y: number) => void;
  unplaceRack: (rackId: string) => void;
  buyNode: (typeId: NodeTypeId) => void;
  placeNode: (nodeId: string, rackId: string, slotIndex: number) => void;
  sellNode: (rackId: string, slotIndex: number) => void;
  unequipNode: (rackId: string, slotIndex: number) => void;
  sellRack: (rackId: string) => void;
  rentServer: (type: RentalType) => void;
  cancelRental: (id: string) => void;
  toggleDevMode: () => void;
  setActiveView: (view: { type: 'office' } | { type: 'server', plotId: string }) => void;
  addLog: (msg: string) => void;
  addNotification: (msg: string, type?: Notification['type']) => void;
  dismissNotification: (id: string) => void;
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
  plots: [],
  rentedServers: [],
  totalSalary: 0,
  selectedProduct: null,
  devMode: false,
  inventoryNodes: [],
  activeView: { type: 'office' },
  visitedPlots: [],
  gameLog: [],
  isBankrupt: false,
  negativeCashMonths: 0,
  screen: 'menu',
  panelOpen: { employees: true, features: false, server: false, finance: false },
  panelMinimized: { employees: false, features: false, server: false, finance: false },
  selectedEmployeeId: null,
  notifications: [],

  setScreen: (screen) => set({ screen }),
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
    get().addNotification(`Hired ${name} (${role}) — $500/mo`, 'success');
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

    const placedRacks = racks.filter(r => r.plotId !== null);
    const unplacedRacks = racks.filter(r => r.plotId === null);
    const trafficStats = getTrafficStats(features);
    const updatedPlacedRacks = calculateNodeLoads(placedRacks, trafficStats.rps, state.rentedServers);

    let cashChange = 0;
    let newTotalSalary = state.totalSalary;
    let newNegativeCashMonths = state.negativeCashMonths;
    if (newMonth > oldMonth) {
      newTotalSalary = calcTotalSalary(newEmployees);
      const serverCost = calcMonthlyServerCost(updatedPlacedRacks, state.rentedServers);
      const revenue = calculateRevenue(trafficStats.users, features, updatedPlacedRacks);
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
      racks: [...unplacedRacks, ...updatedPlacedRacks],
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
    set({ selectedProduct: productId, features, screen: 'playing' });
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

    get().addNotification(`Built ${featDef.name}!`, 'success');
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

    get().addNotification(`Upgraded ${featDef.name} to Lv.${nextLevel}!`, 'success');
    set({ resources: newResources, features: newFeatures });
  },

  buyRack: (tier: RackTier) => {
    const state = get();
    const def = getRackDef(tier);
    if (!def) return;
    if (state.cash < def.price) return;

    rackCounter++;
    const slots = Array.from({ length: def.maxSlots }, (_, i) => ({ index: i, node: null }));
    const rackId = `rack-${rackCounter}`;

    const newRack: ServerRack = {
      id: rackId,
      tier: def.tier,
      label: def.label,
      plotId: null,
      gridX: 0,
      gridY: 0,
      gridW: def.gridW,
      gridH: def.gridH,
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

    get().addLog(`Bought ${def.label} ($${def.price})`);
    get().addNotification(`Bought ${def.label} — $${def.price}`, 'info');
    set({ cash: state.cash - def.price, racks: [...state.racks, newRack] });
  },

  placeRack: (rackId: string, plotId: string, x: number, y: number) => {
    const state = get();
    const rack = state.racks.find(r => r.id === rackId);
    const plot = state.plots.find(p => p.id === plotId);
    if (!rack || !plot) return;
    if (x + rack.gridW > plot.gridCols || y + rack.gridH > plot.gridRows) return;

    const collision = state.racks.some(r =>
      r.id !== rackId && r.plotId === plotId &&
      x < r.gridX + r.gridW && x + rack.gridW > r.gridX &&
      y < r.gridY + r.gridH && y + rack.gridH > r.gridY
    );
    if (collision) return;

    get().addLog(`Placed ${rack.label} at (${x},${y}) on plot ${plotId}`);
    set({
      racks: state.racks.map(r =>
        r.id === rackId ? { ...r, plotId, gridX: x, gridY: y } : r
      ),
      plots: state.plots.map(p =>
        p.id === plotId ? { ...p, rackIds: [...p.rackIds.filter(id => id !== rackId), rackId] } : p
      ),
    });
  },

  moveRack: (rackId: string, x: number, y: number) => {
    const state = get();
    const rack = state.racks.find(r => r.id === rackId);
    if (!rack || rack.plotId === null) return;
    const plot = state.plots.find(p => p.id === rack.plotId);
    if (!plot) return;
    if (x + rack.gridW > plot.gridCols || y + rack.gridH > plot.gridRows) return;

    const collision = state.racks.some(r =>
      r.id !== rackId && r.plotId === rack.plotId &&
      x < r.gridX + r.gridW && x + rack.gridW > r.gridX &&
      y < r.gridY + r.gridH && y + rack.gridH > r.gridY
    );
    if (collision) return;

    get().addLog(`Moved ${rack.label} to (${x},${y})`);
    set({
      racks: state.racks.map(r =>
        r.id === rackId ? { ...r, gridX: x, gridY: y } : r
      ),
    });
  },

  unplaceRack: (rackId: string) => {
    const state = get();
    const rack = state.racks.find(r => r.id === rackId);
    if (!rack) return;
    const plotId = rack.plotId;
    get().addLog(`Removed ${rack.label} from grid`);
    set({
      racks: state.racks.map(r =>
        r.id === rackId ? { ...r, plotId: null, gridX: 0, gridY: 0 } : r
      ),
      plots: state.plots.map(p =>
        p.id === plotId ? { ...p, rackIds: p.rackIds.filter(id => id !== rackId) } : p
      ),
    });
  },

  buyPlot: () => {
    const state = get();
    const price = 1500;
    const monthlyCost = 50;
    if (state.cash < price) return;
    const plotId = `plot-${state.plots.length + 1}`;
    const newPlot: Plot = {
      id: plotId,
      label: `Plot ${String.fromCharCode(64 + state.plots.length + 1)}`,
      price,
      monthlyCost,
      rackIds: [],
      gridCols: 6,
      gridRows: 8,
    };
    get().addNotification(`Bought plot ${newPlot.label} — $${price}`, 'success');
    set({ cash: state.cash - price, plots: [...state.plots, newPlot] });
  },

  buyNode: (typeId: NodeTypeId) => {
    const state = get();
    const def = getNodeDef(typeId);
    if (!def) return;
    if (state.cash < def.price) return;

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

    get().addLog(`Bought ${def.label} ($${def.price}) → inventory`);
    get().addNotification(`Bought ${def.label} — $${def.price}`, 'info');
    set({ cash: state.cash - def.price, inventoryNodes: [...state.inventoryNodes, newNode] });
  },

  placeNode: (nodeId: string, rackId: string, slotIndex: number) => {
    const state = get();
    const nodeIndex = state.inventoryNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;
    const node = state.inventoryNodes[nodeIndex];

    const rack = state.racks.find(r => r.id === rackId);
    if (!rack) return;
    const slot = rack.slots.find(s => s.index === slotIndex);
    if (!slot || slot.node !== null) return;

    get().addLog(`Placed ${node.label} into ${rack.label} slot ${slotIndex + 1}`);
    get().addNotification(`Placed ${node.label} into ${rack.label}`, 'success');
    set({
      inventoryNodes: state.inventoryNodes.filter(n => n.id !== nodeId),
      racks: state.racks.map(r =>
        r.id === rackId
          ? { ...r, slots: r.slots.map(s => s.index === slotIndex ? { ...s, node } : s) }
          : r
      ),
    });
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

    const nodeName = state.racks[rackIndex].slots[slotIndex]?.node?.label || 'Node';
    get().addLog(`Sold ${nodeName} from rack slot (refund $${refund})`);
    get().addNotification(`Sold ${nodeName} — refund $${refund}`, 'warning');
    set({ cash: state.cash + refund, racks: newRacks });
  },

  unequipNode: (rackId: string, slotIndex: number) => {
    const state = get();
    const rackIndex = state.racks.findIndex(r => r.id === rackId);
    if (rackIndex === -1) return;

    const node = state.racks[rackIndex].slots[slotIndex]?.node;
    if (!node) return;

    const newRacks = state.racks.map((r, idx) => {
      if (idx !== rackIndex) return r;
      const newSlots = r.slots.map(s => s.index === slotIndex ? { ...s, node: null } : s);
      return { ...r, slots: newSlots };
    });

    get().addLog(`Unequipped ${node.label} from rack slot`);
    get().addNotification(`Unequipped ${node.label}`, 'info');
    set({ racks: newRacks, inventoryNodes: [...state.inventoryNodes, node] });
  },

  sellRack: (rackId: string) => {
    const state = get();
    const rack = state.racks.find(r => r.id === rackId);
    if (!rack) return;

    if (rack.plotId !== null) {
      const hasNodes = rack.slots.some(s => s.node !== null);
      if (hasNodes) return;
    }

    const refund = Math.floor(rack.price * 0.5);
    const nodeRefunds = rack.slots.reduce((sum, s) => s.node ? sum + Math.floor(s.node.price * 0.5) : sum, 0);
    const nodesFromRack = rack.slots.filter(s => s.node !== null).map(s => s.node!);
    const newRacks = state.racks.filter(r => r.id !== rackId);
    const newPlots = rack.plotId
      ? state.plots.map(p => p.id === rack.plotId ? { ...p, rackIds: p.rackIds.filter(id => id !== rackId) } : p)
      : state.plots;
    const totalRefund = refund + nodeRefunds;
    get().addLog(`Sold ${rack.label} (refund $${totalRefund})`);
    get().addNotification(`Sold ${rack.label} — refund $${totalRefund}`, 'warning');
    set({
      cash: state.cash + totalRefund,
      racks: newRacks,
      plots: newPlots,
      inventoryNodes: [...state.inventoryNodes, ...nodesFromRack],
    });
  },

  rentServer: (type: RentalType) => {
    const state = get();
    const defs: Record<RentalType, Omit<RentedServer, 'id'>> = {
      vps: { type: 'vps', label: 'VPS', capacityRps: 150, storage: 50, monthlyCost: 40, uptime: 0.99 },
      dedicated: { type: 'dedicated', label: 'Dedicated', capacityRps: 600, storage: 200, monthlyCost: 180, uptime: 0.999 },
      cloud: { type: 'cloud', label: 'Cloud Instance', capacityRps: 1000, storage: 500, monthlyCost: 300, uptime: 0.995 },
    };
    const def = defs[type];
    get().addNotification(`Rented ${def.label} — $${def.monthlyCost}/mo`, 'info');
    set({ rentedServers: [...state.rentedServers, { id: `rent-${state.rentedServers.length + 1}`, ...def }] });
  },

  cancelRental: (id: string) => {
    set((state) => ({ rentedServers: state.rentedServers.filter(r => r.id !== id) }));
  },

  toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),
  setActiveView: (view) => set((state) => ({
    activeView: view,
    visitedPlots: view.type === 'server' && !state.visitedPlots.includes(view.plotId)
      ? [...state.visitedPlots, view.plotId]
      : state.visitedPlots,
  })),
  addLog: (msg) => set((state) => ({ gameLog: [...state.gameLog.slice(-49), `[T${state.tick}] ${msg}`] })),
  addNotification: (msg, type = 'info') => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({ notifications: [...state.notifications, { id, message: msg, type }] }));
    setTimeout(() => {
      useGameStore.getState().dismissNotification(id);
    }, 3000);
  },
  dismissNotification: (id) => set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) })),

  togglePanel: (id: PanelId) => set((state) => ({
    panelOpen: { ...state.panelOpen, [id]: !state.panelOpen[id] },
    panelMinimized: { ...state.panelMinimized, [id]: false },
  })),

  toggleMinimize: (id: PanelId) => set((state) => ({
    panelMinimized: { ...state.panelMinimized, [id]: !state.panelMinimized[id] },
  })),

  focusEmployee: (id) => set((state) => ({
    selectedEmployeeId: id,
    panelOpen: { ...state.panelOpen, employees: true },
  })),

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
      employees: [], resources: [], features: [], racks: [], plots: [], rentedServers: [],
      totalSalary: 0, selectedProduct: null, devMode: false,
      inventoryNodes: [], activeView: { type: 'office' }, visitedPlots: [], gameLog: [],
      isBankrupt: false, negativeCashMonths: 0, screen: 'menu',
      panelOpen: { employees: true, features: false, server: false, finance: false },
      panelMinimized: { employees: false, features: false, server: false, finance: false },
      selectedEmployeeId: null,
    });
  },
}));

export function getComponentsByRole(role: EmployeeRole) {
  return COMPONENTS.filter(c => c.producedBy === role);
}
