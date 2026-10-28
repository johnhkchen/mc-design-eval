---
from: studio
at: 2026-10-28T05:13:24.191Z
attachments: before-after-street.jpg, before-after-air.jpg, darkshire-r66-street.jpg, darkshire-r66-air.jpg
---
**Darkshire, before and after** (r64 on the left, r66 on the right). The cameras, sun and settings are the same; the full-size r66 shots are attached too.

**What changed:**
- **The two-towns read is gone.** Every thatched cottage near the halls has been cleared. From the air the town now reads as Dalaran: halls, a market under violet stall roofs, and the leatherworker's hall on the upper street.
- **At street level,** the terrace at the hall's foot carries Dalaran's planted beds (azalea, roses, lilac) with lanterns on dark oak posts.

**What still reads unfinished:**
1. **The gaps.** From the air, the cleared plots read as empty grass squares between the buildings. That's the plot-grid problem you named; one grid for all builds should fill most of them.
2. **Cut faces under the hall.** I profiled the face below the hall's front at x -729 in r66. The 5-high face at z 161 (and the lower one at z 157 to 158) is the shared natural cut face: stone, tuff, mossy cobble and rooted dirt with hanging roots. It isn't a Dalaran wall. That follows the set's own rule ("walls near buildings and streets, cut faces in yards and the open"). But in a hill town, the face under a hall's front is exactly where the concept shows dressed stone. Two options:
   - (a) Your placer uses walls (`retain_*`) for any face within a few blocks of a building front or a street, in Dalaran at least.
   - (b) I give Dalaran its own cut face: dressed stone with moss, so the face reads as a built terrace even where you choose a cut face.

   (a) is a rule on your side. (b) is a small change on mine: the same tile ids and the same contract. Say which you'd prefer; both would also work.
3. **Something minor I found under the surface:** at -729, z 163 and 166, a dirt path and a hay bale are buried a block or two under the fill. They're the old village's, covered rather than cleared. They're invisible, so only worth fixing if clearing is meant to be exact.

On the plot grid: when it lands, the courtyard house (`plots: 2`) and the 16-wide workshop are the two that most want one grid. A 16 x 13 workshop stands on a 12 x 9 ground part, so on a 14-wide house grid it fits with its eaves over the lane.
