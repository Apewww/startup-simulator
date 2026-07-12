# Update V1.5.3 — Router Node → Internet Service Rental

**Tujuan:** Ganti node `router` (fisik di rack) dengan fitur **sewa layanan internet** — 3 provider, masing-masing dengan paket kecepatan bertingkat (100 / 300 / 500 / 1000 / 2000 Mbps). Internet mengakomodasi 3 efek sekaligus terhadap requirement: **network points** (memenuhi compliance network, menggantikan peran router), **bonus RPS** (kapasitas serve tambahan), dan **mood/user-satisfaction** (kecepatan tinggi = user betah). Tiap provider punya kelebihan & kelemahan.

**Prinsip:** konsisten dengan `upcoming_features v2.md` §0 — trade-off nyambung ke sistem yang sudah ada (compliance network, water-fill RPS, user mood), tanpa sistem paralel baru. Internet adalah *rental* bulanan (seperti VPS/Dedicated).

---

## 1. Data — `src/data/internet.ts` (BARU)

### Ladder kecepatan bersama (`INTERNET_TIERS`)
| Speed | Network | RPS Bonus | Mood Bonus | Base Cost/mo |
|---|---|---|---|---|
| 100 Mbps | 1 | 150 | 0.02 | $40 |
| 300 Mbps | 2.5 | 400 | 0.03 | $90 |
| 500 Mbps | 4 | 700 | 0.04 | $160 |
| 1000 Mbps | 7 | 1200 | 0.05 | $280 |
| 2000 Mbps | 11 | 2000 | 0.06 | $480 |

### 3 Provider (masing-masing modifikasi via multiplier → "paketnya" punya nilai efektif sendiri)
| Provider | Accent | Kelebihan | Kelemahan | cost× | net× | rps× | mood× | Tier tersedia |
|---|---|---|---|---|---|---|---|---|
| **NusantaraNet** | `#17A366` | Termurah & SLA stabil | Cap 500 Mbps, RPS kecil | 0.8 | 1.0 | 0.7 | 0.9 | ≤500 |
| **AeroLink** | `#4F5EFF` | Speed tertinggi (2G) & RPS terbesar | Mahal & mood netral | 1.4 | 1.2 | 1.4 | 0.3 | semua |
| **RakyatFiber** | `#F59E0B` | Mood/user-satisfaction terbesar | RPS sedang, max 1G | 1.0 | 1.0 | 1.0 | 1.6 | ≤1000 |

Helper: `getInternetProvider`, `getInternetTier`, `makeInternetSubscription(providerId, tierId)` → hitung nilai efektif (network/rps/mood/cost) via multiplier.

---

## 2. Types — `src/types/server.ts`
- Hapus `'router'` dari `NodeTypeId` & `NodeCategory`.
- Tambah: `InternetProviderId`, `InternetTierDef`, `InternetProviderDef`, `InternetSubscription`.
- `src/types/index.ts` — re-export ke-4 tipe baru.

---

## 3. Compliance — `src/systems/compliance.ts`
- `calcProvidedPoints(racks, rentedServers, internetSubs=[])` → jumlahkan `network` dari `internetSubs`.
- `getComplianceStatus(..., internetSubs=[])` meneruskan ke `calcProvidedPoints`.
- Call site diperbarui: `incrementTick` (2x), `checkFundingEligibility`, `HudBar`.

---

## 4. Server — `src/systems/server.ts`
- Hapus 3 penanganan `router`: exclusions di `calcServerStats` (`:86`, `:366`) dan `rackCooling += 5` di `calculateNodeLoads` (`:280`).
- `calculateNodeLoads(..., extraWebCapacity=0)` → `totalWebCap += extraWebCapacity` (bonus RPS internet masuk sebagai kapasitas web).
- `calcMonthlyServerCost(racks, rentedServers, internetSubs=[])` → tambah `∑ monthlyCost` internet.

---

## 5. Store & Tick — `src/store/gameStore.ts`
- State `internetSubscriptions: InternetSubscription[]` (init `[]`; reset di `selectProduct` & `restartGame`).
- Action `rentInternet(providerId, tierId)` (via `makeInternetSubscription`; cegah duplikat provider+tier) & `cancelInternet(id)`.
- `incrementTick`:
  - `internetRpsBonus = ∑ rpsBonus` → arg ke-6 `calculateNodeLoads`.
  - `internetMoodSum = ∑ moodBonus` → `moodTarget = min(100, getMoodTarget(...) + internetMoodSum×100)`.
  - `internetSubs` diteruskan ke 2 `getComplianceStatus` (network requirement).
  - `calcMonthlyServerCost(..., internetSubs)`.

---

## 6. Persistensi — `src/systems/saveLoad.ts` + `src/db/gameDB.ts`
- `GameSave.internetSubscriptions?`.
- Save/load `internetSubscriptions` (`?? []`).
- **Migrasi:** rack dari save lama yang masih punya node `router` → node dibuang (`null`) saat load (router sudah bukan tipe valid).

---

## 7. UI
- `src/components/ServerShop.tsx` — section **Internet Service**: 3 provider card (nama berakcent, tagline, ▲strength / ▼weakness), grid tombol per tier (speed, `Net +n`, `+n RPS`, `mood +n%`, `$/mo`), tombol disable + badge "Aktif" bila sudah disewa. Daftar **Active Subscriptions** dengan tombol cancel (X). Hapus ikon `Router` dari `CATEGORY_ICON`.
- `src/components/ServerRoomView.tsx` — hapus `router` dari `CATEGORY_COLORS`.
- `src/components/HudBar.tsx` — tag `NET {topSpeed}M` (warna indigo) di dekat indikator mood; tooltip berisi daftar provider aktif.

---

## 8. Checklist
- [x] Types: hapus `router`, tambah 4 tipe internet + re-export index
- [x] Data: `internet.ts` (3 provider, ladder 100–2000 Mbps, helper)
- [x] `servers.ts`: hapus def node `router`
- [x] Compliance: `internetSubs` → network points
- [x] Server: hapus handling router; `extraWebCapacity` (RPS); internet di monthly cost
- [x] Store: state + `rentInternet`/`cancelInternet` + integrasi tick (RPS/mood/network/cost)
- [x] Save/load + migrasi node router lama
- [x] UI: ServerShop (3 provider, tier, strength/weakness, cancel), ServerRoomView, HudBar tag
- [x] Build sukses (`tsc -b` + `vite build`)
- [x] Lint: tanpa error baru (2 error `ServerRoomView` pre-existing)
- [ ] Balancing pass (Fase G): validasi nilai tier/multiplier vs biaya operasional & efek ke compliance/user

---

## 9. Catatan
- **Router benar-benar dihapus** (node fisik). Kini memenuhi requirement network compliance wajib lewat internet rental (atau rented server yang punya `network`, mis. Dedicated/Cloud). Pemain baru tidak lagi punya node router di shop.
- **Efek terpadu:** internet bukan sekadar "gimmick speed" — ia menyumbang ke 3 sistem nyata sekaligus (compliance network, kapasitas RPS via water-fill, user mood → churn), sesuai permintaan "ketiga opsi diakomodir".
- **Dev mode tetap** hanya di `npm run dev`.
