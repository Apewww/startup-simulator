# Update V1.5.1 — Product Monetization Rebalance: Fase B (Monetization Logic)

**Induk:** `docs/upcoming_features v2.md` → **Fase B — Monetization Logic**
**Prasyarat:** `docs/update/update_v1.5.md` (Fase A) — `activeMonetization` state, tipe `MonetizationStrategy`, fitur `ad_platform` (Social Media & Search Engine) & `b2b_search_api` (Search Engine) sudah terdaftar di `data/products.ts`.
**Tujuan:** Implementasi rumus monetisasi aktif (Ads Tier linear, B2B, rebalance Subscription, Freemium, override Data compliance saat Payment Gateway) + modifier growth/churn di tick loop. **Tanpa UI** (radio/toggle menyusul di Fase C). Game tetap backward-compatible: `activeMonetization: 'none'` → perilaku persis seperti sistem lama.

---

## 1. Ads Tier Linear (§1) — `src/systems/monetization.ts`

### Formula dasar
```
adsRevenuePer100Users(level) = 2 + (level - 1) × 1.5     // level = fitur ad_platform
```
| Ad Platform Lv. | Revenue/100 users/bulan |
|---|---|
| 0 (tidak ada) / `none` | $2.00 (flat legacy) |
| 1 | $2.00 |
| 3 | $5.00 |
| 5 | $8.00 |
| 8 | $12.50 |
| 10 | $15.50 |

### Mapping `MonetizationStrategy` → perilaku Ads
| Strategy | Perilaku | Catatan |
|---|---|---|
| `none` | Flat `$2/100` (legacy) | Backward compatible; subscription lama ($2/user) tetap jalan bila gateway aktif |
| `text_ads` | Linear di `adPlatformLevel` | Tanpa penalti |
| `video_ads` | Linear, **tapi** di bawah Lv.5 tetap flat `$2` (early-game unchanged) | Trade-off churn `+0.0001/tick` (diterapkan di tick loop, §5) |
| `targeted_ads` | Linear ×`1.5` bila `synergyActive && dataRatio >= 1`, else cap ×`1.0` | Butuh `adPlatformLevel >= 5` + Synergy Pair aktif + Data ratio ≥100% |

Helper baru: `getAdPlatformLevel(features)`, `adsRevenuePer100Users(level)`, `calculateAdsRevenue(users, racks, adPlatformLevel, strategy, synergyActive, dataRatio)`.

---

## 2. B2B Search API (§2) — `src/systems/monetization.ts`

```
calculateB2BRevenue(features, productId, dataRatio)
  = productId === 'search_engine'
      ? level(b2b_search_api) × $150 × min(dataRatio, 1.5)
      : 0
```
- Hanya `search_engine` & fitur `b2b_search_api` enabled (`level > 0`).
- `dataRatio` diambil dari `compliance.data.ratio` (sudah di-pass lewat `opts` di `calculateRevenue`).
- Ditambahkan ke `total` di `calculateRevenue` (field `b2b` baru di `RevenueBreakdown`).

| Feature Lv. | Data Ratio 100% | Data Ratio 150%+ |
|---|---|---|
| 5 | $750/mo | $1,125/mo |
| 8 | $1,200/mo | $1,800/mo |
| 10 | $1,500/mo | $2,250/mo |

---

## 3. Subscription Rebalance + Freemium (§3) — `src/systems/monetization.ts`

### Subscription
- `calculateSubscriptionRevenue(users, features)` → `$2.50/user` (naik dari `$2`), gate Payment Gateway tetap.
- Growth rate ×`0.65` & churn −`0.00005/tick` **diterapkan di tick loop** (bukan di sini), lihat §5.

### Freemium (opsional, sebelum Full Subscription)
- `calculateFreemiumRevenue(users)` = `round(users × 0.05 × 3)` (5% premium users × $3, tanpa penalti growth/churn).
- Aktif saat `strategy === 'freemium'`; ads (linear kalau ada `ad_platform`, else flat) tetap jalan berdampingan.

### `calculateRevenue` signature baru
```ts
calculateRevenue(
  users, features, racks,
  cohesionMult = 1, synergyRevenueBonus = 0,
  opts?: { strategy, productId, dataRatio, synergyActive }
): RevenueBreakdown   // { ads, subscription, b2b, freemium, total, hasSubscription, uptimePenalty }
```
- `strategy === 'none'` → **legacy exact**: ads flat + subscription `$2/user` bila gateway (100% backward compatible).
- `strategy === 'subscription'` → hanya subscription `$2.50/user` (tanpa ads).
- `strategy === 'freemium'` → ads + freemium premium.
- `strategy` lain (`text_ads`/`video_ads`/`targeted_ads`) → ads saja.
- `synergyRevenueBonus` tetap diaplikasikan ke `subscription` & `freemium` (targeted ads punya multiplier ×1.5 sendiri).

---

## 4. Compliance — Data Requirement Override (§4) — `src/systems/compliance.ts`

Di `calcRequirements(features)`: bila Payment Gateway aktif (`hasActivePaymentGateway`), `DATA_RATES.business` naik `0.3 → 0.45` **per level fitur Business**.

```ts
const dataRate = pgActive && f.group === 'business' ? 0.45 : DATA_RATES[f.group];
data += dataRate * f.level;
```
Efek merambat lewat `getComplianceStatus` yang sudah ada → kalau Data node kurang, `dataRatio < 1` → revenue multiplier turun & (lewat water-fill RPS/overheat) beban DB lebih tinggi. Tidak ada sistem crash baru.

---

## 5. Growth / Churn Modifier di Tick Loop — `src/store/gameStore.ts`

Helper `getMonetizationMods(strategy) → { growthMult, churnDelta }`:
| Strategy | `growthMult` | `churnDelta` |
|---|---|---|
| `subscription` | `0.65` | `-0.00005` (floor 0) |
| `video_ads` | `1` | `+0.0001` |
| lainnya | `1` | `0` |

Di `incrementTick`:
- `userDelta = (targetUsers - currentUsers) × 0.005 × cohesionScore × mods.growthMult`
- `churn = max(0, currentUsers × ((1 - cohesionScore) × 0.0002 + mods.churnDelta))`

`calculateRevenue` dipanggil dengan `opts` di 3 titik (`incrementTick` bulanan ×2, `checkFundingEligibility`), membawa `strategy`, `productId`, `dataRatio` (`compliance.data.ratio`), `synergyActive` (`hasActiveSynergy(features, selectedProduct)`).

### Action baru
`setMonetizationStrategy(strategy)` — write state `activeMonetization`. UI radio/toggle menyusul di Fase C; action ini membuat logic testable (bisa dipanggil dari Dev Panel).

---

## 6. Sanity Check (Fase B terakhir — jangan lanjut Fase C kalau timpang)

Simulasi manual di 3 titik user count per produk (asumsi cohesion 1.0, ads flat vs tier, gateway aktif untuk subscription):

**Social Media** (`ad_platform` Lv.5 → $8/100 users):
| Users | `none` (flat $2) | `text_ads` (Lv.5, $8) | `targeted_ads` (×1.5, $12) |
|---|---|---|---|
| 1,000 | $20 | $80 | $120 |
| 20,000 | $400 | $1,600 | $2,400 |
| 200,000 | $4,000 | $16,000 | $24,000 |

**Search Engine** (`ad_platform` Lv.5 + `b2b_search_api` Lv.5, dataRatio 1.0 → +$750):
| Users | `text_ads` (Lv.5) | `text_ads` + B2B |
|---|---|---|
| 1,000 | $80 | $830 |
| 20,000 | $1,600 | $2,350 |
| 200,000 | $16,000 | $16,750 |

**E-Commerce** (`subscription` $2.50/user, gateway aktif):
| Users | `none` (ads $2 + sub $2) | `subscription` ($2.50) |
|---|---|---|
| 1,000 | $40 | $25 |
| 20,000 | $800 | $500 |
| 200,000 | $8,000 | $5,000 |

> Catatan: di titik user rendah, `none` (ads+sub lama) masih menang vs `subscription` murni karena ads flat kecil tapi sub $2 ikut. `subscription` baru ($2.50) baru unggul bila pemain **mematikan ads** dan mengandalkan loyalitas (churn −0.00005). Ini sesuai desain trade-off (growth turun 35% demi ARPU lebih tinggi & churn lebih rendah). Validasi akhir vs biaya operasional (gaji + server) dilakukan di Fase G.

---

## 7. Perubahan File

| File | Perubahan |
|---|---|
| `docs/update/update_v1.5.1.md` | **BARU** — dokumen ini |
| `src/systems/monetization.ts` | Rewrite: `getAdPlatformLevel`, `adsRevenuePer100Users`, `calculateAdsRevenue` (§1); `calculateB2BRevenue` (§2); `calculateSubscriptionRevenue` $2.50 + `calculateFreemiumRevenue` (§3); `getMonetizationMods` (§5); `calculateRevenue` signature + `opts` + field `b2b`/`freemium` |
| `src/systems/compliance.ts` | `calcRequirements`: override `DATA_RATES.business` 0.3→0.45 saat Payment Gateway aktif (§4) |
| `src/systems/platform.ts` | Helper `hasActiveSynergy(features, productId)` |
| `src/store/gameStore.ts` | Import `hasActiveSynergy`, `getMonetizationMods`; `setMonetizationStrategy` action; modifier growth/churn di `incrementTick`; pass `opts` ke 3 `calculateRevenue` |

---

## 8. Checklist

- [x] `monetization.ts` — `calculateAdsRevenue` linear berbasis `adPlatformLevel`, fallback flat `$2` (backward compatible)
- [x] `monetization.ts` — `calculateB2BRevenue` (§2), baca `dataRatio`
- [x] `monetization.ts` — `calculateSubscriptionRevenue` `$2.50/user` (§3)
- [x] `monetization.ts` — `calculateFreemiumRevenue` (5% × $3)
- [x] `compliance.ts` — override Data requirement Business 0.3→0.45 saat `paymentGatewayActive` (§4)
- [x] `platform.ts` — `hasActiveSynergy`
- [x] `gameStore.ts` — `getMonetizationMods` diterapkan ke `userDelta` & `churn` di `incrementTick`
- [x] `gameStore.ts` — `setMonetizationStrategy` action
- [x] `gameStore.ts` — 3 pemanggilan `calculateRevenue` membawa `opts` (strategy, productId, dataRatio, synergyActive)
- [x] Sanity check angka manual 1k/20k/200k (§6)
- [x] Build sukses (`tsc -b` + `vite build`)
- [x] Lint: tanpa error baru

---

## 9. Catatan Rekonsiliasi

- **`'none'` = legacy exact.** Agar 100% backward compatible, `strategy === 'none'` menghitung ads flat `$2/100` **plus** subscription `$2/user` bila Payment Gateway aktif (perilaku sistem lama persis). Strategi eksplisit (`text_ads`/`video_ads`/`targeted_ads`/`freemium`/`subscription`) adalah model baru yang menggantikan perilaku default.
- **Import type.** `monetization.ts` mengimpor `MonetizationStrategy` via `import type` dari `store/gameStore` (sudah jadi konvensi sejak Fase A) — tidak ada circular runtime dependency.
- **Growth/churn subscription di tick loop, bukan di `monetization.ts`.** Rumus growth saat ini (`0.005 × cohesion`) & churn berada di `incrementTick`; multiplier ×0.65 dan churn −0.00005 diterapkan di sana (§5), konsisten dengan desain doc (penalti menyentuh dinamika user, bukan sekadar angka revenue).
- **UI menyusul (Fase C).** `setMonetizationStrategy` sudah ada agar logic testable; radio/toggle + preview efek dibuat di Fase C `FeaturesPanel.tsx`.

---

## 10. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).

---

## 11. Addendum — Web Load Water-Fill Bug Fix

Ditemukan saat kerja Fase B: node milik pemain (di rack) crash padahal rented server punya kapasitas web kosong (~50%). Akar masalah di `src/systems/server.ts` `calculateNodeLoads`:

- Web server pakai **sequential water-fill** lama: isi server *pertama* sampai 100%, baru spill ke berikutnya. Karena owned node duluan dimasukkan ke `webEntries`, mereka ke-load ke 100% → status `overloaded` → `crashTicks` naik → crash, sementara rented server menganggur.
- DB (`totalDbCapacity`) sudah proporsional (aman); hanya web yang rusak.

### Fix
Ganti sequential → **proportional water-fill**: tiap web server (owned + rented) membawa porsi `capacity_i / totalWebCap` dari load, sehingga utilitas % seragam = `rpsAfterCache / totalWebCap × 100` untuk semua server (owned maupun rented).
- Owned node ikut dipakai (prioritas node aktif terpenuhi) tapi tidak overload selama total kapasitas cukup.
- Menambah node di rack justru **menurunkan** utilisasi semua server (karena `totalWebCap` naik) → sistem makin sustain.
- Baru semua server >100% bila `totalWebCap < rpsAfterCache` (fair overload, sesuai kapasitas).

### Perubahan File
| File | Perubahan |
|---|---|
| `src/systems/server.ts` | `calculateNodeLoads`: web load proporsional (owned + rented), bukan sequential-to-100% |

### Checklist Addendum
- [x] Web load proporsional di `calculateNodeLoads`
- [x] Build sukses; lint tanpa error baru (2 error `ServerRoomView` pre-existing)

---

## 12. Addendum — Load Balancer Fix & Ambang Overload Realistis

Ditemukan saat kerja Fase B: node `load_balancer` punya deskripsi "-10% chance overload" (`servers.ts`) tapi `hasLoadBalancer()` (`events.ts`) **tidak dipanggil di mana pun** → efek mati. Satu-satunya efek LB yang jalan adalah `+0.3` ke `securityLevel` (meredam event acak). Sesuai diskusi real-case (LB = router di depan pool, health-check, 100% utiliasi = penuh aman bukan crash), dilakukan 2 perbaikan di `calculateNodeLoads`:

### 12.1 Wire `hasLoadBalancer` ke crash (-10%)
- Import `hasLoadBalancer` dari `./events` (aman, tidak circular).
- `lbActive = hasLoadBalancer(racks)` dihitung 1× di `calculateNodeLoads`.
- **Web overload**: akumulasi `crashTicks` dilewati dengan probabilitas 10% bila `lbActive` (`if (!(lbActive && Math.random() < 0.1)) newCrashTicks += 1`).
- **DB overload**: sama, reduksi 10% pada akumulasi `crashTicks`.
- **Heat overheat**: `crashChance` dikali `0.9` bila `lbActive`.

### 12.2 Ambang overload realistis (`>100%`, bukan `>=100%`)
Model nyata: 100% = penuh tapi aman; hanya `>100%` (demand melebihi kapasitas) yang overload & akumulasi crash.
- Web: `if (newLoad >= 100)` → `if (newLoad > 100)`.
- DB: `if (newLoad >= 100)` → `if (newLoad > 100)`.
- Status `overloaded` (warning, ≥80%) & `crashTicks` reset tetap sama; hanya ambang crash naik.

### Perubahan File
| File | Perubahan |
|---|---|
| `src/systems/server.ts` | `calculateNodeLoads`: import `hasLoadBalancer`; `lbActive`; reduksi 10% crash (web/db/heat); ambang overload `>100%` |

### Checklist Addendum 12
- [x] `hasLoadBalancer` di-wire ke crash web/db/heat (-10%)
- [x] Ambang overload `>100%` (100% = full-safe)
- [x] Build sukses; lint tanpa error baru (2 error `ServerRoomView` pre-existing)
