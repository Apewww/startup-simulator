# Update V1.4.1 — Lead Developer: Production Boost Logic

**Induk:** `docs/update_v1.4.md` (Phase 1 — Data & Assignment UI)
**Tujuan:** Implementasi efek boost supervisi ke tick loop perhitungan produksi.

---

## 1. Sistem Baru — `src/systems/leadDeveloper.ts`

```ts
import { Employee } from '../types/employee';

export function getSupervisionBoost(lead: Employee): number {
  return lead.speed * 0.1;
}
```

### Rumus final (tanpa diminishing return)

```
outputBoost      = lead.speed × 0.1
newSpeed         = dev.speed × (1 + outputBoost)
```

- Boost diterapkan **penuh tanpa penalti/diminishing return** ke tiap developer yang disupervisi
- Opportunity cost (lead tidak produksi sendiri) sudah cukup jadi balancing natural
- Boost stackable secara multiplicative dengan happiness multiplier & overwork penalty

---

## 2. Modifikasi Tick Loop — `src/store/gameStore.ts`

### Lokasi: `incrementTick`, setelah overwork penalty (~line 320)

Setelah perhitungan `newSpeed` (termasuk penalti overwork), tambahkan logika supervision boost:

```ts
// Sebelum: newSpeed sudah termasuk happiness multiplier + overwork penalty
// Sesudah: tambah supervision boost kalau developer punya lead
if (emp.supervisedBy) {
  const lead = employees.find(e => e.id === emp.supervisedBy);
  if (lead && lead.role === 'Lead_Developer') {
    newSpeed = newSpeed * (1 + getSupervisionBoost(lead));
  }
}
```

### Detail teknis

| Aspek | Penjelasan |
|---|---|
| **Waktu boost** | Boost dihitung tiap tick saat `newSpeed` disimpan — **1-tick delay** sebelum efek ke produksi (karena `emp.speed` yang dipakai produksi adalah `newSpeed` dari tick sebelumnya) |
| **Kondisi** | Semua developer dengan `supervisedBy` kena boost — termasuk saat training (mentorship effect) dan produksi |
| **Lead tidak ditemukan** | Guard `if (lead && lead.role === 'Lead_Developer')` — skip aman kalau lead resign/hilang |
| **Multiplicative vs Additive** | Multiplicative: `newSpeed * (1 + boost)` — boost terpisah dari happiness/overwork multiplier |
| **Side effect training** | Boost juga mempercepat training developer yang disupervisi — intentional (lead mentorship) |

### Contoh perhitungan

Developer Lv.3, happiness 85 (speed 1.3x = 3.9), supervised oleh Lead Lv.3 speed 4.0:

```
outputBoost       = 4.0 × 0.1 = 0.4
finalSpeed        = 3.9 × (1 + 0.4) = 3.9 × 1.4 = 5.46
```

Tanpa supervisi: 3.9 speed → selesaikan komponen 400 ticks dalam ~103 ticks
Dengan supervisi: 5.46 speed → selesaikan dalam ~73 ticks (**~29% faster**)

---

## 3. Cap — Tidak Ada Perubahan

- `calcMaxSupervised` di `employee.ts` sudah handle cap per level (Phase 1)
- Global soft cap 10 sudah terpasang
- Cap dibaca dinamis oleh UI assignment (disable assign saat penuh)

---

## 4. Save/Load — Tidak Ada Perubahan

- Dexie v8 sudah persist `supervisedBy`/`supervising`
- Boost dihitung live dari state tiap tick, tidak perlu field baru

---

## 5. Perubahan File

| File | Perubahan |
|---|---|
| `docs/update_v1.4.1.md` | **BARU** — dokumen ini |
| `src/systems/leadDeveloper.ts` | **BARU** — `getSupervisionBoost()` |
| `src/store/gameStore.ts` | Tambah supervision boost di `incrementTick` |
| `docs/upcoming_features.md` | Mark Phase 2 ✅ |

---

## 6. Checklist

- [ ] `src/systems/leadDeveloper.ts` — `getSupervisionBoost(lead)`
- [ ] `incrementTick`: cek `supervisedBy`, cari lead, aplikasikan `newSpeed *= (1 + boost)`
- [ ] Edge case: lead tidak ditemukan → skip
- [ ] Import `getSupervisionBoost` di `gameStore.ts`
- [ ] Build sukses (typecheck + lint)
- [ ] `upcoming_features.md`: Phase 2 marked ✅

---

## 7. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
