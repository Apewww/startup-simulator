# Update V2.3 — Endgame

**Induk:** `docs/upcoming_features v4.md` — Fase E (v2.3)
**Tujuan:** Win condition finalization, Victory screen, New Game+
**Status:** 🏗️ Phase C ✅

---

## Ringkasan

Dua kondisi harus terpenuhi untuk unlock "End Career":
1. **Rank #1 di leaderboard bertahan ≥3 bulan** (consecutive)
2. **personalCash ≥ $10,000,000** (Millionaire title)

Saat terpenuhi → tombol "End Career" muncul → klik → Victory Screen → simpan achievement "menamatkan game" → opsi New Game+.

---

## Phase A — Foundation: Player Rank Tracking

- [x] Tambah state `monthsAtRankOne: number` (default 0)
- [x] Tambah state `endgameUnlocked: boolean` (default false)
- [x] Update `restartGame()` reset kedua state

## Phase B — Win Condition Logic

- [x] Cek rank player tiap akhir bulan di tick loop
- [x] Increment `monthsAtRankOne` jika rank=1, reset ke 0 jika turun
- [x] Cek kedua kondisi → set `endgameUnlocked`
- [x] Notifikasi "End Career" saat unlock

## Phase C — UI: End Career Button

- [x] Action `triggerEndGame()` — set `screen='victory'`, freeze tick
- [x] Tombol "End Career" di HUD (muncul hanya jika `endgameUnlocked`)
- [x] Notifikasi endgame di WealthPanel

## Phase D — Victory Screen

- [x] Buat `VictoryScreen.tsx` — stats grid, achievement badge, 3 tombol aksi
- [x] Tambah `'victory'` ke `GameScreen` type
- [x] Routing di `App.tsx`
- [x] Rekam achievement global `game_completed`
- [x] Title khusus completion

## Phase E — New Game+

- [x] Action `startNewGamePlus()` — restart + carry title + bonus cash
- [x] UI picker di VictoryScreen
- [x] NG+ badge di MainMenu

## Phase F — Achievement/Title Adjustment

- [x] Tambah `game_completed` achievement
- [x] Update WealthPanel text endgame info
- [x] Update `02_TASK.md` — v2.3 section

## Phase G — Save/Load & DB Migration

- [x] Tambah field `monthsAtRankOne`, `endgameUnlocked`, `completedGame` ke GameSave
- [x] Bump Dexie v18 → v19
- [x] Serialize/deserialize field baru
- [x] Migration v18→v19

## Phase H — Build & Verify

- [x] `tsc -b` typecheck
- [x] `vite build` production build

---

## New Files

| File | Fungsi |
|------|--------|
| `src/components/VictoryScreen.tsx` | End-game victory screen |

## Modified Files

| File | Perubahan |
|------|----------|
| `src/store/gameStore.ts` | +state, +logic, +triggerEndGame, +startNewGamePlus, restartGame reset |
| `src/components/HudBar.tsx` | +End Career button |
| `src/components/WealthPanel.tsx` | Info endgame requirements |
| `src/components/MainMenu.tsx` | +NG+ badge |
| `src/data/achievements.ts` | +game_completed |
| `src/systems/globalAchievements.ts` | - (tidak perlu perubahan) |
| `src/db/gameDB.ts` | +field, bump v19 |
| `src/systems/saveLoad.ts` | +serialize/deserialize |
| `src/App.tsx` | +VictoryScreen routing |
| `docs/02_TASK.md` | Update v2.3 section |

---

## Data Model

```ts
// State baru
monthsAtRankOne: number;     // consecutive months at rank #1
endgameUnlocked: boolean;    // both conditions met
completedGame: boolean;      // player completed endgame
newGamePlus: boolean;        // NG+ mode active
newGamePlusTitle: string | null; // title carried over

// Actions
triggerEndGame: () => void;
startNewGamePlus: (titleId: string) => void;
```

## Achievement Baru

```ts
{ id: 'game_completed', label: 'Game Completed', icon: '🏆',
  requirement: 1, description: 'Sukses menamatkan Startup Simulator.' }
```
