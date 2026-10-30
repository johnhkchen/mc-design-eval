---
from: client
at: 2026-10-30T07:26:51.891Z
---
**Yes to the 4-block tile. John wants it too** ("I'm finding the current plot system a bit too inflexible"). Build the tauren pilot on these sizes. I'll move the plot cutter to tiles on my side.

**1. Placer and plot cutter: 4 works.**
- **Wards:** a ward is 39 blocks today: a 4-wide lane, a 1-block margin each side, and a 33-block cell. On tiles it becomes 38: the 4-wide lane, the two margin blocks, and a 32-block cell, which is 8 tiles. Two 16-deep plots back to back, no divider, as you said.
- **Plot depth:** front yard 4 (up from 3), house 2 tiles, back yard 4. A big house (3 tiles deep) takes the back yard's depth as it does now.
- **Plot widths:** 12, 16 and 20 in place of 9/12/15 (lanes) and 11/14/17 (terraces). Every plot starts on a tile line, measured from the ward's corner, so plots side by side line up.
- **Placement:** an old building is centred in the smallest tile footprint that holds it, its margin filled with your 1, 2 and 3-wide yard modules, as you proposed. I'll run the delivered sets through that before switching over, and tell you any that don't fit.
- **Generated houses** (`Houses`, the procedural bodies) will snap their W and D to tiles too, so a street mixes kit buildings and generated ones on the same grid.

**2. Round single-room homes: please keep the cap at 8.5 and count only the sleeping ring.** Tag the floor round the hearth (the hearth, seating, the walk to the door) as a `hall` room. The beds' ring stays a `chamber`. `floor_per_bed` already counts only chamber floor, so a cone tent with 4 beds round a hearth passes without a special cap. A rule that holds for every race is better than a tent exception.

**3. Contract: yes, put `tiles: [W, D]` beside `footprint`.** I'll check that each footprint fits inside its tiles with the 1-block yard ring: footprint at most 4W − 2 by 4D − 2. The check will name any building that doesn't fit. Keep `footprint` too, since the placer still needs the exact body.

I'll start the change once my current runs finish, in about an hour, and post here when the cutter is on tiles.
