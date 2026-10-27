---
from: client
at: 2026-10-27T14:51:23.253Z
attachments: generated-houses.zip, results.json
---
**The generator is in: your module set, composed in Java, with facades chosen by wave-function collapse.** Results, one finding for your validator, and a request: the plan layer as data.

**What's built** (pushed to our main):
- **`Compose`** lays any layout of the set from its part files: mirrored first, then turned clockwise about the part's footprint, as your `Grid.paste`. Turns and mirrors of block states use Minecraft's own. A game test rebuilds all three golden houses, the terrace's three units included, **block for block** against your `__stone` files.
- **`Houses`** makes a layout for any body 3n + 1 by 3n + 1, of 1 to 3 storeys:
  - your `layoutOf`'s shell, core and fit-out, with 7 wide held to one storey;
  - each face's bays chosen by WFC over a grid of bays by storeys. The door, a shop front and the bays over the stair are pinned. The rest choose among window, window box and plain daub by the set's weights. A box sits only beside a plain window along the front, and each column keeps its kind up the house.
  - One body with another seed gives another face.
- **`/enterprise houses N`** writes a sheet (N seeds of each body) as `.nbt` and `.json` for the gates. The attached zip is N = 4: 28 houses across 7 bodies.

**In game:** one of each body went on the test street. **Every house laid (6 to 10 ms) and every bed was slept in,** upper floors included.

**Against the gates** (`results.json`, per house):
- **Contract:** 16 of 28 pass. The misses are 1 to 3 dark cells in the 13-wide fit-outs (lantern spots: mine to fix).
- **Interior:** 0 of 28 pass. Some of that is a threshold question, some is plan layer:
  1. **The 7 x 7 cottage, one room:** circulation 0.67. In a 15-cell room, the routes to two beds, a hearth and a chest *are* the room. I'd let a single-room house under about 20 floor skip the circulation band; it has no corridors to judge. Agree?
  2. **The 10-deep bodies** (10 x 10, 13 x 10) still get the 7-deep fit-out, so they have 2 beds on a 40-cell floor: floor per bed 20, idle 0.56. They need a fit-out of their own, a second chamber or a room behind.
  3. **10 x 7 with 2 or 3 storeys:** circulation 0.47 to 0.52, just over the band, because the landing's L counts whole on every floor.

**A finding for the validator.** My first port put the partitions on the floor layer instead of one above it (your `put` defaults to dy = 1). The inner door was sunk a block: a 1-high doorway between the landing and the chamber. `floorplan.py` refused the beds behind it as unreached, but the shared validator passed the house. In game the villagers slept anyway, so a 1-high door may not stop them. Still, the validator's walk should require 2 clear at a door cell, as everywhere else.

**The request: make the plan layer data, not code.** Today the fit-out is three hand-written branches in your `layoutOf`, and now in my Java too. Every new body or room rule means editing both. Could you express it as a `plan.json` per set?
- room tiles: hall, chamber (2 made beds, a chest, a lantern), landing, cottage room, work, store, each with its size, its furniture placements and what must touch what;
- rules per body class: how many chambers per storey, where the core goes, where partitions run.

I'd solve it with the same WFC over the interior grid: room tiles as modules, adjacency as sockets, the core pinned. Then a new body size, a deeper house, or a different faction's interiors is a data change you make and both sides' tools judge. It's the same move we made for the shell.
