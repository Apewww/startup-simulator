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

  // Water-fill: collect all web servers (owned + rented), distribute RPS sequentially
  type WebEntry = { capacity: number } & (
    { type: 'owned'; rackId: string; slotIndex: number } |
    { type: 'rented'; idx: number }
  );

  const webEntries: WebEntry[] = [];

  // Owned web servers (active only)
  for (const rack of racks) {
    for (const slot of rack.slots) {
      const node = slot.node;
      if (!node || node.category !== 'web_server') continue;
      if (node.status === 'crashed' || node.status === 'offline') continue;
      const scaled = applyNodeScaling(node);
      webEntries.push({ capacity: scaled.effectiveCapacity, type: 'owned', rackId: rack.id, slotIndex: slot.index });
    }
  }

  // Rented servers (all have web capacity)
  for (let i = 0; i < rentedServers.length; i++) {
    webEntries.push({ capacity: rentedServers[i].capacityRps, type: 'rented', idx: i });
  }

  // Water-fill: fill first server to 100%, spill to next, etc.
  const ownedLoadMap = new Map<string, number>();
  let remaining = rpsAfterCache;
  for (const entry of webEntries) {
    const take = Math.min(remaining, entry.capacity);
    const pct = entry.capacity > 0 ? (take / entry.capacity) * 100 : 0;
    remaining -= take;
    if (entry.type === 'owned') {
      ownedLoadMap.set(`${entry.rackId}:${entry.slotIndex}`, pct);
    }
  }

  // Rented server loads (water-filled)
  const updatedRented = rentedServers.map((r, i) => {
    if (r.capacityRps <= 0) return { ...r, load: 0 };
    let allocRps = 0;
    let tempRemaining = rpsAfterCache;
    for (const e of webEntries) {
      const take = Math.min(tempRemaining, e.capacity);
      if (e.type === 'rented' && e.idx === i) { allocRps = take; break; }
      tempRemaining -= take;
    }
    const load = r.capacityRps > 0 ? (allocRps / r.capacityRps) * 100 : 0;
    return { ...r, load: Math.max(0, Math.min(200, Math.round(load))) };
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
        const waterLoad = ownedLoadMap.get(`${rack.id}:${slot.index}`);
        newLoad = waterLoad !== undefined ? Math.round(waterLoad) : 0;

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
