# Update V1.3.4 — Platform Cohesion, Dynamic Users & Events

**Induk:** `docs/update_v1.3.3.md` (Player Character & Training)
**Tujuan:** Feature balance system (weighted bottleneck + groups), dynamic user pool, random events, node scaling & security appliance.

---

## 1. Feature Groups

Tiap fitur dikategorikan dengan weight berbeda.

| Group | Weight | Social Media | E-Commerce | Search Engine |
|---|---|---|---|---|
| **Core** (×3) | 3 | User Profiles, News Feed | Product Listing, Shopping Cart, Payment Gateway | Web Crawler, Search Algorithm, Index Builder |
| **Business** (×2) | 2 | Messaging, Groups | Review System, Recommendation Engine | Image Search, Analytics |
| **Engagement** (×1) | 1 | Photo Sharing, Stories, Live Streaming | Wishlist, Seller Dashboard | Voice Search, Maps |

Group didefinisikan di `FeatureDef` dan di-runtime di `PlatformFeature`.

---

## 2. Weighted Bottleneck (Cohesion Score)

```
weightedAvg = sum(level × groupWeight) / sum(groupWeight)
deviasi = sum(|level - weightedAvg| × groupWeight)
cohesion = 1 - (deviasi / maxPossibleDeviation)
→ range 0.0 – 1.0
```

- Core tertinggal → penalty besar (weight 3x)
- Engagement tertinggal → penalty kecil (weight 1x)
- Ditampilkan sebagai **Platform Health** meter di HUD

### Efek Cohesion

| Aspek | Formula |
|---|---|
| **Revenue multiplier** | `revMult = 0.6 + 0.4 × cohesion` (0.6x–1.0x) |
| **User growth** | `growthRate = 0.005 × cohesion` (stagnan di 0 cohesion) |
| **RPS efficiency** | `rpsMult = 1.3 - 0.3 × cohesion` (1.0x–1.3x) |

---

## 3. Synergy Bonus

Pasangan fitur tertentu dapet bonus jika levelnya seimbang.

| Produk | Pasangan | Syarat | Bonus |
|---|---|---|---|
| Social Media | News Feed + User Profiles | ≤2 level gap, min Lv.3 | +15% traffic ke keduanya |
| E-Commerce | Shopping Cart + Payment Gateway | ≤2 level gap, min Lv.3 | +10% revenue conversion |
| Search Engine | Search Algorithm + Index Builder | ≤2 level gap, min Lv.3 | +15% traffic ke keduanya |

Badge "Synergy Active!" muncul di FeaturesPanel.

---

## 4. Dynamic Users

`currentUsers` dipisah dari `targetUsers` (ex-traffic). Bergerak gradual.

```
targetUsers = rawTrafficFromFeatures
currentUsers → bergerak menuju targetUsers secara asimptotik

setiap tick:
  delta = (targetUsers - currentUsers) × 0.005 × cohesion
  crashPenalty = ada node crash → -5% currentUsers
  churn = currentUsers × (1 - cohesion) × 0.0002
  currentUsers += delta - churn - crashPenalty
  currentUsers = max(0, currentUsers)
```

- Naik perlahan kalau platform bagus
- Turun gradual kalau cohesion jelek (user churn)
- Anjlok kalau server crash
- Revenue & RPS pakai `currentUsers`, bukan `targetUsers`

---

## 5. Events System

Events muncul random, frekuensi dipengaruhi ukuran platform & security level.

### Daftar Event

| Event | Trigger | Efek | Durasi |
|---|---|---|---|
| **DDoS Attack** | Random, chance ↑ users | RPS × 2–3, bypass cache | 15–30 tick |
| **Traffic Spike** | Random (viral) | User growth +50% | 20–40 tick |
| **Server Outage** | Jika uptime buruk | 1 random rack crash | — (instant) |
| **PR Crisis** | Jika cohesion < 0.3 | User growth = 0 | 50–100 tick |
| **Viral Growth** | Jika cohesion > 0.8 | +10% targetUsers instan | — (instant) |

### Event Trigger Formula

```
baseChance = 0.001 / tick
eventChance = baseChance × (1 + users/10000) / (1 + securityLevel × 0.2)
~ Rata-rata 1 event per 1000 tick (~50 hari) tanpa security
```

### Event Structure

```ts
interface GameEvent {
  id: string;
  type: 'ddos' | 'traffic_spike' | 'server_outage' | 'pr_crisis' | 'viral_growth';
  name: string;
  description: string;
  duration: number;
  tickLeft: number;
  effects: {
    rpsMultiplier?: number;
    userGrowthMultiplier?: number;
    revenueMultiplier?: number;
    crashChanceBonus?: number;
  };
}
```

---

## 6. Node Scaling (Overclocking)

Tiap node punya `scaleLevel: number` (1–5, default 1).

| Scale | Capacity Mult | Heat Mult | Power Mult | Monthly Cost Mult |
|---|---|---|---|---|
| 1 | 1.0× | 1.0× | 1.0× | 1.0× |
| 2 | 1.5× | 2.0× | 1.5× | 1.2× |
| 3 | 2.0× | 3.5× | 2.0× | 1.5× |
| 4 | 2.5× | 5.5× | 3.0× | 2.0× |
| 5 | 3.0× | 8.0× | 4.5× | 3.0× |

Rented server: scale → monthlyCost × scale×2 (provider markup).

UI: tombol ± di NodeSlot, muncul saat hover.

---

## 7. Security Node

Node baru untuk mitigasi event & extra protection.

| Node | Kategori | Effect | Heat | Power | Price | Monthly |
|---|---|---|---|---|---|---|
| Firewall T1 | security | +1 securityLevel, -20% DDoS chance | 5 | 3 | $150 | $20 |
| Firewall T2 | security | +2 securityLevel, -35% DDoS chance | 10 | 6 | $350 | $45 |
| Rate Limiter | security | DDoS durasi -50% | 3 | 2 | $80 | $12 |
| Load Balancer | security | Distribusi RPS merata, -10% overload chance | 4 | 4 | $200 | $30 |

---

## 8. Perubahan File

| File | Perubahan |
|---|---|
| `types/feature.ts` | Tambah `group: 'core'\|'business'\|'engagement'` |
| `types/event.ts` | **BARU** — `GameEvent`, `EventType`, `EventEffects` |
| `types/server.ts` | Tambah `scaleLevel: number` di ServerNode; `'security'` kategori; `firewall_t1\|firewall_t2\|rate_limiter\|load_balancer` NodeTypeId |
| `types/index.ts` | Export event types |
| `data/products.ts` | Tambah `group` di FeatureDef; `synergyPairs` per produk |
| `data/servers.ts` | Tambah 4 node security + Liquid Cooling |
| `systems/traffic.ts` | **RENAME** → `systems/platform.ts`. `getPlatformStats()` return cohesion, targetUsers, effectiveRPS, etc |
| `systems/events.ts` | **BARU** — event trigger, tick progression, effect calculation |
| `systems/server.ts` | Terima `effectiveRPS` dari platform; apply `scaleLevel` ke capacity/heat/power; hitung `securityLevel` |
| `systems/monetization.ts` | Terima `currentUsers` + cohesion multiplier |
| `store/gameStore.ts` | Tambah `currentUsers`, `events[]`; dynamic user logic; event check; cohesion multiplier; scale actions |
| `components/HudBar.tsx` | Ganti `trafficStats.users` → `currentUsers`; tambah **Platform Health** meter; event badge |
| `components/FeaturesPanel.tsx` | Group label (C/B/E); synergy badge; cohesion tooltip per fitur |
| `components/ServerPanel.tsx` | Scale ± button di NodeSlot |
| `components/ServerShop.tsx` | Tampilkan node security |
| `components/EventBanner.tsx` | **BARU** — banner untuk active events |
| `db/gameDB.ts` | DB v7: currentUsers, events |
| `systems/saveLoad.ts` | Save/load currentUsers, events |

---

## 9. Checklist

- [x] Types: feature group, event, scaleLevel, security
- [x] Data: products group/synergy, servers security/scaling
- [x] Systems: platform stats, events, server scaling, monetization cohesion
- [x] Store: dynamic users, events, cohesion multiplier, scale actions
- [x] HudBar: Platform Health meter, event badge, dynamic users display
- [x] FeaturesPanel: group, synergy badge
- [x] ServerPanel: scale buttons, security node display
- [x] EventBanner component
- [x] DB v7 + save/load
- [x] Build sukses (typecheck + lint)
- [x] Main Menu versi v1.3.4

---

## 10. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
