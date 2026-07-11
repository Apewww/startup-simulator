# Update V1.4.2 — Lead Developer: UI Polish & Visual Feedback

**Induk:** `docs/upcoming_features.md` (Phase 3 — Lead Developer: UI Polish)
**Tujuan:** Tambah visual feedback & tooltip untuk fitur supervisi di kantor grid dan panel karyawan.

---

## 1. Office Grid — Supervisi Indicator (`src/components/OfficeGrid.tsx`)

### Lead Developer Desk

- Render **star icon** (`lucide-react` `Star`) di pojok kiri atas pada meja Lead Developer.
- **Indigo border accent** (`ring-2 ring-indigo/60`) membedakan meja lead dari developer biasa.

### Supervised Developer Desk

- **Small dot indicator** (`bg-indigo w-1.5 h-1.5 rounded-full`) di pojok kanan atas.
- Title tooltip diperbarui menyertakan info supervisi.

### Detail implementasi

| Element | Kondisi | Visual |
|---|---|---|
| Star icon | `emp.role === 'Lead_Developer'` | `absolute -top-1 -left-1 w-3 h-3 text-indigo` |
| Indigo ring | `emp.role === 'Lead_Developer'` | `ring-2 ring-indigo/60` |
| Dot indicator | `emp.supervisedBy` terisi | `absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo rounded-full` |
| Tooltip | `emp.supervisedBy` | Tambah "(supervised)" di title |

---

## 2. Employee Card — Tooltip Boost Percentage (`src/components/EmployeesPanel.tsx`)

### Developer (disupervisi)

Ubah tooltip dari:

```
Supervised by [Lead Name]
```

Menjadi:

```
Supervised by [Lead Name] (+X% output)
```

`X = getSupervisionBoost(lead) * 100` — dibulatkan ke integer.

### Lead Developer

Ubah tooltip dari:

```
Supervising: X/Y
```

Menjadi:

```
Supervising: X/Y (+X% boost each)
```

`X = getSupervisionBoost(lead) * 100` — persentase boost yang diberikan ke setiap developer.

---

## 3. HUD — Supervision Production Indicator (`src/components/HudBar.tsx`)

Tambah indikator visual di HUD ketika supervisi aktif:

- Jika ada developer yang sedang disupervisi (`supervisedBy` terisi), tampilkan star icon + count di HUD bar.
- Informasi: jumlah developer yang sedang di-boost oleh supervisi.
- Posisi: di area kiri (setelah date), hanya muncul saat `supervisedCount > 0`.

---

## 4. Perubahan File

| File | Perubahan |
|---|---|
| `docs/update_v1.4.2.md` | **BARU** — dokumen ini |
| `docs/upcoming_features.md` | Mark Phase 3 ✅ |
| `docs/02_TASK.md` | Tambah V1.4.2 task section |
| `src/components/OfficeGrid.tsx` | Star icon lead + dot indicator supervised + title update |
| `src/components/EmployeesPanel.tsx` | Tooltip boost percentage |
| `src/components/HudBar.tsx` | Supervision active indicator |

---

## 5. Checklist

- [ ] OfficeGrid.tsx — lead desk: star icon + indigo border
- [ ] OfficeGrid.tsx — supervised desk: dot + tooltip
- [ ] EmployeesPanel.tsx — tooltip lead: "Supervising: X/Y (+X% boost each)"
- [ ] EmployeesPanel.tsx — tooltip dev: "Supervised by [Name] (+X% output)"
- [ ] HudBar.tsx — supervision indicator (optional)
- [ ] Build sukses (typecheck + lint)
- [ ] `upcoming_features.md`: Phase 3 marked ✅
- [ ] `02_TASK.md`: V1.4.2 tasks added

---

## 6. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
