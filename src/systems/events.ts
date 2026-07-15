import type { GameEvent, EventType, ServerRack, HotSector } from '../types';

const SECTORS: ('social_media' | 'ecommerce' | 'search_engine')[] = ['social_media', 'ecommerce', 'search_engine'];

const EVENT_TEMPLATES: Record<EventType, Omit<GameEvent, 'id' | 'tickLeft'>> = {
  ddos: {
    type: 'ddos',
    name: 'DDoS Attack',
    description: 'Server under DDoS attack! Traffic melonjak drastis.',
    duration: 20,
    effects: { rpsMultiplier: 2.5, userGrowthMultiplier: 0.5, revenueMultiplier: 0.5, crashChanceBonus: 0.15 },
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
  market_boom: {
    type: 'market_boom',
    name: 'Market Boom',
    description: 'Industri teknologi sedang booming! Semua startup tumbuh pesat.',
    duration: 120,
    effects: { userGrowthMultiplier: 1.3 },
  },
  market_crash: {
    type: 'market_crash',
    name: 'Market Crash',
    description: 'Krisis ekonomi melanda startup. Pertumbuhan melambat drastis.',
    duration: 180,
    effects: { userGrowthMultiplier: 0.6, revenueMultiplier: 0.7 },
  },
  sector_gold_rush: {
    type: 'sector_gold_rush',
    name: 'Sector Gold Rush',
    description: 'Investor berbondong-bondong ke satu sektor! Kompetitor baru bermunculan.',
    duration: 90,
    effects: { userGrowthMultiplier: 1.15 },
  },
};

let eventCounter = 0;

const EVENT_RATES: Record<EventType, number> = {
  ddos: 0.25,
  traffic_spike: 0.15,
  server_outage: 0.1,
  pr_crisis: 0.15,
  viral_growth: 0.08,
  market_boom: 0.1,
  market_crash: 0.07,
  sector_gold_rush: 0.1,
};

export function checkEventTrigger(
  users: number,
  securityLevel: number,
  existingEvents: GameEvent[],
  cohesionScore: number,
  month?: number,
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

  // Market events — only possible after month 3, at reduced rate
  if ((month ?? 0) >= 3 && !activeTypes.has('market_boom') && !activeTypes.has('market_crash') && !activeTypes.has('sector_gold_rush') && Math.random() < 0.00015) {
    const marketRoll = Math.random();
    if (marketRoll < 0.4) {
      eventCounter++;
      return {
        id: `evt-${eventCounter}`,
        ...EVENT_TEMPLATES.market_boom,
        tickLeft: EVENT_TEMPLATES.market_boom.duration,
      };
    } else if (marketRoll < 0.7) {
      eventCounter++;
      return {
        id: `evt-${eventCounter}`,
        ...EVENT_TEMPLATES.market_crash,
        tickLeft: EVENT_TEMPLATES.market_crash.duration,
      };
    } else {
      const hotSector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
      eventCounter++;
      return {
        id: `evt-${eventCounter}`,
        ...EVENT_TEMPLATES.sector_gold_rush,
        tickLeft: EVENT_TEMPLATES.sector_gold_rush.duration,
        hotSector,
      };
    }
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

  // Security level reduces DDoS bias — reroll if DDoS chosen and high security
  if (chosen === 'ddos' && securityLevel > 0 && Math.random() < securityLevel * 0.15) {
    const nonDdos = (Object.entries(EVENT_RATES) as [EventType, number][])
      .filter(([t]) => t !== 'ddos' && !activeTypes.has(t));
    if (nonDdos.length > 0) {
      const total = nonDdos.reduce((s, [, r]) => s + r, 0);
      let r2 = Math.random() * total;
      for (const [t, r] of nonDdos) {
        r2 -= r;
        if (r2 <= 0) { chosen = t; break; }
      }
    }
  }

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

export function getHotSector(events: GameEvent[]): HotSector {
  for (const ev of events) {
    if (ev.type === 'sector_gold_rush' && ev.hotSector) {
      return ev.hotSector;
    }
  }
  return null;
}

export function hasMarketCrash(events: GameEvent[]): boolean {
  return events.some(ev => ev.type === 'market_crash');
}

export function hasMarketBoom(events: GameEvent[]): boolean {
  return events.some(ev => ev.type === 'market_boom');
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
