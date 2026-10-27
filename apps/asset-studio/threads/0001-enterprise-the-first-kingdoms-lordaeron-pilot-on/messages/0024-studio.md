---
from: studio
at: 2026-10-27T17:05:24.055Z
attachments: 017-lordaeron-earthworks-rev3.zip, 017-lordaeron-earthworks-rev3-manifest.json, demo_plinth.jpg, side.jpg
---
**Batch 017: earthworks rev 3**, with both pieces you asked for. All 55 tiles pass the shared validator, and `017-lordaeron-earthworks-rev3.zip` replaces 014 whole. Your fixes (whole-plot cut and fill, courses with terraces, tree clearing) are the right ones. Looking forward to r33.

**Side flight, `steps_side_h2`, `_h3`, `_h4`:** for a door facing a rise of 2 to 4 inside a 3-deep front yard.
- **Size:** 2r + 1 long (5, 7, 9) by 3 deep, so it fits plots from 9 wide.
- **Rows:**
  - z 0, against the house, stays at plot level, with a guard wall past the landing;
  - z 1 is the landing at x 0, then the flight running along the yard to +x, half steps only, reaching street level at the far end;
  - z 2, the street edge, is a coursed retaining wall with a parapet and a lamp on its post, open at the flight's foot.
- **Placing it:** put x 0 at the door's column. Mirror the tile for a flight running to -x (toward whichever side has room). Lay `retain_h<r>` along the rest of the street edge, and the wall runs on.
- **Metadata:** each tile's JSON gives `landing: [0, 1]` and `door_column: 0`.

**Stepped plinth, `plinth_h1..h3_1` and `plinth_h1..h3_corner`:** for a house's foot standing on a fill above its own yard.
- **Rise:** 1 to 3, the house's ground over the yard's. Above 3, use your retaining courses.
- **Run tile:** 1 wide, r + 1 deep, z 0 against the wall.
  - Row 0 is coped flush with the house's ground.
  - Each row out is a course lower, under a stone-brick stair: the water table stepping down.
  - The outermost row is a stair toe on the yard.
- **Corner:** the outer corner, (r + 1) square, drawn for the house to its north-west. Rotate for the others.
- **Courses:** a cobble footing course, then mixed coursing, as on the retaining walls.

A door on a plinth wall needs its approach: where the plinth is under the door, a `steps_h<r>_3` flight in front of it, or skip the plinth there.

**Previews** in `assets-src/lordaeron/earthworks/`:
- `demo_plinth.jpg` (and its `.nbt`): a block on a 2-high fill wrapped in the plinth with its four corners, beside a yard 3 above the street with the side flight and retaining runs;
- `steps_side_h3.jpg`: the flight alone.
