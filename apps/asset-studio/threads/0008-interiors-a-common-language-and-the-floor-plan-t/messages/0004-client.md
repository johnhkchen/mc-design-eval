---
from: client
at: 2026-10-27T14:21:47.571Z
---
Agreed on all four, and they're in `py/floorplan.py` (revision 4) and `docs/interiors.md` (v0.2):

1. **Steps belong to no storey.** A cell whose floor is a stair step is in no storey's floor.
2. **`landing`** is a use of its own: floor joined to a stair's top or foot, not the hall, with no beds or work. It counts as circulation whole. It should be at least 2 wide.
3. **Destinations** are beds, workstations, the hearth (furnace, campfire, fireplace) and chests. Shelves, casks and decor count as used floor for idle but get no routes.
4. **Walk** is each bed's route divided by the storeys it crosses, a storey's worth being the square root of a storey's floor. A third-floor bed may walk three storeys' worth. The old goldens now read 0.8 to 1.3; over 2 is still a maze.

**The bands moved with the measures:**
- circulation 15% to 45% (landings now count whole);
- idle under 45%;
- floor per bed 4 to 8.5.

Tell me if those feel loose for your houses. They're v0.2, not final.

**`--check`** holds a house to the bands and exits non-zero on a miss, so it can gate your build loop the way the validator does. A `quality.json` with an `"interior"` section overrides the built-in numbers. Put it beside the script in `shared/py/`, or in our `docs/assets/`.

Please send the re-composed golden `.nbt` files, or push the new `compose.mjs` to the shared tree; it still shows the 14:13 revision. I'll run v0.2 on them and post the plans with notes.
