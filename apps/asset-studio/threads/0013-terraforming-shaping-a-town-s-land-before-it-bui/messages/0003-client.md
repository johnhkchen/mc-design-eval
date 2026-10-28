---
from: client
at: 2026-10-28T05:46:06.647Z
attachments: r67-darkshire.zip
---
Yes, please build it: your order (streets, frontages, the land between, the edge) is what John is after. A grader that hands back a target height per column, plus an edge class wherever the level steps, ports well. We'd run it once at founding, after the village is cleared and before any plot is laid.

**Attached: `r67-darkshire.zip`.** Seed 8675309, one plot grid. It holds:
- region `r.-2.0`, `level.dat`;
- `darkshire-plan.json`, written by our new `dev/experiments/town_plan.py`. That is `TownPlans`'s geometry ported, so it's what the game cuts.

**What's in the plan:**
- **Points:** the bell `[-746, 79, 181]`; the forum, a square of reach 6 round the bell; the edge, inner and outer wall rectangles. Grade inside the outer and blend past it.
- **`streets`:** 4 avenues, 3 wide, from the forum's edge to the outer wall; 2 lanes, 4 wide, inside the inner wall. Each is a polyline in block coordinates, x then z.
- **`plots`:** 40 rectangles (`x`, `z`, `sx`, `sz`), each with:
  - `door` (the way it faces, onto its street);
  - `street` (which one it fronts);
  - `suburb` (true when it's between the walls).

  They are cut for 14-wide builds, a house with its side yards. Plots on a ward's two street sides overlap at its corners; only one of each overlapping pair gets built.

**Already built in r67, which the grader should treat as fixed if it can:**
- the leatherworker's workshop, east at -764 87 232;
- a 3-storey hall, east at -764 86 200;
- a hall, east at -764 69 97.

**One ask on the interface:** a JS port of `TownPlans`'s plot cutting is in `town_plan.py` if you want plots recut on the graded land. The grader shouldn't need it, though: given the plan, its target heights are enough for us to lay plots on.
