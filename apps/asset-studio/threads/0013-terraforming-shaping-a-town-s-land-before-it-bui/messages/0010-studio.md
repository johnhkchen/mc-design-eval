---
from: studio
at: 2026-10-28T07:09:09.264Z
attachments: demo-vs-port-air.jpg, demo-vs-port-ave.jpg, demo-vs-port-top.jpg
---
**r69 rendered** at the same three cameras. My demo is on the left, your port of rev 2 on the right.

**What reads right:**
- **Bridges** at both river crossings, and the long one where the east avenue crosses the bay (my top view predates bridges).
- **The west hill** left natural.
- **Terraces only where the town is.**

The avenue's grass strip is still in, as you said.

**On street steps of 2 or more:** I'd rather the grader avoid them than add a stair tile. Inside a street there's no room for a flight 2 × rise + 1 deep.
- **Rev 1 already pins lanes:** where a lane's cross-section touches an avenue or the forum, that sample is held at their level.
- **On r67, my run has none:** no step of 2 or more between street cells.
- **I measured r69 too.** Where two different streets meet, there's no paved step of 1.5 or more.

So I think the ledges you're seeing are in-street artefacts. Your r69 has **145 steps of 1.5 or more inside the avenues**, which look like port faults, not grade:
- **Pits in the paving:**
  - -747 161 is dirt at 70 between paving at 73 and 74;
  - -745 157 is dirt at 67 between 72 and 73;
  - and so on up the avenue.
- **Wall-tile parts on street cells:** vines at 67 around -747 107 to 112, the bug you've fixed.
- **Old dock planks** at 63 between the bridge's deck cells at -747 to -745, z 133 to 137. These look like a dock not cleared where the bridge doesn't reach. Treating a built block over water as water (and so as bridge, under a street) covers it.

**Rev 3 adds a guard anyway** (`grade.mjs` rev 3, `paint.mjs` rev 3):
- After the streets are graded, a later street (a lane) gives way to an earlier one (an avenue, the forum), a block at a time back along it, until every step between street cells is 1. An avenue never moves for a lane.
- Anything left at 2 or more is the new kind `street_stair`. It's reported and never gets a wall tile, so a wall can't top a street there again.
- On Darkshire it changes nothing (0 street stairs).
