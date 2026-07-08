import type { ServerRack, ServerNode } from '../types';
import { getNodeDef } from '../data/servers';

export interface ServerStats {
  totalWebCapacity: number;
  totalCacheOffload: number;
  totalDbCapacity: number;
  totalCoolingProvided: number;
  totalPowerDraw: number;
  totalMonthlyCost: number;
  activeWebCount: number;
}

export function calcServerStats(racks: ServerRack[]): ServerStats {
  let totalWebCapacity = 0;
  let totalCacheOffload = 0;
  let totalDbCapacity = 0;
  let totalCoolingProvided = 0;
  let totalPowerDraw = 0;
  let totalMonthlyCost = 0;
  let activeWebCount = 0;

  for (const rack of racks) {
    totalMonthlyCost += rack.monthlyCost;
    for (const slot of rack.slots) {
      const node = slot.node;
      if (!node || node.status === 'offline' || node.status === 'crashed') continue;

      totalMonthlyCost += node.monthlyCost;
      totalPowerDraw += node.power;

      if (node.category === 'web_server') {
        if (node.status === 'active') {
          totalWebCapacity += node.capacity;
          activeWebCount++;
        }
      } else if (node.category === 'caching') {
        if (node.status === 'active') {
          totalCacheOffload += node.capacity;
        }
      } else if (node.category === 'database') {
        if (node.status === 'active') {
          totalDbCapacity += node.capacity;
        }
      } else if (node.category === 'cooling') {
        totalCoolingProvided += node.capacity;
      }
    }

    const rackCoolingFromNodes = rack.slots
      .filter(s => s.node?.category === 'cooling' && s.node?.status !== 'crashed')
      .reduce((sum, s) => sum + (s.node?.capacity ?? 0), 0);
    rack.coolingCapacity = getRackBaseCooling(rack.tier) + rackCoolingFromNodes;
  }

  return { totalWebCapacity, totalCacheOffload, totalDbCapacity, totalCoolingProvided, totalPowerDraw, totalMonthlyCost, activeWebCount };
}

function getRackBaseCooling(tier: string): number {
  switch (tier) {
    case 'basic': return 40;
    case 'advanced': return 80;
    case 'enterprise': return 150;
    default: return 40;
  }
}

export function calculateNodeLoads(racks: ServerRack[], incomingRPS: number): ServerRack[] {
  const stats = calcServerStats(racks);
  const rpsAfterCache = Math.max(0, incomingRPS - stats.totalCacheOffload);

  return racks.map(rack => {
    let rackHeat = 0;
    let rackCooling = rack.coolingCapacity;
    let hasRouter = false;

    const newSlots = rack.slots.map(slot => {
      const node = slot.node;
      if (!node) return slot;

      let newLoad = node.load;
      let newStatus = node.status;
      let newCrashTicks = node.crashTicks;
      let newRecoveryTicks = node.recoveryTicks;

      if (node.status === 'crashed') {
        newCrashTicks = 0;
        return { ...slot, node: { ...node, load: 0, crashTicks: newCrashTicks, recoveryTicks: newRecoveryTicks } };
      }

      if (node.status === 'offline') {
        return { ...slot, node: { ...node, load: 0 } };
      }

      if (node.category === 'router') {
        hasRouter = true;
        rackCooling += 5;
      }

      if (node.category === 'web_server') {
        const activeCount = Math.max(1, racks.reduce((c, r) => {
          const def = getNodeDef(node.typeId);
          if (!def) return c;
          return c + r.slots.filter(s =>
            s.node?.category === 'web_server' &&
            s.node?.status === 'active'
          ).length;
        }, 0));

        const rpsPerServer = activeCount > 0 ? rpsAfterCache / activeCount : 0;
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

      if (node.category === 'caching' || node.category === 'storage' || node.category === 'cooling') {
        newLoad = (node.status === 'active') ? 50 : 0;
      }

      if (node.status !== 'crashed') {
        rackHeat += node.heat;
      }

      return { ...slot, node: { ...node, load: Math.round(newLoad), status: newStatus, crashTicks: newCrashTicks, recoveryTicks: newRecoveryTicks } };
    });

    const isOverheating = rackHeat > rackCooling;
    const newOverheatTicks = isOverheating ? rack.overheatTicks + 1 : 0;

    if (isOverheating && newOverheatTicks >= 5) {
      newSlots.forEach(slot => {
        if (slot.node && slot.node.status !== 'crashed' && slot.node.status !== 'offline' && slot.node.heat > 0) {
          if (Math.random() < 0.05) {
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
      powerDraw: newSlots.reduce((sum, s) => sum + (s.node?.power ?? 0), 0),
      isOverheating,
      overheatTicks: newOverheatTicks,
    };
  });
}

export function calcMonthlyServerCost(racks: ServerRack[]): number {
  let total = 0;
  for (const rack of racks) {
    total += rack.monthlyCost;
    for (const slot of rack.slots) {
      if (slot.node) {
        total += slot.node.monthlyCost;
        total += slot.node.power * 2;
      }
    }
  }
  return total;
}
