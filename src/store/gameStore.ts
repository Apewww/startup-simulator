import { create } from 'zustand';
import type { Employee, EmployeeRole, ComponentResource, PlatformFeature, ComponentRequirement, ServerRack, RackTier, NodeTypeId, ServerNode, Plot, RentedServer, RentalType, FundingRound, SourcingCampaign, Applicant, GameEvent } from '../types';
import { calcFundingOffer } from '../types/employee';
import { getComponentDef, COMPONENTS } from '../data/components';
import { getProductDef } from '../data/products';
import { getNodeDef, getRackDef } from '../data/servers';
import { calculateNodeLoads, calcMonthlyServerCost } from '../systems/server';
import { getPlatformStats, getAppliedEffects } from '../systems/platform';
import { calculateRevenue } from '../systems/monetization';
import { generateApplicant, CAMPAIGN_COST, getCampaignTicks, negotiate, applicantToEmployee } from '../systems/recruitment';
import { checkEventTrigger, processEvents, calcSecurityLevel } from '../systems/events';
import { getComplianceStatus } from '../systems/compliance';

export type GameSpeed = 1 | 2 | 4;
export const TICKS_PER_MONTH = 600;
export const TICKS_PER_DAY = 20;

export type PanelId = 'employees' | 'features' | 'server' | 'finance' | 'recruitment';
export type PanelOpenState = Record<PanelId, boolean>;
export type GameScreen = 'menu' | 'select' | 'playerSetup' | 'playing';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface MonthlySnapshot {
  month: number;
  revenue: number;
  expenses: number;
  net: number;
  cash: number;
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
  cashFlowHistory: MonthlySnapshot[];
  isBankrupt: boolean;
  negativeCashMonths: number;
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  panelOpen: PanelOpenState;
  panelMinimized: PanelOpenState;
  maximizedPanel: PanelId | null;
  togglePanel: (id: PanelId) => void;
  toggleMinimize: (id: PanelId) => void;
  setMaximizedPanel: (id: PanelId | null) => void;
  selectedEmployeeId: string | null;
  darkMode: boolean;
  toggleDarkMode: () => void;
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
  fundingRounds: FundingRound[];
  pendingFunding: FundingRound | null;
  checkFundingEligibility: () => void;
  acceptFunding: () => void;
  declineFunding: () => void;
  buyPlot: () => void;
  buyRack: (tier: RackTier) => void;
  placeRack: (rackId: string, plotId: string, x: number, y: number) => void;
  moveRack: (rackId: string, x: number, y: number) => void;
  unplaceRack: (rackId: string) => void;
  unplaceAllRacks: (plotId: string) => void;
  autoPlaceRack: (rackId: string, plotId: string) => void;
  autoPlaceNode: (nodeId: string) => void;
  buyNode: (typeId: NodeTypeId) => void;
  placeNode: (nodeId: string, rackId: string, slotIndex: number) => void;
  sellNode: (rackId: string, slotIndex: number) => void;
  unequipNode: (rackId: string, slotIndex: number) => void;
  sellRack: (rackId: string) => void;
  clearRack: (rackId: string) => void;
  clearAllNodes: () => void;
  unplaceAllRacksGlobal: () => void;
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
  sourcingCampaign: SourcingCampaign | null;
  applicants: Applicant[];
  startSourcing: (tier: SourcingCampaign['tier']) => void;
  cancelSourcing: () => void;
  dismissApplicant: (id: string) => void;
  negotiateSalary: (applicantId: string, offer: number) => void;
  selectedHrId: string | null;
  setSelectedHr: (id: string | null) => void;
  initPlayer: (name: string) => void;
  setPlayerRole: (id: string, role: EmployeeRole) => void;
  startTraining: (employeeId: string) => void;
  cancelTraining: (employeeId: string) => void;
  giveBonus: (employeeId: string) => void;
  startVacation: (employeeId: string, days: number) => void;
  cancelVacation: (employeeId: string) => void;
  restartGame: () => void;
  currentUsers: number;
  events: GameEvent[];
  setNodeScale: (rackId: string, slotIndex: number, delta: number) => void;
}

function calcTotalSalary(employees: Employee[]): number {
  return employees.reduce((sum, emp) => sum + emp.salary, 0);
}

const EMPLOYEE_NAMES: Record<EmployeeRole, string[]> = {
  Developer: ['Alice', 'Charlie', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'],
  Designer: ['Bob', 'Diana', 'Fiona', 'George', 'Helen', 'Isaac', 'Julia', 'Kevin'],
  Lead_Developer: ['Mallory', 'Oscar', 'Peggy', 'Sam', 'Uma', 'Walter'],
  SysAdmin: ['Trent', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zane'],
  HR: ['Riley', 'Jordan', 'Casey', 'Morgan', 'Avery', 'Quinn', 'Skyler', 'Harper'],
};

let rackCounter = 0;
let nodeCounter = 0;

export const useGameStore = create<GameState>((set, get) => ({
  tick: 0,
  isPaused: false,
  speed: 1,
  cash: 15000,
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
  panelOpen: { employees: true, recruitment: false, features: false, server: false, finance: false },
  panelMinimized: { employees: false, recruitment: false, features: false, server: false, finance: false },
  maximizedPanel: null,
  selectedEmployeeId: null,
  darkMode: false,
  notifications: [],
  cashFlowHistory: [],
  fundingRounds: [],
  pendingFunding: null,
  sourcingCampaign: null,
  applicants: [],
  selectedHrId: null,
  currentUsers: 0,
  events: [],

  setScreen: (screen) => set({ screen }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setSpeed: (speed) => set({ speed }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  hireEmployee: (role: EmployeeRole) => {
    const state = get();
    const roleNames = EMPLOYEE_NAMES[role] || ['Unknown'];
    const roleCount = state.employees.filter(e => e.role === role).length;
    const name = roleNames[roleCount % roleNames.length];
    const id = `emp-${state.employees.length + 1}`;

    const usedDesks = new Set(state.employees.map(e => e.deskIndex));
    let deskIndex = 0;
    while (usedDesks.has(deskIndex)) deskIndex++;
    const newEmp: Employee = {
      id, name, role, level: 1, salary: 500,
      happiness: 80, speed: 1, currentTask: null, taskProgress: 0,
      resignTicks: 0, deskIndex, isPlayer: false,
      isTraining: false, trainingProgress: 0, overworkTicks: 0,
      onVacation: false, vacationTicksLeft: 0,
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
    const { tick, employees, resources, features, racks, events, currentUsers, selectedProduct, rentedServers } = state;
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
        let newTrainingProgress = emp.trainingProgress;
        let newIsTraining = emp.isTraining;
        let newLevel = emp.level;
        let newOverworkTicks = emp.overworkTicks;
        let newVacationTicks = emp.vacationTicksLeft;
        let newOnVacation = emp.onVacation;

        if (emp.onVacation) {
          newVacationTicks = emp.vacationTicksLeft - 1;
          newHappiness += 0.1;
          if (newVacationTicks <= 0) {
            newOnVacation = false;
            newVacationTicks = 0;
          }
        } else if (emp.isTraining) {
          newTrainingProgress = emp.trainingProgress + emp.speed;
          if (newTrainingProgress >= emp.level * 400) {
            newLevel = emp.level + 1;
            newIsTraining = false;
            newTrainingProgress = 0;
            get().addNotification(`${emp.name} completed training — now Lv.${newLevel}!`, 'success');
          }
        } else if (emp.currentTask && def) {
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

        const isWorking = newCurrentTask !== null || newIsTraining;
        if (newOnVacation) {
        } else if (isWorking) {
          newHappiness -= 0.05;
        } else {
          newHappiness -= 0.005;
        }
        newHappiness = Math.max(0, Math.min(100, newHappiness));

        let newSpeed: number;
        if (newHappiness < 30) {
          newSpeed = emp.level * 0.6;
        } else if (newHappiness >= 80) {
          newSpeed = emp.level * 1.3;
        } else {
          newSpeed = emp.level;
        }

        if (newHappiness < 20 && isWorking) {
          newOverworkTicks += 1;
        } else {
          newOverworkTicks = 0;
        }
        if (newOverworkTicks >= 50) {
          newSpeed = Math.floor(newSpeed * 0.7);
        }

        if (!emp.isPlayer && newHappiness < 15) {
          newResignTicks += 1;
        } else {
          newResignTicks = 0;
        }

        if (!emp.isPlayer && newResignTicks >= 10 * TICKS_PER_DAY && Math.random() < 0.2) {
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
          isTraining: newIsTraining,
          trainingProgress: newTrainingProgress,
          level: newLevel,
          overworkTicks: newOverworkTicks,
          onVacation: newOnVacation,
          vacationTicksLeft: newVacationTicks,
        };
      })
      .filter((emp): emp is Employee => emp !== null);

    const placedRacks = racks.filter(r => r.plotId !== null);
    const unplacedRacks = racks.filter(r => r.plotId === null);

    // Platform stats (cohesion, synergy, target users)
    const platformStats = getPlatformStats(features, events, selectedProduct);
    const targetUsers = platformStats.targetUsers;
    const cohesionScore = platformStats.cohesionScore;

    // Dynamic users
    const eventEffects = getAppliedEffects(events);
    const userDelta = (targetUsers - currentUsers) * 0.005 * cohesionScore;
    const hasCrash = placedRacks.some(r => r.slots.some(s => s.node?.status === 'crashed'));
    const crashPenalty = hasCrash ? currentUsers * 0.05 : 0;
    const churn = currentUsers * (1 - cohesionScore) * 0.0002;
    let newCurrentUsers = currentUsers + (userDelta * eventEffects.userGrowthMult) - crashPenalty - churn;
    newCurrentUsers = Math.max(0, Math.round(newCurrentUsers));

    // Server calculation with effectiveRPS — first check compliance for RPS penalty
    const complianceBefore = features.some(f => f.level > 0) ? getComplianceStatus(features, placedRacks) : null;
    const rpsMult = complianceBefore?.rpsPenalty ?? 1;
    const adjustedRps = Math.round(platformStats.effectiveRps * rpsMult);

    const sysAdminLevel = employees
      .filter(e => e.role === 'SysAdmin' && e.happiness >= 15)
      .reduce((max, e) => Math.max(max, e.level), 0);
    const { racks: updatedPlacedRacks, rentedServers: updatedRentedServers } = calculateNodeLoads(placedRacks, adjustedRps, rentedServers, sysAdminLevel);

    // If no web capacity at all, users drop fast
    const hasWebCapacity = updatedPlacedRacks.some(r =>
      r.slots.some(s =>
        s.node?.category === 'web_server' && (s.node.status === 'active' || s.node.status === 'overloaded')
      )
    ) || updatedRentedServers.some(r => r.capacityRps > 0);
    if (platformStats.effectiveRps > 0 && !hasWebCapacity) {
      newCurrentUsers = Math.max(0, Math.floor(newCurrentUsers * 0.92));
    }

    // Compliance check — hardware must meet feature requirements
    const compliance = features.some(f => f.level > 0)
      ? getComplianceStatus(features, [...unplacedRacks, ...updatedPlacedRacks])
      : null;
    if (compliance) {
      if (compliance.overall === 'critical') {
        newCurrentUsers = 0;
      } else if (compliance.userCap < 1) {
        newCurrentUsers = Math.min(newCurrentUsers, Math.round(platformStats.targetUsers * compliance.userCap));
      }
    }

    // Event trigger & processing
    const securityLevel = calcSecurityLevel(updatedPlacedRacks);
    const newEvent = checkEventTrigger(newCurrentUsers, securityLevel, events, cohesionScore);
    const allEvents = newEvent ? [...events, newEvent] : events;
    const { events: processedEvents, crashedRackId } = processEvents(allEvents, updatedPlacedRacks);

    // Handle server_outage: crash all nodes in target rack
    let finalRacks = updatedPlacedRacks;
    if (crashedRackId) {
      finalRacks = updatedPlacedRacks.map(r =>
        r.id === crashedRackId
          ? {
              ...r,
              slots: r.slots.map(s =>
                s.node && s.node.status !== 'offline'
                  ? { ...s, node: { ...s.node, status: 'crashed' as const, load: 0, crashTicks: 0 } }
                  : s
              ),
            }
          : r
      );
      get().addNotification('Server outage! A rack has crashed.', 'error');
    }

    // DDoS duration reduction if rate limiter present
    let finalEvents = processedEvents;
    if (newEvent?.type === 'ddos') {
      const hasRateLimiter = finalRacks.some(r =>
        r.slots.some(s => s.node?.typeId === 'rate_limiter' && s.node.status === 'active')
      );
      if (hasRateLimiter) {
        finalEvents = finalEvents.map(ev =>
          ev.id === newEvent.id ? { ...ev, duration: Math.round(ev.duration * 0.5), tickLeft: Math.round(ev.tickLeft * 0.5) } : ev
        );
      }
    }

    // Viral growth: instant user boost
    if (newEvent?.type === 'viral_growth') {
      newCurrentUsers = Math.round(newCurrentUsers * 1.1);
      get().addNotification('Viral growth! Users increased by 10%', 'success');
    }

    let cashChange = 0;
    let newTotalSalary = state.totalSalary;
    let newNegativeCashMonths = state.negativeCashMonths;
    if (newMonth > oldMonth) {
      newTotalSalary = calcTotalSalary(newEmployees);
      const serverCost = calcMonthlyServerCost(finalRacks, rentedServers);
      const revenue = calculateRevenue(newCurrentUsers, features, finalRacks, cohesionScore * (compliance?.revenueMult ?? 1), platformStats.synergyRevenueBonus);
      cashChange = revenue.total - (newTotalSalary + serverCost);

      const cashAfter = state.cash + cashChange;
      if (cashAfter < 0) {
        newNegativeCashMonths += 1;
      } else {
        newNegativeCashMonths = 0;
      }

      const snapshot: MonthlySnapshot = {
        month: newMonth,
        revenue: revenue.total,
        expenses: newTotalSalary + serverCost,
        net: cashChange,
        cash: state.cash + cashChange,
      };
      const history = [...state.cashFlowHistory, snapshot].slice(-12);
      set({ cashFlowHistory: history });
    }

    const isBankrupt = newNegativeCashMonths >= 3;

    let newPendingFunding = state.pendingFunding;
    if (newMonth > oldMonth && !newPendingFunding) {
      const revenue = calculateRevenue(newCurrentUsers, features, finalRacks, cohesionScore * (compliance?.revenueMult ?? 1), platformStats.synergyRevenueBonus);
      const offer = calcFundingOffer(newMonth, newCurrentUsers, revenue.total);
      if (offer) {
        const lastRound = state.fundingRounds[state.fundingRounds.length - 1];
        const monthsSinceLast = lastRound ? newMonth - lastRound.month : newMonth;
        if (monthsSinceLast >= 6) {
          const round: FundingRound = {
            id: `fund-${state.fundingRounds.length + 1}`,
            round: state.fundingRounds.length + 1,
            amount: offer.amount,
            equityGiven: offer.equity,
            accepted: false,
            month: newMonth,
          };
          newPendingFunding = round;
        }
      }
    }
    if (newPendingFunding && newPendingFunding !== state.pendingFunding) {
      get().addNotification(`Funding offer: $${newPendingFunding.amount} for ${newPendingFunding.equityGiven}% equity`, 'info');
    }

    let newCampaign = state.sourcingCampaign;
    let newApplicants = [...state.applicants];
    if (newCampaign) {
      newCampaign = { ...newCampaign, daysLeft: newCampaign.daysLeft - 1 };
      if (newCampaign.daysLeft <= 0) {
        const hrEmp = state.selectedHrId ? state.employees.find(e => e.id === state.selectedHrId) : undefined;
        const hrLevel = hrEmp?.role === 'HR' ? hrEmp.level : 0;
        const count = newCampaign.tier === 'basic' ? 1 : newCampaign.tier === 'pro' ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
        const batch: Applicant[] = [];
        for (let i = 0; i < count; i++) {
          batch.push(generateApplicant(newCampaign, hrLevel));
        }
        newApplicants.push(...batch);
        newCampaign = null;
        get().addNotification(`${count} new applicant${count > 1 ? 's' : ''} arrived`, 'info');
      }
    }

    set({
      tick: newTick,
      month: newMonth,
      cash: state.cash + cashChange,
      totalSalary: newTotalSalary,
      employees: newEmployees,
      resources: newResources,
      racks: [...unplacedRacks, ...finalRacks],
      rentedServers: updatedRentedServers,
      negativeCashMonths: newNegativeCashMonths,
      isBankrupt,
      pendingFunding: newPendingFunding,
      sourcingCampaign: newCampaign,
      applicants: newApplicants,
      currentUsers: newCurrentUsers,
      events: finalEvents,
    });
  },

  addCash: (amount) => set((state) => ({ cash: state.cash + amount })),

  checkFundingEligibility: () => {
    const state = get();
    if (state.pendingFunding) return;
    const lastRound = state.fundingRounds[state.fundingRounds.length - 1];
    const monthsSinceLast = lastRound ? state.month - lastRound.month : state.month;
    if (monthsSinceLast < 6) return;

    const traffic = getPlatformStats(state.features, state.events, state.selectedProduct);
    const compliance = state.features.some(f => f.level > 0) ? getComplianceStatus(state.features, state.racks) : null;
    const revenue = calculateRevenue(state.currentUsers, state.features, state.racks, traffic.cohesionScore * (compliance?.revenueMult ?? 1), traffic.synergyRevenueBonus);
    const offer = calcFundingOffer(state.month, state.currentUsers, revenue.total);
    if (!offer) return;
    const round: FundingRound = {
      id: `fund-${state.fundingRounds.length + 1}`,
      round: state.fundingRounds.length + 1,
      amount: offer.amount,
      equityGiven: offer.equity,
      accepted: false,
      month: state.month,
    };
    get().addNotification(`Funding offer: $${offer.amount} for ${offer.equity}% equity`, 'info');
    set({ pendingFunding: round });
  },

  acceptFunding: () => {
    const state = get();
    if (!state.pendingFunding) return;
    get().addCash(state.pendingFunding.amount);
    get().addNotification(`Accepted funding! +$${state.pendingFunding.amount}`, 'success');
    set({
      fundingRounds: [...state.fundingRounds, { ...state.pendingFunding, accepted: true }],
      pendingFunding: null,
    });
  },

  declineFunding: () => {
    const state = get();
    if (!state.pendingFunding) return;
    get().addNotification('Funding offer declined', 'info');
    set({
      fundingRounds: [...state.fundingRounds, { ...state.pendingFunding }],
      pendingFunding: null,
    });
  },

  startSourcing: (tier) => {
    const state = get();
    const cost = CAMPAIGN_COST[tier];
    if (state.cash < cost) return;
    const hrEmp = state.selectedHrId ? state.employees.find(e => e.id === state.selectedHrId) : undefined;
    const hrLevel = hrEmp?.role === 'HR' ? hrEmp.level : 0;
    const hrSpeed = hrEmp?.role === 'HR' ? hrEmp.speed : 0;
    const ticks = getCampaignTicks(tier, hrLevel, hrSpeed);
    set({
      cash: state.cash - cost,
      sourcingCampaign: { tier, daysLeft: ticks },
    });
    get().addNotification(`Started ${tier} sourcing campaign${hrLevel > 0 ? ` (HR Lv.${hrLevel} boost)` : ''}`, 'info');
  },

  cancelSourcing: () => {
    set({ sourcingCampaign: null });
    get().addNotification('Sourcing campaign cancelled', 'info');
  },

  dismissApplicant: (id) => {
    set((state) => ({ applicants: state.applicants.filter(a => a.id !== id) }));
  },

  negotiateSalary: (applicantId, offer) => {
    const state = get();
    const idx = state.applicants.findIndex(a => a.id === applicantId);
    if (idx === -1) return;
    const app = state.applicants[idx];
    const result = negotiate(app, offer);
    const updated = { ...app, negotiationRounds: app.negotiationRounds + 1 };

    if (result.status === 'hired') {
      updated.expectedSalary = result.newExpectedSalary ?? offer;
      updated.status = 'hired';
      const usedDesks = new Set(state.employees.map(e => e.deskIndex));
      let deskIndex = 0;
      while (usedDesks.has(deskIndex)) deskIndex++;
      const emp = applicantToEmployee(updated, deskIndex);
      const newApplicants = state.applicants.map((a, i) => i === idx ? updated : a);
      const newEmployees = [...state.employees, emp];
      get().addNotification(`Hired ${emp.name} (${emp.role.replace('_', ' ')}) — $${emp.salary.toLocaleString('en-US')}/mo`, 'success');
      set({
        applicants: newApplicants,
        employees: newEmployees,
        totalSalary: calcTotalSalary(newEmployees),
      });
    } else if (result.status === 'rejected') {
      updated.status = 'rejected';
      const newApplicants = state.applicants.map((a, i) => i === idx ? updated : a);
      get().addNotification(`${app.name} rejected offer: ${result.message}`, 'warning');
      set({ applicants: newApplicants });
    } else {
      updated.expectedSalary = result.newExpectedSalary ?? app.expectedSalary;
      const newApplicants = state.applicants.map((a, i) => i === idx ? updated : a);
      set({ applicants: newApplicants });
    }
  },

  selectProduct: (productId: string) => {
    const product = getProductDef(productId);
    if (!product) return;
    const features: PlatformFeature[] = product.features.map((f) => ({
      id: f.id, name: f.name, level: 0,
      group: f.group,
      requiredComponents: f.requiredComponents, trafficGenerated: 0,
    }));
    set({ selectedProduct: productId, features, screen: 'playerSetup', currentUsers: 0 });
  },

  initPlayer: (name: string) => {
    const player: Employee = {
      id: 'player-1',
      name,
      role: 'Designer',
      level: 1,
      salary: 0,
      happiness: 80,
      speed: 1,
      currentTask: null,
      taskProgress: 0,
      resignTicks: 0,
      deskIndex: 0,
      isPlayer: true,
      isTraining: false,
      trainingProgress: 0,
      overworkTicks: 0,
      onVacation: false,
      vacationTicksLeft: 0,
    };
    set({ employees: [player], totalSalary: 0, screen: 'playing' });
  },

  setSelectedHr: (id) => {
    set({ selectedHrId: id });
  },

  setPlayerRole: (id, role) => {
    const state = get();
    const emp = state.employees.find(e => e.id === id);
    if (!emp || !emp.isPlayer) return;
    set({ employees: state.employees.map(e => e.id === id ? { ...e, role } : e) });
  },

  startTraining: (employeeId) => {
    set((state) => ({
      employees: state.employees.map(emp =>
        emp.id === employeeId && !emp.isTraining
          ? { ...emp, isTraining: true, trainingProgress: 0, currentTask: null, taskProgress: 0 }
          : emp
      ),
    }));
  },

  cancelTraining: (employeeId) => {
    set((state) => ({
      employees: state.employees.map(emp =>
        emp.id === employeeId
          ? { ...emp, isTraining: false, trainingProgress: 0 }
          : emp
      ),
    }));
  },

  giveBonus: (employeeId) => {
    const state = get();
    const cost = 200;
    if (state.cash < cost) return;
    set({
      cash: state.cash - cost,
      employees: state.employees.map(emp =>
        emp.id === employeeId
          ? { ...emp, happiness: Math.min(100, emp.happiness + 20) }
          : emp
      ),
    });
    get().addNotification('Bonus given! +20 happiness', 'success');
  },

  startVacation: (employeeId, days) => {
    set((state) => ({
      employees: state.employees.map(emp =>
        emp.id === employeeId
          ? { ...emp, onVacation: true, vacationTicksLeft: days * 20, currentTask: null, taskProgress: 0 }
          : emp
      ),
    }));
  },

  cancelVacation: (employeeId) => {
    set((state) => ({
      employees: state.employees.map(emp =>
        emp.id === employeeId
          ? { ...emp, onVacation: false, vacationTicksLeft: 0 }
          : emp
      ),
    }));
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
        ? { ...f, level: 1, trafficGenerated: featDef.baseTraffic, group: featDef.group }
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

  setNodeScale: (rackId: string, slotIndex: number, delta: number) => {
    set((state) => ({
      racks: state.racks.map(r =>
        r.id === rackId
          ? {
              ...r,
              slots: r.slots.map(s =>
                s.index === slotIndex && s.node
                  ? { ...s, node: { ...s.node, scaleLevel: Math.max(1, Math.min(5, s.node.scaleLevel + delta)) } }
                  : s
              ),
            }
          : r
      ),
    }));
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

  unplaceAllRacks: (plotId: string) => {
    const state = get();
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot || plot.rackIds.length === 0) return;
    get().addLog(`Removed all racks from ${plotId}`);
    set({
      racks: state.racks.map(r =>
        r.plotId === plotId ? { ...r, plotId: null, gridX: 0, gridY: 0 } : r
      ),
      plots: state.plots.map(p =>
        p.id === plotId ? { ...p, rackIds: [] } : p
      ),
    });
  },

  autoPlaceRack: (rackId: string, plotId: string) => {
    const state = get();
    const rack = state.racks.find(r => r.id === rackId);
    const plot = state.plots.find(p => p.id === plotId);
    if (!rack || !plot) return;

    for (let y = 0; y <= plot.gridRows - rack.gridH; y++) {
      for (let x = 0; x <= plot.gridCols - rack.gridW; x++) {
        const collision = state.racks.some(r =>
          r.id !== rackId && r.plotId === plotId &&
          x < r.gridX + r.gridW && x + rack.gridW > r.gridX &&
          y < r.gridY + r.gridH && y + rack.gridH > r.gridY
        );
        if (!collision) {
          get().addLog(`Auto-placed ${rack.label} at (${x},${y}) on ${plotId}`);
          set({
            racks: state.racks.map(r =>
              r.id === rackId ? { ...r, plotId, gridX: x, gridY: y } : r
            ),
            plots: state.plots.map(p =>
              p.id === plotId ? { ...p, rackIds: [...p.rackIds.filter(id => id !== rackId), rackId] } : p
            ),
          });
          return;
        }
      }
    }
    get().addNotification('No space available for rack', 'warning');
  },

  autoPlaceNode: (nodeId: string) => {
    const state = get();
    const node = state.inventoryNodes.find(n => n.id === nodeId);
    if (!node) return;

    for (const rack of state.racks) {
      if (rack.plotId === null) continue;
      for (const slot of rack.slots) {
        if (!slot.node) {
          const emptySlot = slot;
          get().addLog(`Auto-placed ${node.label} into ${rack.label} slot ${emptySlot.index + 1}`);
          get().addNotification(`Placed ${node.label} into ${rack.label}`, 'success');
          set({
            inventoryNodes: state.inventoryNodes.filter(n => n.id !== nodeId),
            racks: state.racks.map(r =>
              r.id === rack.id
                ? { ...r, slots: r.slots.map(s => s.index === emptySlot.index ? { ...s, node } : s) }
                : r
            ),
          });
          return;
        }
      }
    }
    get().addNotification('No empty slots available in any rack', 'warning');
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
      scaleLevel: 1,
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

  clearRack: (rackId: string) => {
    const state = get();
    const rack = state.racks.find(r => r.id === rackId);
    if (!rack) return;
    const nodes = rack.slots.filter(s => s.node !== null).map(s => s.node!);
    if (nodes.length === 0) return;
    get().addLog(`Cleared ${nodes.length} nodes from ${rack.label}`);
    get().addNotification(`Cleared ${rack.label} — ${nodes.length} nodes returned to inventory`, 'info');
    set({
      racks: state.racks.map(r =>
        r.id === rackId
          ? { ...r, slots: r.slots.map(s => s.node ? { ...s, node: null } : s) }
          : r
      ),
      inventoryNodes: [...state.inventoryNodes, ...nodes],
    });
  },

  clearAllNodes: () => {
    const state = get();
    const allNodes: ServerNode[] = [];
    const newRacks = state.racks.map(r => ({
      ...r,
      slots: r.slots.map(s => {
        if (s.node) allNodes.push(s.node);
        return { ...s, node: null };
      }),
    }));
    if (allNodes.length === 0) return;
    get().addLog(`Cleared all nodes (${allNodes.length}) from all racks`);
    get().addNotification(`Cleared all nodes — ${allNodes.length} returned to inventory`, 'info');
    set({ racks: newRacks, inventoryNodes: [...state.inventoryNodes, ...allNodes] });
  },

  unplaceAllRacksGlobal: () => {
    const state = get();
    const placedCount = state.racks.filter(r => r.plotId !== null).length;
    if (placedCount === 0) return;
    get().addLog(`Unplaced all racks from all plots`);
    set({
      racks: state.racks.map(r => r.plotId !== null ? { ...r, plotId: null, gridX: 0, gridY: 0 } : r),
      plots: state.plots.map(p => ({ ...p, rackIds: [] })),
    });
  },

  rentServer: (type: RentalType) => {
    const state = get();
    const defs: Record<RentalType, Omit<RentedServer, 'id'>> = {
      vps: { type: 'vps', label: 'VPS', capacityRps: 150, storage: 50, monthlyCost: 40, uptime: 0.99, load: 0 },
      dedicated: { type: 'dedicated', label: 'Dedicated', capacityRps: 600, storage: 200, monthlyCost: 180, uptime: 0.999, load: 0 },
      cloud: { type: 'cloud', label: 'Cloud Instance', capacityRps: 1000, storage: 500, monthlyCost: 300, uptime: 0.995, load: 0 },
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
    maximizedPanel: state.maximizedPanel === id ? null : state.maximizedPanel,
  })),

  setMaximizedPanel: (id) => set((state) => {
    const updates: Partial<GameState> = { maximizedPanel: id };
    if (id && state.maximizedPanel && state.maximizedPanel !== id) {
      updates.panelMinimized = { ...state.panelMinimized, [state.maximizedPanel]: true };
    }
    return updates;
  }),

  focusEmployee: (id) => set((state) => ({
    selectedEmployeeId: id,
    panelOpen: { ...state.panelOpen, employees: true },
    panelMinimized: { ...state.panelMinimized, employees: false },
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
      return { ...f, level: 1, trafficGenerated: featDef.baseTraffic, group: featDef.group };
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
            scaleLevel: 1,
          },
        };
      });
      return { ...r, slots: newSlots };
    });

    set({ racks: newRacks });
  },

  restartGame: () => {
    set({
      tick: 0, isPaused: false, speed: 1, cash: 15000, month: 0,
      employees: [], resources: [], features: [], racks: [], plots: [], rentedServers: [],
      totalSalary: 0, selectedProduct: null, devMode: false,
      inventoryNodes: [], activeView: { type: 'office' }, visitedPlots: [], gameLog: [],
      cashFlowHistory: [], notifications: [],
      isBankrupt: false, negativeCashMonths: 0, screen: 'menu',
      panelOpen: { employees: true, recruitment: false, features: false, server: false, finance: false },
      panelMinimized: { employees: false, recruitment: false, features: false, server: false, finance: false },
      maximizedPanel: null,
      selectedEmployeeId: null,
      darkMode: false,
      fundingRounds: [], pendingFunding: null,
      sourcingCampaign: null, applicants: [],
      selectedHrId: null,
      currentUsers: 0,
      events: [],
    });
  },
}));

export function getComponentsByRole(role: EmployeeRole) {
  return COMPONENTS.filter(c => c.producedBy === role);
}

export function getAvailableComponents(role: EmployeeRole, level: number) {
  return COMPONENTS.filter(c => c.producedBy === role && level >= c.minLevel);
}

export function getLockedComponents(role: EmployeeRole, level: number) {
  return COMPONENTS.filter(c => c.producedBy === role && level < c.minLevel);
}
