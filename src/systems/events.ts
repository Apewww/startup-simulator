import type { GameEvent, EventType, ServerRack } from '../types';

const EVENT_TEMPLATES: Record<EventType, Omit<GameEvent, 'id' | 'tickLeft'>> = {
  ddos: {
    type: 'ddos',
    name: 'DDoS Attack',
    description: 'Server under DDoS attack! Traffic melonjak drastis.',
    duration: 20,
    effects: { rpsMultiplier: 2.5, userGrowthMultiplier: 0.5, revenueMultiplier: 0.7 },
  },
  traffic_spike: {
    type: 'traffic_spike',
    name: 'Traffic Spike',
    description: 'Platform trending! Pengguna baru berdatangan.',
    duration: 30,
    effects: { userGrowthMultiplier: 1.5 },
  },
  server_outage: {
    type: 'server_outage',
    name: 'Server Outage',
    description: 'Kegagalan hardware menyebabkan server mati mendadak.',
    duration: 1,
    effects: {},
  },
  pr_crisis: {
    type: 'pr_crisis',
    name: 'PR Crisis',
    description: 'Berita negatif meluas. Pertumbuhan pengguna terhambat.',
    duration: 70,
    effects: { userGrowthMultiplier: 0 },
  },
  viral_growth: {
    type: 'viral_growth',
    name: 'Viral Growth',
    description: 'Platform menjadi viral! Ledakan pengguna baru.',
    duration: 1,
    effects: { userGrowthMultiplier: 2 },
  },
};

let eventCounter = 0;

const EVENT_RATES: Record<EventType, number> = {
  ddos: 0.35,
  traffic_spike: 0.2,
  server_outage: 0.15,
  pr_crisis: 0.2,
  viral_growth: 0.1,
};

export function checkEventTrigger(
  users: number,
  securityLevel: number,
  existingEvents: GameEvent[],
  cohesionScore: number,
): GameEvent | null {
  const activeTypes = new Set(existingEvents.map(e => e.type));

  if (activeTypes.size >= 3) return null;
  if (activeTypes.has('pr_crisis') || activeTypes.has('ddos')) return null;

  if (cohesionScore < 0.3 && !activeTypes.has('pr_crisis') && Math.random() < 0.002) {
    eventCounter++;
    return {
      id: `evt-${eventCounter}`,
      ...EVENT_TEMPLATES.pr_crisis,
      tickLeft: EVENT_TEMPLATES.pr_crisis.duration + Math.floor(Math.random() * 30),
    };
  }

  if (cohesionScore > 0.8 && !activeTypes.has('viral_growth') && Math.random() < 0.0005) {
    eventCounter++;
    return {
      id: `evt-${eventCounter}`,
      ...EVENT_TEMPLATES.viral_growth,
      tickLeft: 1,
    };
  }

  const baseChance = 0.0008;
  const userScale = 1 + users / 10000;
  const securityMitigation = 1 + securityLevel * 0.2;
  const eventChance = (baseChance * userScale) / securityMitigation;

  if (Math.random() >= eventChance) return null;

  const roll = Math.random();
  let cumulative = 0;
  let chosen: EventType = 'traffic_spike';

  for (const [type, rate] of Object.entries(EVENT_RATES)) {
    cumulative += rate;
    if (roll < cumulative) { chosen = type as EventType; break; }
  }

  if (activeTypes.has(chosen)) return null;

  eventCounter++;
  const tmpl = EVENT_TEMPLATES[chosen];
  const duration = chosen === 'ddos' ? 15 + Math.floor(Math.random() * 16)
    : chosen === 'traffic_spike' ? 20 + Math.floor(Math.random() * 21)
    : chosen === 'pr_crisis' ? 50 + Math.floor(Math.random() * 51)
    : tmpl.duration;

  return {
    id: `evt-${eventCounter}`,
    ...tmpl,
    duration,
    tickLeft: duration,
  };
}

export function processEvents(
  events: GameEvent[],
  racks: ServerRack[],
): { events: GameEvent[]; crashedRackId: string | null } {
  let crashedRackId: string | null = null;

  const updated = events
    .map(ev => {
      if (ev.type === 'server_outage' && ev.tickLeft === ev.duration) {
        const onlineRacks = racks.filter(r =>
          r.slots.some(s => s.node?.status === 'active' || s.node?.status === 'overloaded')
        );
        if (onlineRacks.length > 0) {
          const target = onlineRacks[Math.floor(Math.random() * onlineRacks.length)];
          crashedRackId = target.id;
        }
      }
      return { ...ev, tickLeft: ev.tickLeft - 1 };
    })
    .filter(ev => ev.tickLeft > 0);

  return { events: updated, crashedRackId };
}

export function calcSecurityLevel(racks: ServerRack[]): number {
  let level = 0;
  for (const rack of racks) {
    for (const slot of rack.slots) {
      const node = slot.node;
      if (!node || node.status === 'crashed' || node.status === 'offline') continue;
      if (node.category === 'security') {
        if (node.typeId === 'firewall_t1') level += node.capacity;
        else if (node.typeId === 'firewall_t2') level += node.capacity;
        else if (node.typeId === 'rate_limiter') level += 0.5;
        else if (node.typeId === 'load_balancer') level += 0.3;
      }
    }
  }
  return level;
}

export function getDdosDurationReduction(racks: ServerRack[]): number {
  for (const rack of racks) {
    for (const slot of rack.slots) {
      const node = slot.node;
      if (!node || node.status !== 'active') continue;
      if (node.typeId === 'rate_limiter') return 0.5;
    }
  }
  return 0;
}

export function hasLoadBalancer(racks: ServerRack[]): boolean {
  for (const rack of racks) {
    for (const slot of rack.slots) {
      const node = slot.node;
      if (node?.typeId === 'load_balancer' && node.status === 'active') return true;
    }
  }
  return false;
}
