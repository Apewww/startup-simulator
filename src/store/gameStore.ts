import { create } from 'zustand';
import type { Employee, EmployeeRole, ComponentResource, PlatformFeature, ComponentRequirement, ServerRack, RackTier, NodeTypeId, ServerNode, Plot, RentedServer, RentalType, FundingRound, SourcingCampaign, Applicant, GameEvent, PlacedFurniture, FurnitureInventoryItem, InternetProviderId, InternetSubscription } from '../types';
import { calcFundingOffer, calcMaxSupervised } from '../types/employee';
import { getComponentDef, COMPONENTS } from '../data/components';
import { getProductDef } from '../data/products';
import { MILESTONES, type PerkContext } from '../data/milestones';
import { PERKS } from '../data/perks';
import { getNodeDef, getRackDef } from '../data/servers';
import { makeInternetSubscription } from '../data/internet';
import { calculateNodeLoads, calcMonthlyServerCost, recomputeRackAdjacency, getUpgradeCost } from '../systems/server';
import { getPlatformStats, getAppliedEffects, hasActiveSynergy } from '../systems/platform';
import { getSupervisionBoost } from '../systems/leadDeveloper';
import { computeFurnitureEffects } from '../systems/radiusEffect';
import { getFurnitureDef, FURNITURE } from '../data/furniture';
import { calculateRevenue, getMonetizationMods, getMoodTarget, MOOD_BASELINE, MOOD_DRIFT_RATE, MOOD_PENALTY_K } from '../systems/monetization';
import { generateApplicant, CAMPAIGN_COST, getCampaignTicks, negotiate, applicantToEmployee } from '../systems/recruitment';
import { checkEventTrigger, processEvents, calcSecurityLevel } from '../systems/events';
import { getComplianceStatus } from '../systems/compliance';

export type GameSpeed = 1 | 2 | 4;
export const TICKS_PER_MONTH = 600;
export const TICKS_PER_DAY = 20;

export type PanelId = 'employees' | 'features' | 'server' | 'finance' | 'recruitment' | 'perks';
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

export type MonetizationStrategy = 'none' | 'text_ads' | 'video_ads' | 'targeted_ads' | 'freemium' | 'subscription';

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
  internetSubscriptions: InternetSubscription[];
  totalSalary: number;
  selectedProduct: string | null;
  activeMonetization: MonetizationStrategy;
  userMood: number;
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
  cancelTask: (employeeId: string) => void;
  selectProduct: (productId: string) => void;
  setMonetizationStrategy: (strategy: MonetizationStrategy) => void;
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
  scaleRental: (rentalId: string, delta: number) => void;
  cancelRental: (id: string) => void;
  rentInternet: (providerId: InternetProviderId, tierId: string) => void;
  cancelInternet: (id: string) => void;
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
  toggleFeature: (featureId: string) => void;
  downgradeFeature: (featureId: string) => void;
  assignDeveloperToLead: (leadId: string, devId: string) => void;
  unassignDeveloperFromLead: (devId: string) => void;
  restartGame: () => void;
  currentUsers: number;
  events: GameEvent[];
  upgradeNode: (nodeId: string, delta: 1 | -1) => void;
  officeGridCols: number;
  officeGridRows: number;
  moveEmployee: (empId: string, x: number, y: number) => void;
  perkPoints: number;
  earnedMilestones: string[];
  unlockedPerks: string[];
  checkMilestones: () => void;
  unlockPerk: (perkId: string) => void;
  furnitureInventory: FurnitureInventoryItem[];
  furniture: PlacedFurniture[];
  placementFurnitureId: string | null;
  buyFurniture: (defId: string) => void;
  startFurniturePlacement: (invId: string) => void;
  cancelFurniturePlacement: () => void;
  placeFurniture: (x: number, y: number) => void;
  unplaceFurniture: (furnId: string) => void;
  moveFurniture: (furnId: string, x: number, y: number) => void;
  sellFurnitureItem: (id: string) => void;
  unlockAllPerks: () => void;
  devSpawnFurniture: () => void;
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

function newFurnitureId(): string {
  return `finv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

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
  internetSubscriptions: [],
  totalSalary: 0,
  selectedProduct: null,
  activeMonetization: 'none',
  userMood: 80,
  devMode: false,
  inventoryNodes: [],
  activeView: { type: 'office' },
  visitedPlots: [],
  gameLog: [],
  isBankrupt: false,
  negativeCashMonths: 0,
  screen: 'menu',
  panelOpen: { employees: true, recruitment: false, features: false, server: false, finance: false, perks: false },
  panelMinimized: { employees: false, recruitment: false, features: false, server: false, finance: false, perks: false },
  maximizedPanel: null,
  selectedEmployeeId: null,
  darkMode: (() => { try { return localStorage.getItem('ss-dark') === '1'; } catch { return false; } })(),
  notifications: [],
  cashFlowHistory: [],
  fundingRounds: [],
  pendingFunding: null,
  sourcingCampaign: null,
  applicants: [],
  selectedHrId: null,
  currentUsers: 0,
  events: [],
  officeGridCols: 8,
      officeGridRows: 8,
      perkPoints: 0,
      earnedMilestones: [],
      unlockedPerks: [],
      furnitureInventory: [],
      furniture: [],
      placementFurnitureId: null,

  setScreen: (screen) => set({ screen }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setSpeed: (speed) => set({ speed }),
  toggleDarkMode: () => set((state) => {
    const next = !state.darkMode;
    try { localStorage.setItem('ss-dark', next ? '1' : '0'); } catch {}
    return { darkMode: next };
  }),

  hireEmployee: (role: EmployeeRole) => {
    const state = get();
    const roleNames = EMPLOYEE_NAMES[role] || ['Unknown'];
    const roleCount = state.employees.filter(e => e.role === role).length;
    const name = roleNames[roleCount % roleNames.length];
    const id = `emp-${state.employees.length + 1}`;

    const occupied = new Set(state.employees.map(e => `${e.gridX},${e.gridY}`));
    for (const f of state.furniture) {
      if (f.defId !== 'ergonomic_chair') occupied.add(`${f.gridX},${f.gridY}`);
    }
    let gridX = 0, gridY = 0;
    for (let y = 0; y < state.officeGridRows; y++) {
      for (let x = 0; x < state.officeGridCols; x++) {
        if (!occupied.has(`${x},${y}`)) { gridX = x; gridY = y; y = state.officeGridRows; break; }
      }
    }
    const newEmp: Employee = {
      id, name, role, level: 1, salary: 500,
      happiness: 80, speed: 1, currentTask: null, taskProgress: 0,
      resignTicks: 0, gridX, gridY, isPlayer: false,
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
          ? emp.onVacation ? emp : { ...emp, currentTask: componentId, taskProgress: 0 }
          : emp
      ),
    }));
  },

  cancelTask: (employeeId: string) => {
    set((state) => ({
      employees: state.employees.map(emp =>
        emp.id === employeeId
          ? { ...emp, currentTask: null, taskProgress: 0 }
          : emp
      ),
    }));
  },

  incrementTick: () => {
    const state = get();
    const { tick, employees, resources, features, racks, events, currentUsers, selectedProduct, rentedServers } = state;
    const internetSubs = state.internetSubscriptions;
    const internetRpsBonus = internetSubs.reduce((s, x) => s + x.rpsBonus, 0);
    const internetMoodSum = internetSubs.reduce((s, x) => s + x.moodBonus, 0);
    const newTick = tick + 1;
    const newMonth = Math.floor(newTick / TICKS_PER_MONTH);
    const oldMonth = Math.floor(tick / TICKS_PER_MONTH);

    const newResources = resources.map(r => ({ ...r }));
    const resignedIds: string[] = [];
    const fx = computeFurnitureEffects(state.furniture, state.employees);
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
          newHappiness += 0.1 + (emp.vacationTotal ? (emp.vacationTotal / 20 - 1) * 0.03 : 0);
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
          newHappiness -= fx.coffee.has(emp.id) ? 0.025 : 0.05;
        } else if (fx.water.has(emp.id)) {
          newHappiness += 0.15;
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

        const overworkThreshold = fx.chair.has(emp.id) ? 80 : 50;
        if (newHappiness < 20 && isWorking) {
          newOverworkTicks += 1;
        } else {
          newOverworkTicks = 0;
        }
        if (newOverworkTicks >= overworkThreshold) {
          newSpeed = Math.floor(newSpeed * 0.7);
        }

        if (emp.supervisedBy) {
          const lead = employees.find(e => e.id === emp.supervisedBy);
          if (lead && lead.role === 'Lead_Developer') {
            newSpeed = newSpeed * (1 + getSupervisionBoost(lead, lead.supervising?.length ?? 1));
          }
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

    // Edge case: handle supervision cleanup for resigned employees
    for (const resignedId of resignedIds) {
      const resigned = employees.find(e => e.id === resignedId);
      if (!resigned) continue;
      if (resigned.supervisedBy) {
        // Developer resigned → remove from lead's supervising list
        const leadIdx = newEmployees.findIndex(e => e.id === resigned.supervisedBy);
        if (leadIdx !== -1 && newEmployees[leadIdx].supervising) {
          newEmployees[leadIdx] = {
            ...newEmployees[leadIdx],
            supervising: newEmployees[leadIdx].supervising!.filter(id => id !== resignedId),
          };
        }
      }
      if (resigned.role === 'Lead_Developer' && resigned.supervising) {
        // Lead resigned → unassign all developers under them
        for (const devId of resigned.supervising) {
          const devIdx = newEmployees.findIndex(e => e.id === devId);
          if (devIdx !== -1) {
            newEmployees[devIdx] = { ...newEmployees[devIdx], supervisedBy: undefined };
          }
        }
      }
    }

    const placedRacks = racks.filter(r => r.plotId !== null);
    const unplacedRacks = racks.filter(r => r.plotId === null);

    // Platform stats (cohesion, synergy, target users)
    const platformStats = getPlatformStats(features, events, selectedProduct);
    const targetUsers = platformStats.targetUsers;
    const cohesionScore = platformStats.cohesionScore;

    // Dynamic users
    const eventEffects = getAppliedEffects(events);
    const monetizationMods = getMonetizationMods(state.activeMonetization);
    const userDelta = (targetUsers - currentUsers) * 0.005 * cohesionScore * monetizationMods.growthMult;
    const hasCrash = placedRacks.some(r => r.slots.some(s => s.node?.status === 'crashed'));
    const crashPenalty = hasCrash ? currentUsers * 0.05 : 0;
    const baseChurnRate = (1 - cohesionScore) * 0.0002 + monetizationMods.churnDelta;
    let newCurrentUsers = currentUsers;

    // Server calculation with effectiveRPS — compliance load mult untuk compute/data shortage
    const complianceBefore = features.some(f => f.level > 0) ? getComplianceStatus(features, placedRacks, rentedServers, internetSubs) : null;
    const synergyActive = hasActiveSynergy(features, selectedProduct);
    const earlyDataRatio = complianceBefore?.data.ratio ?? 1;

    // User mood (satisfaction) — drifts toward strategy target; feeds churn (no separate system)
    const moodTarget = Math.min(100, getMoodTarget(state.activeMonetization, synergyActive, earlyDataRatio) + internetMoodSum * 100);
    const newMood = Math.max(0, Math.min(100, state.userMood + (moodTarget - state.userMood) * MOOD_DRIFT_RATE));
    const moodPenalty = Math.max(0, (MOOD_BASELINE - newMood) * MOOD_PENALTY_K);
    const churn = Math.max(0, currentUsers * (baseChurnRate + moodPenalty));
    newCurrentUsers = currentUsers + (userDelta * eventEffects.userGrowthMult) - crashPenalty - churn;
    newCurrentUsers = Math.max(0, newCurrentUsers);
    const computeLoadMult = complianceBefore ? Math.max(1, complianceBefore.compute.required / Math.max(complianceBefore.compute.provided, 0.1)) : 1;
    const dataLoadMult = complianceBefore ? Math.max(1, complianceBefore.data.required / Math.max(complianceBefore.data.provided, 0.1)) : 1;
    const adjustedRps = Math.round(platformStats.effectiveRps * computeLoadMult * dataLoadMult);

    const sysAdminLevel = employees
      .filter(e => e.role === 'SysAdmin' && e.happiness >= 15)
      .reduce((max, e) => Math.max(max, e.level), 0);
    const { racks: updatedPlacedRacks, rentedServers: updatedRentedServers } = calculateNodeLoads(placedRacks, adjustedRps, rentedServers, sysAdminLevel, eventEffects.crashChanceBonus, internetRpsBonus);

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
      ? getComplianceStatus(features, [...unplacedRacks, ...updatedPlacedRacks], updatedRentedServers, internetSubs)
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
    const dataRatio = compliance?.data.ratio ?? 1;
    const revOpts = { strategy: state.activeMonetization, productId: selectedProduct, dataRatio, synergyActive };
    if (newMonth > oldMonth) {
      newTotalSalary = calcTotalSalary(newEmployees);
      const serverCost = calcMonthlyServerCost(finalRacks, rentedServers, internetSubs);
      const revenue = calculateRevenue(newCurrentUsers, features, finalRacks, cohesionScore * (compliance?.revenueMult ?? 1), platformStats.synergyRevenueBonus, revOpts);
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
      const revenue = calculateRevenue(newCurrentUsers, features, finalRacks, cohesionScore * (compliance?.revenueMult ?? 1), platformStats.synergyRevenueBonus, revOpts);
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
      currentUsers: Math.round(newCurrentUsers),
      events: finalEvents,
      userMood: newMood,
    });

    get().checkMilestones();
  },

  addCash: (amount) => set((state) => ({ cash: state.cash + amount })),

  checkFundingEligibility: () => {
    const state = get();
    if (state.pendingFunding) return;
    const lastRound = state.fundingRounds[state.fundingRounds.length - 1];
    const monthsSinceLast = lastRound ? state.month - lastRound.month : state.month;
    if (monthsSinceLast < 6) return;

    const traffic = getPlatformStats(state.features, state.events, state.selectedProduct);
    const compliance = state.features.some(f => f.level > 0) ? getComplianceStatus(state.features, state.racks, state.rentedServers, state.internetSubscriptions) : null;
    const synergyActive = hasActiveSynergy(state.features, state.selectedProduct);
    const revOpts = {
      strategy: state.activeMonetization,
      productId: state.selectedProduct,
      dataRatio: compliance?.data.ratio ?? 1,
      synergyActive,
    };
    const revenue = calculateRevenue(state.currentUsers, state.features, state.racks, traffic.cohesionScore * (compliance?.revenueMult ?? 1), traffic.synergyRevenueBonus, revOpts);
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
    const hrEmp = state.selectedHrId ? state.employees.find(e => e.id === state.selectedHrId) : undefined;
    if (!hrEmp || hrEmp.role !== 'HR') {
      get().addNotification('Assign an HR lead first (Team panel → HR role)', 'warning');
      return;
    }
    const cost = CAMPAIGN_COST[tier];
    if (state.cash < cost) return;
    const hrLevel = hrEmp.level;
    const hrSpeed = hrEmp.speed;
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
      const occupied = new Set(state.employees.map(e => `${e.gridX},${e.gridY}`));
      for (const f of state.furniture) {
        if (f.defId !== 'ergonomic_chair') occupied.add(`${f.gridX},${f.gridY}`);
      }
      let gridX = 0, gridY = 0;
      for (let y = 0; y < state.officeGridRows; y++) {
        for (let x = 0; x < state.officeGridCols; x++) {
          if (!occupied.has(`${x},${y}`)) { gridX = x; gridY = y; y = state.officeGridRows; break; }
        }
      }
      const emp = applicantToEmployee(updated, gridX, gridY);
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
      requiredComponents: f.requiredComponents, trafficGenerated: 0, enabled: true,
    }));
    set({ selectedProduct: productId, features, screen: 'playerSetup', currentUsers: 0, userMood: 80, internetSubscriptions: [] });
  },

  setMonetizationStrategy: (strategy) => {
    set({ activeMonetization: strategy });
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
      gridX: 0,
      gridY: 0,
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
    if (id === null) { set({ selectedHrId: null }); return; }
    const emp = get().employees.find(e => e.id === id);
    if (emp && emp.onVacation) {
      get().addNotification(`${emp.name} is on vacation — cannot assign as HR lead`, 'warning');
      return;
    }
    set({ selectedHrId: id });
  },

  setPlayerRole: (id, role) => {
    const state = get();
    const emp = state.employees.find(e => e.id === id);
    if (!emp || !emp.isPlayer) return;
    if (emp.currentTask || emp.isTraining) {
      get().addNotification('Cannot change role while working — finish current task first', 'warning');
      return;
    }
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
          ? { ...emp, onVacation: true, vacationTicksLeft: days * 20, vacationTotal: days * 20, currentTask: null, taskProgress: 0 }
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
        ? { ...f, level: 1, trafficGenerated: featDef.baseTraffic, group: featDef.group, enabled: true }
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

  upgradeNode: (nodeId: string, delta: 1 | -1) => {
    const state = get();
    if (!state.unlockedPerks.includes('hardware_overclock')) {
      get().addNotification('Unlock the Hardware Overclocking perk first', 'warning');
      return;
    }

    let target: ServerNode | undefined;
    for (const r of state.racks) {
      for (const s of r.slots) {
        if (s.node?.id === nodeId) { target = s.node; break; }
      }
      if (target) break;
    }
    if (!target) target = state.inventoryNodes.find(n => n.id === nodeId);
    if (!target) return;

    if (delta > 0) {
      if (target.scaleLevel >= 5) return;
      const cost = getUpgradeCost(target);
      if (cost === null) return;
      if (state.cash < cost) {
        get().addNotification('Not enough cash to upgrade', 'warning');
        return;
      }
      const newLevel = target.scaleLevel + 1;
      get().addLog(`Upgraded ${target.label} to Lv.${newLevel} ($${cost})`);
      get().addNotification(`Upgraded ${target.label} to Lv.${newLevel} — $${cost}`, 'success');
      set({
        cash: state.cash - cost,
        racks: state.racks.map(r => ({
          ...r,
          slots: r.slots.map(s => s.node?.id === nodeId ? { ...s, node: { ...s.node, scaleLevel: newLevel } } : s),
        })),
        inventoryNodes: state.inventoryNodes.map(n => n.id === nodeId ? { ...n, scaleLevel: newLevel } : n),
      });
    } else {
      if (target.scaleLevel <= 1) return;
      const newLevel = target.scaleLevel - 1;
      get().addNotification(`Downgraded ${target.label} to Lv.${newLevel} (no refund)`, 'info');
      set({
        racks: state.racks.map(r => ({
          ...r,
          slots: r.slots.map(s => s.node?.id === nodeId ? { ...s, node: { ...s.node, scaleLevel: newLevel } } : s),
        })),
        inventoryNodes: state.inventoryNodes.map(n => n.id === nodeId ? { ...n, scaleLevel: newLevel } : n),
      });
    }
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
      heatRatio: 0,
      adjacentRackIds: [],
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
      racks: recomputeRackAdjacency(state.racks.map(r =>
        r.id === rackId ? { ...r, plotId, gridX: x, gridY: y } : r
      )),
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
      racks: recomputeRackAdjacency(state.racks.map(r =>
        r.id === rackId ? { ...r, gridX: x, gridY: y } : r
      )),
    });
  },

  unplaceRack: (rackId: string) => {
    const state = get();
    const rack = state.racks.find(r => r.id === rackId);
    if (!rack) return;
    const plotId = rack.plotId;
    get().addLog(`Removed ${rack.label} from grid`);
    set({
      racks: recomputeRackAdjacency(state.racks.map(r =>
        r.id === rackId ? { ...r, plotId: null, gridX: 0, gridY: 0 } : r
      )),
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
      racks: recomputeRackAdjacency(state.racks.map(r =>
        r.plotId === plotId ? { ...r, plotId: null, gridX: 0, gridY: 0 } : r
      )),
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
            racks: recomputeRackAdjacency(state.racks.map(r =>
              r.id === rackId ? { ...r, plotId, gridX: x, gridY: y } : r
            )),
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
    const baseDefs: Record<RentalType, { label: string; capacityRps: number; storage: number; monthlyCost: number; uptime: number; compute: number; data: number; network: number; dbCapacity: number }> = {
      vps: { label: 'VPS', capacityRps: 150, storage: 50, monthlyCost: 40, uptime: 0.99, compute: 1, data: 0.5, network: 0.3, dbCapacity: 0 },
      dedicated: { label: 'Dedicated', capacityRps: 600, storage: 200, monthlyCost: 180, uptime: 0.999, compute: 3, data: 2, network: 1, dbCapacity: 0 },
      cloud: { label: 'Cloud Instance', capacityRps: 1000, storage: 500, monthlyCost: 300, uptime: 0.995, compute: 5, data: 3, network: 3, dbCapacity: 0 },
      db: { label: 'DB Cluster', capacityRps: 0, storage: 200, monthlyCost: 200, uptime: 0.999, compute: 0, data: 4, network: 0, dbCapacity: 800 },
    };
    const def = baseDefs[type];
    get().addNotification(`Rented ${def.label} — $${def.monthlyCost}/mo`, 'info');
    set({ rentedServers: [...state.rentedServers, { id: `rent-${state.rentedServers.length + 1}`, type, ...def, load: 0, scaleLevel: 1 }] });
  },

  scaleRental: (rentalId: string, delta: number) => {
    const state = get();
    const idx = state.rentedServers.findIndex(r => r.id === rentalId);
    if (idx === -1) return;
    const r = state.rentedServers[idx];
    const newLevel = Math.max(1, Math.min(5, r.scaleLevel + delta));
    if (newLevel === r.scaleLevel) return;
    const baseDefs: Record<string, { capacityRps: number; monthlyCost: number; compute: number; data: number; network: number; dbCapacity: number }> = {
      vps: { capacityRps: 150, monthlyCost: 40, compute: 1, data: 0.5, network: 0.3, dbCapacity: 0 },
      dedicated: { capacityRps: 600, monthlyCost: 180, compute: 3, data: 2, network: 1, dbCapacity: 0 },
      cloud: { capacityRps: 1000, monthlyCost: 300, compute: 5, data: 3, network: 3, dbCapacity: 0 },
      db: { capacityRps: 0, monthlyCost: 200, compute: 0, data: 4, network: 0, dbCapacity: 800 },
    };
    const base = baseDefs[r.type];
    if (!base) return;
    const mult = [1, 1.3, 1.6, 2, 2.5][newLevel - 1];
    const costMult = [1, 1.3, 1.7, 2.2, 3][newLevel - 1];
    const updated = {
      ...r,
      scaleLevel: newLevel,
      capacityRps: Math.round(base.capacityRps * mult),
      monthlyCost: Math.round(base.monthlyCost * costMult),
      compute: Math.round(base.compute * mult * 10) / 10,
      data: Math.round(base.data * mult * 10) / 10,
      network: Math.round(base.network * mult * 10) / 10,
      dbCapacity: Math.round(base.dbCapacity * mult),
    };
    get().addLog(`Scaled ${r.label} to Lv.${newLevel} (${updated.capacityRps} RPS, $${updated.monthlyCost}/mo)`);
    get().addNotification(`Scaled ${r.label} to Lv.${newLevel}`, 'info');
    set({
      rentedServers: state.rentedServers.map((s, i) => i === idx ? updated : s),
    });
  },

  cancelRental: (id: string) => {
    set((state) => ({ rentedServers: state.rentedServers.filter(r => r.id !== id) }));
  },

  rentInternet: (providerId, tierId) => {
    const sub = makeInternetSubscription(providerId, tierId);
    if (!sub) return;
    const activeFromProvider = get().internetSubscriptions.some(s => s.providerId === providerId);
    if (activeFromProvider) {
      get().addNotification(`${sub.providerName} already active — cancel first to switch tier`, 'warning');
      return;
    }
    get().addLog(`Subscribed ${sub.providerName} ${sub.speedMbps} Mbps ($${sub.monthlyCost}/mo)`);
    get().addNotification(`Internet ${sub.providerName} ${sub.speedMbps} Mbps — $${sub.monthlyCost}/mo`, 'info');
    set((state) => ({ internetSubscriptions: [...state.internetSubscriptions, sub] }));
  },

  cancelInternet: (id) => {
    set((state) => ({ internetSubscriptions: state.internetSubscriptions.filter(s => s.id !== id) }));
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
      return { ...f, level: 1, trafficGenerated: featDef.baseTraffic, group: featDef.group, enabled: true };
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

  assignDeveloperToLead: (leadId: string, devId: string) => {
    const state = get();
    const lead = state.employees.find(e => e.id === leadId);
    const dev = state.employees.find(e => e.id === devId);
    if (!lead || !dev) return;
    if (lead.role !== 'Lead_Developer' || dev.role !== 'Developer') return;
    if (dev.supervisedBy) return;
    if (devId === leadId) return;

    const maxSupervised = calcMaxSupervised(lead.level);
    const currentSupervising = lead.supervising?.length ?? 0;
    if (currentSupervising >= maxSupervised) return;

    set({
      employees: state.employees.map(emp => {
        if (emp.id === leadId) {
          return { ...emp, supervising: [...(emp.supervising ?? []), devId] };
        }
        if (emp.id === devId) {
          return { ...emp, supervisedBy: leadId };
        }
        return emp;
      }),
    });
    get().addNotification(`${dev.name} assigned under ${lead.name}`, 'info');
  },

  toggleFeature: (featureId: string) => {
    set((state) => ({
      features: state.features.map(f =>
        f.id === featureId && f.level > 0 ? { ...f, enabled: !f.enabled } : f
      ),
    }));
    const state = get();
    const feat = state.features.find(f => f.id === featureId);
    if (feat) {
      get().addNotification(`${feat.enabled ? 'Disabled' : 'Enabled'} ${feat.name}`, feat.enabled ? 'warning' : 'info');
    }
  },

  downgradeFeature: (featureId: string) => {
    const state = get();
    const feature = state.features.find(f => f.id === featureId);
    if (!feature || feature.level < 2) return;

    const newResources = state.resources.map(r => {
      const req = feature.requiredComponents.find(req => req.componentId === r.id);
      return req ? { ...r, quantity: r.quantity + req.amount * (feature.level - 1) } : r;
    });
    const newFeatures = state.features.map(f =>
      f.id === featureId
        ? { ...f, level: feature.level - 1, trafficGenerated: Math.round(f.trafficGenerated * (feature.level - 1) / feature.level) }
        : f
    );

    get().addNotification(`Downgraded ${feature.name} to Lv.${feature.level - 1}`, 'info');
    set({ resources: newResources, features: newFeatures });
  },

  unassignDeveloperFromLead: (devId: string) => {
    const state = get();
    const dev = state.employees.find(e => e.id === devId);
    if (!dev || !dev.supervisedBy) return;

    const leadId = dev.supervisedBy;
    set({
      employees: state.employees.map(emp => {
        if (emp.id === devId) {
          return { ...emp, supervisedBy: undefined };
        }
        if (emp.id === leadId && emp.supervising) {
          return { ...emp, supervising: emp.supervising.filter(id => id !== devId) };
        }
        return emp;
      }),
    });
    get().addNotification(`${dev.name} unassigned from lead`, 'info');
  },

  moveEmployee: (empId: string, x: number, y: number) => {
    const state = get();
    if (x < 0 || x >= state.officeGridCols || y < 0 || y >= state.officeGridRows) return;
    const collision = state.employees.some(e => e.id !== empId && e.gridX === x && e.gridY === y);
    if (collision) return;
    const furnitureCollision = state.furniture.some(f => f.defId !== 'ergonomic_chair' && f.gridX === x && f.gridY === y);
    if (furnitureCollision) return;
    set({
      employees: state.employees.map(e => e.id === empId ? { ...e, gridX: x, gridY: y } : e),
    });
  },

  checkMilestones: () => {
    const state = get();
    const ctx: PerkContext = {
      employees: state.employees,
      cash: state.cash,
      currentUsers: state.currentUsers,
      features: state.features,
      racks: state.racks,
      month: state.month,
    };

    const earned = [...state.earnedMilestones];
    const notifications: string[] = [];
    let points = 0;

    for (const m of MILESTONES) {
      if (m.repeatable) {
        const count = m.repeatCount ? m.repeatCount(ctx) : 0;
        const already = earned.filter(id => id.startsWith(`${m.id}_`)).length;
        const toAward = Math.max(0, count - already);
        for (let i = 0; i < toAward; i++) {
          earned.push(`${m.id}_${already + i + 1}`);
          points++;
          notifications.push(`Milestone Clear: "${m.name}" — +1 Perk Point!`);
        }
      } else if (!earned.includes(m.id) && m.check(ctx)) {
        earned.push(m.id);
        points++;
        notifications.push(`Milestone Clear: "${m.name}" — +1 Perk Point!`);
      }
    }

    if (points === 0) return;
    set({ perkPoints: state.perkPoints + points, earnedMilestones: earned });
    for (const msg of notifications) get().addNotification(msg, 'success');
  },

  unlockPerk: (perkId: string) => {
    const state = get();
    const perk = PERKS.find(p => p.id === perkId);
    if (!perk) return;
    if (state.unlockedPerks.includes(perkId)) return;
    if (state.perkPoints < perk.cost) {
      get().addNotification(`Not enough Perk Points for ${perk.name}`, 'warning');
      return;
    }
    set({
      perkPoints: state.perkPoints - perk.cost,
      unlockedPerks: [...state.unlockedPerks, perkId],
    });
    get().addNotification(`Perk Unlocked: ${perk.name}!`, 'success');
  },

  unlockAllPerks: () => {
    set({ unlockedPerks: PERKS.map(p => p.id) });
    get().addNotification('DEV: All perks unlocked', 'info');
  },

  devSpawnFurniture: () => {
    const state = get();
    const spawned = FURNITURE.map(def => ({ id: newFurnitureId(), defId: def.id }));
    set({ furnitureInventory: [...state.furnitureInventory, ...spawned] });
    get().addNotification(`DEV: Spawned ${spawned.length} furniture`, 'info');
  },

  buyFurniture: (defId: string) => {
    const state = get();
    const def = getFurnitureDef(defId);
    if (!def) return;
    if (!state.unlockedPerks.includes(def.unlockPerk)) {
      get().addNotification(`Unlock the ${def.name} perk first`, 'warning');
      return;
    }
    if (state.cash < def.price) {
      get().addNotification(`Not enough cash for ${def.name}`, 'warning');
      return;
    }
    const id = newFurnitureId();
    set({
      cash: state.cash - def.price,
      furnitureInventory: [...state.furnitureInventory, { id, defId }],
    });
    get().addNotification(`Bought ${def.name}`, 'success');
  },

  startFurniturePlacement: (invId: string) => {
    const state = get();
    const item = state.furnitureInventory.find(i => i.id === invId);
    if (!item) return;
    const def = getFurnitureDef(item.defId);
    if (!def) return;
    if (def.placement === 'desk' && state.employees.length === 0) {
      get().addNotification('Hire an employee first to place a chair', 'warning');
      return;
    }
    set({ placementFurnitureId: invId });
  },

  cancelFurniturePlacement: () => set({ placementFurnitureId: null }),

  placeFurniture: (x: number, y: number) => {
    const state = get();
    const invId = state.placementFurnitureId;
    if (!invId) return;
    const item = state.furnitureInventory.find(i => i.id === invId);
    if (!item) return;
    const def = getFurnitureDef(item.defId);
    if (!def) return;
    if (x < 0 || x >= state.officeGridCols || y < 0 || y >= state.officeGridRows) return;

    if (def.placement === 'tile') {
      const empHere = state.employees.some(e => e.gridX === x && e.gridY === y);
      const furnHere = state.furniture.some(f => f.gridX === x && f.gridY === y);
      if (empHere || furnHere) {
        get().addNotification('That tile is occupied', 'warning');
        return;
      }
    } else {
      const empHere = state.employees.find(e => e.gridX === x && e.gridY === y);
      if (!empHere) {
        get().addNotification('Place the chair on an employee desk', 'warning');
        return;
      }
      const chairHere = state.furniture.some(f => f.defId === 'ergonomic_chair' && f.gridX === x && f.gridY === y);
      if (chairHere) {
        get().addNotification('That desk already has a chair', 'warning');
        return;
      }
    }

    set({
      furnitureInventory: state.furnitureInventory.filter(i => i.id !== invId),
      furniture: [...state.furniture, { id: invId, defId: item.defId, gridX: x, gridY: y }],
      placementFurnitureId: null,
    });
    get().addNotification(`Placed ${def.name}`, 'success');
  },

  unplaceFurniture: (furnId: string) => {
    const state = get();
    const furn = state.furniture.find(f => f.id === furnId);
    if (!furn) return;
    const def = getFurnitureDef(furn.defId);
    set({
      furniture: state.furniture.filter(f => f.id !== furnId),
      furnitureInventory: [...state.furnitureInventory, { id: furn.id, defId: furn.defId }],
    });
    get().addNotification(`Picked up ${def?.name ?? 'furniture'}`, 'info');
  },

  sellFurnitureItem: (id: string) => {
    const state = get();
    const invItem = state.furnitureInventory.find(i => i.id === id);
    const placed = state.furniture.find(f => f.id === id);
    const target = invItem ?? placed;
    if (!target) return;
    const def = getFurnitureDef(target.defId);
    if (!def) return;
    const refund = Math.floor(def.price * 0.5);
    get().addNotification(`Sold ${def.name} — refund $${refund}`, 'warning');
    set({
      cash: state.cash + refund,
      furnitureInventory: state.furnitureInventory.filter(i => i.id !== id),
      furniture: state.furniture.filter(f => f.id !== id),
    });
  },

  moveFurniture: (furnId: string, x: number, y: number) => {
    const state = get();
    const furn = state.furniture.find(f => f.id === furnId);
    if (!furn) return;
    const def = getFurnitureDef(furn.defId);
    if (!def) return;
    if (x < 0 || x >= state.officeGridCols || y < 0 || y >= state.officeGridRows) return;

    if (def.placement === 'tile') {
      const empHere = state.employees.some(e => e.gridX === x && e.gridY === y);
      const furnHere = state.furniture.some(f => f.id !== furnId && f.gridX === x && f.gridY === y);
      if (empHere || furnHere) {
        get().addNotification('That tile is occupied', 'warning');
        return;
      }
    } else {
      const empHere = state.employees.find(e => e.gridX === x && e.gridY === y);
      if (!empHere) {
        get().addNotification('Place the chair on an employee desk', 'warning');
        return;
      }
      const chairHere = state.furniture.some(f => f.id !== furnId && f.defId === 'ergonomic_chair' && f.gridX === x && f.gridY === y);
      if (chairHere) {
        get().addNotification('That desk already has a chair', 'warning');
        return;
      }
    }

    set({
      furniture: state.furniture.map(f => f.id === furnId ? { ...f, gridX: x, gridY: y } : f),
    });
  },

  restartGame: () => {
    set({
      tick: 0, isPaused: false, speed: 1, cash: 15000, month: 0,
      employees: [], resources: [], features: [], racks: [], plots: [], rentedServers: [],
      totalSalary: 0, selectedProduct: null, activeMonetization: 'none', userMood: 80, internetSubscriptions: [], devMode: false,
      inventoryNodes: [], activeView: { type: 'office' }, visitedPlots: [], gameLog: [],
      cashFlowHistory: [], notifications: [],
      isBankrupt: false, negativeCashMonths: 0, screen: 'menu',
      panelOpen: { employees: true, recruitment: false, features: false, server: false, finance: false, perks: false },
      panelMinimized: { employees: false, recruitment: false, features: false, server: false, finance: false, perks: false },
      maximizedPanel: null,
      selectedEmployeeId: null,
  darkMode: (() => { try { return localStorage.getItem('ss-dark') === '1'; } catch { return false; } })(),
      fundingRounds: [], pendingFunding: null,
      sourcingCampaign: null, applicants: [],
      selectedHrId: null,
      currentUsers: 0,
      events: [],
      officeGridCols: 8,
      officeGridRows: 8,
      perkPoints: 0,
      earnedMilestones: [],
      unlockedPerks: [],
      furnitureInventory: [],
      furniture: [],
      placementFurnitureId: null,
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
