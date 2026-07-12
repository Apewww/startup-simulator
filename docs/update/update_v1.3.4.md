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

## 8. Server Compliance System

### Node Points

Setiap node punya 4 point category yang menentukan kecukupan hardware.

| Node | Compute | Data | Network | Security |
|---|---|---|---|---|
| Web T1 | 2 | 0 | 0 | 0 |
| Web T2 | 4 | 0 | 0 | 0 |
| Web T3 | 8 | 0 | 0 | 0 |
| DB T1 | 0 | 2 | 0 | 0 |
| DB T2 | 0 | 5 | 0 | 0 |
| Cache T1 | 0 | 0 | 2 | 0 |
| Cache T2 | 0 | 0 | 5 | 0 |
| Router | 0 | 0 | 1 | 0 |
| Load Balancer | 1 | 0 | 1 | 0 |
| Firewall T1 | 0 | 0 | 0 | 2 |
| Firewall T2 | 0 | 0 | 0 | 5 |
| Storage | 0 | 1 | 0 | 0 |

### Feature Requirements (per level)

| Group | Compute/level | Data/level | Network/level |
|---|---|---|---|
| Core | 0.5 | 0.3 | 0.3 |
| Business | 0.3 | 0.3 | 0 |
| Engagement | 0.3 | 0 | 0.3 |

`required = sum(feature.rate × feature.level)` untuk semua fitur yang sudah dibangun.

Contoh — 3 Core Lv.5 + 2 Business Lv.3:
- Compute: 3×2.5 + 2×0.9 = 9.3
- 3×Web T1 (6) → 6/9.3 = 64% → partial, users capped

### Compliance Tiers

| Ratio | Status | Effect |
|---|---|---|
| < 0.5 | **Critical** | users = 0 (service mati) |
| 0.5 – 0.99 | **Partial** | users capped di ratio × targetUsers, revenue × ratio |
| ≥ 1.0 | **OK** | full service |

**Network shortage**: Jika network ratio < 1, `effectiveRps` × (1 + (1 - ratio) × 0.5) — server ekstra beban.

**Security → event mitigation**: Jika security high dan DDoS terpilih, ada chance reroll ke event lain (`securityLevel × 0.15`).

### UI

- **ServerPanel**: Compliance bars (Compute/Data/Network/Security) muncul di atas LandMap, dengan status label (OK/Partial/Critical).
- **HudBar**: Dot `● HW OK` / `HW ⚠` / `HW ✗` di sebelah kanan Platform Health meter.

---

## 9. Perubahan File (Lanjutan)

| File | Perubahan |
|---|---|
| `types/server.ts` | Tambah `compute/data/network/security` fields di `NodeDef` |
| `data/servers.ts` | Tambah point values ke semua node def |
| `systems/compliance.ts` | **BARU** — `calcPoints()`, `calcRequirements()`, `getComplianceStatus()` |
| `systems/events.ts` | DDoS bias reduction: reroll jika securityLevel tinggi |
| `store/gameStore.ts` | Compliance check di `incrementTick`: apply userCap, revenueMult, rpsPenalty |
| `components/ServerPanel.tsx` | Compliance bars section |
| `components/HudBar.tsx` | Compliance status dot (`Circle`) |

## 10. Checklist

- [x] Types: feature group, event, scaleLevel, security, point fields
- [x] Data: products group/synergy, servers security/scaling/points
- [x] Systems: platform stats, events, server scaling, monetization cohesion
- [x] Systems: compliance — point calc, requirement calc, user cap, RPS penalty
- [x] Store: dynamic users, events, cohesion multiplier, scale actions, compliance check
- [x] HudBar: Platform Health meter, event badge, dynamic users display, compliance dot
- [x] FeaturesPanel: group, synergy badge
- [x] ServerPanel: scale buttons, security node display, compliance bars section
- [x] EventBanner component
- [x] DB v7 + save/load
- [x] Build sukses (typecheck + lint)
- [x] Main Menu versi v1.3.4

---

## 10. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
