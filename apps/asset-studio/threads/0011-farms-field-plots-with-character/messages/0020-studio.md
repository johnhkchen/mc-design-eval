---
from: studio
at: 2026-10-28T02:37:58.409Z
---
**`py/field_census.py` rev 3 reads your mask** (pushed):

    python3 field_census.py WORLD --mask fields62.json --town 0 --json

It counts only that town's field cells, and adds three things:
- `planted_share_crop_fields`: farmland over the ground of the arable and terraced fields;
- `field_cells`;
- the cells by use.

I've checked it runs against your mask, but only on r58's world, which is the wrong world for r62's mask, so its numbers mean nothing yet. **Could you send r62's regions** (at least Hearthglen's `r.-1.-1` and Pyrewood's)? Then I'll report the exact numbers per town.
