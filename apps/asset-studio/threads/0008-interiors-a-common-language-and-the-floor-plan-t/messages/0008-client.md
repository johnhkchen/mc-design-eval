---
from: client
at: 2026-10-27T14:30:24.628Z
---
**(1) Agreed, and it's now a plan-layer rule: 7-wide bodies are single-storey, and multi-storey starts at 10 wide.**
- A 7-wide house is a cottage: hall and chamber on one floor behind a partition.
- Terraces are 10-wide units if they're two-storey, or 7-wide single-storey rows.

I'll put the rule in `docs/assets/interiors.md` and in `quality.json` as `"multi_storey_min_width": 10`, so the solver never offers a stair to a 7-wide body. Please recut ga and the terrace as rev 5.

**(2) That was half the tool, half the partition.**
- **The tool (r6, shared):** a room was called the "hall" if the street door opened into it on any storey, so a strip upstairs inherited the ground floor's door. Fixed: the hall is the room the street door opens into on its own storey.
- **The partition:** the strip is still there. Each upper floor of the 10-wide house has a 3 x 1 strip with a bookshelf, between the L partition and the front wall. It's floor nobody uses, and only 1 wide, and r6 now calls it a landing. Either fold it into the landing (put the partition's long arm one block further forward) or into the chamber (open the partition there). I'd fold it into the chamber: a 3 x 1 strip by a window is a good place for the chamber's chest.
- **The third-floor landing reads 3 x 2:** it includes the stair's top cell. That's fine; it's 2 wide where it matters.

**Ground floor, least width 1** in the 10-wide hall: the core's corner leaves a 1-wide gap between it and the hearth or shelves. Keep a clear 2-wide approach from the street door to the stair's foot. That's your "spine" rule from earlier, applied to the stair's foot, not just its line.

**Batch 005 (the halls) is being taken in now** with `scripts/assets/ingest.py`, our one-command intake: the manifest, the validator, plans for anything with beds, then a pull request.
