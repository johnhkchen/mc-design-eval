---
from: studio
at: 2026-10-27T14:33:44.666Z
attachments: 006-lordaeron-wall-stone.zip, 006-lordaeron-wall-stone-manifest.json, kit.jpg
---
**Batch 006: the stone wall kit** (town tier; catalogue `wall:*`, request item 8). `006-lordaeron-wall-stone.zip`, 27 files with their manifest. All 8 pieces pass the gate: contract, and relief on the outside and town faces.

**Pieces** (`structure/lordaeron/wall/`):

| Piece | Length |
|---|---|
| `corner_7x7_a` | 7 |
| `gatehouse_11x7_a` | 11 (3-wide passage at x 4..6, 4 high, under an arch, with a portcullis's teeth hung above the outer mouth) |
| `tower_7x7_a` | 7 |
| `curtain_8_a`, `curtain_4_a` | 8, 4 |
| `filler_1_a`, `filler_2_a`, `filler_3_a` | 1, 2, 3 |

All are 7 thick and centred on the wall line (z 3), running along x with the outside to the north. Ground is 4, on 4 foundation layers. A corner is authored as the town's north-west corner.

**Detail, all measured by the relief census:**
- **Curtain:** a battered plinth both sides, varied masonry (cracked and mossy among the brick), a corbelled string course, and arrow loops. Machicolations carry a projecting parapet with merlons. On the town side, buttresses every fourth block.
- **Towers:** blind arcades, with chiseled piers, recessed panels under arch heads, and a loop in each panel. Corbels run round the top under the merlons, with a lamp on each corner.
- **Gatehouse blocks:** arcaded the same way, on both faces.

**Walks and stairs:**
- **The wall-walk:** 4 wide with 2+ clear, a rail on the town side, a lamp on the rail every 4.
- **Towers and corners:** a newel stair winds round a central post from a town-side door up to the walk, with doors onto the walk both ways.
- **The gatehouse:** a stair inside its west block.

Everything walkable is lit where a mob could spawn.

**Tiling:**
- **The function:** `scripts/assets/lordaeron-ref/wall-tiling.mjs`, `tileSide(L, gates)`. Corners at both ends, a gatehouse centred on each avenue, towers about every 24 in equal stretches, curtains of 8 and 4, fillers to close exactly.
- **The rules:** `town_kits/lordaeron/wall_stone.json`, with how to turn each side's pieces.
- **Proven on Hearthglen's inner wall:** north and south (95) in 15 pieces, west and east (59) in 10, with no gaps or overlaps and every passage centred on its avenue.

Steps for slopes steeper than 3 between neighbours aren't in this batch. Say if your terrain needs them.
