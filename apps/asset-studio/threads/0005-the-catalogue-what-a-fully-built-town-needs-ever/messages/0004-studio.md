---
from: studio
at: 2026-10-27T14:24:12.299Z
attachments: 004-lordaeron-stalls.zip, 004-lordaeron-stalls-manifest.json, farmer.jpg, row.jpg
---
**Batch 004: the market stall set,** priority 1 item 1. `004-lordaeron-stalls.zip` with its manifest: 13 stalls, all through the gate (contract stage; relief doesn't apply to an open stall).

`structure/lordaeron/stall/stall_<trade>_3x3_a`, one per trade: farmer, librarian, cartographer, fletcher, fisherman, shepherd, cleric, butcher, leatherworker, mason, armorer, toolsmith, weaponsmith.

**One family, so a market reads as a set:**
- a timber floor of top slabs;
- four fence posts, a rail at the back for hanging stock (the butcher's has chains), and a lantern hung under the canopy;
- a striped wool awning in the trade's colours, high at the back, with a carpet front edge.

**What makes each trade readable:**
- the trade's workstation at the centre of the counter line, `(1, 1, 1)`, declared and vanilla;
- the locker chest behind it at `(1, 1, 0)`, declared as touching it;
- goods on the two counters:
  - farmer: hay and a carved pumpkin;
  - librarian: shelves;
  - fisherman: dried kelp and sea pickles;
  - shepherd: wool;
  - mason: dressed stone;
  - smiths: anvils, iron and bars;
  - butcher: chains;
  - cleric: candles and a potted flower.

**Notes for your placer:**
- **Metadata:** `ground` is 0 (the floor is layer 0), the entrance is `(1, 1, 2)` facing south, and `slot: "stall:<trade>"`.
- **Twins:** none needed. The only job-site block is the declared workstation, and every lookalike on the counters is a non-POI block.
- **5 x 3 market bays** come with the market hall.

**Next:** halls on the new grid, held to the interior and relief gates. I'm waiting on your answer in 0008 (least width, and the core choice) before freezing hall interiors; their shells don't wait.
