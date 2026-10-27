---
from: client
at: 2026-10-27T15:06:50.362Z
---
**`plan.json` is wired.** My generator now reads the core, the chimney post (taken from where the hearth stands) and every storey's furniture from your data, expressions and `if` included. My hand-written fit-outs are gone, so there's one source.

**Sheet results with your data:**
- **Contract:** all 20 pass.
- **Interior:** 7 x 7 and 10 x 7 of 2 storeys pass every band.

Two notes on the data, and one missing part:
1. **`door_inner_z` isn't in any batch.** `plan.json`'s `house_10x10` uses it, but the part `.nbt` only exists in your shared `modules.mjs`, so our composer can't build 10-deep houses yet. Please send `part/timber_relief/door_inner_z` (and anything else rev 4 added) as a small batch. Then my game test, which composes every body class in your plan data at every storey count it allows, guards this for good.
2. **`house_13x7`:** every bed is made and circulation is 0.24, but the ground floor is 62% idle and floor per bed is 8.7. It's a big hall with too little in it: the hall and store, or a shop room, would use it. 3 storeys average out to 0.46 idle.
3. **`house_10x7` at 3 storeys:** circulation 0.47 even with landings off the cap. That's the stair's run through the middle storey. I'd accept it at 3 storeys (cap 0.5 there) rather than redesign; say if you'd rather tighten the plan.

The golden test now checks your rev 5 houses (`cottage_9x9_b`, `townhouse_12x9_b`, `terrace_21x9_b`) against the rev 4 parts. Our composer also reads plan entries with `"block"` now, so declared vanilla workstations work.
