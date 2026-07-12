# Update V1.4.6 — Phase 7: Balancing, Save Migration & QA

**Induk:** `docs/upcoming_features.md` (Phase 7 — fase terakhir). Menutup rangkaian **Lead Developer Mechanic** + **Office Furniture System** sekaligus menuntaskan sisa *balancing pass* Phase 2.

**Tujuan:** Menyeimbangkan kombinasi Lead Developer boost + Furniture happiness buff, memverifikasi migrasi save lama tetap loadable, dan menambahkan dev cheat tools untuk mempercepat QA.

---

## 1. Balancing — Lead Developer Soft Diminishing Return

**Masalah:** Boost supervisi = `leadSpeed × 0.1` diterapkan **penuh tanpa penalti** ke tiap developer, sementara cap developer naik per level (`calcMaxSupervised`). Lead level tinggi bisa menyupervisi hingga 10 developer, masing-masing dapat boost penuh → power scaling terlalu kuat di late game.

**Solusi:** Soft diminishing return berbasis jumlah developer yang disupervisi.

`src/systems/leadDeveloper.ts`:
```ts
export function getSupervisionBoost(lead: Employee, supervisedCount = 1): number {
  const base = lead.speed * 0.1;
  const factor = 1 - Math.min(0.5, Math.max(0, supervisedCount - 1) * 0.05);
  return base * factor;
}
```
- Developer ke-1 dapat boost penuh; tiap developer tambahan mengurangi faktor **-5%**, dengan **floor 50%**.
- Contoh (lead speed 3 → base +0.3): 1 dev = +30%, 5 dev = +24% each, 10 dev = +16.5% each (floor 50%).

`src/store/gameStore.ts` (`incrementTick`):
```ts
newSpeed = newSpeed * (1 + getSupervisionBoost(lead, lead.supervising?.length ?? 1));
```

> Opportunity cost lead (tidak produksi optimal saat jadi manajer) tetap jadi balancing natural; diminishing return ini lapisan tambahan agar tidak OP.

---

## 2. Balancing — Tuning Kombinasi Happiness Furniture

**Masalah:** Coffee Machine (−50% work decay) + Water Dispenser (idle recovery) bersamaan bisa menahan happiness employee mendekati 100 permanen → selalu di tier `>= 80` (speed 1.3x), men-trivialisasi happiness management.

**Solusi (tuning konservatif):** turunkan idle recovery Water Dispenser.

`src/store/gameStore.ts` (`incrementTick`):
```ts
} else if (fx.water.has(emp.id)) {
  newHappiness += 0.15;   // sebelumnya 0.2
} else {
```
- Coffee reduction tetap −50% (`0.025` decay saat kerja) — sudah wajar.
- Nilai ini tetap membuat furniture worth dibeli tanpa membuat happiness "gratis".

---

## 3. Dev Cheat Tools

`src/store/gameStore.ts` — 2 action baru:

```ts
unlockAllPerks: () => { set({ unlockedPerks: PERKS.map(p => p.id) }); ... }
devSpawnFurniture: () => { /* push 1x tiap FURNITURE def ke furnitureInventory */ }
```

`src/components/DevPanel.tsx` — section baru **"Perks & Furniture"**:
- **+5 Perk Points** — `setState perkPoints += 5`.
- **Unlock All Perks** — buka semua perk (gate furniture shop).
- **Spawn All Furniture** — masukkan 1x tiap furniture ke inventory (tinggal Place di grid).
- Info: jumlah perk points & perk ter-unlock.

Tetap gated `import.meta.env.DEV && devMode` (tidak berubah).

---

## 4. Save Migration Regression (QA — no schema change)

- Dexie tetap **v11** (tidak ada field baru di v1.4.6).
- `loadGame()` sudah punya default aman untuk semua field baru: `perkPoints ?? 0`, `earnedMilestones ?? []`, `unlockedPerks ?? []`, `furnitureInventory ?? []`, `furniture ?? []`.
- Migrasi `deskIndex → gridX/gridY` (v1.4.3) tetap berjalan untuk save lama.

**Checklist QA manual:**
- [ ] Load save pre-v1.4.x (tanpa furniture/perk) → tidak crash, field default kosong.
- [ ] Load save v1.4.5 (ada furniture ter-place) → posisi grid persist.
- [ ] Save → reload → perkPoints, unlockedPerks, furnitureInventory, furniture persist.
- [ ] Restart game → semua field furniture/perk reset.

---

## 5. Perubahan File

| File | Perubahan |
|---|---|
| `src/systems/leadDeveloper.ts` | `getSupervisionBoost` param `supervisedCount` + diminishing return |
| `src/store/gameStore.ts` | apply count ke boost; water recovery 0.2→0.15; action `unlockAllPerks` + `devSpawnFurniture`; import `FURNITURE` |
| `src/components/DevPanel.tsx` | section "Perks & Furniture" (perk points / unlock / spawn) |
| `docs/update_v1.4.6.md` | **BARU** — dokumen ini |
| `docs/upcoming_features.md` | Phase 7 ✅ `v1.4.6`; sisa Phase 2 balancing pass ✅ |
| `docs/02_TASK.md` | section V1.4.6 |
| `README.md` | catatan mekanik Lead Developer + Furniture (bila belum) |

---

## 6. Checklist

- [x] `leadDeveloper.ts`: diminishing return
- [x] `gameStore.ts`: boost pakai `supervising.length`
- [x] `gameStore.ts`: water recovery 0.15
- [x] `gameStore.ts`: `unlockAllPerks` + `devSpawnFurniture`
- [x] `DevPanel.tsx`: section Perks & Furniture
- [ ] Build sukses (typecheck + lint)
- [ ] QA save migration (checklist §4)
- [ ] Balancing sanity: lead 10-dev boost menurun; happiness tidak stuck 100

---

## 7. Catatan Desain

- **Diminishing berbasis count, bukan level** — sumber OP sebenarnya adalah *jumlah* developer yang disupervisi (cap naik per level). Menyerang count langsung mengatasi akar masalah tanpa menghukum lead level tinggi yang hanya menyupervisi sedikit developer.
- **Tuning happiness konservatif** — hanya menurunkan idle recovery; efek kerja (coffee) dibiarkan agar furniture tetap terasa berguna. Angka final dapat direvisi setelah playtest lanjutan.
- **Dev tools tetap dev-only** — tidak memengaruhi build produksi.
