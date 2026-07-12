import type { ServerRack, RentedServer, ServerNode, InternetSubscription } from '../types';
import { getNodeDef } from '../data/servers';
import { hasLoadBalancer } from './events';

const SCALE_CAPS = [1, 1.5, 2, 2.5, 3];
const SCALE_HEAT = [1, 2.8, 5.2, 8, 11.2];
const SCALE_POWER = [1, 1.5, 2, 3, 4.5];
const SCALE_COST = [1, 1.2, 1.5, 2, 3];

// Cash cost to upgrade a node from its current scaleLevel to the next (index = current level - 1).
// Cost = node base price × factor. Returns null when already at max level (5).
const UPGRADE_COST_FACTOR = [0.5, 0.9, 1.5, 2.5];

export function getUpgradeCost(node: ServerNode): number | null {
  if (node.scaleLevel >= 5) return null;
  const def = getNodeDef(node.typeId);
  if (!def) return null;
  return Math.round(def.price * UPGRADE_COST_FACTOR[node.scaleLevel - 1]);
}

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

      if (node.category !== 'security') {
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

export interface DatabaseStatus {
  provided: number;
  demand: number;
  ratio: number;
}

// DB capacity (database + storage nodes, scaled, active) vs DB demand (post-cache traffic × DB fraction).
// Used by the Server Compliance panel to surface the DB bottleneck that compliance (compute/data/network) doesn't show.
export function getDatabaseStatus(racks: ServerRack[], effectiveRps: number, rentedServers: RentedServer[] = []): DatabaseStatus {
  const stats = calcServerStats(racks);
  const rackProvided = racks.reduce((sum, rack) => {
    if (rack.plotId === null) return sum;
    return sum + rack.slots.reduce((acc, slot) => {
      const n = slot.node;
      if (!n || n.status === 'crashed' || n.status === 'offline') return acc;
      if (n.category === 'database' || n.category === 'storage') return acc + applyNodeScaling(n).effectiveCapacity;
      return acc;
    }, 0);
  }, 0);
  const rentedProvided = rentedServers.reduce((sum, r) => sum + (r.dbCapacity || 0), 0);
  const provided = rackProvided + rentedProvided;
  const demand = Math.max(0, effectiveRps - stats.totalCacheOffload) * 0.2;
  const ratio = provided > 0 ? Math.min(demand / provided, 5) : (demand > 0 ? 5 : 1);
  return { provided, demand, ratio };
}

function getRackBaseCooling(tier: string): number {
  switch (tier) {
    case 'basic': return 40;
    case 'advanced': return 80;
    case 'enterprise': return 150;
    default: return 40;
  }
}

// Fase A (update_v1.5): hitung rack yang berbagi sisi grid dalam plot yang sama.
// Digunakan oleh logika heat spread (§6.5) di Fase D.
function racksShareSide(a: ServerRack, b: ServerRack): boolean {
  const verticalOverlap = a.gridY < b.gridY + b.gridH && a.gridY + a.gridH > b.gridY;
  const horizontalOverlap = a.gridX < b.gridX + b.gridW && a.gridX + a.gridW > b.gridX;
  const touchX = a.gridX + a.gridW === b.gridX || b.gridX + b.gridW === a.gridX;
  const touchY = a.gridY + a.gridH === b.gridY || b.gridY + b.gridH === a.gridY;
  return (touchX && verticalOverlap) || (touchY && horizontalOverlap);
}

export function recomputeRackAdjacency(racks: ServerRack[]): ServerRack[] {
  const byPlot = new Map<string, ServerRack[]>();
  for (const r of racks) {
    if (r.plotId) {
      const list = byPlot.get(r.plotId) ?? [];
      list.push(r);
      byPlot.set(r.plotId, list);
    }
  }
  return racks.map(r => {
    if (!r.plotId) {
      return r.adjacentRackIds.length ? { ...r, adjacentRackIds: [] } : r;
    }
    const ids = (byPlot.get(r.plotId) ?? [])
      .filter(o => o.id !== r.id && racksShareSide(r, o))
      .map(n => n.id)
      .sort();
    const current = [...r.adjacentRackIds].sort();
    if (ids.length === current.length && ids.every((v, i) => v === current[i])) return r;
    return { ...r, adjacentRackIds: ids };
  });
}

export function calculateNodeLoads(racks: ServerRack[], incomingRPS: number, rentedServers: RentedServer[] = [], sysAdminLevel: number = 0, crashChanceBonus: number = 0, extraWebCapacity: number = 0): NodeLoadResult {
  const stats = calcServerStats(racks, rentedServers);
  const rpsAfterCache = Math.max(0, incomingRPS - stats.totalCacheOffload);
  const lbActive = hasLoadBalancer(racks);

  // Water-fill: collect all web servers (owned + rented), distribute RPS proportionally (equal utilization)
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

  // Proportional water-fill: distribute RPS across ALL web servers
  // (owned rack nodes + rented) so every server carries the same utilization %.
  // Since each server carries capacity_i / totalCap of the load, utilization
  // = rpsAfterCache / totalCap, identical for all servers. This keeps owned
  // nodes sustainable when rented capacity is free, and only pushes every
  // server past 100% when total capacity is truly insufficient.
  const totalWebCap = webEntries.reduce((sum, e) => sum + e.capacity, 0) + extraWebCapacity;
  const utilPct = totalWebCap > 0 ? (rpsAfterCache / totalWebCap) * 100 : 0;
  const ownedLoadMap = new Map<string, number>();
  for (const entry of webEntries) {
    if (entry.type === 'owned') {
      ownedLoadMap.set(`${entry.rackId}:${entry.slotIndex}`, Math.round(utilPct));
    }
  }

  // Rented server loads (same utilization %)
  const updatedRented = rentedServers.map((r) => {
    if (r.capacityRps <= 0) return { ...r, load: 0 };
    return { ...r, load: Math.max(0, Math.min(200, Math.round(utilPct))) };
  });

  // Global DB capacity (database + storage nodes, scaled, active only) for even load distribution
  // across all owned hardware — matches how web/cache are already distributed globally.
  const totalDbCapacity = racks.reduce((sum, rack) => {
    const rackDb = rack.slots.reduce((acc, slot) => {
      const n = slot.node;
      if (!n || n.status === 'crashed' || n.status === 'offline') return acc;
      if (n.category === 'database' || n.category === 'storage') return acc + applyNodeScaling(n).effectiveCapacity;
      return acc;
    }, 0);
    return sum + rackDb;
  }, 0) + rentedServers.reduce((sum, r) => sum + (r.dbCapacity || 0), 0);
  const dbRPS = rpsAfterCache * 0.2;

  // ── Pass 1: update node statuses & collect raw heat + cooling per rack ──
  const rackRawData: { rawHeat: number; coolingFromNodes: number; adjCoolingBonus: number; slots: typeof racks[0]['slots'] }[] = [];
  const rackById = new Map<string, ServerRack>();

  for (const rack of racks) {
    rackById.set(rack.id, rack);
    let rawHeat = 0;
    let coolingFromNodes = 0;

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

      if (node.category === 'web_server') {
        const waterLoad = ownedLoadMap.get(`${rack.id}:${slot.index}`);
        newLoad = waterLoad !== undefined ? Math.round(waterLoad) : 0;

        if (newLoad > 100) {
          newStatus = 'overloaded';
          if (!(lbActive && Math.random() < 0.1)) newCrashTicks += 1;
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
        newLoad = totalDbCapacity > 0 ? (dbRPS / totalDbCapacity) * 100 : 0;
        if (newLoad > 100) {
          if (!(lbActive && Math.random() < 0.1)) newCrashTicks += 1;
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

      if (node.category !== 'cooling') {
        rawHeat += scaled.effectiveHeat;
      }

      if (node.category === 'cooling' && (node.status === 'active' || node.status === 'overloaded')) {
        coolingFromNodes += node.capacity;
      }

      return { ...slot, node: { ...node, load: Math.round(newLoad), status: newStatus, crashTicks: newCrashTicks, recoveryTicks: newRecoveryTicks } };
    });

    // Industrial Fan bonus ke rack tetangga (§6.3)
    let adjCoolingBonus = 0;
    for (const adjId of rack.adjacentRackIds) {
      const adj = rackById.get(adjId);
      if (!adj) continue;
      for (const s of adj.slots) {
        if (s.node?.typeId === 'industrial_fan' && s.node.status !== 'crashed' && s.node.status !== 'offline') {
          adjCoolingBonus += 10;
        }
      }
    }

    rackRawData.push({ rawHeat, coolingFromNodes, adjCoolingBonus, slots: newSlots });
  }

  // ── Pass 2: hitung cooling final tiap rack (base + cooling nodes + neighbor fan), heat spread, heatRatio, status ──
  const heatRatios = new Map<string, number>();
  const effCooling = new Map<string, number>();

  for (let i = 0; i < racks.length; i++) {
    const rack = racks[i];
    const data = rackRawData[i];
    const base = getRackBaseCooling(rack.tier);
    const totalCooling = base + data.coolingFromNodes + data.adjCoolingBonus;
    effCooling.set(rack.id, totalCooling);
    heatRatios.set(rack.id, totalCooling > 0 ? data.rawHeat / totalCooling : 0);
  }

  // Heat spread: overheated rack → adjacent rack (+5% of rawHeat) (§6.5)
  const spreadHeat = new Map<string, number>();
  for (let i = 0; i < racks.length; i++) {
    const rack = racks[i];
    const data = rackRawData[i];
    const hr = heatRatios.get(rack.id) ?? 0;
    if (hr > 1.0) {
      for (const adjId of rack.adjacentRackIds) {
        spreadHeat.set(adjId, (spreadHeat.get(adjId) ?? 0) + data.rawHeat * 0.05);
      }
    }
  }

  // Heat spread reduction oleh SysAdmin (§6.6)
  const spreadReduction = 1 - sysAdminLevel * 0.03;
  for (const [rackId, heat] of spreadHeat) {
    spreadHeat.set(rackId, heat * Math.max(0, spreadReduction));
  }

  // ── Pass 3: finalize tiap rack dengan heatRatio, status, throttle ──
  const updatedRacks: ServerRack[] = racks.map((rack, i) => {
    const data = rackRawData[i];
    const totalCooling = effCooling.get(rack.id) ?? 40;
    const rawHeat = data.rawHeat + (spreadHeat.get(rack.id) ?? 0);
    const heatRatio = totalCooling > 0 ? rawHeat / totalCooling : 0;

    const isOverheating = heatRatio > 1.0;
    const isCritical = heatRatio > 1.3;
    const newOverheatTicks = isOverheating ? rack.overheatTicks + 1 : 0;

    const crashChanceMult = isCritical ? 2 : 1;
    const crashChance = Math.max(0.01, Math.min(0.4, 0.05 - sysAdminLevel * 0.008 + crashChanceBonus)) * (lbActive ? 0.9 : 1) * crashChanceMult;

    if (isOverheating && newOverheatTicks >= 5) {
      data.slots.forEach(slot => {
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
      slots: data.slots,
      coolingUsed: rawHeat,
      coolingCapacity: totalCooling,
      heatRatio: Math.round(heatRatio * 100) / 100,
      powerDraw: data.slots.reduce((sum, s) => sum + (s.node ? applyNodeScaling(s.node).effectivePower : 0), 0),
      isOverheating,
      isCritical,
      overheatTicks: newOverheatTicks,
    };
  });

  return { racks: updatedRacks, rentedServers: updatedRented };
}

export function calcMonthlyServerCost(racks: ServerRack[], rentedServers: RentedServer[] = [], internetSubs: InternetSubscription[] = []): number {
  let total = 0;
  for (const rack of racks) {
    total += rack.monthlyCost;
    for (const slot of rack.slots) {
      if (!slot.node) continue;
      const scaled = applyNodeScaling(slot.node);
      if (slot.node.category !== 'security') {
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
  for (const s of internetSubs) {
    total += s.monthlyCost;
  }
  return total;
}
