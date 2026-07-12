# Update V1.5.2 — Product Monetization Rebalance: Fase C (Monetization UI)

**Induk:** `docs/upcoming_features v2.md` → **Fase C — Monetization UI**
**Prasyarat:** `docs/update/update_v1.5.1.md` (Fase B) — seluruh logic monetisasi sudah jalan (`calculateAdsRevenue` linear, `calculateB2BRevenue`, subscription $2.50, freemium, `getMonetizationMods`, action `setMonetizationStrategy` di `gameStore.ts`). Fase C hanya menambah UI untuk memilih & mem-pratinjau strategi; tidak ada perubahan rumus.
**Tujuan:** Beri pemain kontrol eksplisit atas `activeMonetization` lewat `FeaturesPanel.tsx` (radio/toggle + requirement + preview efek), dan tampilkan indikator strategi aktif di `HudBar.tsx`. Game tetap backward-compatible: default `'none'`.

---

## 1. Section "Monetization Strategy" — `src/components/FeaturesPanel.tsx`

Tambah komponen `MonetizationStrategySection` (render di atas Inventory). Mengambil state dari store:
- `activeMonetization`, `setMonetizationStrategy`
- `currentUsers`, `features`, `racks`, `rentedServers`, `selectedProduct`, `events`

Helper perhitungan (sudah tersedia):
- `getAdPlatformLevel(features)` — `systems/monetization.ts`
- `hasActiveSynergy(features, selectedProduct)` — `systems/platform.ts`
- `getPlatformStats(features, events, selectedProduct)` → `cohesionScore`, `synergyRevenueBonus`
- `getComplianceStatus(features, racks, rentedServers)` → `data.ratio`, `revenueMult`

### 1.1 Daftar Strategi & Availability

| `strategy` | Label | Requirement agar **aktif** (di-disable, bukan disembunyikan) |
|---|---|---|
| `none` | No Ads (Legacy) | Selalu |
| `text_ads` | Text Ads | `ad_platform` Lv ≥ 1 (hanya Social Media / Search Engine) |
| `video_ads` | Video Ads | `ad_platform` Lv ≥ 1 |
| `targeted_ads` | Targeted Ads | `ad_platform` Lv ≥ 5 **+** `synergyActive` **+** `dataRatio ≥ 1` |
| `freemium` | Freemium | ≥1 fitur `business` Lv.3 (semua produk) |
| `subscription` | Subscription | `payment_gateway` aktif (hanya E-Commerce) |

Helper lokal:
```ts
const adPlatformLevel = getAdPlatformLevel(features);
const paymentGatewayActive = features.some(f => f.id === 'payment_gateway' && f.level > 0 && f.enabled);
const hasBusinessLv3 = features.some(f => f.group === 'business' && f.level >= 3 && f.enabled);
const synergyActive = hasActiveSynergy(features, selectedProduct);
const dataRatio = compliance?.data.ratio ?? 1;

function getAvailability(id: MonetizationStrategy): { ok: boolean; reason: string } { /* lihat §1.1 tabel */ }
```

Opsi yang belum unlock **tetap ditampilkan tapi di-disable** + teks reason (biar pemain tahu apa yang perlu dikejar).

### 1.2 Preview Efek (sebelum konfirmasi switch)

Untuk tiap opsi yang aktif, hitung:
```ts
const rev = calculateRevenue(
  currentUsers, features, racks,
  cohesionScore * (compliance?.revenueMult ?? 1),
  platformStats.synergyRevenueBonus,
  { strategy: id, productId: selectedProduct, dataRatio, synergyActive }
);
const mods = getMonetizationMods(id);
```
Tampilkan:
- **Projected:** `$${rev.total}/mo` (format compact).
- Chip modifier bila berbeda dari default:
  - `subscription` → `growth ×0.65`, `churn −0.00005`
  - `video_ads` → `churn +0.0001`
- Opsi terpilih di-highlight (border/background `indigo`).
- Klik opsi aktif → `setMonetizationStrategy(id)`.

> `subscription` menampilkan preview murni $2.50/user (tanpa ads); `freemium` menampilkan ads + 5% premium; `none` = baseline legacy (ads flat + sub $2 bila gateway).

---

## 2. Indikator Strategi Aktif — `src/components/HudBar.tsx`

Ambil `activeMonetization` dari store. Tambah tag kecil di dekat dot compliance:

| `strategy` | Tag | Tooltip |
|---|---|---|
| `none` | `NONE` | No Ads (legacy) |
| `text_ads` | `ADS·TEXT` | Text Ads |
| `video_ads` | `ADS·VIDEO` | Video Ads (+churn) |
| `targeted_ads` | `ADS·TARGET` | Targeted Ads (×1.5 bila synergy) |
| `freemium` | `FREEMIUM` | Freemium 5% @ $3 |
| `subscription` | `SUB` | Subscription $2.50/user |

Render sebagai `span` kecil (`text-[10px]`, border) dengan `title` berisi detail. Tidak mengubah layout yang ada.

---

## 3. Perubahan File

| File | Perubahan |
|---|---|
| `docs/update/update_v1.5.2.md` | **BARU** — dokumen ini |
| `docs/upcoming_features v2.md` | Mark `Fase C` → moved ke doc ini |
| `src/components/FeaturesPanel.tsx` | Section `MonetizationStrategySection` (radio + requirement + preview + chip mood) |
| `src/components/HudBar.tsx` | Tag indikator strategi aktif + indikator User Mood |

---

## 4. Checklist

- [x] `FeaturesPanel.tsx` — section "Monetization Strategy" dengan 6 opsi radio/toggle
- [x] Opsi di-disable + reason bila requirement belum terpenuhi (tidak disembunyikan)
- [x] Preview `$${rev.total}/mo` + chip modifier (growth/churn) per opsi aktif
- [x] Klik → `setMonetizationStrategy(id)`; opsi aktif di-highlight
- [x] `HudBar.tsx` — tag strategi aktif (+tooltip)
- [x] Build sukses (`tsc -b` + `vite build`)
- [x] Lint: tanpa error baru (2 error `ServerRoomView` pre-existing, di luar scope)
- [ ] Playtest manual: 1 sesi per produk (Social Media / E-Commerce / Search Engine) — switch strategi, cek preview & efek revenue berjalan (rekomendasi Fase G)

---

## 5. Catatan Rekonsiliasi

- **UI + sedikit logic.** Fase C inti murni UI (§1–§2). Addendum §7 menambah logic `userMood` yang digabung ke `churn` — bukan sistem mandiri, sesuai prinsip "no parallel system" di `upcoming_features v2.md` §0.
- **Availability ≠ revenue-gating.** `video_ads` & `targeted_ads` bisa dipilih bila `ad_platform` ada; tapi rumus Fase B sudah menangani fallback (di bawah Lv.5 → flat $2; targeted tanpa synergy/data → ×1.0). UI cukup disable `targeted_ads` saat prasyarat *meaningful* belum lengkap, supaya pemain tidak memilih opsi yang secara efektif sama dengan flat.
- **Dev mode.** `setMonetizationStrategy` sudah callable dari Dev Panel (Fase B); Fase C tidak menambah tombol Dev baru (opsional).

---

## 6. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).

---

## 7. Addendum — User Mood (kepuasan, digabung ke churn)

Ditambahkan setelah Fase C (masih rilis v1.5.2) untuk memberi tiap strategi **ciri khas** lewat dimensi kepuasan user. Mood `0–100` (netral `80`) **bukan stat mandiri yang dirawat** — tiap tick drift ke `moodTarget` strategi, lalu selisih dari baseline **ditambahkan ke `churn` yang sudah ada** (`incrementTick`). Satu arah, tanpa sistem recovery/systems paralel baru.

### 7.1 Konstanta (`systems/monetization.ts`)
```
MOOD_BASELINE   = 80
MOOD_DRIFT_RATE = 0.03   // per tick menuju target
MOOD_PENALTY_K  = 0.00004 // churn per mood-point di bawah baseline
```

### 7.2 `moodTarget` per strategi (ciri khas)
| Strategi | `moodTarget` | Karakter | Efek ke churn |
|---|---|---|---|
| `none` | 85 | Bersih | netral (penalty 0) |
| `text_ads` | 72 | Intrusif ringan | ▲ kecil |
| `video_ads` | 55 | Intrusif sedang | ▲ besar |
| `targeted_ads` | `78` (synergy+data ok) / `45` (syarat rusak → anjlok) | "Relevan" high-skill | ▲ kecil / ▲ besar |
| `freemium` | 80 | Hybrid ramah | netral |
| `subscription` | 92 | Premium → user betah | ▼ (loyalty bonus, + churnDelta −0.00005) |

Contoh: `video_ads` steady-state mood 55 → `churn += (80−55) × 0.00004 = 0.001/tick` (ditambah churnDelta +0.0001). Moderat, tidak membekukan growth (sesuai prinsip §0).

### 7.3 Implementasi
- `systems/monetization.ts` — `getMoodTarget(strategy, synergyActive, dataRatio)` + 3 konstanta.
- `store/gameStore.ts`:
  - Interface + init `userMood: 80`.
  - `selectProduct` & `restartGame` reset `userMood: 80`.
  - `incrementTick`: drift `newMood`, hitung `moodPenalty = max(0, (BASELINE−newMood)×K)`, gabung ke `churn` (`baseChurnRate + moodPenalty`); tulis `userMood: newMood` di `set()`. `synergyActive` & `earlyDataRatio` dihitung lebih awal (setelah `complianceBefore`) agar `churn`/`newCurrentUsers` tersedia sebelum pengecekan `hasWebCapacity`.
- `systems/saveLoad.ts` — save/load `userMood` (`?? 80`).
- `db/gameDB.ts` — `GameSave.userMood?: number` (field non-indexed → **tidak perlu** bump schema Dexie).
- `components/FeaturesPanel.tsx` — tiap opsi tunjukkan chip `mood ▲/▼/◆`; opsi aktif tunjukkan mood saat ini (`mood {n}`).
- `components/HudBar.tsx` — indikator mood (`●{n}` berwarna: hijau ≥80, amber ≥60, merah <60) di dekat tag monetisasi, tooltip berisi status.

### 7.4 Checklist Addendum
- [x] `getMoodTarget` + konstanta di `monetization.ts`
- [x] `userMood` state (init/selectProduct/restartGame) + drift & `moodPenalty` di `incrementTick`
- [x] save/load `userMood` (+ `GameSave.userMood?`)
- [x] UI: chip mood di `FeaturesPanel`, indikator mood di `HudBar`
- [x] Build sukses (`tsc -b` + `vite build`)
- [x] Lint: tanpa error baru (2 error `ServerRoomView` pre-existing)
- [ ] Balancing pass (Fase G): simulasi mood steady-state per strategi di 1k/20k/200k users, pastikan churn tambahan proporsional
