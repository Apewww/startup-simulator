# Update V1.6 — Ad Sales Pipeline (Ad Monetization Specialist + Manual Negotiation)

**Induk:** `docs/upcoming_features v3.md` — V1.6
**Tujuan:** Revenue aktif — pemain bisa jual jasa iklan ke client luar lewat role Ad Monetization Specialist. Negosiasi manual: pemain tentukan durasi campaign + harga per hari, sukses/gagal berdasarkan kewajaran tawaran terhadap platform value.

---

## Perubahan

### 1. Role Baru: Ad Monetization Specialist

- `EmployeeRole` baru: `Ad_Monetization_Specialist`
- Unlock saat `currentUsers >= 5.000` **dan** fitur `ad_platform` Lv. >= 3
- Notifikasi unlock muncul satu kali
- Recruitment filter: hanya muncul di applicant pool setelah unlock
- Nama pool: Sterling, Blake, Phoenix, Rowan, Sage, Jade, Onyx, Zion

### 2. Continuous Searching (tidak auto-stop)

- Klik [Find Leads] → specialist mulai searching terus sampai tombol [Stop] ditekan
- Selama searching: lead muncul gradual dengan random chance per tick:

```
chance per tick = 0.08 × emp.speed × (1 - existingCount / maxLeads)
```

- Max leads per tier: Small 3, Medium 4, Enterprise 5
- Specialist idle > 30 tick → happiness decay ×3 (0.15/tick)

### 3. Manual Negotiation (no RNG, deterministik)

- Player klik [Negotiate] pada lead → form inline:
  - Duration slider (7–180 hari)
  - Price per day input
  - Estimated rate bar (hijau/merah/oranye)
- Klik [Send Offer] → specialist mulai negosiasi
- Setelah durasi negosiasi selesai → hasil deterministik:

```
platformMultiplier = 1 + (users × 0.00001 + adPlatformLevel × 0.1 + synergy × 0.2)
minTotal = budget × 0.4
maxTotal = budget × platformMultiplier

SUCCESS jika: minTotal <= offeredPrice × offeredDays <= maxTotal
```

- Tidak ada random roll. Jika tawaran dalam range → deal auto accepted.

### 4. Campaign & Revenue

- Campaign aktif: `revenuePerTick = dealValue / totalTicks`
- Revenue per tick ditambahkan ke cash setiap tick (bukan cuma bulanan)
- Monthly billing: `campaignMonthlyRevenue = sum(revenuePerTick) × 600`

### 5. Auto-Renew Perk

- Perk `sales_auto_renew` (cost 2) — unlock di Perks panel
- Saat campaign selesai, specialist auto-renew dengan loyal client (selalu sukses)
- Renewal value: 70–90% dari original deal
- Max 5 renewal per client

### 6. Finance Panel

```
Income:
  Ads Revenue:        $1,200   (passive formula)
  Ad Campaigns:       $2,800   ← active campaign revenue
  Subscription:       $950
```

### 7. Chart Fix

- CashFlowChart hover tooltip: `pointer-events: all` + posisi dinamis (mengikuti bar) + `z-50`

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/types/adSales.ts` | **BARU** — `AdLead`, `AdCampaign` |
| `src/data/clientNames.ts` | **BARU** — 20 nama perusahaan |
| `src/systems/adSales.ts` | **BARU** — lead gen, evaluateOffer, makeCampaign, auto-renew |
| `src/components/AdSalesPanel.tsx` | **BARU** — panel ad sales |
| `src/types/employee.ts` | Role `Ad_Monetization_Specialist` + field `failStreak` |
| `src/types/index.ts` | Export `AdLead`, `AdCampaign` |
| `src/data/perks.ts` | Perk `sales_auto_renew` |
| `src/store/gameStore.ts` | State + actions + incrementTick hooks |
| `src/systems/recruitment.ts` | `ALL_ROLES` export + salary specialist |
| `src/systems/saveLoad.ts` | Save/load 3 field baru |
| `src/db/gameDB.ts` | Dexie v13 |
| `src/components/Dock.tsx` | Tombol Ad Sales (shortcut 7) |
| `src/components/CharacterAvatar.tsx` | Role meta specialist |
| `src/components/CashFlowChart.tsx` | Fix hover tooltip |
| `src/components/FinancePanel.tsx` | Ad Campaigns revenue breakdown |
| `src/App.tsx` | FloatingPanel Ad Sales |
| `docs/upcoming_features v3.md` | V1.6 ✅ |

---

## Checklist

- [x] Types + data foundation
- [x] Role recruitment & unlock notification
- [x] Continuous searching + gradual lead reveal
- [x] Manual negotiation form (days + price)
- [x] Deterministic negotiation evaluation
- [x] Campaign lifecycle & revenue per tick
- [x] Auto-renew perk
- [x] Specialist idle mood penalty
- [x] Finance panel revenue breakdown
- [x] Chart hover fix
- [x] Save/load Dexie v13
- [x] Build sukses (`tsc -b` + `vite build`)
