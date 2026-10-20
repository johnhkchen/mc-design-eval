# Six Giant Rocks Viewpoint (Xiangshan): plan

Plot 0, local coords x 0..105, z 0..100, y 0..74 (nothing at y 75 or above). Minecraft 1.21.1 blocks only.
No street here: this is a hillside. North (low z) is the downhill side toward the city and the camera's view;
the hill climbs to the south-east. Exterior only, no rooms.

## SITE

**Ground grid → blocks.** GROUND cell (column c, row r) covers x 3c..3c+2, z 3r..3r+2 (column 35 clipped to
x 105, row 33 clipped to z 99..100). The value is the top ground block's y in that cell. Rebuild the hillside:
- Interpolate the surface between cell centres (x 3c+1, z 3r+1) so it rises in 1-block steps, never 3x3 terraces.
  Each centre cell keeps its exact map value.
- Solid below the surface down to y 0: surface block, 3 blocks of `dirt` under it, `stone` below that.
- Low point: north-east corner, y 1 (x 105, z 0). High point: south-east corner, y 63 (x 105, z 100).
- A knoll on the west side (x 12..29, z 45..71, up to y 44) has steep flanks.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Hillside ground | 0..105 | 0..63 | 0..100 | the whole plot, per GROUND map |
| R1 lead rock (NW, behind the platform) | 34..47 | 35..52 | 46..58 | 14 x 13, 17 tall; north face hangs over the deck's back edge |
| R2 | 49..59 | 37..50 | 47..57 | 11 x 11, 13 tall; leans west (top shifted 1 toward R1); gap x 48 (1 wide, slot) to R1 |
| R3 tallest (E) | 62..75 | 35..53 | 46..59 | 14 x 14, 18 tall; gap x 60..61 (2 wide, open cleft) to R2 |
| R4 (SW, back row) | 38..50 | 43..56 | 60..71 | 12 x 12, 13 tall; nearly touches R1 at z 59 (1-wide crack) |
| R5 leaning (S, back row) | 53..64 | 45..61 | 61..70 | 12 x 10, 16 tall; top 3 rows lean 2 cells north-west and rest on R2's crown (they touch at about x 55..58, z 57..60, y 49..50) |
| R6 low (SE) | 66..76 | 46..56 | 62..71 | 11 x 10, 10 tall |
| Viewing platform deck | 42..66 | 36..38 | 30..45 | prow footprint below; deck top y 37, walking level y 38 |
| Deck posts/footings | on the deck's perimeter and every 4 cells inside | ground..35 | 30..45 | up to about 9 tall at the north prow (ground there y 28) |
| Lower trail (from the north edge up to the deck) | 67..68 | 8..37 | 0..45 | 2 wide; enters the deck from the east at z 42..45 |
| Upper trail (deck up to the south-east) | 67..79 then 78..79 then diagonal | 35..63 | 42..100 | 2 wide: east along z 42..43 to x 79, south along x 78..79 to z 74, then diagonal to the south edge at x 96..97, z 100 |
| Rock-cleft spur | 60..61 | 38..44 | 46..59 | 2-wide stepped path from the deck's south edge up into the R2/R3 cleft, dead end with a lantern |
| Tree T1 (east edge) | trunk 98, crown 94..102 | 32..44 | trunk 44, crown 40..48 | ground about y 31 |
| Tree T2 (south-east edge) | trunk 88, crown 84..92 | 61..71 | trunk 93, crown 89..97 | ground about y 60; crown top y 71 or lower |
| Tree T3 (south-west edge) | trunk 20, crown 16..24 | 35..46 | trunk 95, crown 91..99 | ground about y 34 |

**Platform footprint.** A stepped prow pointing north-west:

| Part | x | z |
|---|---|---|
| West block | 42..56 | 30..45 |
| Middle step | 57..62 | 34..45 |
| East step | 63..66 | 38..45 |

The deck's south edge (z 45) meets R1 at x 42..47 and the slope at x 48..66.

**Rock shape (every rock).**
- Rounded boulder, not a box. Each horizontal slice is an ellipse filling the rock's x/z box.
- Widest at about 1/3 of the height. The bottom 2 courses are inset 1 (undercut, so the rock reads as sitting on
  the ground). The top 4 courses step in 1–2 per course to a domed crown.
- Bury the bottom course 1 block into the ground.
- Gaps between rocks stay air from the ground to the sky; R4/R5's lean is the only contact.
- Carve 2–3 vertical cracks per rock (1-wide notches, 1 deep, 4–8 tall) on the north and west faces.

**Bench, sign and lamps.**
- Bench: two spruce benches on the deck facing north, at x 49..51, z 44 and x 58..60, z 44.
- Trail sign: x 69, z 41, at y = ground + 1 to +2.
- Lantern posts:
  - deck corners (42,30), (56,30), (66,38), (42,45), (66,45);
  - lower trail at z 10, 20, 30 (x 69);
  - upper trail at (79, 52), (79, 64), (86, 82), (94, 96);
  - cleft spur end (61, 58).

## ROOFS

None. There is no building. The deck is open to the sky (no pavilion roof); nothing stands above the deck rail.
Rock crowns are the silhouette: R5 (y 61) and R3 (y 53) are the high points. No `$MCD roof` preset is used.

## FACADES

There are no building faces. These are the readable "faces" of the scene, in order of what the camera sees
(it looks north-west, so the rocks' north and west faces and their crowns).

**Rocks, per rock, bottom → top:**
- Base, courses 1–3: `tuff` mixed with `terracotta` (about 60/40), with `moss_block` patches on the north side.
- Body: `smooth_sandstone` (about 70%), with `sandstone` streaks (vertical runs of 2–5, about 20%) and
  `orange_terracotta` weather stains (about 10%), placed in vertical drips, never as noise.
- Crown, top 2–3 courses: `smooth_sandstone`, with `moss_block` and `moss_carpet` caps over about 1/3 of the top,
  favouring the north side.
- Cracks: recessed 1, lined with `tuff`, with a `fern` at the foot of each.
- R3 and R5 also get one `brown_terracotta` band (a 1–2 course bedding seam, recessed 0) at about mid-height.
  That gives the layered sandstone look.

**Viewing platform:**
- Footings: a `stone_bricks` pad 1 block wider than each post, set on the ground.
- Posts: `dark_oak_log` axis y, from the pad to y 35. Under the north and west edges they stand at every 4 cells
  (x 42, 46, 50, 54, 56 at z 30; z 30, 34, 38, 42 at x 42; and the step corners).
- Bracing: under the north prow, `dark_oak_stairs` upside-down knee braces post → joist (1 under the joist
  line, proud 0).
- Joists: y 36, `stripped_dark_oak_log` axis z, every 2 x.
- Fascia: `dark_oak_planks` around the whole deck perimeter at y 36, proud 0.
- Deck: y 37, `spruce_planks`. The outermost ring is `dark_oak_slab` (type top) at y 37 as an edge board.
- Railing: y 38, `spruce_fence` around the perimeter. Openings stay air (see OPENINGS).
- Rail posts: `dark_oak_fence` at y 38 every 4 cells, with a `lantern` standing on top at y 39 at the 5 corners only.

**Trails:**
- Rises: `stone_brick_stairs` facing up-slope (facing south on the lower trail, east then south on the upper).
- Treads: `stone_brick_slab` bottom where the rise is half a block, full `stone_bricks` landings every 6–8 steps.
- About 1 in 6 trail blocks use the mossy variant (`mossy_stone_brick_stairs`, `mossy_stone_brick_slab`,
  `mossy_stone_bricks`), more near the rocks.
- Edges: a 1-cell border of `coarse_dirt` and `rooted_dirt` both sides.
- It is a hiking trail, so stairs are correct here (not an entrance ramp).

**Lantern posts:** `stone_bricks` base, then 2 `dark_oak_fence`, then a `lantern` standing on top.
Light is warm only (no soul lanterns).

**Planting:**
- Shrubs and ground cover anywhere (`azalea`, `flowering_azalea`, `fern`, `large_fern`, `short_grass`,
  `moss_carpet`), thickest around the rock feet and along the trails.
- Nothing taller than 2 blocks anywhere with x < 80 and z < 70 (the open view to the north-west).
- Trees only at T1–T3:
  - trunk `oak_log` (T2 `jungle_log`), 6 tall;
  - crown of persistent `oak_leaves` mixed with `jungle_leaves` (T2 `jungle_leaves` mixed with `azalea_leaves`),
    9 wide and 5 tall, irregular, not a sphere.

## MATERIALS

| Role | Block id |
|---|---|
| Ground (main, about 65%) | `grass_block` |
| Ground patches: slopes and trail borders (about 15%) | `coarse_dirt` |
| Ground near rock feet and trees (about 10%) | `moss_block`, `rooted_dirt` |
| Ground under trees | `podzol` |
| Exposed outcrop on steep cells (west knoll flanks, any cell rising more than 2 over its neighbour) | `stone`, `andesite` |
| Sub-surface | `dirt` (3 deep), then `stone` |
| Rock body | `smooth_sandstone` |
| Rock streaks | `sandstone` |
| Rock stains | `orange_terracotta` |
| Rock base and cracks | `tuff`, `terracotta` |
| Rock bedding seam | `brown_terracotta` |
| Rock moss | `moss_block`, `moss_carpet` |
| Deck | `spruce_planks` |
| Deck edge board | `dark_oak_slab` (top) |
| Fascia | `dark_oak_planks` |
| Joists | `stripped_dark_oak_log` |
| Posts | `dark_oak_log` |
| Braces | `dark_oak_stairs` |
| Railing | `spruce_fence` |
| Rail posts and lamp posts | `dark_oak_fence` |
| Footings | `stone_bricks` |
| Trail | `stone_brick_stairs`, `stone_brick_slab`, `stone_bricks`, mossy variants |
| Light | `lantern` (warm) |
| Bench | `spruce_stairs` + `spruce_trapdoor` arms |
| Sign | `spruce_sign` (standing) reading "象山 SIX GIANT ROCKS / VIEWPOINT" |
| Plants | `azalea`, `flowering_azalea`, `fern`, `large_fern`, `short_grass`, `oak_leaves`, `jungle_leaves`, `azalea_leaves` (persistent) |

All ids pass `$MCD blocks --check`. Do not use `chain`: the toolkit's registry doesn't know the 1.21.1 name, so
railings are fences. No pale oak.

Colour logic: warm buff sandstone with orange stains reads as the real tan rocks at dusk against dark green moss
and grass. The deck is a darker brown so it separates from the rock.

## OPENINGS

There are no doors or windows. These gaps in the railing stay air at y 38..39:

| Opening | x | z |
|---|---|---|
| East entry from the lower trail | 66 | 42..43 |
| East exit to the upper trail | 66 | 44..45 |
| South exit to the cleft spur | 60..61 | 45 |
| Back edge against R1, no rail (the rock is the wall) | 42..47 | 45 |

Rock gaps (air, ground to sky):

| Gap | x | z |
|---|---|---|
| R1 \| R2 | 48 | 47..57 |
| R2 \| R3 (the spur runs in it) | 60..61 | 46..59 |
| R1 \| R4 crack | 38..47 | 59 |
| R3 \| R6 | 65 | 62..71 |

## RESERVED

| Item | Cells |
|---|---|
| Trail cells (ground parts leave them for the trail part to set) | lower trail x 67..68, z 0..45; upper trail x 67..79, z 42..43; x 78..79, z 44..74; diagonal 2-wide band from (78, 74) to (96..97, 100); spur x 60..61, z 45..59 |
| Lantern post bases | the posts listed under SITE (base cell at ground level beside the trail) |
| Tree trunks | T1 (98, 44), T2 (88, 93), T3 (20, 95), from ground + 1 up |
| Bench and sign | benches at (49..51, 38, 44) and (58..60, 38, 44); sign at (69, ground + 1, 41) |
| View corridor | x 0..80, z 0..70: nothing above ground + 2 except the deck (to y 39) and the rocks |

## FLOORS

| Level | y |
|---|---|
| Deck walking level | 38 (deck top block y 37) |
| Lower trail | climbs y 9 → 37 |
| Upper trail | climbs y 36 → 63 |

There is no interior volume.

Light: lanterns as listed, plus 2 hanging `lantern`s under the deck's north fascia at (46, 35, 30) and (52, 35, 30).
They glow under the prow and light the post forest below.

# DESIGNER SECTIONS

## PALETTE
Architect's ids unchanged. Shape variants and decor, all checked with `$MCD blocks --check` (none unknown):
- Terrain: `grass_block`, `coarse_dirt`, `moss_block`, `rooted_dirt`, `podzol`, `stone`, `andesite`, `dirt`.
- Rock: `smooth_sandstone`, `sandstone`, `orange_terracotta`, `terracotta`, `brown_terracotta`, `tuff`, `moss_block`, `moss_carpet`.
- Deck: `spruce_planks`, `spruce_slab`, `dark_oak_slab` (top), `dark_oak_planks`, `stripped_dark_oak_log`, `dark_oak_log`, `dark_oak_stairs`, `spruce_fence`, `dark_oak_fence`, `stone_bricks`.
- Trail: `stone_brick_stairs`, `stone_brick_slab`, `stone_bricks`, `mossy_stone_bricks`, `mossy_stone_brick_stairs`, `mossy_stone_brick_slab`.
- Bench: `spruce_stairs`, `spruce_trapdoor`. Sign: `spruce_sign`.
- Light: `lantern` (hanging true/false).
- Plants: `azalea`, `flowering_azalea`, `fern`, `large_fern`, `short_grass`, `oak_log`, `jungle_log`, `oak_leaves`, `jungle_leaves`, `azalea_leaves` (all `persistent: "true"`).

## VOCABULARY
- `hillCell(x, z, h)`: fills x/z column to the interpolated height. Surface is grass_block (65%), coarse_dirt on slopes (>1 rise), moss_block/rooted_dirt near rock feet, stone/andesite where the rise is over 2; then 3 dirt, then stone to y 0. The interpolation is bilinear between cell centres, rounded; centres exact. Skips the RESERVED trail cells.
- `boulder(box, {lean, seam})`: per course, an ellipse in the box's x/z. Radius is full at about 1/3 height, base two courses inset 1, top 4 courses step in 1-2 into a dome; the bottom course buried 1. Base courses 1-3 tuff 60% / terracotta 40%, moss_block on the north side. Body is smooth_sandstone 70%, sandstone vertical runs of 2-5 (20%), orange_terracotta drips (10%) in vertical runs. Crown is smooth_sandstone, one third capped with moss_block/moss_carpet, mostly north. `seam`: one 1-2 course brown_terracotta band at mid-height. `lean`: the top 3 courses shift 2 north-west.
- `crack(rock, face, x|z, y0, len)`: a 1-wide, 1-deep notch 4-8 tall, lined with tuff, fern at its foot. Two or three per rock on the N and W faces.
- `deckPost(x, z)`: a stone_bricks pad 3x3 at ground, dark_oak_log axis y up to y 35, and a dark_oak_stairs brace (half top) under the joist on the north prow.
- `deckRail(path)`: spruce_fence at y 38 along the perimeter, leaving the OPENINGS as air. dark_oak_fence rail post every 4 cells; a standing lantern on the 5 corner posts at y 39.
- `bench(x0, z, face)`: three cells. spruce_stairs at (x0..x0+2, 38, z) facing north (the seat faces the view), spruce_trapdoor open arms at both ends on the south side.
- `trailRun(points, width)`: stone_brick_stairs facing up-slope on 1-block rises, stone_brick_slab (bottom) on half rises, a full stone_bricks landing every 6-8 steps. Mossy variant about 1 in 6. A coarse_dirt/rooted_dirt border 1 cell each side. Every step stands on a solid block (fill dirt below).
- `trailSign(x, z)`: a stone_bricks base, a spruce_fence post, a standing spruce_sign (rotation 4, to read from the north-west). Lines: "SIX GIANT ROCKS" and "VIEWPOINT".
- `lampPost(x, z)`: a stone_bricks base at ground, 2 dark_oak_fence, then a lantern (hanging false).
- `shrub(x, z, kind)`: azalea or flowering_azalea on grass or moss; fern, large_fern or short_grass in clumps; moss_carpet on rock feet.
- `tree(x, z, kind)`: a log trunk 6 tall on a podzol patch (radius 2), a crown of persistent leaves 9 wide and 5 tall, irregular; T2 uses jungle_log with jungle_leaves and azalea_leaves.

## ROOMS
There are no rooms (an open hillside). `rooms` is empty.

Lighting: lantern positions are the architect's list. Add standing lanterns on the ground edge of the trail every 9 cells where the plan has none.
The deck is lit by 5 corner lanterns and 2 hanging ones.

The way in: it is a hiking trail, so stairs are correct (see plan FACADES). The entrance cell is the foot of the lower trail, (67, 8, 0). The street cell is (68, 1, 0).

## PARTS
1. [x] Terrain: parts/terrain.mjs. All the hillCell columns, from y 0 to the surface. Tick the hillside.
2. Rocks: parts/rocks.mjs. The six `boulder`s, `crack`s, the seams and the R5 lean. Place after terrain, keep the gaps clear.
3. Platform: parts/platform.mjs. The pads, posts, braces, joists, fascia, deck, edge board, rail, benches. Hanging lanterns at (46,35,30) and (52,35,30).
4. Trails and lights: parts/trails.mjs. The lower and upper trails, the spur, the sign, all lantern posts, ground lanterns.
5. Planting: parts/planting.mjs. Shrubs, ferns, moss carpets and the three trees. Respect the view corridor (nothing above ground+2 in x 0..80, z 0..70, other than the rocks and the deck).
6. Dusk pass: parts/dusk.mjs. Verify light coverage, add lanterns on the trail and the deck where a gap over 9 cells is left, and check that nothing exceeds y 74 or leaves the plot.

## NOTES
- Build in site orientation. North is low z.
- Rocks come after the terrain and overwrite its columns; the trail cells are reserved from both.
- Lamp posts sit beside the trail, never in it.
- Run `$MCD check` and `$MCD fit` after each part.
- 1.21.1 only: use no `chain` (use fences) and no pale oak.
