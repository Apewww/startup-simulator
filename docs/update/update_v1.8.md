# Update V1.8 — Revenue Visualization & Pricing Bugfix

**Induk:** `docs/upcoming_features v3.md` — V1.8
**Tujuan:** Revenue breakdown, pricing impact preview, deal notifications. Plus fix pricing revenue multiplier tidak terpakai di 3 callsite.

---

## Bugfix: Pricing RevenueMult Tidak Efektif

**Akar masalah:** `pricingRevenueMult` sudah dikirim di `calculateRevenue` panggilan monthly billing (`gameStore.ts:705,753`), tapi **3 callsite lain tidak menyertakannya** — jadi revenue multiplier pricing tidak berpengaruh di tampilan & funding.

| Callsite | Sebelum | Sesudah |
|---|---|---|
| `gameStore.ts:843` — funding offer calc | `revOpts` tanpa pricing field | `+ pricingRevenueMult: getPricingTier(...)` |
| `FeaturesPanel.tsx:78` — monetization preview | passing objek tanpa pricing | `+ pricingRevenueMult` dari getPricingTier |
| `FinancePanel.tsx:32` — finance display | `{strategy, productId, dataRatio, synergyActive}` | `+ pricingRevenueMult` |

Efek setelah fix:
- FinancePanel tampilkan revenue × pricing benar
- Preview strategi monetisasi pakai angka × pricing
- Funding offer hitung valuation pakai revenue × pricing

---

## V1.8 Features

### 3.1 Deal Closing Notification
✅ Sudah sejak V1.6 — `addNotification` di `sendOffer` (L1052) & `acceptLead` (L1081), auto-dismiss 3s.

### 3.2 Revenue Breakdown
✅ Revenue sources (Ads, Campaigns, Subscription, B2B, Freemium) tampil di FinancePanel sejak V1.6.
✅ Loan Payment — tampil di Expenses + masuk ke net calculation.

### 3.3 Client History
✅ Active Campaigns + Completed Campaigns di AdSalesPanel.
✅ Lifetime total revenue dari campaigns tampil di History header.

### 3.4 Pricing Impact Preview
✅ Revenue ×, Growth ×, Mood target tampil inline per tier.
✅ Comparison arrow (▲/▼) vs current tier — ▲ hijau (lebih tinggi), ▼ merah (lebih rendah).

---

## Files Changed

| File | Perubahan |
|------|----------|
| `src/store/gameStore.ts` | Funding revOpts + `pricingRevenueMult` |
| `src/components/FeaturesPanel.tsx` | Preview revOpts + `pricingRevenueMult` + import getPricingTier + pricing arrows ▲/▼ |
| `src/components/FinancePanel.tsx` | Revenue calc + `pricingRevenueMult` + import getPricingTier + loan payment display & net fix |
| `src/components/AdSalesPanel.tsx` | Lifetime revenue total di History header |
| `docs/update/update_v1.8.md` | BARU |

---

## Checklist

- [x] Fix pricing revenueMult di funding offer calc
- [x] Fix pricing revenueMult di monetization preview
- [x] Fix pricing revenueMult di finance display
- [x] Loan payment di FinancePanel expenses + net fix
- [x] Lifetime revenue campaigns di History
- [x] Pricing comparison arrow ▲/▼ vs current tier
- [x] Build sukses (`tsc -b` + `vite build`)
- [ ] Commit
