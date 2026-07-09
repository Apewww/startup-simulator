# Update V1.1.3 — Server Plot Grid, Drag Layout & Inventory

**Induk:** `docs/update_v1.1.2.md` (Window Manager, Day Cycle, Server Shop, Land Plot, VPS Rental)
**Tujuan:** Plot server berupa **grid** tempat rack ditaruh; rack punya **ukuran** (batas jumlah per plot); layout diatur **drag**; rack & node dibeli masuk **Inventory** lalu di-drag ke grid/slot.

## 1. Model Data
- `ServerRack.plotId: string | null` (null = di inventory) + `gridX, gridY, gridW, gridH`.
- `Plot.gridCols` (6) / `gridRows` (8).
- `RackDef.gridW/H`: Basic 1x2, Advanced 2x2, Enterprise 2x3.
- Store: `inventoryNodes: ServerNode[]`, `activeView` (`office` | `serverRoom:<plotId>`), `gameLog: string[]`.

## 2. Alur Beli & Placement
- `buyRack(tier)` -> rack `plotId:null` (inventory). `buyNode(typeId)` -> node ke `inventoryNodes`.
- `placeRack(rackId, plotId, x, y)` / `moveRack(rackId, x, y)` / `unplaceRack(rackId)` / `placeNode(nodeId, rackId, slotIndex)`.
- Overlap antar rack dalam plot yg sama ditolak (collision check) + grid boundary check.
- Semua aksi di-log via `addLog(msg)` ke `gameLog`.

## 3. Main Viewport (dua scene)
- Tab **[Office]** / **[Server: <plot>]**. Klik plot di LandMap -> `setActiveView`.
- `ServerRoomView`: grid plot 6x8, floating Inventory Panel, RackSlotView reaktif.

## 4. Inventory Panel (floating window)
- **Draggable** via header (pointer events), z-index stacking, **minimize/maximize/close** buttons.
- **Responsive**: bottom sheet on mobile.
- Section: Cash, Buy Rack (3-col grid with size info), Unplaced Racks (drag to grid), Buy Node (2-col grid), Inventory Nodes (drag to rack slots).
- Drag items become semi-transparent during drag; grip icon on draggable items.

## 5. Drag & Drop (grid)
- **Fix bug**: sebelumnya per-rack `onDragOver`/`onDrop` intercept event, grid drop tidak pernah fire. Sekarang hanya grid container yang handle drop.
- Grid `onDrop` detect apakah rack sudah terpasang (panggil `moveRack`) atau dari inventory (`placeRack`).
- **Live preview**: cyan highlight box saat drag rack di atas grid; merah jika invalid/collision.
- Rack card di grid: show node count, cooling %, power, mini slot dots.

## 6. Rack Slot View (node placement)
- **Reaktif**: pakai `rackId` prop, baca data dari store langsung -> tidak perlu close/reopen.
- **Animasi**: green pulse saat node berhasil ditempatkan (600ms).
- Drop zone highlight cyan saat node di-drag ke slot; stats (heat, power, cost, load bar).
- Inventory node chips di bawah slot untuk quick drag.

## 7. systems/server.ts
- `calcServerStats` / `calculateNodeLoads` / `calcMonthlyServerCost` hanya hitung rack `plotId !== null`.

## 8. Scrollbar
- `.custom-scroll` class dengan themed purple scrollbar (4px width, #7C3AED thumb).

## 9. LandMap (Server Panel)
- Compact rack chip per plot: label, node count, cooling %, power draw.
- Color-coded: overheating (red), empty (gray), active (purple).
- Grid size badge + total racks/nodes summary.

## 10. Komponen
| File | Aksi |
|---|---|
| `types/server.ts` | plotId nullable + grid pos, Plot grid |
| `data/servers.ts` | RackDef gridW/H |
| `store/gameStore.ts` | inventoryNodes, activeView, gameLog, aksi placement, filter placed |
| `index.css` | custom-scroll styles |
| `MainViewport.tsx` | tab + ServerRoomView |
| `ServerRoomView.tsx` | BARU — grid, floating inventory panel, rack slot view, DnD |
| `LandMap.tsx` | tombol Open + compact rack info |
| `ServerPanel.tsx`, `ServerShop.tsx`, `DevPanel.tsx` | adapt inventory API |

## 11. Dev Mode tetap hanya `npm run dev`.
