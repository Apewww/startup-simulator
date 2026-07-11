# Update V1.4.5 — Furniture Shop & Placement

**Induk:** `docs/upcoming_features.md` (Phase 6 — Furniture Shop & Placement)
**Tujuan:** Setelah furniture di-unlock via Perks (Phase 5 / v1.4.4), pemain bisa beli furniture di Furniture Shop lalu menaruhnya di Office Grid modular (Phase 4 / v1.4.3). Efek radius/decay aktual diterapkan ke tick loop.

---

## 1. Data — Furniture (`src/data/furniture.ts`)

Interface + daftar furniture yang bisa dibeli (semuanya gated oleh perk di v1.4.4).

```ts
export type FurnitureEffect = 'coffee_decay' | 'ergonomic_overwork' | 'water_recovery';
export type FurniturePlacement = 'tile' | 'desk';

export interface FurnitureDef {
  id: string;            // 'coffee_machine' | 'ergonomic_chair' | 'water_dispenser'
  name: string;
  description: string;
  icon: string;          // lucide icon name (untuk render di OfficeGrid)
  price: number;
  unlockPerk: string;    // id perk di data/perks.ts yang membuka furniture ini
  effect: FurnitureEffect;
  radius: number;        // 0 = per-tile (chair); >0 = Manhattan radius (coffee/water)
  placement: FurniturePlacement; // 'tile' = tile kosong; 'desk' = di tile meja employee
}

export interface PlacedFurniture {
  id: string;            // 'furn-1', 'furn-2', ...
  defId: string;
  gridX: number;
  gridY: number;
}

export const FURNITURE: FurnitureDef[];
export function getFurnitureDef(id: string): FurnitureDef | undefined;
```

### Daftar Furniture

| id | Name | Price | Effect | Radius | Placement | Unlock Perk |
|---|---|---|---|---|---|---|
| `coffee_machine` | Coffee Machine | $300 | -50% happiness decay saat kerja | 2 | tile | `coffee_machine` |
| `ergonomic_chair` | Ergonomic Chair | $150 | overwork threshold 50→80 tick | 0 (per-tile) | desk | `ergonomic_chair` |
| `water_dispenser` | Water Dispenser | $250 | +0.2/tick happiness recovery idle | 2 | tile | `water_dispenser` |

---

## 2. Radius Utility — `src/systems/radiusEffect.ts`

Ekstrak logic radius jadi shared utility (reuse pola yang sama dengan rencana Cooling Grid). Hitung Manhattan distance antar tile.

```ts
import type { Employee, PlacedFurniture } from '../types';

export interface FurnitureEffects {
  coffee: Set<string>;   // emp id: -50% work decay
  water: Set<string>;    // emp id: +0.2/tick idle recovery
  chair: Set<string>;    // emp id: overwork threshold 80
}

export function computeFurnitureEffects(
  furniture: PlacedFurniture[],
  employees: Employee[]
): FurnitureEffects;
```

- **Coffee / Water** (`radius > 0`): efek area **horizontal** — employee masuk set jika `emp.gridY === furn.gridY || emp.gridY === furn.gridY + 1` (baris furniture sendiri + baris tepat di bawahnya, 2 baris penuh lebar grid, abaikan kolom).
- **Ergonomic Chair** (`placement: 'desk'`, `radius: 0`): employee masuk set jika `emp.gridX === furn.gridX && emp.gridY === furn.gridY` (chair menempel di meja employee yang sama).

Dihitung sekali per tick di `incrementTick` (posisi grid gak berubah selama map employee).

---

## 3. Store Changes — `src/store/gameStore.ts`

### State baru

```ts
furnitureInventory: FurnitureInventoryItem[]; // furniture yang sudah dibeli, belum ditaruh (id + defId)
furniture: PlacedFurniture[];                 // furniture yang sudah ditaruh di grid (id + defId + koordinat)
placementFurnitureId: string | null;         // id inventory item sedang dalam mode placement
```

Model **inventory**: beli → masuk `furnitureInventory` (cash dipotong sekali). Place tarik dari inventory → `furniture`. Unplace balikin ke inventory (gak rugi). Sell kasih refund 50% (dari inventory maupun placed).

### Action baru

**`buyFurniture(defId: string)`**
- Guard: perk `def.unlockPerk` ada di `unlockedPerks`, dan `cash >= def.price` (else notif warning).
- Deduct cash, push `FurnitureInventoryItem` (`id: 'finv-' + (furnitureInventory.length+1)`), notif `"Bought {name}"`.

**`startFurniturePlacement(invId: string)`**
- Cari item di `furnitureInventory`; guard ada.
- Untuk `ergonomic_chair`: kalau gak ada employee sama sekali → notif warning.
- Set `placementFurnitureId = invId`.

**`cancelFurniturePlacement()`**
- Set `placementFurnitureId = null`.

**`placeFurniture(x, y)`**
- Ambil item dari `placementFurnitureId`; guard ada.
- Validasi bounds (`0 <= x < officeGridCols`, `0 <= y < officeGridRows`).
- Validasi tile:
  - `placement === 'tile'`: tile harus kosong (gak ada employee lain, gak ada furniture lain di `(x,y)`).
  - `placement === 'desk'`: harus ada employee di `(x,y)` (chair nempel ke meja), dan belum ada chair di tile itu.
- Pindah item dari `furnitureInventory` → `furniture` (pakai `id` yang sama), clear `placementFurnitureId`, notif `"Placed {name}"`.

**`unplaceFurniture(furnId)`**
- Cari di `furniture`; pindah balik ke `furnitureInventory` (`id` sama), notif `"Picked up {name}"`. Gratis (gak ada refund rugi).

**`sellFurnitureItem(id)`**
- Cari di `furnitureInventory` atau `furniture`; refund 50% (`Math.floor(def.price * 0.5)`); hapus; notif warning.

### Ubah `incrementTick`

- Sebelum map employee: `const fx = computeFurnitureEffects(state.furniture, state.employees);`
- Working decay (`gameStore.ts:317-321`):
  ```ts
  if (fx.coffee.has(emp.id)) newHappiness -= 0.025;       // -50% dari 0.05
  else if (isWorking) newHappiness -= 0.05;
  else if (fx.water.has(emp.id)) newHappiness += 0.2;     // idle recovery
  else newHappiness -= 0.005;
  ```
- Overwork threshold (`gameStore.ts:333-340`):
  ```ts
  const overworkThreshold = fx.chair.has(emp.id) ? 80 : 50;
  if (newHappiness < 20 && isWorking) newOverworkTicks += 1;
  else newOverworkTicks = 0;
  if (newOverworkTicks >= overworkThreshold) newSpeed = Math.floor(newSpeed * 0.7);
  ```

### Ubah collision (employee placement)

- `hireEmployee` (`:223`): occupied set juga musti cek `furniture` tile (tile 'tile'-placement gak boleh keisi employee).
- `moveEmployee` (`:1498`): collision juga tolak tile yang ditempati furniture `placement === 'tile'`.
- `negotiateSalary` (`:673`): sama seperti hireEmployee.

### Ubah `restartGame`

- Reset `furniture: []`, `placementFurnitureId: null`.

---

## 4. Dexie Schema — `src/db/gameDB.ts`

Bump version ke 11:

```ts
this.version(11).stores({ saves: '++id, timestamp' });
```

Tambah field di `GameSave`:

```ts
furniture?: PlacedFurniture[];
```

Import `PlacedFurniture` dari `../types`.

---

## 5. Save/Load — `src/systems/saveLoad.ts`

**`saveGame()`:** tambah `furniture: state.furniture`.

**`loadGame()`:** hydrate `furniture: save.furniture ?? []`. Save lama tanpa field → aman (array kosong).

---

## 6. UI — Furniture Shop & Office Grid

### `src/components/FurnitureShop.tsx` (BARU)

- List furniture yg `unlockPerk`-nya ada di `unlockedPerks` (mirip pattern `ServerShop.tsx` kartu).
- Tiap kartu: icon, nama, harga, deskripsi efek, tombol "Buy" (disabled kalau `cash < price`).
- Tampil count owned (in inventory / placed).

### `src/components/FurnitureInventory.tsx` (BARU)

- List semua owned: `furnitureInventory` (belum place) + `furniture` (placed).
- Item inventory: tombol "Place" (`startFurniturePlacement(invId)`) + "Sell" (`sellFurnitureItem`).
- Item placed: info posisi + tombol "Pick up" (`unplaceFurniture`) + "Sell".
- Kosong → pesan suruh beli di tab Shop.

### `src/components/PerksPanel.tsx` — 4 tab

- Tab Milestones (progress) / Unlock Perks (spend point) / **Shop** (beli furniture) / **Inventory** (kelola owned).
- Tab **Shop** render `<FurnitureShop />` (tombol Buy per def, tampil count owned/placed).
- Tab **Inventory** render `<FurnitureInventory />` (item di inventory → Place/Sell; item ter-place → Pick up/Sell).

### `src/components/OfficeGrid.tsx` — placement mode + render furniture

- Render layer furniture: map `furniture`, absolute-positioned div di `(gridX*CELL, gridY*CELL)` dengan icon + nama.
- **Drag furniture** (hold + drag, mirip employee): `onDragStart` set `application/furn-id` → grid `onDrop` panggil `moveFurniture(furnId, x, y)` (validasi tile/desk). **Klik sekali** (tanpa drag) → `unplaceFurniture(furnId)` (pick up balik inventory).
- **Indikator radius = persegi panjang** (rectangle): div transparan `bg-amber/10` lebar penuh grid (`officeGridCols * CELL_SIZE`) × tinggi `(radius*2+1)*CELL_SIZE`, di batas atas/bawah area radius. Bukan kotak (square) lagi — sesuai efek band horizontal.
- Saat `placementFurnitureId` aktif:
  - Grid container dapat `onClick` → `getGridPos` → `placeFurniture(x, y)`.
  - Tampilkan ghost tile valid/invalid (hijau = valid, merah = invalid) mengikuti hover.
  - Banner kecil "Placing [Name] — click a [tile/desk]" + tombol Cancel (`cancelFurniturePlacement`).
- Drag & drop employee tetap jalan; collision drop kini juga tolak tile furniture `placement === 'tile'`.

---

## 7. Perubahan File

| File | Perubahan |
|---|---|
| `docs/update_v1.4.5.md` | **BARU** — dokumen ini |
| `src/data/furniture.ts` | **BARU** — `FURNITURE` + `FurnitureDef` + `PlacedFurniture` + `getFurnitureDef` |
| `src/systems/radiusEffect.ts` | **BARU** — `computeFurnitureEffects` (Manhattan radius) |
| `src/types/employee.ts` | Tambah `FurnitureEffect`, `FurniturePlacement`, `PlacedFurniture` |
| `src/types/index.ts` | Export type baru |
| `src/store/gameStore.ts` | State `furnitureInventory`/`furniture`/`placementFurnitureId`; action `buyFurniture`/`startFurniturePlacement`/`cancelFurniturePlacement`/`placeFurniture`/`unplaceFurniture`/`sellFurnitureItem`; `incrementTick` efek; collision hire/move/negotiate; `restartGame` reset |
| `src/components/OfficeGrid.tsx` | Render furniture + placement mode (click + ghost + banner) + collision drop |
| `src/components/FurnitureShop.tsx` | **BARU** — kartu furniture ter-unlock, tombol Buy per def |
| `src/components/FurnitureInventory.tsx` | **BARU** — daftar owned: inventory (Place/Sell) + placed (Pick up/Sell) |
| `src/components/PerksPanel.tsx` | 4 tab: Milestones / Unlock Perks / Shop (`FurnitureShop`) / Inventory (`FurnitureInventory`) |
| `src/db/gameDB.ts` | Bump Dexie v11 + field `furniture` di `GameSave` |
| `src/systems/saveLoad.ts` | Save/load `furniture` |
| `docs/upcoming_features.md` | Phase 5 ✅ `v1.4.4`; Phase 6 ✅ `v1.4.5` |
| `docs/02_TASK.md` | Tambah V1.4.5 task section |

---

## 8. Checklist

- [ ] `data/furniture.ts`: `FURNITURE` (3 item) + `FurnitureDef` + `PlacedFurniture` + `getFurnitureDef`
- [ ] `systems/radiusEffect.ts`: `computeFurnitureEffects` (Manhattan; chair same-tile)
- [ ] `employee.ts`: type `FurnitureEffect`/`FurniturePlacement`/`FurnitureInventoryItem`/`PlacedFurniture`
- [ ] `types/index.ts`: export type baru
- [ ] `gameStore.ts`: state `furnitureInventory`/`furniture`/`placementFurnitureId`
- [ ] `gameStore.ts`: action `buyFurniture` (guard perk + cash, masuk inventory)
- [ ] `gameStore.ts`: action `startFurniturePlacement(invId)` (chair-needs-employee)
- [ ] `gameStore.ts`: action `cancelFurniturePlacement`
- [ ] `gameStore.ts`: action `placeFurniture(x, y)` (tarik dari inventory, bounds + tile/desk valid)
- [ ] `gameStore.ts`: action `unplaceFurniture(furnId)` (balik ke inventory)
- [ ] `gameStore.ts`: action `moveFurniture(furnId, x, y)` (drag geser, validasi tile/desk)
- [ ] `gameStore.ts`: action `sellFurnitureItem(id)` (50% refund)
- [ ] `gameStore.ts`: `incrementTick` panggil `computeFurnitureEffects` + terapkan coffee/water/chair
- [ ] `gameStore.ts`: `hireEmployee`/`moveEmployee`/`negotiateSalary` collision cek furniture
- [ ] `gameStore.ts`: `restartGame` reset furniture
- [ ] `OfficeGrid.tsx`: render layer furniture + indikator radius persegi panjang 2 baris (lebar grid penuh)
- [ ] `OfficeGrid.tsx`: drag furniture → `moveFurniture`; klik sekali → `unplaceFurniture`
- [ ] `OfficeGrid.tsx`: placement mode (onClick → placeFurniture + ghost + banner cancel)
- [ ] `OfficeGrid.tsx`: drop collision tolak tile furniture
- [ ] `FurnitureShop.tsx`: Buy per def + Place/Sell per inventory item
- [ ] `PerksPanel.tsx`: tab "Shop" render `FurnitureShop`
- [ ] `gameDB.ts`: bump Dexie v11 + field `furnitureInventory`/`furniture` di `GameSave`
- [ ] `saveLoad.ts`: save/load `furnitureInventory`/`furniture`
- [ ] Build sukses (typecheck + lint)
- [ ] Test: unlock perk → Shop → Buy → Place → efek happiness/overwork terlihat
- [ ] Test: klik furniture ter-place → unplace balik inventory → bisa di-place lagi
- [ ] Test: save/load furniture + inventory persist
- [ ] Test: restart → furniture + inventory reset

---

## 9. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).

---

## 10. Catatan Desain

- **Ergonomic Chair pengecualian:** model `OfficeSlot` single-occupant, jadi chair ditempatkan di tile yang *sudah* berisi meja employee (effect per-tile). Coffee/Water ocupy tile kosong sendiri dan affect radius. Ini kompromi konsisten dengan model grid yang ada tanpa perlu multi-occupant.
- **Efek Coffee/Water = 2 baris horizontal** (bukan diamond Manhattan). Employee terpengaruh kalau di baris furniture sendiri ATAU baris tepat di bawahnya (2 baris penuh lebar grid, abaikan kolom). Visual = persegi panjang transparan 2 baris tinggi, lebar penuh grid.
- **FurnitureShop di tab PerksPanel** (bukan FloatingPanel/Dock baru) — perk unlock & shop tetap berdekatan, surface UI minimal.
