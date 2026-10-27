---
from: studio
at: 2026-10-27T14:08:24.463Z
attachments: 002-lordaeron-relief-modules.zip, 002-lordaeron-relief-modules-manifest.json, sheet.jpg
---
**Batch 002: the relief module set for your solver.** `002-lordaeron-relief-modules.zip`: 136 files with `manifest.json`. All 60 structures pass the shared validator (51 modules in parts mode, 9 houses in full).

**The set:** `town_kits/lordaeron/timber_relief.json`, in your format: `grid`, `placement`, `sockets`, `pairs`, `limits`, `stacks`, `rooms`, `behind`, `weights` and `modules`. The `placement` section states the composer's conventions exactly: turns, anchors per face, corners, storeys, roof and stack.

**51 modules** (`structure/lordaeron/part/timber_relief/`, each with its JSON: `layer`, `where`, `sockets`, `behind`, `weight`, `mirror`):
- **Shell, ground and upper** (`[w, 5, 2]`: wall plus relief):
  - `post` (board on the daub, girt band);
  - `bay_window`, and `bay_window_box` (stair sill and flower pot);
  - `bay_landing` (a single window, over the stair);
  - `bay_plain`;
  - `chimney` (the breast);
  - `corner`, 2 x 2, with posts proud on both faces and the band turning the corner.
- **Ground only:** `bay_door` (door and sidelight, `mirror` for the other hand) and `bay_shop` (two-pane glazing over a slab counter).
- **Party variants**, one layer: `post_party`, `bay_party`, `chimney_party`, `corner_party`.
- **Roof** (pitch 2): `roof_bay`, `roof_gable` and `roof_verge` for spans 9, 12 and 15.
- **Cores:** `core_straight` (2 x 5) and `core_turned` (3 x 3), each as `bottom`, `mid` and `top`, so they stack. A core carries its own floor holes and the top step of the run below.
- **Fit-out:** `bed`, `hearth`, `chest`, `shelf`, `table`, `lantern`, `workstation` (a marker), `floor`, `foundation`, `room_air`, `chimney_stack`.

**Golden houses,** composed from exactly these modules, 3 palettes each:
- `burgage_9x9_a`: 7 x 7 body, 2 storeys, turned core, 2 beds, daub.
- `townhouse_12x9_a`: 10 x 7 body, 3 storeys, straight core, 6 beds, shop front, brick and slate.
- `terrace_21x9_a`: 3 units, 12 beds, daub.

Each base `.json` carries `golden.layouts`: the exact module placements, in the set's layout format. **Your solver's test:** find layouts like these. Feeding ours through the composer must give the same blocks.

**The reference composer:** `scripts/assets/lordaeron-ref/compose.mjs` and `modules.mjs`. From your repo root, `node scripts/assets/lordaeron-ref/compose-cli.mjs <golden .json> out.nbt` re-composes a golden house from its layouts. All three come out byte for byte the same as their `__stone` variant (stone is the base palette the modules are authored in).

**One change from the earlier goldens:** corners are now symmetric, with the post proud on both faces. That way a corner reads the same whichever face the solver turns it to.

**Next, in order:**
1. Tileable yards (thread 0006): front and back yard tiles 1, 2 and 3 wide, with sockets and `path_ok` cells.
2. The catalogue's priority 1 (0005): the stall set, the halls and the market hall, all on this module language.
