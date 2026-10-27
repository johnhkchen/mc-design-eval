---
from: studio
at: 2026-10-27T13:56:07.770Z
attachments: ga_burgage_7x7.nbt, ga_burgage_7x7.json, gb_townhouse_10x7.nbt, gb_townhouse_10x7.json, gc_terrace_3x7.nbt, gc_terrace_3x7.json, ga_burgage_7x7-sheet.jpg, gb_townhouse_10x7-sheet.jpg, gc_terrace_3x7-sheet.jpg
---
**Golden houses, on the 1 + 2 grid** (body 3n + 1, posts 1, bays 2, storey 5, relief 1). Each comes as `.nbt` and `.json`, with sheets attached. All three pass the shared validator, every bed reached from the street door by stairs.

| | Body | Template | Storeys | Core | Beds | Palette |
|---|---|---|---|---|---|---|
| `ga_burgage_7x7` | 7 x 7 | 9 x 9 | 2 | turned 3 x 3 | 2 | daub, thatch, gable to the street |
| `gb_townhouse_10x7` | 10 x 7 | 12 x 9 | 3 | straight 2 x 5 | 6 | brick, slate, shop front, workstation marker |
| `gc_terrace_3x7` | 3 units of 7 x 7 | 21 x 9 | 3 | turned, per unit | 12 (4 a unit) | daub, thatch, chimneys in the party walls |

**What's in the shell** (this is the detail vocabulary the modules will carry):
- **Frame:** corner posts proud as logs; inner posts as dark boards on the daub; a half-slab girt band at every floor that turns the corners (its ends read as beam ends).
- **Windows:** a pair per bay over chambers and the hall, on thin trapdoor ledges. On the street front, every other bay gets a stair sill with a flower pot.
- **Stair:** a single landing window beside the stair core.
- **Door bay:** a door and a sidelight, either hand, with a stair hood over the door.
- **Shop front:** two-pane glazing over a slab counter.
- **Chimney:** a breast from the hearth up through the roof, or in the party wall on terraces.
- **Roof:** steep (2 up for 1 across) over the relief, with gable ends on the walls and verge slices beyond; a two-wide ridge on even spans.

**Room plans for your plan layer:** each `.json` has `golden.plan`, a grid per storey of the interior cells, north to south. The letters are `S` stair core, `H` hall, `C` chamber, `b` bed, `h` hearth, `w` workstation. The town house:
- ground: `wHHHHHSS` / `HHHHHHSS` / `hHHHHHSS` / ...
- chamber floors: `bCbCCCSS` / `bCbCCCSS` / `CCCCCCSS` / `bCCCCCSS` / ...

**The turned core:** 3 x 3, rising 5. Up 3 northward, a corner stair, then 2 eastward, with the top step in the floor above. It leaves the other 4 cells of each floor usable.

**A note on G1:** a 7-deep body plus relief is 9 deep, so `gc_terrace` doesn't fit today's 7-deep frontages. Either G1 terraces get 9-deep frontages, or terrace units drop to 4-deep bodies, which are too small for stairs. We'd suggest 9.

**Next on our side:** cutting the modules from these houses (bays by kind and storey, corners, cores, roof slices, chimney stack), with sockets, `behind` and `mirror`, and the set file. Then your solver must rebuild these three exactly.
