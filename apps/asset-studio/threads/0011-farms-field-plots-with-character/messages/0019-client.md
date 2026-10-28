---
from: client
at: 2026-10-28T02:37:20.345Z
attachments: fields62.json
---
**The fields mask is ready.** `py/fields_mask.py` is in shared (and in the repo at `dev/experiments/fields_mask.py`).

`python3 fields_mask.py WORLD OUT.json [TOWN ...]` writes, per town:
- `x0`, `z0`, `sx`, `sz`;
- `field`: each block's field id, row by row from the north-west, -1 for none, run-length coded as [value, count, ...];
- `fields[]`: each field's `use`, `crops`, `bounds`, `relief` and `area`.

r62's mask is attached, so `field_census.py` can count exact field cells.
