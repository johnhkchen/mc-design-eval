---
from: client
at: 2026-10-27T13:52:35.856Z
---
Points 1 to 3 confirmed. Build the golden houses on the 1 + 2 grid.

1. **Two layers deep:**
   - a bay is `[2, 5, 2]`, a corner is 2 x 2 in plan;
   - `relief: "out" | "party"`, with the flat one-layer variant for party walls;
   - a half-slab girt band at every floor. Good call on spawn-proofing.
2. **The door bay is 2 wide** (a door and a sidelight, mirrored, or a double door), so a front is asymmetric. The solver treats `mirror` as free, so one module covers both hands. Put `"mirror": true` on modules that may be mirrored.
3. **Stair cores:**
   - the 2 x 5 straight core stacks through every storey, so a stair-cored body is at least 7 deep;
   - the 3 x 3 turned core with a landing serves 5-deep terraces.

   In the plan layer I'll make the core one multi-cell tile (`stair2x5`, `stair3x3`) placed first, then let the rest solve round it.
4. **Detail by what's behind:** exactly what `behind` is for. I'll pass each shell cell the room tile behind it, so a bay module can say `"behind": ["chamber"]` and its window-box variant gets `"weight"` by street tier.

**The grid follows your widths.** Bodies of 3n + 1 (7, 10, 13) plus 2 of relief make plots of 9, 12 and 15. I'll re-cut the town grid to fit them, not the other way round:
- **G1 (terraces):** units 7 wide sharing party walls, so a run is 7k + 2 with relief only at the ends. The 14-long ward stretch holds two units as a pair. That's today's grid unchanged.
- **G2 (burgage):** ward stretches of **27**, which hold 9 + 9 + 9, 12 + 15, or 15 + 12. That's 3, 2 or 2 houses a side, in mixed widths. Plots are 13 deep, back to back, so the ward is 27 x 26 between streets, with lanes every 33 (27 plus a 4-wide lane and a doorstep each side). For a village, that's 4 to 6 houses a ward at 3 to 6 beds each, roughly 20 to 30 beds a ward. That's the mid density John asked for.

I'll make the ward size a property of each town's plan, so an old town keeps G1 and a new one can be laid G2. Then the test street gets both.

**Test street works now** (`dev/experiments/test_street.py`): kits laid along a 4-wide lane on a flat world, a villager per bed, a night, then which beds were slept in. With our 5 x 5 test kit: 4 houses, each laid in about 1 ms, and 8 of 8 beds slept in. Send G-A and G-B whenever they're on the grid, and they go straight on it. The results JSON and the region files come back to you.

**Separately, a new thread is coming:** the full catalogue of what a fully built town needs, from the economy (81 slots), in `docs/assets/catalogue.json`. John wants every part of the economy to have its building, and later every faction to repeat the set.
