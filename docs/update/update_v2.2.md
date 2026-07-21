# Update V2.2 — Scale Update

**Induk:** `docs/upcoming_features v4.md` — Fase D (v2.2)
**Tujuan:** Multi-Product Portfolio + Global Expansion
**Status:** 📝 Planned

---

## Final Feature List

### Multi-Product Portfolio
- State refactor: `selectedProduct: string` → `activeProductId: string` + `products: Record<string, ProductPortfolioState>`
- Setiap produk punya state terpisah: `features`, `currentUsers`, `userMood`, `activeMonetization`, `activePricingTier`, `brandScore`, `marketingCampaigns`
- Shared resource pool: `cash`, `employees`, `racks`, `rentedServers`, `research`, `boardSatisfaction`
- Action: `createProduct(productDefId, name)` — init per-product state, pilih sektor
- Action: `switchProduct(productId)` — ganti aktif produk, UI refresh
- Action: `closeProduct(productId)` — tutup/archived product
- Validasi: minimal 1 produk aktif

### Tick Loop Refactor
- `incrementTick()` loop `for each product in products`:
  - Hitung traffic/users per produk
  - Hitung revenue per produk → akumulasi ke shared `cash`
  - Hitung churn, mood, brand per produk
- Server cost, salary, loan → shared (dihitung sekali per tick)
- Research effects global (traffic_mult, revenue_mult berlaku ke semua produk)

### UI Product Switcher
- `ProductBar.tsx` — dropdown/list semua produk player, tombol "New Product"
- `ProductOverview.tsx` — dashboard per produk: users, revenue, rank, growth trend
- `FeaturesPanel.tsx` — baca `products[activeProductId].features`
- `HudBar.tsx` — per-product metrics + product switcher
- `FinancePanel.tsx` — revenue breakdown per produk + total
- `MarketingPanel.tsx` — brand per-produk, campaign per-produk

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
- `GameSave` schema v19: hapus `features`, `currentUsers`, dll dari root → pindah ke `products[]`
- Migration: bungkus existing state jadi `products[0]` di save baru

---

## New Files

| File | Fungsi |
|------|--------|
| `src/types/portfolio.ts` | `ProductPortfolioState`, `Region`, `ComplianceLaw` |
| `src/systems/regulatory.ts` | Compliance law checking, penalty calc |
| `src/data/regions.ts` | Region definitions (NA, EU, AS, OC, SA, AF) |
| `src/components/ProductBar.tsx` | Product switcher + new product |
| `src/components/ProductOverview.tsx` | Dashboard per produk |
| `src/components/RegionPanel.tsx` | Global expansion UI |

## Modified Files

| File | Perubahan |
|------|----------|
| `src/types/index.ts` | Export tipe baru portfolio, region, compliance |
| `src/store/gameStore.ts` | State → multi-produk; tick loop → iterasi per produk; +createProduct, switchProduct, closeProduct |
| `src/db/gameDB.ts` | Dexie v19 + multi-produk schema |
| `src/systems/saveLoad.ts` | Migration v18→v19; serialization multi-produk |
| `src/systems/monetization.ts` | Parameter productId untuk per-produk revenue |
| `src/data/products.ts` | ProductDef → bisa multiple instance |
| `src/components/FeaturesPanel.tsx` | Baca dari `products[activeProductId]` |
| `src/components/FinancePanel.tsx` | Revenue breakdown per produk |
| `src/components/HudBar.tsx` | Per-product metrics + product switcher |
| `src/components/MarketingPanel.tsx` | Per-product campaigns |
| `src/components/ProductSelect.tsx` | Adaptasi untuk "New Product" flow |

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
  createdMonth: number;
  expandedRegions: string[];  // region IDs
}

interface Region {
  id: string;
  name: string;
  baseUsers: number;
  growthMult: number;
  complianceRequired: ComplianceLaw[];
  entryCost: number;
  monthlyMaintenance: number;
}

interface ComplianceLaw {
  id: string;
  name: string;
  description: string;
  requirement: 'data_residency' | 'right_to_delete' | 'cookie_consent' | 'age_verification';
  penalty: number;
  requiresFeature: string;
  devCost: number;
}
```

---

## Checklist

- [ ] Types: ProductPortfolioState, Region, ComplianceLaw
- [ ] gameStore: state refactor ke multi-produk
- [ ] gameStore: action createProduct
- [ ] gameStore: action switchProduct
- [ ] gameStore: action closeProduct
- [ ] gameStore: tick loop iterasi per produk
- [ ] ProductOverview.tsx — dashboard per produk
- [ ] ProductBar.tsx — switcher + new product
- [ ] FeaturesPanel.tsx — adaptasi per-produk
- [ ] HudBar.tsx — per-product metrics
- [ ] FinancePanel.tsx — revenue breakdown per produk
- [ ] MarketingPanel.tsx — per-produk campaigns
- [ ] Data: region definitions
- [ ] systems/regulatory.ts — compliance law checking
- [ ] RegionPanel.tsx — global expansion UI
- [ ] monetization.ts — wiring region mult
- [ ] gameDB.ts — Dexie v19
- [ ] saveLoad.ts — migration v18→v19
- [ ] Build sukses (tsc -b + vite build)
