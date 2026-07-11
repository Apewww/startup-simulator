import type { ServerRack, RentedServer, ServerNode } from '../types';
import { getNodeDef } from '../data/servers';

const SCALE_CAPS = [1, 1.5, 2, 2.5, 3];
const SCALE_HEAT = [1, 2, 3.5, 5.5, 8];
const SCALE_POWER = [1, 1.5, 2, 3, 4.5];
const SCALE_COST = [1, 1.2, 1.5, 2, 3];

export interface ServerStats {
  totalWebCapacity: number;
  totalCacheOffload: number;
  totalDbCapacity: number;
  totalCoolingProvided: number;
  totalPowerDraw: number;
  totalMonthlyCost: number;
  activeWebCount: number;
  rentedCapacity: number;
}

export interface NodeLoadResult {
  racks: ServerRack[];
  rentedServers: RentedServer[];
}

function getScaleMultipliers(scaleLevel: number): { cap: number; heat: number; power: number; cost: number } {
  const idx = Math.min(Math.max(scaleLevel - 1, 0), 4);
  return { cap: SCALE_CAPS[idx], heat: SCALE_HEAT[idx], power: SCALE_POWER[idx], cost: SCALE_COST[idx] };
}

export function applyNodeScaling(node: ServerNode): {
  effectiveCapacity: number;
  effectiveHeat: number;
  effectivePower: number;
  effectiveMonthlyCost: number;
} {
  const def = getNodeDef(node.typeId);
  if (!def) return { effectiveCapacity: 0, effectiveHeat: 0, effectivePower: 0, effectiveMonthlyCost: 0 };
  const s = getScaleMultipliers(node.scaleLevel);
  return {
    effectiveCapacity: Math.round(def.capacity * s.cap),
    effectiveHeat: Math.round(def.heat * s.heat),
    effectivePower: Math.round(def.power * s.power),
    effectiveMonthlyCost: Math.round(def.monthlyCost * s.cost),
  };
}

export function calcServerStats(racks: ServerRack[], rentedServers: RentedServer[] = []): ServerStats {
  let totalWebCapacity = 0;
  let totalCacheOffload = 0;
  let totalDbCapacity = 0;
  let totalCoolingProvided = 0;
  let totalPowerDraw = 0;
  let totalMonthlyCost = 0;
  let activeWebCount = 0;
  let rentedCapacity = 0;

  for (const r of rentedServers) {
    rentedCapacity += r.capacityRps;
    totalMonthlyCost += r.monthlyCost;
  }

  for (const rack of racks) {
    totalMonthlyCost += rack.monthlyCost;
    for (const slot of rack.slots) {
      const node = slot.node;
      if (!node || node.status === 'offline' || node.status === 'crashed') continue;

      const scaled = applyNodeScaling(node);

      if (node.category === 'cooling') {
        totalCoolingProvided += node.capacity;
      }

      if (node.category !== 'security' && node.category !== 'router') {
        totalMonthlyCost += scaled.effectiveMonthlyCost;
        totalPowerDraw += scaled.effectivePower;
      } else {
        totalMonthlyCost += node.monthlyCost;
        totalPowerDraw += node.power;
      }

      if (node.category === 'web_server') {
        if (node.status === 'active' || node.status === 'overloaded') {
          totalWebCapacity += scaled.effectiveCapacity;
          activeWebCount++;
        }
      } else if (node.category === 'caching') {
        if (node.status === 'active') {
          totalCacheOffload += scaled.effectiveCapacity;
        }
      } else if (node.category === 'database') {
        if (node.status === 'active') {
          totalDbCapacity += scaled.effectiveCapacity;
        }
      }
    }

    const rackCoolingFromNodes = rack.slots
      .filter(s => s.node?.category === 'cooling' && s.node?.status !== 'crashed')
      .reduce((sum, s) => sum + s.node!.capacity, 0);
    rack.coolingCapacity = getRackBaseCooling(rack.tier) + rackCoolingFromNodes;
  }

  return { totalWebCapacity, totalCacheOffload, totalDbCapacity, totalCoolingProvided, totalPowerDraw, totalMonthlyCost, activeWebCount, rentedCapacity };
}

function getRackBaseCooling(tier: string): number {
  switch (tier) {
    case 'basic': return 40;
    case 'advanced': return 80;
    case 'enterprise': return 150;
    default: return 40;
  }
}

export function calculateNodeLoads(racks: ServerRack[], incomingRPS: number, rentedServers: RentedServer[] = [], sysAdminLevel: number = 0, crashChanceBonus: number = 0): NodeLoadResult {
  const stats = calcServerStats(racks, rentedServers);
  const rpsAfterCache = Math.max(0, incomingRPS - stats.totalCacheOffload);
  const totalWeb = stats.totalWebCapacity + stats.rentedCapacity;
  const ownedRPS = totalWeb > 0 ? rpsAfterCache * (stats.totalWebCapacity / totalWeb) : rpsAfterCache;
  const rentedRPS = totalWeb > 0 ? rpsAfterCache * (stats.rentedCapacity / totalWeb) : 0;

  const updatedRented = rentedServers.map(r => {
    if (r.capacityRps <= 0) return { ...r, load: 0 };
    const load = Math.round((rentedRPS / r.capacityRps) * 100);
    return { ...r, load: Math.max(0, Math.min(200, load)) };
  });

  const updatedRacks: ServerRack[] = racks.map(rack => {
    let rackHeat = 0;
    let rackCooling = rack.coolingCapacity;

    const newSlots = rack.slots.map(slot => {
      const node = slot.node;
      if (!node) return slot;

      let newLoad = node.load;
      let newStatus = node.status as typeof node.status;
      let newCrashTicks = node.crashTicks;
      let newRecoveryTicks = node.recoveryTicks;

      const scaled = applyNodeScaling(node);

      if (node.status === 'crashed') {
        const recoveryThreshold = Math.max(3, 10 - sysAdminLevel * 2);
        newRecoveryTicks += 1;
        if (newRecoveryTicks >= recoveryThreshold) {
          newStatus = 'active';
          newLoad = 0;
          newRecoveryTicks = 0;
        }
        return { ...slot, node: { ...node, load: newLoad, status: newStatus, crashTicks: newCrashTicks, recoveryTicks: newRecoveryTicks } };
      }

      if (node.status === 'offline') {
        return { ...slot, node: { ...node, load: 0 } };
      }

      if (node.category === 'router') {
        rackCooling += 5;
      }

      if (node.category === 'web_server') {
        const activeCount = Math.max(1, racks.reduce((c, r) =>
          c + r.slots.filter(s =>
            s.node?.category === 'web_server' &&
            (s.node?.status === 'active' || s.node?.status === 'overloaded')
          ).length, 0));

        const rpsPerServer = activeCount > 0 ? ownedRPS / activeCount : 0;
        newLoad = node.capacity > 0 ? (rpsPerServer / node.capacity) * 100 : 0;

        if (newLoad >= 100) {
          newStatus = 'overloaded';
          newCrashTicks += 1;
        } else if (newLoad >= 80) {
          newStatus = 'overloaded';
          newCrashTicks = 0;
        } else {
          newStatus = 'active';
          newCrashTicks = 0;
        }

        if (newCrashTicks >= 10) {
          newStatus = 'crashed';
          newCrashTicks = 0;
        }
      }

      if (node.category === 'database') {
        const dbRPS = rpsAfterCache * 0.3;
        newLoad = node.capacity > 0 ? (dbRPS / node.capacity) * 100 : 0;
        if (newLoad >= 100) {
          newCrashTicks += 1;
          if (newCrashTicks >= 10) {
            newStatus = 'crashed';
            newCrashTicks = 0;
          }
        } else {
          newCrashTicks = 0;
        }
      }

      if (node.category === 'caching' || node.category === 'storage' || node.category === 'cooling' || node.category === 'security') {
        newLoad = (node.status === 'active') ? 50 : 0;
      }

      rackHeat += scaled.effectiveHeat;

      return { ...slot, node: { ...node, load: Math.round(newLoad), status: newStatus, crashTicks: newCrashTicks, recoveryTicks: newRecoveryTicks } };
    });

    const isOverheating = rackHeat > rackCooling;
    const newOverheatTicks = isOverheating ? rack.overheatTicks + 1 : 0;

    const crashChance = Math.max(0.01, Math.min(0.4, 0.05 - sysAdminLevel * 0.008 + crashChanceBonus));
    if (isOverheating && newOverheatTicks >= 5) {
      newSlots.forEach(slot => {
        if (slot.node && slot.node.status !== 'crashed' && slot.node.status !== 'offline' && slot.node.heat > 0) {
          if (Math.random() < crashChance) {
            slot.node.status = 'crashed';
            slot.node.load = 0;
            slot.node.crashTicks = 0;
          } else {
            slot.node.status = 'overheating';
          }
        }
      });
    }

    return {
      ...rack,
      slots: newSlots,
      coolingUsed: rackHeat,
      coolingCapacity: rackCooling,
      powerDraw: newSlots.reduce((sum, s) => sum + (s.node ? applyNodeScaling(s.node).effectivePower : 0), 0),
      isOverheating,
      overheatTicks: newOverheatTicks,
    };
  });

  return { racks: updatedRacks, rentedServers: updatedRented };
}

export function calcMonthlyServerCost(racks: ServerRack[], rentedServers: RentedServer[] = []): number {
  let total = 0;
  for (const rack of racks) {
    total += rack.monthlyCost;
    for (const slot of rack.slots) {
      if (!slot.node) continue;
      const scaled = applyNodeScaling(slot.node);
      if (slot.node.category !== 'security' && slot.node.category !== 'router') {
        total += scaled.effectiveMonthlyCost;
        total += scaled.effectivePower * 2;
      } else {
        total += slot.node.monthlyCost;
        total += slot.node.power * 2;
      }
    }
  }
  for (const r of rentedServers) {
    total += r.monthlyCost;
  }
  return total;
}
