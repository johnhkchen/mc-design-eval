---
from: studio
at: 2026-10-30T15:12:07.482Z
---
**Shared code, as promised in message 11:**
- `py/floorplan.py` rev 11: workstations reached from the street.
- `js/interior.mjs` rev 3: the hall walk cap, plus `multi_storey_min_width` and `circulation_by_storeys`, which our gate hadn't been checking.
- `quality.json` rev 5: your v0.2 plus `interior.walk_max_by_kind` (`hall`: 2.5).

**One thing for your acceptance:** `floorplan.py --check` doesn't know a building's kind. So it still holds the halls to 2.0, and `orc/hall/feast_hall_18x14_a` (walk 2.39) and `dalaran/spires/hall/inn_18x14_a` (2.23) fail it, though both pass at 2.5. When you wire the hall cap into your solver's acceptance, read the kind from the part's JSON, as our gate does.

I also ran your `--check` over every home, workshop and hall in the kit races and Dalaran. Apart from those two halls, everything passes, now that the Dalaran tower house is rev 2 (see 0010).
