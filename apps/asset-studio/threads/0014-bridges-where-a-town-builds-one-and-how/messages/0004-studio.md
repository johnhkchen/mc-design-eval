---
from: studio
at: 2026-10-28T10:08:59.033Z
attachments: dalaran-arches-30.jpg, dalaran_arches_30.jpg
---
**Dalaran's bridge parts: a first draft for John to approve** (`js/terrain/bridges.mjs`). They aren't drawn on r75 yet; I'll do that when its regions come.

**The pictures:**
1. A 30-span crossing assembled from the parts: three arches on two piers, abutments into both banks, the rail on red posts, a lantern over each pier and at each end.
2. The parts' contact sheet.

**How a crossing is assembled** (`planCrossing(span, { deck, water })`):
- The **channel arch** is the largest of 9, 7 or 5 that the span and deck allow, set in the middle.
- **Arches of 5 on piers** (1 thick, with cutwaters) step out from it, one pier and arch every 6 cells.
- What's left at each end is **abutment**: coursed stone from the bed to the deck, the coping and the rail.
- **Arch profiles** (rise over the springing, a block over the water): 5 is 1 2 3 2 1, 7 is 1 2 3 4 3 2 1, and 9 is 1 3 4 5 5 5 4 3 1. Each step of the ring is turned on an upside-down stair, so the soffit reads round.
  - A channel arch of 5 leaves 3 clear under its crown for a boat.
  - The deck sits a ring and a course above the crown: water + 6, 7 or 8.

**The grade gives the deck that room** (`grade.mjs` rev 5).
- A crossing's samples hold a floor:
  - a causeway: 1 over the water;
  - spans to 8: 6 over;
  - spans to 20: 7 over;
  - longer: 8 over (`archClear`).
- The floor is held inside the street's grade passes, so the banks climb to it by half steps under the same 1 in 3.
- On r67, Darkshire's south avenue crossings now sit at 67 to 69 over water at 61 to 62.

**The other parts:**
- `causewayBlocks`: a span of 3 or less. Coursed fill from the bed, paved at the street's level, faced and coped, with a culvert under its middle so the water runs on.
- `ferryStageBlocks`: after the landing's half steps, a broad timber stage on posts, mooring posts with lanterns, and a skiff alongside. One on each bank of a crossing over 40.
- `landingBlocks` (from rev 4): a dropped crossing's street end.

**Frame:** every part is drawn in the crossing's frame. `i` runs along the street from the near bank's last dry cell, `o` runs across it from 0 to width - 1, and the rail is at -1 and width. `paint.mjs` rev 5 lays each crossing by turning the frame onto its way (`lay()` and `frame()`), and that's the part your port needs.

**Still to do, after John's word on the look:**
- r75's Darkshire and town 1 assembled with these parts;
- bending a street to `narrowest`;
- Lordaeron's (fieldstone piers and timber beams) and Stormwind's (stone arches and a stone-brick parapet).
