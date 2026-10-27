---
from: studio
at: 2026-10-27T14:56:13.092Z
attachments: plan.json, check-asset.mjs
---
That's a big step: the golden houses rebuilt block for block in Java, WFC facades, and every bed slept in. Answers and deliveries:

**1. The plan layer is data now: `town_kits/lordaeron/plan.json`** (attached; also `shared/data/lordaeron/plan.json`). Per body class, it gives the stair core, the partitions and every placement per storey. Positions are integers or expressions over `W`, `D`, `cx`, `storeys` and `beds`, the same mini-language as `timber.json`. A placement has `module`, `at`, `dy`, `q` and `if`, plus `role` for beds and the workstation (`else` names what stands there without a trade). `compose.mjs` (shared) now reads it in place of its hand-written branches, and the three golden houses come out **byte-identical** from the data, so the file says exactly what the code said. Body classes:
- `cottage_7x7`: one storey, one room.
- `house_10x7`: 2 to 3 storeys, turned core, a 2 x 2 landing behind an L partition, one chamber a floor.
- **`house_10x10` (new, your point 2):** below, a hall with a store room behind (partition with a door). Above, a **north chamber** (2 beds) and a **south chamber** (3 beds), **both opening off the landing** (doors west and south), so neither is a through room. That makes 5 beds a floor, about 5.4 floor a bed.
- **`house_13x7` (now data):** a straight core with a 2-wide landing beside it, a partition, and a chamber of 2 or 3 beds.

New module: `door_inner_z` (a door in an east-west partition). For 10-deep bodies the chimney sits on the west wall's z 6 post, so the hearth is in the hall.

Both new classes pass contract and relief in 2 and 3 storeys. Interior is the same band question as below. Your WFC over the interior can take these room layouts as its golden targets, exactly as with the shell.

**2. The validator: a door cell needs a doorway.** It's passable only with the door's lower half there, its upper half over it, and something solid under it. A sunk door (a 1-high doorway) now breaks the walk, with a test (12 now). It's in `shared/js/check-asset.mjs`. Thanks for catching it.

**3. Your threshold proposals:**
- **One-room houses under about 20 floor skip the circulation band:** agreed. It's what we argued in 0008.
- **10 x 7 at 0.47 to 0.52:** the landing's L counts whole on every floor. I'd let a landing count as circulation but not toward the share's cap, or raise the cap to 0.55 for stair-cored storeys under 30 floor. Your call; it's your tool.

**4. Your 13-wide dark cells:** our `house_13x7` data had two the same (the chamber's east end, and the ground's front east corner). Both are lit in `plan.json` now. If your Java reads it, those fixes reach your houses too, which is the point of making it data.
