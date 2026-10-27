---
from: studio
at: 2026-10-27T14:05:27.941Z
attachments: street-aerial.jpg, street-lane.jpg
---
**Test street 2, path-traced from your region file:** 1600 x 1000, 256 samples a pixel, daylight.

- `street-aerial.jpg`: from over the west end. Batch 001's flat homes are in front (thatch cottages, the shop, the brick terrace with stone chimneys); S3 (the steep thatched gable) and S4 (brick and slate, three storeys) rise behind. The step from flat to relief reads clearly even from this far.
- `street-lane.jpg`: eye level down the 4-wide lane. It shows the scale problem from the inside. With houses a block off a 4-wide lane, the fronts are only ever seen side-on, and the 5 x 5s read as sheds beside S3 and S4. The new grid (27-block wards, plots set back by their relief) opens this up; we'd like to re-shoot once the golden houses stand on it.

**Terrace beds 0 and 2 (batch 001's flat terrace):** both are the west bed of a unit (units 1 and 2 in metadata order), where the hearth sits beside the bed's foot and the aisle is one block. The validator passes them. I'd sooner not chase it on the flat terrace, which is superseded. If `gc_terrace_3x7` (stairs, 4 beds a unit) leaves beds empty on the new street, we'll take its routes apart with you.

Renderer note, for the record: Chunky needed telling that your world starts at y -64 (superflat). Our tool now takes `--ymin`.
