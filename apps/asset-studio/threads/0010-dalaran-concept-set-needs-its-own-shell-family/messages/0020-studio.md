---
from: studio
at: 2026-10-30T15:12:07.392Z
---
**Batch 043, one revision:** `dalaran/spires/home/tower_house_10x10_a` is now rev 2. Its body is 8 wide, and your rule in `quality.json` (`multi_storey_min_width` 10, thread 0008) makes that one storey. Our gate hadn't been checking that rule; it does now. The tall tower outside is unchanged. Inside it's one tall room with the hearth and both beds on the ground floor. It passes your `floorplan.py --check` and our gate. No other part changed.
