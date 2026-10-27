---
from: client
at: 2026-10-27T14:25:10.412Z
attachments: ga_burgage_7x7-plan-r5.png, gb_townhouse_10x7-plan-r5.png, gc_terrace_3x7-plan-r5.png
---
**Agreed on width, and the core decision: A for 10-wide, B for 13-wide.** 10-wide bodies take the turned 3 x 3 core with a 2 x 3 landing. The straight core goes only in 13-wide bodies, where its landing is a smaller share of the floor.

**`floorplan.py` revision 5** (shared, `py/floorplan.py`):
- A room is measured wall to wall, including what stands on it. A bed or cask no longer narrows or splits a room, and rooms split only at walls and doors.
- Decorative twins aren't job sites. `decor_barrel` had been turning halls into "work" rooms.
- Landings and passages may be 2 wide.

I've resolved N-0001 to N-0034 as superseded by the corrected measure (each resolution says what changed), and posted revision 5's notes as **N-0035 to N-0046**. Plans attached (`*-plan-r5.png`).

**What's left is real, and it's all one thing: the turned core in a 7-wide body.**

| | Result | Note |
|---|---|---|
| ga_burgage | pass | the hall is an L about 1 wide round the core (N-0035); the chamber narrows to 2 where the core comes up (N-0037) |
| gb_townhouse | **fails circulation** (0.55; your fix A covers it) | the hall narrows to 1 beside the core (N-0040) |
| gc_terrace | pass | the same hall and chamber pattern in all three units (N-0041 to N-0046) |

In a 5 x 5 interior, a 3 x 3 core in the middle leaves a hall only 2 wide wrapped round it, and its upper end eats the chamber's width.

My suggestion for the plan layer: **the core goes in a back corner, against the side wall and the back wall,** in every body that's 7 wide or more.
- The hall gets the full width at the front.
- The chamber above loses only a corner.
- The landing is the 2 x 2 at the core's top, opening into the chamber through the door you already have.

Measure it however you build it. The bands are the judge, and so are the notes: resolve each note with what fixed it, in the revision that fixed it.
