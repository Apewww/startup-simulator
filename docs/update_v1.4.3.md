# Update V1.4.3 — Office Grid Refactor: Modular Positioning

**Induk:** `docs/upcoming_features.md` (Phase 4 — Office Grid Refactor)
**Tujuan:** Ubah OfficeGrid dari layout statis (`deskIndex` linear) jadi grid modular berbasis koordinat (`gridX/gridY`) seperti ServerRoomView, dengan drag & drop reposition.

---

## 1. Type Changes

### `src/types/employee.ts`

**Employee** — ganti `deskIndex` jadi `gridX`/`gridY`:

```ts
export interface Employee {
  // ... existing fields
  deskIndex: number;      // HAPUS
  gridX: number;          // BARU
  gridY: number;          // BARU
  // ...
}
```

**Type baru — `OfficeSlot`:**

```ts
export type OfficeOccupantType = 'employee' | 'furniture' | 'empty';

export interface OfficeSlot {
  x: number;
  y: number;
  occupantType: OfficeOccupantType;
  occupantId?: string;
}
```

### `src/types/index.ts`

Tambah export `OfficeSlot`, `OfficeOccupantType`.

---

## 2. Store Changes — `src/store/gameStore.ts`

### State baru

```ts
officeGridCols: number;   // default 8
officeGridRows: number;   // default 8
```

### Action baru

**`moveEmployee(empId: string, x: number, y: number)`**
- Validasi: koordinat dalam bounds (`0 <= x < officeGridCols`, `0 <= y < officeGridRows`)
- Validasi: slot target kosong (tidak ada employee lain dengan `gridX === x && gridY === y`)
- Update `emp.gridX = x`, `emp.gridY = y`
- Log + notifikasi

### Ubah `hireEmployee`

- Ganti `deskIndex` assignment → cari slot `(x, y)` pertama yang kosong
- Logika: loop `y = 0..gridRows-1`, `x = 0..gridCols-1`, cek apakah ada employee di `(x,y)`
- Set `gridX`/`gridY` pada employee baru

### Ubah `restartGame`

- Reset `officeGridCols: 8`, `officeGridRows: 8`

### Ubah `incrementTick`

- Tidak ada perubahan — tick loop tidak peduli posisi grid.

---

## 3. Dexie Schema — `src/db/gameDB.ts`

Bump version ke 9:

```ts
this.version(9).stores({ saves: '++id, timestamp' });
```

---

## 4. Save Migration — `src/systems/saveLoad.ts`

### `loadGame()` — migrasi `deskIndex` → `gridX/gridY`

Saat load save lama (tanpa `gridX`/`gridY`), konversi otomatis:

```ts
// Setelah setState, jika employees lama punya deskIndex tapi belum punya gridX/gridY
const migratedEmployees = save.employees.map(emp => {
  if (emp.gridX === undefined && emp.gridY === undefined) {
    // Konversi deskIndex (linear 0-63) ke gridX/gridY (8x8)
    return {
      ...emp,
      gridX: emp.deskIndex % GRID_COLS,
      gridY: Math.floor(emp.deskIndex / GRID_COLS),
    };
  }
  return emp;
});
```

**GRID_COLS = 8, GRID_ROWS = 8** — default office grid size.

### `saveGame()`

Tambah field `officeGridCols`, `officeGridRows` ke objek save (biar grid size persist).

Update `GameSave` interface di `gameDB.ts`:

```ts
export interface GameSave {
  // ... existing fields
  officeGridCols: number;
  officeGridRows: number;
}
```

---

## 5. UI Refactor — `src/components/OfficeGrid.tsx`

### Target: modular grid seperti `PlotGrid` di ServerRoomView

#### Grid structure

- Hapus hardcoded `GRID_COLS = 8`, `GRID_ROWS = 8`, `TOTAL_CELLS = 64`
- Baca `officeGridCols`/`officeGridRows` dari store (prepare untuk dynamic size nanti)
- Render grid sebagai absolute-positioned cells dalam container relatif

#### Employee placement

- Iterasi employees, render tiap employee di posisi `(emp.gridX * CELL_SIZE, emp.gridY * CELL_SIZE)`
- Sama seperti rack di `PlotGrid`: `left: gridX * CELL_SIZE, top: gridY * CELL_SIZE`
- Employee card tampil sebagai absolute-positioned div dalam grid

#### Drag & drop reposition

- **Employee drag**: `onDragStart` set `application/emp-id`
- **Grid drop**: `onDrop` baca `application/emp-id`, validasi slot kosong, panggil `moveEmployee`
- **Ghost overlay**: tampilkan preview kotak di posisi drag (sama pattern `dragOverPos` di ServerRoomView)
- **Collision check**: loop employees, cek apakah `gridX === x && gridY === y` untuk id selain dragged employee

#### Grid labels

- Column numbers di bottom (`0..cols-1`)
- Row numbers di left (`0..rows-1`)
- Sama pattern `PlotGrid`

#### Visual elements (pertahankan dari existing)

| Element | Kondisi | Visual |
|---|---|---|
| Star icon | `emp.role === 'Lead_Developer'` | `absolute -top-1.5 -left-1.5 w-3.5 h-3.5 text-indigo` |
| Indigo ring | `emp.role === 'Lead_Developer'` | `ring-2 ring-indigo/60` |
| Dot indicator | `emp.supervisedBy` terisi | `absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo rounded-full` |
| Resign pulse | `emp.happiness < 15` | `absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red rounded-full animate-pulse` |
| Progress bar | `emp.currentTask` ada | Bottom bar persentase |
| Empty cell | Tidak ada occupant | Dashed border square |

#### CELL_SIZE constant

```ts
const CELL_SIZE = 72; // Sama seperti ServerRoomView
```

#### Layout container

```tsx
<div 
  className="relative"
  style={{ 
    width: officeGridCols * CELL_SIZE, 
    height: officeGridRows * CELL_SIZE 
  }}
>
  {/* grid cells background */}
  {/* grid labels */}
  {/* employee desks absolute-positioned */}
  {/* drag ghost overlay */}
</div>
```

---

## 6. Perubahan File Lengkap

| File | Perubahan |
|---|---|
| `docs/update_v1.4.3.md` | **BARU** — dokumen ini |
| `src/types/employee.ts` | Ganti `deskIndex` → `gridX`/`gridY`; tambah `OfficeSlot`, `OfficeOccupantType` |
| `src/types/index.ts` | Export type baru |
| `src/store/gameStore.ts` | Tambah `officeGridCols`/`officeGridRows` state; `moveEmployee` action; update `hireEmployee`; update `restartGame` |
| `src/components/OfficeGrid.tsx` | **REFACTOR BESAR** — coordinate-based grid + drag & drop |
| `src/db/gameDB.ts` | Bump schema v9; tambah field `officeGridCols`/`officeGridRows` di `GameSave` |
| `src/systems/saveLoad.ts` | Migrasi `deskIndex` → `gridX`/`gridY`; save/load `officeGridCols`/`officeGridRows` |
| `docs/upcoming_features.md` | Mark Phase 4 in progress |
| `docs/02_TASK.md` | Tambah V1.4.3 task section |

---

## 7. Checklist

- [ ] `employee.ts`: hapus `deskIndex`, tambah `gridX`/`gridY` + `OfficeSlot` type
- [ ] `gameStore.ts`: state `officeGridCols: 8`, `officeGridRows: 8`
- [ ] `gameStore.ts`: action `moveEmployee(empId, x, y)` — validasi bounds & collision
- [ ] `gameStore.ts`: update `hireEmployee` — pakai `gridX`/`gridY` cari slot kosong
- [ ] `gameStore.ts`: update `restartGame` — reset grid size
- [ ] `OfficeGrid.tsx`: refactor ke coordinate-based grid (absolute positioning)
- [ ] `OfficeGrid.tsx`: drag & drop employee reposition (reuse ServerRoomView pattern)
- [ ] `OfficeGrid.tsx`: ghost overlay + collision check
- [ ] `OfficeGrid.tsx`: grid labels (col/row numbers)
- [ ] `OfficeGrid.tsx`: pertahankan visual dari v1.4.2 (star, dot, ring, progress bar)
- [ ] `gameDB.ts`: bump Dexie version to 9, tambah field di `GameSave`
- [ ] `saveLoad.ts`: migrasi `deskIndex` → `gridX`/`gridY` untuk save lama
- [ ] `saveLoad.ts`: save/load `officeGridCols`/`officeGridRows`
- [ ] Build sukses (typecheck + lint)
- [ ] `upcoming_features.md`: Phase 4 marked in progress
- [ ] `02_TASK.md`: V1.4.3 tasks added
- [ ] Test: hire employee → muncul di grid
- [ ] Test: drag employee ke slot kosong → pindah
- [ ] Test: drag ke slot terisi → ditolak
- [ ] Test: load save lama (v8) → employee migrasi `deskIndex` → `gridX`/`gridY`

---

## 8. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).
