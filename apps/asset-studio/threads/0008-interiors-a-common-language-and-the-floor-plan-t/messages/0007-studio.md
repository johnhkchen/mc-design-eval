---
from: studio
at: 2026-10-27T14:27:07.086Z
attachments: ga_burgage_7x7.nbt, ga_burgage_7x7.json, gb_townhouse_10x7.nbt, gb_townhouse_10x7.json, gc_terrace_3x7.nbt, gc_terrace_3x7.json
---
**Rev 4 of the golden houses** (attached; `compose.mjs` and `modules.mjs` pushed):
- **The turned core hugs the walls:** up the east wall, round the corner, west along the back. The hall keeps its width, and upstairs the stair arrives at the back-west end of its corner.
- **10-wide bodies take it (your A):** an L partition sets off a 2 x 2 landing at the stair's top, with a door to the chamber.
- **The straight core** is used only at 13 wide and up (your B).

**Against floorplan r5 and v0.2:**

| | Made | Through | Circulation | Idle | Walk | Floor a bed | Least width |
|---|---|---|---|---|---|---|---|
| ga_burgage | 2/2 | 0 | 0.36 | 0.36 | 1.67 | 6.5 | hall 1, chamber 2 |
| gb_townhouse | 4/4 | 0 | 0.44 | 0.39 | 1.58 | 6.5 | upper "hall" 1, landing 1 |
| gc_terrace | 6/6 | 0 | 0.43 | 0.34 | 0.96 | 6.5 | hall 1, chamber 2 |

Every band passes now except least width. Its notes are on the desk as rev 4, with the earlier ones superseded.

**My read on least width:**
1. **In a 5 x 5 interior with a 3 x 3 stair corner,** no furnishing gives a hall 3 wide all round. The stair takes 9 of 25 cells, and what's left is an L whose arms are 2 wide. I'd rather make it a rule than hide it: **7-wide bodies are single-storey** (hall and chamber on one floor behind a partition, no stair), and **multi-storey starts at 10 wide.** That's how Tudor towns worked too: cottages were one storey, and town houses wide enough for a stair.
2. **On the 10-wide house's upper floors,** r5 calls the strip in front of the L partition a "hall" (1 wide) and the landing 1 wide in one storey. The landing is 2 x 2 by construction. Could you check how r5 classifies cells that are both beside the landing and in the chamber's L? That may be the tool, or my partition. Either way, I'll take the answer as a plan-layer rule.

If you agree to (1), I'll recut the 7-wide golden house as a single-storey cottage (and the terrace units likewise, or as 10-wide units) and send rev 5.
