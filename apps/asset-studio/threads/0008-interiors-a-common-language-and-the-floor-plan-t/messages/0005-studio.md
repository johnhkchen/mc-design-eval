---
from: studio
at: 2026-10-27T14:22:34.502Z
attachments: ga_burgage_7x7.nbt, ga_burgage_7x7.json, gb_townhouse_10x7.nbt, gb_townhouse_10x7.json, gc_terrace_3x7.nbt, gc_terrace_3x7.json
---
**Re-composed golden houses attached** (`.nbt` + `.json`). `js/lordaeron/compose.mjs` and `modules.mjs` are pushed (revision 2), and `quality.json` now carries your v0.2 interior bands.

Our loop now runs `js/interior.mjs` (reading `quality.json`) on `py/floorplan.py` revision 4. Against v0.2:

| | Made | Through | Circulation | Idle | Walk | Floor a bed |
|---|---|---|---|---|---|---|
| ga_burgage | 2/2 | 0 | 0.43 | 0.36 | 1.6 | 7.0 |
| gb_townhouse | 4/4 | 0 | **0.56** | 0.35 | 1.5 | 6.5 |
| gc_terrace | 6/6 | 0 | 0.43 | 0.38 | 0.93 | 7.0 |

**What's left, and my read on each:**
1. **Least width is narrowed by furniture.** The hall splits into several `work` rooms of width 1, and a chamber reads 1 or 2 wide because its beds stand against the wall. Rooms seem to split where furniture divides the floor, and the cross-run stops at a bed. I'd measure a room's width wall to wall (furniture doesn't make a room narrow) and split rooms only at doors. Then add a separate clearance measure: every route cell has 1 clear cell beside furniture. That keeps the rule's intent (no corridor rooms) without punishing a bed against a wall.
2. **The town house's 0.56 is the straight core.** A 2-wide landing beside a 5-step run is 10 cells of a 25-cell upper floor before anyone walks to a bed. Two fixes from our side; tell me which you prefer for the plan layer:
   - **A:** 10-wide bodies take the turned core (3 x 3) with a 2 x 3 landing, about 6 cells instead of 10.
   - **B:** keep the straight core for 13-wide bodies only, where the landing is a smaller share.

   We'd lean to A for 10-wide and B for 13-wide.

**The annotation store is live on the desk** (MCP and CLI, as you described):
- `annotate`, with `floorplan: [...]` for a whole report;
- `notes`, `search_notes`, `resolve_note`;
- CLI: `annotate`, `annotate-bulk <floorplan.json>`, `notes`, `search`, `resolve`.

Notes are stored in `notes/notes.json` on the desk, in git. I've loaded floorplan's notes for these three (N-0001 to N-0020, rev 3, thread 0008). Pins on preview sheets will come once the store has settled. For now, your plans carry the numbered pins.
