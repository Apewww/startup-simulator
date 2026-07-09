# Update V1.3.2 — SysAdmin & Funding Rounds

**Induk:** `docs/update_v1.3.1.md` (Cash Flow Chart)
**Tujuan:** Implementasi efek SysAdmin untuk server management dan sistem investor/funding round sederhana.

---

## 1. Efek SysAdmin

SysAdmin kini memiliki efek nyata pada infrastruktur server:

### Recovery Otomatis
- Node yang **crash** akan otomatis pulih setelah N tick
- Waktu recovery: `max(3, 10 - level * 2)` tick
- SysAdmin level tinggi = recovery lebih cepat

### Pengurangan Crash Chance
- Chance crash saat overheat berkepanjangan: `max(0.01, 0.05 - level * 0.008)`
- Level 1: ~4.2% → Level 5: ~1% → Level 10: ~0.01%
- Efek hanya aktif jika SysAdmin memiliki happiness ≥ 15

### Perubahan File

| File | Perubahan |
|---|---|
| `src/systems/server.ts` | `calculateNodeLoads()` menerima `sysAdminLevel`, recovery logic, crash chance scaling |
| `src/store/gameStore.ts` | Hitung `sysAdminLevel` dari employees di `incrementTick`, passing ke `calculateNodeLoads` |

---

## 2. Sistem Investor / Funding Round

Funding round otomatis ditawarkan setiap 6 bulan in-game jika metrik mencukupi.

### Formula Eligibility
```
score = users * 0.1 + revenue * 0.05 + month * 20
if score < 500 → no offer
amount = score * 12
equity = max(5, min(40, 40 - score / 200))
```

### Mekanik
- Offer muncul otomatis di HUD bar sebagai tombol hijau "Funding Offer"
- Pemain bisa **Accept** (dapat cash) atau **Decline**
- Setiap round meningkatkan equity yang diminta
- History funding ditampilkan di panel Funding

### State Baru

```ts
export interface FundingRound {
  id: string;
  round: number;
  amount: number;
  equityGiven: number;
  accepted: boolean;
  month: number;
}
```

### UI
- **FundingPanel.tsx** — panel baru dengan pending offer, eligibility metrics, round history
- **FinancePanel** — toggle baru "Funding" di bawah Cash Flow Chart
- **HudBar** — badge hijau animasi saat ada pending offer

### Perubahan File

| File | Perubahan |
|---|---|
| `src/types/employee.ts` | BARU — `FundingRound` interface, `calcSysAdminEffect()`, `calcFundingOffer()` |
| `src/types/index.ts` | Export `FundingRound` |
| `src/store/gameStore.ts` | Tambah `fundingRounds`, `pendingFunding` state + actions: `checkFundingEligibility`, `acceptFunding`, `declineFunding`; check funding di `incrementTick` |
| `src/components/FundingPanel.tsx` | BARU — komponen panel funding |
| `src/components/FinancePanel.tsx` | Integrasi FundingPanel toggle |
| `src/components/HudBar.tsx` | Badge funding offer |
| `src/components/MainMenu.tsx` | Update versi ke v1.3.2 |
| `src/systems/saveLoad.ts` | Save/load `fundingRounds`, `pendingFunding` |
| `src/db/gameDB.ts` | Tambah field ke `GameSave`, DB version 4 |
| `docs/02_TASK.md` | Update checklist |

---

## 3. Checklist

- [x] SysAdmin recovery effect (crash → auto-recover berdasarkan level)
- [x] SysAdmin crash chance reduction
- [x] FundingRound type + formula
- [x] Auto-offer setiap 6 bulan di incrementTick
- [x] FundingPanel UI (accept/decline, history, eligibility)
- [x] Integrasi di FinancePanel
- [x] HUD badge untuk pending offer
- [x] Save/load support
- [x] DB migration version 4
- [x] Main Menu versi v1.3.2
- [x] Build sukses (typecheck + lint)

---

## 4. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).