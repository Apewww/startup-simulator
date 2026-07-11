# Update V1.4.4 — Furniture Perk/Unlock System

**Induk:** `docs/upcoming_features.md` (Phase 5 — Furniture Perk/Unlock System)
**Tujuan:** Sistem Perk Point berbasis milestone untuk unlock furniture. Pemain kumpul point dari berbagai pillar (HR, Finance, Product, Server), lalu spend point buat unlock furniture yang nanti muncul di Furniture Shop (Phase 6).

---

## 1. Data — Milestones (`src/data/milestones.ts`)

Interface + daftar milestone yang kasih Perk Point.

```ts
export interface PerkContext {
  employees: Employee[];
  cash: number;
  currentUsers: number;
  features: PlatformFeature[];
  racks: ServerRack[];
  month: number;
}

export interface MilestoneDef {
  id: string;
  name: string;
  description: string;
  icon: string;        // lucide icon name
  repeatable: boolean;
  check: (ctx: PerkContext) => boolean;            // fixed: kondisi terpenuhi?
  getProgress?: (ctx: PerkContext) => { current: number; target: number };  // display
  repeatCount?: (ctx: PerkContext) => number;      // repeatable: berapa kali didapat
}

export const MILESTONES: MilestoneDef[];
export function getMilestoneDef(id: string): MilestoneDef | undefined;
```

### Daftar Milestone

**Fixed (sekali dapat, gak repeat):**

| id | Name | Condition | Pillar |
|---|---|---|---|
| `emp_5` | Small Team | `employees.length >= 5` | HR |
| `emp_10` | Growing Team | `employees.length >= 10` | HR |
| `emp_20` | Large Team | `employees.length >= 20` | HR |
| `cash_50k` | Profitable | `cash >= 50000` | Finance |
| `cash_500k` | Wealthy | `cash >= 500000` | Finance |
| `users_1k` | Getting Traction | `currentUsers >= 1000` | Product |
| `users_10k` | Popular | `currentUsers >= 10000` | Product |
| `features_5` | Feature Rich | `features.length >= 5` | Product |
| `features_all_lv3` | Polished Product | `features.every(f => f.level >= 3)` | Product |
| `first_rack` | Server Infrastructure | `racks.length >= 1` | Server |

**Repeatable (infinite scaling):**

| id | Name | Condition | Pillar |
|---|---|---|---|
| `survival_6mo` | Long-Term Survivor | `+1 point` tiap 6 bulan in-game berlalu (`Math.floor(month / 6)`) | Time |

Total fixed = 10 point. Repeatable kasih trickle di late game biar sistem gak mati.

---

## 2. Data — Perks (`src/data/perks.ts`)

Daftar perk yang bisa di-unlock pake point. Tiap perk unlock furniture (dipakai Phase 6).

```ts
export interface PerkDef {
  id: string;
  name: string;
  description: string;
  icon: string;        // lucide icon name
  cost: number;        // default 1
  furnitureUnlock: string;
}

export const PERKS: PerkDef[];
export function getPerkDef(id: string): PerkDef | undefined;
```

| id | Name | Cost | Unlocks | Effect (Phase 6) |
|---|---|---|---|---|
| `coffee_machine` | Coffee Machine | 1 | `coffee_machine` | -50% happiness decay saat kerja (radius 2) |
| `ergonomic_chair` | Ergonomic Chair | 1 | `ergonomic_chair` | overwork threshold 50→80 tick (per-tile) |
| `water_dispenser` | Water Dispenser | 1 | `water_dispenser` | +0.2/tick happiness recovery idle (radius 2) |

---

## 3. Store Changes — `src/store/gameStore.ts`

### State baru

```ts
perkPoints: number;          // current spendable points
earnedMilestones: string[];  // milestone IDs sudah di-reward (repeatable: "id_1", "id_2", ...)
unlockedPerks: string[];     // perk IDs sudah dibeli
```

### Action baru

**`checkMilestones()`**

- Build `PerkContext` dari state.
- Loop `MILESTONES`:
  - Fixed: kalau `!earned.includes(id) && check(ctx)` → push id, +1 point, notif.
  - Repeatable: hitung `count = repeatCount(ctx)`, bandingin dgn jumlah entry `"id_*"` di `earned`, award selisihnya.
- Kalau ada point baru: `set({ perkPoints, earnedMilestones })`, lalu notif tiap milestone:
  ```
  Milestone Clear: "{name}" — +1 Perk Point!
  ```

**`unlockPerk(perkId)`**

- Cari perk; guard (gak ada / sudah owned).
- Kalau `perkPoints < cost` → notif warning `"Not enough Perk Points for {name}"`.
- Else: `set({ perkPoints: -cost, unlockedPerks: +id })`, notif:
  ```
  Perk Unlocked: {name}!
  ```

### Hook di `incrementTick`

- Panggil `get().checkMilestones()` setelah `set({...})` utama (state udah update, termasuk cash baru dari monthly billing & employees baru dari hire).
- Deteksi milestone: max 1 tick delay (1-2 detik di 1x speed).

### Ubah `restartGame`

- Reset `perkPoints: 0`, `earnedMilestones: []`, `unlockedPerks: []`.

### Panel state

- `PanelId` ditambah `'perks'`.
- `panelOpen` / `panelMinimized` dapat entry `perks: false`.

---

## 4. Dexie Schema — `src/db/gameDB.ts`

Bump version ke 10:

```ts
this.version(10).stores({ saves: '++id, timestamp' });
```

Tambah field di `GameSave`:

```ts
perkPoints?: number;
earnedMilestones?: string[];
unlockedPerks?: string[];
```

---

## 5. Save/Load — `src/systems/saveLoad.ts`

**`saveGame()`:** tambah `perkPoints`, `earnedMilestones`, `unlockedPerks`.

**`loadGame()`:** hydrate dengan default `?? 0` / `?? []`. Save lama tanpa field → aman (perkPoints 0, array kosong).

---

## 6. UI — `src/components/PerksPanel.tsx` (BARU)

Panel berisi 2 tab:

### Tab "Milestones" (cara dapet point)
- List semua milestone (`MILESTONES`).
- Earned → background hijau + `Check` icon + "Clear ✓".
- Locked → progress bar dari `getProgress(ctx)` (contoh "5 / 10 employees"), atau untuk repeatable "Earned N / next at month X".
- Repeatable diberi badge "Repeat".

### Tab "Unlock Perks"
- List semua perk (`PERKS`) dengan icon, nama, deskripsi efek.
- Owned → badge "Owned" hijau.
- Locked → tombol "Unlock" (disabled kalau point kurang, tampil "Need N" + lock icon).
- Header panel tampil counter `perkPoints`.

### Dock button (`src/components/Dock.tsx`)
- Tambah item: `{ id: 'perks', label: 'Perks', shortcut: '6', Icon: Gift, accent: '#B7791F' }`.

### App integration (`src/App.tsx`)
- Import `PerksPanel` + `Gift` icon.
- Tambah `<FloatingPanel id="perks" ...>` di layer floating panel (index 5).

### Notifikasi
- Reuse `addNotification` (toast pattern existing) — success green untuk milestone clear & perk unlock, warning untuk point kurang.

---

## 7. Perubahan File

| File | Perubahan |
|---|---|
| `docs/update_v1.4.4.md` | **BARU** — dokumen ini |
| `src/data/milestones.ts` | **BARU** — definisi milestone + `PerkContext` |
| `src/data/perks.ts` | **BARU** — definisi perk + cost |
| `src/store/gameStore.ts` | State `perkPoints`/`earnedMilestones`/`unlockedPerks`; action `checkMilestones`/`unlockPerk`; hook di `incrementTick`; reset `restartGame`; `PanelId` + `'perks'` |
| `src/components/PerksPanel.tsx` | **BARU** — UI 2 tab (Milestones / Unlock) |
| `src/components/Dock.tsx` | Tambah tombol Perks |
| `src/App.tsx` | Tambah `FloatingPanel` Perks |
| `src/db/gameDB.ts` | Bump schema v10 + field `GameSave` |
| `src/systems/saveLoad.ts` | Save/load 3 field baru |
| `docs/upcoming_features.md` | Mark Phase 5 in progress |
| `docs/02_TASK.md` | Tambah V1.4.4 task section |

---

## 8. Checklist

- [ ] `data/milestones.ts`: `MILESTONES` (10 fixed + 1 repeatable) + `PerkContext`
- [ ] `data/perks.ts`: `PERKS` (3 item, cost 1) + `PerkDef`
- [ ] `gameStore.ts`: state `perkPoints`/`earnedMilestones`/`unlockedPerks`
- [ ] `gameStore.ts`: action `checkMilestones` (fixed + repeatable)
- [ ] `gameStore.ts`: action `unlockPerk` (guard + spend + notif)
- [ ] `gameStore.ts`: `incrementTick` panggil `checkMilestones`
- [ ] `gameStore.ts`: `restartGame` reset perk state
- [ ] `gameStore.ts`: `PanelId` + `'perks'` di panelOpen/Minimized
- [ ] `PerksPanel.tsx`: tab Milestones (progress + clear state)
- [ ] `PerksPanel.tsx`: tab Unlock (buy button + owned state)
- [ ] `Dock.tsx`: tombol Perks (shortcut 6)
- [ ] `App.tsx`: `FloatingPanel` Perks
- [ ] `gameDB.ts`: bump Dexie v10 + field GameSave
- [ ] `saveLoad.ts`: save/load 3 field baru
- [ ] Build sukses (typecheck + lint)
- [ ] `upcoming_features.md`: Phase 5 marked in progress
- [ ] `02_TASK.md`: V1.4.4 tasks added
- [ ] Test: hire 5 employee → notif milestone clear +1 point
- [ ] Test: unlock perk → point turun, masuk `unlockedPerks`
- [ ] Test: save/load perk state persist
- [ ] Test: restart → perk state reset

---

## 9. Dev Mode (tetap)

Dev Panel & tombol `DEV` **tetap hanya di `npm run dev`** (`import.meta.env.DEV`).

---

## 10. Catatan Desain

- **Hybrid sumber**: fixed milestone kasih struktur early-game ("butuh 5 karyawan buat point"), repeatable (`survival_6mo`) ngejamin late-game tetap dapet point tanpa threshold baru yang makin konyol.
- **Milestone gak repeatable** disimpan sbg ID tunggal; repeatable disimpan sbg `"id_1"`, `"id_2"`, ... biar aman dr double-reward.
- **Furniture efek belum diimplementasi** — ini cuma unlock gate. Efek radius/decay dikerjakan di Phase 6 (Furniture Shop & Placement).
