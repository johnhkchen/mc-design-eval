---
from: studio
at: 2026-10-27T21:15:07.277Z
attachments: 026-avenue-terraces-corners-zoning.zip, 026-avenue-terraces-corners-zoning-manifest.json, lordaeron_avenue_row.jpg, stormwind_avenue_row.jpg
---
**Batch 026: avenue terraces, corner houses, and the zoning as data.** `026-avenue-terraces-corners-zoning.zip` with its manifest. Every structure passes the shared gate. Lordaeron's existing goldens are byte-identical.

**1. Terraces and corners in `plan.json` (rev bumped), as kinds over any body.** The new `kinds` section:
- `detached`: no party walls, for lanes and ward backs.
- `terrace`: party walls both sides, for avenue fronts.
- `terrace_end`: party wall west, plain side east.
- `corner`: party wall west; the east side is **a second street front** with window boxes, and the shop bay if the house keeps a shop. Mirror it for a west corner.

The plan (core, partitions, furniture) is the body's own, so every body class and every palette takes every kind. The reference composer reads `corner: "east" | "west"`. In the set file, `bay_window_box` and `bay_shop_ground` now list `"corner_side"` among their faces, so your solver may place them on a corner's side street.

**Roof spans 10, 11, 13 and 14 are added** to the set (12 new roof parts). A terrace with party walls has no relief at its sides, so a gable turned to the street (`gable_z`) spans W, or W + 1 for a terrace end, not W + 2. This is what gives an avenue its rhythm (see below).

**Goldens:**
- Lordaeron: `terrace_10x9_a` and `corner_11x9_a`, each in stone, brick and daub.
- Stormwind: the same in its palettes.

All are 10 x 7, 3 storeys.

**2. The zoning, pushed as the paintings push it:** `town_rules/lordaeron.json` rev 2 has a `zoning` section.
- **Streets:** `forum_front`, `avenue`, `lane`, `ward_back`.
- **Bands** by distance from the bell along the streets: core under 40, inner 40 to 90, outer 90 to 160, fringe beyond.
- **`fill_order`:** forum fronts, core avenues, inner avenues, core lanes, outer avenues, then the rest.
- **`rules`:** body, kind, storeys, palette weights and shop or workshop by street and band. In short:
  - 3-storey stone terraces with shops on the forum and core avenues, corner houses where lanes meet them;
  - 2 to 3 storeys of brick and daub further out;
  - 1 to 2-storey detached houses on lanes;
  - cottages with big gardens at the ward backs;
  - farmsteads, fields and pastures in the fringe.
- **`rhythm`:**
  - **roofs:** alternate `gable_x` and `gable_z` along a terrace, never two gables in a row;
  - **palettes:** never one palette three houses running;
  - **doors:** vary the door bay by hash.
- **`placeholder`:** unbuilt plots carry front garden tiles and a fallow or garden field tile.
- **`replacement`:** John's one-by-one rule, as you wrote it.

`town_rules/stormwind.json` and `town_rules/dalaran.json` take the same zoning. Dalaran's houses stay detached for now: a terrace of hipped roofs needs its own roof pieces, which come next.

**`lordaeron_avenue_row.jpg`** shows a corner house, three terraces and a corner house, shoulder to shoulder, with the rhythm rule applied: tile, thatch gable to the street, slate, thatch gable, tile. That's the difference between a terrace and a street. `stormwind_avenue_row.jpg` is the same row in Stormwind's palettes. Both `.nbt` files are under `assets-src/<kingdom>/frontage/`.

Next, as you ordered it: the forum frontage set (hall, inn, guildhall), then the gatehouse quarter.
