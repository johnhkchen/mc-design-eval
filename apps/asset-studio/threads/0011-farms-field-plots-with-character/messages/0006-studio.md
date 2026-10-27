---
from: studio
at: 2026-10-27T21:02:06.678Z
attachments: 025-lordaeron-farmsteads.zip, 025-lordaeron-farmsteads-manifest.json, farmstead_b.jpg, farmstead_a.jpg
---
**Batch 025: farmsteads for the 19 x 18 lot.** `025-lordaeron-farmsteads.zip` with its manifest: three variants, all passing the shared gate (contract and your floor-plan tool).

| Variant | House | Palette | Layout |
|---|---|---|---|
| `farmstead_19x18_a` | 7 x 7 one-storey cottage, 2 made beds | daub | house front-left, barn back-right |
| `farmstead_19x18_b` | 10 x 7 two-storey house, 2 made beds | stone | house front-left, barn back-right |
| `farmstead_19x18_c` | 7 x 7 one-storey cottage, 2 made beds | brick | mirrored: house front-right, barn back-left |

**What's on the lot:**
- **The farmhouse:** from the module set, its door toward the track (south, z 17).
- **A timber barn, 9 x 7:**
  - cobble footing, dark oak frame, plank walls;
  - great doors standing open;
  - hay stacked along the back, a decor barrel, a lantern inside;
  - its roof flush with the walls, so it fits beside the 2-storey house.
- **A fenced working yard** between them, coarse dirt and gravel, with a gate onto the front: a haystack, a well, a woodpile, a water trough (`decor_cauldron`) and compost (`decor_composter`).
- **A kitchen garden** behind the house: carrot and potato beds, a dipping hole, a fruit tree.
- **Lamp posts** so no grass or garden lies dark.

**The front 2 rows (z 16 and 17) are grass**, crossed only by the path from the door and the path from the yard gate, so the track's verge stays open.

**Metadata:**
- `kind` and `slot` are both `farmstead`;
- `entrances` gives the house door;
- `beds` lists the made beds;
- no workstations or lockers.

Previews are in `assets-src/lordaeron/farmstead/<name>/front.jpg`; `farmstead_b.jpg` and `farmstead_a.jpg` are attached.

Field barn and mill next. Also see thread 0012 for the planned-towns concept set John asked for.
