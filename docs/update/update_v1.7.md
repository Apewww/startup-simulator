# Update V1.7 — Pricing Controls & Banking

**Induk:** `docs/upcoming_features v3.md` — V1.7
**Tujuan:** Pricing slider per produk (revenue/growth/mood trade-off) + sistem pinjaman bank (business loan, credit score).

---

## Ringkasan Fitur

### 1. Pricing Slider

Tiap produk punya 4 pricing tier dengan trade-off: harga tinggi → revenue naik, growth turun, mood target turun.

**Social Media — Ad Frequency:**
| Tier | Label | Revenue × | Growth × | Mood Target |
|------|-------|-----------|----------|-------------|
| 0 | Light (non-intrusive) | 1.0 | 1.0 | 85 |
| 1 | Moderate | 1.3 | 0.90 | 75 |
| 2 | Aggressive | 1.6 | 0.80 | 65 |
| 3 | Saturated | 2.0 | 0.65 | 50 |

**E-Commerce — Transaction Fee:**
| Fee | Revenue × | Growth × | Mood Target |
|-----|-----------|----------|-------------|
| 1% | 1.0 | 1.0 | 82 |
| 2% | 1.8 | 0.90 | 76 |
| 3% | 2.5 | 0.78 | 68 |
| 5% | 3.5 | 0.55 | 50 |

**Search Engine — API Pricing:**
| Price/1k calls | Revenue × | Growth × | Mood Target |
|----------------|-----------|----------|-------------|
| $0.001 | 1.0 | 1.0 | 84 |
| $0.005 | 2.5 | 0.85 | 75 |
| $0.01 | 4.0 | 0.70 | 62 |
| $0.02 | 6.0 | 0.45 | 45 |

### 2. Banking — Business Loan

- `maxLoan = max(5000, companyValuation × 0.3)`
- Tenor: 6/12/24 bulan, APR: 8/10/12%
- Hanya 1 loan aktif dalam satu waktu
- Default jika `missedPaymentTicks >= 90` (3 bulan)
- Credit score 0–100, default 50, naik/turun berdasarkan event pembayaran
- Credit score < 30 → maxLoan ×0.5. Credit score > 80 → interestRate -0.02

---

## Files Changed

| File | Perubahan |
|------|----------|
| `src/types/monetization.ts` | BARU: `PricingTier` + `BusinessLoan` + pricing data per produk |
| `src/systems/banking.ts` | BARU: loan logic (ambil, bayar, default, credit score) |
| `src/systems/monetization.ts` | Pricing multiplier integration ke `calculateRevenue` + growth/mood |
| `src/store/gameStore.ts` | State: `activePricingTier`, `loan`, `creditScore`, `missedPaymentTicks`. Actions: `setPricingTier`, `takeLoan`, `payLoanEarly`, `updateMoodFromPricing`. Tick hook: loan billing check |
| `src/components/FeaturesPanel.tsx` | Section pricing slider di bawah Monetization Strategy |
| `src/components/BankingPanel.tsx` | BARU: credit score, active loan, take loan form |
| `src/components/Dock.tsx` | Tombol Banking (shortcut 8) |
| `src/App.tsx` | FloatingPanel Banking |
| `src/db/gameDB.ts` | Dexie v14 |
| `src/systems/saveLoad.ts` | Save/load 4 field baru |

---

## Checklist

- [x] Types: `PricingTier` + `BusinessLoan` + pricing data per produk
- [x] Store: state + actions pricing/loan/credit
- [x] Store: `incrementTick` — mood dari pricing, loan billing check
- [x] Systems: `banking.ts` — `takeLoan`, `payLoanEarly`, default check, credit score
- [x] Systems: `monetization.ts` — pricing multiplier di `calculateRevenue`, growth/mood effect
- [x] UI: Pricing slider di `FeaturesPanel.tsx`
- [x] UI: `BankingPanel.tsx`
- [x] UI: Dock button Banking (shortcut 8)
- [x] UI: Register FloatingPanel di `App.tsx`
- [x] Save/load: Dexie v14 + 4 field baru
- [x] Build sukses (`tsc -b` + `vite build`)
