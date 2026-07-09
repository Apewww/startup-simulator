# Update V1.3.1 — Cash Flow Chart

**Induk:** `docs/update_v1.3.md` (Balancing & Polish)
**Tujuan:** Menambahkan grafik cash flow sederhana ke panel keuangan tanpa dependency tambahan (inline SVG).

---

## 1. Monthly Cash Flow History

Setiap pergantian bulan in-game, game store mencatat snapshot keuangan:

```ts
interface MonthlySnapshot {
  month: number;
  revenue: number;
  expenses: number;
  net: number;
  cash: number;
}
```

- Disimpan di `cashFlowHistory: MonthlySnapshot[]`
- Maksimal 12 bulan terakhir (shift otomatis)
- Dicatat di `incrementTick()` saat `newMonth > oldMonth`

## 2. Cash Flow Chart (Inline SVG)

Komponen `CashFlowChart.tsx` — bar chart menggunakan SVG murni:

| Aspek | Detail |
|---|---|
| **Data** | 12 bulan terakhir (atau kurang) |
| **Bar color** | Hijau (net positif) / Merah (net negatif) |
| **Hover** | Tooltip menampilkan revenue, expenses, net |
| **Y-axis** | Label otomatis dengan format `$1K` / `$500` |
| **X-axis** | Label `M1`, `M2`, dst |
| **Grid** | Garis horizontal tipis untuk referensi |
| **Responsif** | `w-full` dengan viewBox |

### Detail Visual

```
  $2K ┤  ██
  $1K ┤  ██  ██
   $0 ┤──██──██──██────
 -$1K ┤        ██  ██
       └──┬──┬──┬──┬──
          M1 M2 M3 M4
```

- Bar chart dengan lebar proporsional
- Tooltip muncul saat hover (`onMouseOver`/`onMouseOut`)
- Transisi halus saat data berubah

## 3. Integrasi ke FinancePanel

- Section baru **"Cash Flow"** di bawah breakdown income/expenses
- Tombol toggle untuk show/hide chart
- Chip info: "Last 12 months"
- Jika data < 2 bulan: pesan "Not enough data yet"

## 4. Perubahan File

| File | Perubahan |
|---|---|
| `docs/update_v1.3.1.md` | BARU — dokumen ini |
| `src/store/gameStore.ts` | Tambah `cashFlowHistory`, record tiap bulan di `incrementTick` |
| `src/components/CashFlowChart.tsx` | BARU — komponen SVG bar chart |
| `src/components/FinancePanel.tsx` | Integrasi `CashFlowChart` |
| `src/systems/saveLoad.ts` | Save/load `cashFlowHistory` |
| `src/db/gameDB.ts` | Tambah field `cashFlowHistory` di `GameSave` |
| `docs/02_TASK.md` | Checklist update |

## 5. Checklist

- [x] `cashFlowHistory` state + record tiap bulan
- [x] `CashFlowChart.tsx` — inline SVG bar chart
- [x] Tooltip hover dengan detail
- [x] Integrasi di FinancePanel
- [x] Save/load support
- [x] Empty state (data < 2 bulan)
- [x] Build sukses

## 6. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
