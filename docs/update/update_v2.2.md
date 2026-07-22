# Update V2.2 — Scale Update

**Induk:** `docs/upcoming_features v4.md` — Fase D (v2.2)
**Tujuan:** Multi-Product Portfolio + Global Expansion
**Status:** 🏗️ In Progress

---

## Final Feature List

### Multi-Product Portfolio
- State refactor: `selectedProduct: string` → `activeProductId: string` + `products: Record<string, ProductPortfolioState>` ✅
- Setiap produk punya state terpisah: `features`, `currentUsers`, `userMood`, `activeMonetization`, `activePricingTier`, `brandScore`, `marketingCampaigns` ✅
- Shared resource pool: `cash`, `employees`, `racks`, `rentedServers`, `research`, `boardSatisfaction` ✅
- Action: `createProduct(productDefId, name)` — init per-product state, pilih sektor ✅
- Action: `switchProduct(productId)` — ganti aktif produk, UI refresh ✅
- Action: `closeProduct(productId)` — tutup/archived product 📝 Planned
- Validasi: minimal 1 produk aktif ✅

### Tick Loop Refactor
- `incrementTick()` loop `for each product in products`:
  - Hitung traffic/users per produk
  - Hitung revenue per produk → akumulasi ke shared `cash`
  - Hitung churn, mood, brand per produk
- Server cost, salary, loan → shared (dihitung sekali per tick)
- Research effects global (traffic_mult, revenue_mult berlaku ke semua produk)

### UI Product Switcher
- `ProductBar.tsx` — dropdown/list semua produk player, tombol "New Product" ✅
- `ProductOverview.tsx` — dashboard per produk: users, revenue, rank, growth trend 📝 Planned
- `FeaturesPanel.tsx` — baca `products[activeProductId].features` ✅
- `HudBar.tsx` — per-product metrics + product switcher ✅
- `FinancePanel.tsx` — revenue breakdown per produk + total ✅
- `MarketingPanel.tsx` — brand per-produk, campaign per-produk ✅

### Rack & Rented Service Assignment
- `ServerRack.assignedProductId` field — dropdown "Serve:" di ServerPanel
- `RentedServer.assignedProductId` field — dropdown assignment
- Tick: filter rack per produk saat hitung load

### Global Expansion
- Region model: `north_america`, `europe`, `asia`, `oceania`, `south_america`, `africa`
- Tiap region punya: `baseUsers`, `growthMult`, `entryCost`, `monthlyMaintenance`
- Compliance law (GDPR-style): `data_residency`, `right_to_delete`, `cookie_consent`, `age_verification`
- Compliance diimplement sebagai research node atau feature requirement
- Revenue per region dikali growthMult region
- Penalty per bulan jika tidak comply

### Regulatory Compliance System (New)
- `systems/regulatory.ts` — compliance law checking, penalty calc
- Terpisah dari `compliance.ts` (server load) — ini regulatory compliance
- UI: `RegionPanel.tsx` — daftar region, status ekspansi, compliance checklist

### Save/Load Migration
- `GameSave` schema v19: hapus `features`, `currentUsers`, dll dari root → pindah ke `products[]` ✅
- Migration: bungkus existing state jadi `products[0]` di save baru ✅

---

## New Files

| File | Fungsi | Status |
|------|--------|--------|
| `src/types/portfolio.ts` | `ProductPortfolioState`, `createProductState` | ✅ Done |
| `src/components/ProductBar.tsx` | Product switcher + new product | ✅ Done |
| `src/systems/regulatory.ts` | Compliance law checking, penalty calc | 📝 Planned |
| `src/data/regions.ts` | Region definitions (NA, EU, AS, OC, SA, AF) | 📝 Planned |
| `src/components/ProductOverview.tsx` | Dashboard per produk | 📝 Planned |
| `src/components/RegionPanel.tsx` | Global expansion UI | 📝 Planned |

## Modified Files

| File | Perubahan | Status |
|------|----------|--------|
| `src/types/index.ts` | Export tipe baru portfolio, region, compliance | ✅ Done |
| `src/types/monetization.ts` | Export `MonetizationStrategy` type | ✅ Done |
| `src/store/gameStore.ts` | State → multi-produk; +createProduct, switchProduct, flushActiveProduct | ✅ Done |
| `src/db/gameDB.ts` | Dexie v19 + multi-produk schema | ✅ Done |
| `src/systems/saveLoad.ts` | Migration v18→v19; serialization multi-produk | ✅ Done |
| `src/systems/monetization.ts` | Import `MonetizationStrategy` dari types | ✅ Done |
| `src/data/products.ts` | ProductDef → bisa multiple instance | ✅ Done |
| `src/components/FeaturesPanel.tsx` | Baca dari `activeProductTypeId` | ✅ Done |
| `src/components/FinancePanel.tsx` | Baca dari `activeProductTypeId` | ✅ Done |
| `src/components/HudBar.tsx` | Baca dari `activeProductTypeId` | ✅ Done |
| `src/components/MarketingPanel.tsx` | Per-product campaigns | ✅ Done |
| `src/components/CompetitorPanel.tsx` | Baca dari `activeProductTypeId` | ✅ Done |
| `src/components/DevPanel.tsx` | Expose `__gameStore` ke window | ✅ Done |
| `src/components/ServerPanel.tsx` | Baca dari `activeProductTypeId` | ✅ Done |
| `src/components/NewProductModal.tsx` | Modal New Product dengan 3 tipe | ✅ Done |
| `src/components/ProductSelect.tsx` | Adaptasi untuk "New Product" flow | ✅ Done (via modal) |
| `src/App.tsx` | Integrasi ProductBar | ✅ Done |

---

## Data Model

```ts
interface ProductPortfolioState {
  id: string;
  name: string;
  sector: CompetitorSector;
  features: PlatformFeature[];
  currentUsers: number;
  userMood: number;
  activeMonetization: MonetizationStrategy;
  activePricingTier: string;
  brandScore: number;
  marketingCampaigns: MarketingCampaign[];
  adLeads: AdLead[];
  adCampaigns: AdCampaign[];
  adSalesUnlockNotified: boolean;
  campaignCostThisMonth: number;
  createdMonth: number;
  expandedRegions: string[];
  businessModel: 'b2c' | 'b2b';
}
```

---

## Checklist

- [x] Types: ProductPortfolioState, migration helpers
- [x] gameStore: state refactor ke multi-produk
- [x] gameStore: action createProduct
- [x] gameStore: action switchProduct
- [x] gameStore: action flushActiveProduct
- [ ] gameStore: action closeProduct
- [x] gameStore: tick loop → productTypeId fix
- [x] ProductBar.tsx — switcher + new product button
- [x] NewProductModal.tsx — modal 3 tipe produk
- [ ] ProductOverview.tsx — dashboard per produk
- [ ] FeaturesPanel.tsx — adaptasi per-produk ✅ (via activeProductTypeId)
- [ ] HudBar.tsx — per-product metrics ✅ (via activeProductTypeId)
- [ ] FinancePanel.tsx — revenue breakdown per produk ✅ (via activeProductTypeId)
- [ ] MarketingPanel.tsx — per-produk campaigns ✅ (via activeProductTypeId)
- [ ] Rack assignment — dropdown + action
- [ ] Tick loop — routing RPS per produk
- [ ] Data: region definitions
- [ ] systems/regulatory.ts — compliance law checking
- [ ] RegionPanel.tsx — global expansion UI
- [ ] monetization.ts — wiring region mult
- [x] gameDB.ts — Dexie v19
- [x] saveLoad.ts — migration v18→v19
- [x] Build sukses (tsc -b + vite build)
