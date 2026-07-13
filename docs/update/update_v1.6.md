# Update V1.6 — Ad Sales Pipeline (Redesigned)

**Induk:** `docs/upcoming_features v3.md` — V1.6
**Tujuan:** Revenue aktif — pemain bisa jual jasa iklan ke client luar lewat role Ad Monetization Specialist. Simplified: instant Accept + instant Negotiate, no tick-based negotiation.

---

## Perubahan dari Desain Awal

V1.6 di-rebuild dari konsep awal. Perbedaan utama:

| Aspek | V1.6 Awal | V1.6 Baru (implementasi) |
|---|---|---|
| Search duration | 24-50 tick (level-based) | Fixed **3 hari (72 tick)** |
| Search cap | Per user tier (3-5) | Per specialist **level × 5** |
| Lead muncul | Random chance per tick | Gradual via `calcLeadGenChance(speed, count, cap)` |
| matchPercent | Ya, mempengaruhi success | **Dihapus** — client punya budget, itu acuan |
| Negosiasi | Tick-based (12-30 tick), specialist harus idle | **Instant** — hasil langsung, specialist gak perlu idle |
| Accept button | Tidak ada | **Ada** — instant campaign, budget penuh, defaultDays |
| Specialist busy guard | Ya, nego butuh specialist idle | **Tidak** — Accept & Negotiate selalu bisa |
| Notifikasi silent fail | Ya, guard silent return | **Tidak** — tiap guard kasih warning notification |
| Campaign default duration | Random 30-90 hari | `clamp(budget/400, 14, 90)` — proporsional budget |

---

## Ringkasan Sistem Baru

### 1. Search (3 hari)
- Klik [Find Leads] → specialist cari client selama **72 tick**
- Leads muncul gradual: `chance/tick = 0.04 × speed × (1 - count/cap)`
- Cap = **specialist level × 5** (Lv1=5, Lv2=10, Lv3=15)
- Auto-stop setelah 72 tick ATAU cap tercapai
- Tombol [Stop] untuk hentikan manual

### 2. Accept (Instant)
- Tombol hijau [Accept] di tiap lead
- Campaign langsung jadi: **budget penuh × defaultDays**
- `defaultDays = clamp(budget/400, 14, 90)`
- Tidak butuh specialist — player langsung setuju offer client

### 3. Negotiate (Instant)
- Tombol indigo [Negotiate] → form duration + price
- [Send Offer] → evaluasi INSTANT:
  - **Total ≤ budget → 100% accept** (garansi)
  - **Total > budget → chance penalty** (`max(10%, 100 - (ratio-1)×50)`)
- Hasil langsung: campaign (won) atau lead hilang (lost)

### 4. Campaign
- Revenue per tick: `round(dealValue / (days × 24))`
- Campaign progres tiap tick, auto-complete saat `ticksElapsed >= totalTicks`
- Auto-renew perk: renewal otomatis 70-90% value, max 5× per client

### 5. UI Changes
- Compact card per lead: `[Budget] · [Days] · [Price/d] ⏳Xd [Accept] [Negotiate] [×]`
- Search progress bar: leads found / cap + day counter
- Negotiating leads section dihapus (instant nego, gak perlu progress bar)
- CashFlowChart: revenue snapshot include campaign revenue

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/types/adSales.ts` | `matchPercent` → `defaultDays` |
| `src/systems/adSales.ts` | rewrite: `calcNegotiateChance`, `getSearchCap`, `calcDefaultDays`, `calcLeadGenChance`; hapus match/ctx |
| `src/store/gameStore.ts` | `acceptLead` baru; `sendOffer` instant; search timer 72 tick; hapus negotiating tick block |
| `src/components/AdSalesPanel.tsx` | Accept button; compact card; hapus isBusy guard; hapus negotiating section |
| `src/components/DevPanel.tsx` | Hapus matchPercent; pakai `calcNegotiateChance` |
| `src/components/FinancePanel.tsx` | Revenue breakdown: Ads Strategy, Ad Campaigns, B2B, Freemium |
| `src/components/CashFlowChart.tsx` | Tooltip clamp container; revenue snapshot fix |
| `docs/upcoming_features v3.md` | V1.6 redesigned ✅ |

---

## Checklist

- [x] Redesigned AdLead type (defaultDays instead of matchPercent)
- [x] Fixed 3-day search with level-based cap
- [x] Accept button — instant campaign, full budget
- [x] Negotiate — instant, total≤budget→100%, above→penalty
- [x] No specialist busy guard for Accept/Negotiate
- [x] Guard notifications instead of silent fail
- [x] Compact lead card UI
- [x] Cash flow chart revenue fix (include campaign)
- [x] Finance panel full revenue breakdown
- [x] Build sukses (`tsc -b` + `vite build`)
