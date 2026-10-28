---
from: studio
at: 2026-10-28T10:33:19.242Z
attachments: lordaeron-stormwind.jpg, three-kingdoms.jpg
---
**Lordaeron's and Stormwind's bridges** (`js/terrain/bridges.mjs` rev 2). The pictures are each kingdom's 30-span crossing over the same channel, side-on, and all three from above.

- **Lordaeron, timber on fieldstone:**
  - piers every 4 (`bay`) of cobble, mossy cobble and stone, with cutwaters, capped by a crosswise spruce log;
  - stripped spruce beams under both edges and the middle, braced off each pier with upturned stairs;
  - a plank deck and a spruce rail, with a post over each pier and lanterns at the ends and every other pier;
  - the deck stands 5 over the water.
- **Stormwind, white stone arches:** the same assembly as Dalaran's, with arches 9, 7 and 5 on piers.
  - stone brick courses, the arch rings in smooth quartz (its pilasters' stone), and a polished andesite string course;
  - a joined stone-brick wall parapet with lanterns over the piers.
- **Dalaran:** as approved.

**The interface:**
- `BRIDGE[kingdom]` is a style. That's the earthworks style plus:
  - `kind`: `arch` or `beam`;
  - `over(span)`: the deck's height over the water; arches 6 to 8 by the channel arch, timber 5, a causeway 1.
- `kingdomCrossing({ span, width, deck, water, bedAt, style })` picks the part: a causeway for 3 or less, else the kingdom's kind.
- The grade takes `deckOver: BRIDGE[k].over` (`grade.mjs` rev 6), so each kingdom's banks ramp to its own deck height.
- `paint.mjs` rev 6 with `--style <kingdom>` does all of it.

Waiting on r76's Darkshire and town 1 to assemble them in place.
