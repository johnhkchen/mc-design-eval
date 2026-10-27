---
from: studio
at: 2026-10-27T13:51:31.877Z
attachments: s3_burgage_7x7-sheet.jpg, s4_wide_9x7-sheet.jpg
---
Agreed on the split and on the format. You run procedural generation and scale; we design the detail: parts, sockets, weights, and the golden houses the solver must reproduce. Two layers solved in order (plan, then shell), `behind`, `weight`, `limits`, `stacks` and `rooms` all work for us. What building our first detailed houses taught us, with the changes we'd ask for:

**1. Modules are two layers deep.** John has ruled flat walls out of production, so every shell module carries its relief: the wall layer on the body's line and a relief layer one block outside. In the relief layer:
- corner posts stand proud;
- studs are dark boards on the daub;
- a half-slab girt band runs at each floor (so no mob spawns on it);
- stair sills sit under windows, with flower pots on some;
- doors have a hood;
- the chimney has a breast.

So a bay is `size: [2, 5, 2]` (width, storey, depth) with sockets on left, right, up and down, plus `relief: "out" | "party"`. A party-wall face uses a flat one-layer variant. Corner modules are 2 x 2 in plan. The set's grid becomes `{"post": 1, "bay": 2, "storey": 5, "relief": 1}`, as you wrote.

**2. The 1 + 2 grid and the door.** Posts of 1 and bays of 2 give fronts 3n + 1 wide: 7, 10, 13. On a 7, the centre column is a post, so the door can't sit centred in a 1-wide column. We'd make **`bay_door` 2 wide**: a door and a sidelight (window), mirrored per house, or a double door (villagers manage those). Then a 7 is post, door bay, post, window bay, post: asymmetric, which is very Tudor. Even widths give an even roof span; we'll make the ridge 2 wide (a flat ridge course), which reads fine.

**3. The stair core has a fixed size.** At storey 5, a straight stair is 5 steps of 1 rise, with the top step in the floor above. Headroom means 3 holes in that floor. The core is **2 x 5 cells**: the stair and a corridor beside it. It stacks through every storey with the same footprint, which matches your "stair tiles stack". So a stair-cored house needs a body at least 7 deep. For 5-deep bodies (terraces), we'll design a turned stair: a 3 x 3 core rising 5 with a landing.

**4. Detail follows the plan, not just the bay type:**
- `chamber` behind: window with a sill and maybe a window box;
- `hearth` behind: the chimney breast, through every storey and the roof;
- `stair` behind: a smaller window at the landing height;
- `store` behind: a plain daub panel.

The weights we'll tune from your sheets.

**What we'll deliver for the set:**
- **Golden houses** (`.nbt`, `.json`, and a room plan per storey, so your plan layer can match them):
  - G-A: a 7-wide burgage house, 2 storeys, 3 beds;
  - G-B: a 9-wide town house, 3 storeys, 6 beds, shop front;
  - G-C: a terrace of three 7-wide units on G1;
  - G-D: a corner house.
- **Modules:** cut from those same houses, so the set provably reproduces them.

Attached: the first two candidates, G-A in daub and G-B in brick with a slate roof. Both pass the shared validator, every bed reached by stairs. They aren't yet on the 1 + 2 grid (they use odd widths and centred doors). We'll redo them on your grid once you confirm points 1 to 3.
