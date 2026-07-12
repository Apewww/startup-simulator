# Update V1.4 — Lead Developer: Data Model & Supervisi Dasar

**Induk:** `docs/upcoming_features.md` (Phase 1 — Lead Developer Mechanic)
**Tujuan:** Bangun fondasi data & UI assignment Lead Developer, tanpa efek boost (Phase 2 nanti).

---

## 1. Type System — Employee

### Employee (semua role)

Tambah field baru di `src/types/employee.ts`:

```ts
export interface Employee {
  // ... existing fields
  supervisedBy?: string;  // employee id lead-nya (untuk Developer)
  supervising?: string[]; // list id developer yang disupervisi (untuk Lead_Developer)
}
```

### Validasi assignment

| Aturan | Detail |
|---|---|
| **Role constraint** | Hanya `Lead_Developer` yang bisa punya `supervising` |
| **Role constraint** | Hanya `Developer` yang bisa punya `supervisedBy` |
| **1 lead per dev** | 1 developer hanya bisa di-supervise oleh 1 lead pada satu waktu |
| **Cap per lead** | `maxSupervised = baseCap + (level - 1) × capPerLevel` — `baseCap = 2`, `capPerLevel = 1` |
| **Global soft cap** | Maks 10 developer per lead (safety net) |
| **Self-assign** | Lead tidak bisa supervise dirinya sendiri |

Cap table:

| Lead Level | Max Developer Disupervisi |
|---|---|
| 1 | 2 |
| 2 | 3 |
| 3 | 4 |
| 4 | 5 |
| 5 | 6 |

---

## 2. Store Actions — `src/store/gameStore.ts`

### State baru

Tidak perlu state terpisah — data supervision hidup di `Employee.supervisedBy` / `Employee.supervising` langsung.

### Actions baru

**`assignDeveloperToLead(leadId: string, devId: string)`**
- Validasi: `lead.role === 'Lead_Developer'`
- Validasi: `dev.role === 'Developer'`
- Validasi: `dev.supervisedBy === undefined` (belum punya lead)
- Validasi: `lead.supervising.length < maxSupervised(lead.level)`
- Validasi: dev bukan lead itu sendiri
- Update `dev.supervisedBy = leadId`
- Update `lead.supervising` push `devId`
- Notification: `"Assigned {devName} under {leadName}"`

**`unassignDeveloperFromLead(devId: string)`**
- Cari dev, dapatkan `leadId = dev.supervisedBy`
- Cari lead
- Update `dev.supervisedBy = undefined`
- Update `lead.supervising` filter out `devId`
- Notification: `"Unassigned {devName} from {leadName}"`

### Edge cases di `incrementTick()`

**Developer resign/dipecat:**
- Saat filter null (developer resign), cek `emp.supervisedBy`
- Jika ada lead, hapus dev id dari `lead.supervising`

**Lead resign/dipecat:**
- Iterasi semua developer dengan `supervisedBy === emp.id` (emp = lead yang resign)
- Set `supervisedBy = undefined` untuk semua

---

## 3. UI — `src/components/EmployeesPanel.tsx`

### Lead Developer Card

- Badge di header: `"Supervising: {current}/{max} developers"` — warna indigo/orange
- Tooltip informasi: nama-nama developer yang disupervisi (opsional, bisa list ringkas)

### Tombol Action Lead Developer

Lead Developer punya 2 tombol di sebelah Actions:

- **Supervision** (icon Star) — toggle panel assign/unassign developer
- **Production** (icon Hammer) — toggle panel kontrol produksi massal

Panel saling menutup (eksklusif).

### Supervision Panel

- List developer assigned (dengan tombol Unassign)
- List developer available (dengan tombol Assign)
- Cap info: "Cap reached — train to supervise more"

### Production Panel

- Tombol komponen — klik untuk assign task ke SEMUA supervised dev yang bisa produce komponen itu
- **Cancel All** — cancel task semua supervised dev (muncul jika ada yang sedang bekerja)

### Developer Card

- Jika `supervisedBy` terisi, tampilkan badge: `"Supervised by {leadName}"`
- Tooltip: "Supervised by [Lead Name]"

---

## 4. Save/Load — Schema Version 8

### `src/db/gameDB.ts`

- Bump version: `this.version(8).stores({ saves: '++id, timestamp' });`
- Tidak ada perubahan struktur table — field `supervisedBy`/`supervising` sudah otomatis tersimpan sebagai bagian dari `employees: Employee[]`

### `src/systems/saveLoad.ts`

- Tidak perlu perubahan — state `employees` sudah disave/load termasuk field baru
- Migration: save lama tanpa `supervisedBy`/`supervising` → undefined, aman

---

## 5. Perubahan File

| File | Perubahan |
|---|---|
| `docs/update_v1.4.md` | **BARU** — dokumen ini |
| `src/types/employee.ts` | Tambah `supervisedBy?: string`, `supervising?: string[]` ke `Employee` |
| `src/store/gameStore.ts` | Tambah actions `assignDeveloperToLead`, `unassignDeveloperFromLead`; handle edge case resign di `incrementTick`; helper `calcMaxSupervised`/validasi |
| `src/components/EmployeesPanel.tsx` | UI Supervision panel + Production panel + Cancel All + badge supervision |
| `src/db/gameDB.ts` | Bump schema ke version 8 |

---

## 6. Checklist

- [ ] Type: `supervisedBy` + `supervising` di `Employee` interface
- [ ] Validasi role (Lead_Developer → supervising, Developer → supervisedBy)
- [ ] Cap: `maxSupervised = 2 + (level - 1) * 1`
- [ ] Action: `assignDeveloperToLead(leadId, devId)`
- [ ] Action: `unassignDeveloperFromLead(devId)`
- [ ] Edge case — developer resign: auto unassign dari lead
- [ ] Edge case — lead resign: semua dev di bawahnya auto unassign
- [ ] UI Lead card: badge "Supervising: X/Y"
- [ ] UI Dev card: badge "Supervised by [Name]" jika ada
- [x] UI Supervision panel: assign/unassign developer
- [x] UI Production panel: assign component ke supervised devs + Cancel All
- [x] UI: disable assign saat cap penuh
- [ ] Save/load: Dexie version 8
- [ ] Build sukses (typecheck + lint)

---

## 7. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
