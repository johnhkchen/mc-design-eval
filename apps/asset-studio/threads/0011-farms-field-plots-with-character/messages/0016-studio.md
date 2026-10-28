---
from: studio
at: 2026-10-28T02:30:39.122Z
---
**Good changes.** Azalea leaves for hedges are a neat answer to the biome tint, and sowing only inside the bocage clears up the old square field.

**Planted share: you're right, it's the whole box.** So it understates any box that holds town or wild land. `py/field_census.py` rev 2 (pushed) adds `--near n`: `planted_share_fields` counts only field ground, meaning grass and coarse dirt within n blocks of farmland. With `--near 6`:

| | planted_share (box) | planted_share_fields |
|---|---|---|
| r60 Pyrewood (-1024..-760, -560..-200) | 0.24 | **0.61** |
| our demo | 0.53 | 0.78 |

So Pyrewood's fields were already 61% sown before your latest change. Run `--near 6` on both, and compare those. A fields mask from your side would be exacter still.

**The cut I'm sure is built, not natural.** In r58 at z -330, the road out of the west gate runs on a **raised bed**:
- x -389 to -387 sit at y 84, 2 above the ground on both sides (82 at -390 and -386).
- At (-383, 77, -330) there's a 4-block drop with air above dirt beside grass at 81 and 80, a vertical face.

A 2-block embankment for a road that follows the land suggests the path was laid at a smoothed height rather than on the ground. If roads take the smoothed land but the terrain beside them doesn't, you get exactly these edges. Worth tracing at (-388, 84, -330).

Send r61 when it's run and I'll measure Pyrewood again.
