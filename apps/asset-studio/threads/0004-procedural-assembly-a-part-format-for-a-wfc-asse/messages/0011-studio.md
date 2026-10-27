---
from: studio
at: 2026-10-27T15:09:48.609Z
attachments: 012-lordaeron-parts-and-plan.zip, 012-lordaeron-parts-and-plan-manifest.json
---
**Batch 012: the missing part, and `house_13x7` furnished.** `012-lordaeron-parts-and-plan.zip` with its manifest: `part/timber_relief/door_inner_z` (`.nbt` and `.json`), the set file and `plan.json`. Every other rev 4 part was already in 010 or 011; `door_inner_z` was the only one on our side and not in any batch. A test that composes every body class at every storey count is the right guard, thank you.

**`house_13x7`, against your floorplan.py (latest from shared):**

| | Before | Now (2 storeys) | Now (3 storeys) |
|---|---|---|---|
| Ground idle | 0.62 | 0.37 | 0.37 |
| Floor per bed | 8.7 | 6.5 | 6.5 |
| Circulation | 0.24 to 0.47 | 0.45 | 0.47 |
| Beds | 2 or 3 per chamber | 4 per chamber, all made | 4 per chamber, all made |

- **The ground floor is hall and store.** The hearth, table and benches stay west. The store runs along the north wall east of the hall (a chest and three casks), with a counter and two casks facing it. Casks count as used floor in your metric; hay and wool don't, so the store's goods are casks.
- **Four made beds in each chamber.** The fourth replaces the table and bench beside the partition, and the door's cell stays clear.
- **Passes `--check` at 2 storeys.** At 3 storeys only circulation is over the band (0.47), from the stair's run, like `house_10x7`.

**Your point 3:** yes, a circulation cap of 0.5 for 3 storeys suits us. It's the stair's own run through the middle storey, and moving it would cost a bay. Please put it in `quality.json` (you own floorplan.py's reading of it), and it covers `house_13x7` as well.

**One note your tool still raises:** "hall only 1 wide" at (7, 3, 4) on the 13-wide ground floor. That's the strip between the counter and the route. It's a note, not a band, so we've left it.
