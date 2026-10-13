# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Mill village housing kit: one sample row of 8 modules

## SITE

- Row 96 wide (x 0..95), 19 deep (z 0..18). Front faces NORTH (-z), the lane side. x runs along the lane.
- Ground: solid fill y -2..-1 (dirt, stone at y -2), ground surface at **y 0** (grass_block patched with coarse_dirt, podzol under the tree). Standing level outdoors y 1.
- Lane: z 0..4, y 0, x 0..95: gravel centre strip z 1..3 with dirt_path wheel ruts at z 1 and z 3, coarse_dirt edges z 0 and z 4.
- Lantern posts at the lane's south edge, z 4, x = 0, 12, 24, 36, 48, 60, 72, 84 (one per module, on its west column): spruce_fence y 1..3, lantern (standing) y 4. Plus one at x 95, z 4 to close the row.
- Module cut: module i = x 12i..12i+11, z 0..18, y -2..top. Each carries its lane strip and its lantern post.
- Plot side columns x 12i and 12i+11, z 5..18: low spruce_fence (y 1) on the house plots, oak_fence round the garden, coop run and store; open dirt_path on the well plot. The front line z 5 is a picket fence (birch_fence on houses) with a 2-wide gate at x 12i+5..6. Back line z 18 is a fence on all plots except the well (open).
- Every house: brick piers y 1, plank deck y 2, walls y 3..6, roof from y 7. Front step z 6 (stairs, y 1), porch deck z 7..8, house body from z 9.

| plot | mass | x0..x1 | y0..y1 | z0..z1 |
|---|---|---|---|---|
| 0 shotgun | body (gable to lane) | 3..8 | 1..6 (+roof) | 9..17 |
| 0 | front porch (deck y 2, posts, shed roof) | 3..8 | 1..6 | 7..8 |
| 0 | front step | 5..6 | 1 | 6 |
| 0 | chimney (exterior, east side) | 9..10 | 1..11 (+cap, fire y 12) | 12..13 |
| 0 | back step (stairs facing north) + wood pile (stripped logs, x 4) | 4..7 | 1 | 18 |
| 1 saddlebag duplex | body (side gable, ridge along x) | 13..22 | 1..6 (+roof) | 9..16 |
| 1 | long porch | 13..22 | 1..6 | 7..8 |
| 1 | steps (two, one per door) | 15, 20 | 1 | 6 |
| 1 | central chimney (in the party wall, on its own footing) | 17..18 | 1..13 (+cap, fire y 14) | 12..13 |
| 1 | back yard: two small flower/herb beds | 14..16, 19..21 | 0..1 | 17 |
| 2 hall-and-parlour | body (side gable, ridge along x) | 26..34 | 1..6 (+roof) | 9..16 |
| 2 | porch across the front | 26..34 | 1..6 | 7..8 |
| 2 | front step | 29..30 | 1 | 6 |
| 2 | end chimney (west gable; its east column IS the wall) | 25..26 | 1..13 (+cap, fire y 14) | 12..13 |
| 3 shotgun, mirrored | body (gable to lane) | 39..44 | 1..6 (+roof) | 9..17 |
| 3 | front porch | 39..44 | 1..6 | 7..8 |
| 3 | front step | 41..42 | 1 | 6 |
| 3 | chimney (exterior, west side) | 37..38 | 1..11 (+cap, fire y 12) | 12..13 |
| 4 kitchen garden | fence ring (gate x 53..54 at z 5) | 48..59 | 1 | 5..18 |
| 4 | centre path (dirt_path) | 53..54 | 0 | 6..17 |
| 4 | water channel (across, bridged by the path) | 49..52, 55..58 | -1..0 (water y 0, stone bed y -1) | 11 |
| 4 | path bridge over channel | 53..54 | 0 (oak_planks) | 11 |
| 4 | beds north (farmland y 0, crops y 1) | 49..52, 55..58 | 0..1 | 7..10 |
| 4 | beds south | 49..52, 55..58 | 0..1 | 12..15 |
| 4 | work strip: scarecrow at 50,z 17; composter 57,z 17; barrel 58,z 17; rain barrel (water_cauldron) 49,z 16 | 49..58 | 1..3 | 16..17 |
| 5 coop + run | run fence (gate x 65..66 at z 5) | 60..71 | 1 | 5..18 |
| 5 | coop (on cobblestone piers, floor y 1, walls y 2..4) | 63..68 | 1..4 (+roof) | 12..16 |
| 5 | coop ramp (chickens) | 64 | 1 (spruce slab) | 11 |
| 5 | feed trough | 62..64 | 1 | 8 |
| 5 | water trough (water_cauldron) | 69 | 1 | 8 |
| 5 | straw corner: one hay_block on coarse_dirt | 61 | 1 | 10 |
| 6 well yard | well ring (cobblestone, 1 high) | 76..79 | 1 | 9..12 |
| 6 | well shaft (water y -3..0, inside ring) | 77..78 | -3..0 | 10..11 |
| 6 | well posts + roof | 76, 79 (posts at z 9 and z 12) | 2..4, roof y 5..6 | 9..12 |
| 6 | bench (two oak_stairs facing south, armrests trapdoors) | 74..75 | 1 | 14 |
| 6 | shade tree: oak trunk | 81 | 1..6 | 15 |
| 6 | tree crown (persistent oak leaves, ragged) | 78..82 | 5..9 | 12..17 |
| 6 | wash line: posts (oak_fence) | 73 and 79 | 1..4 | 17 |
| 6 | wash line rail + sheets | 73..79 rail y 4; sheets y 3 at x 75, 77 | 3..4 | 17 |
| 6 | paths (dirt_path) gate→well→bench, and open side columns | 77..78 then 74..77 | 0 | 5..14 |
| 7 company store | body (gable along z behind the false front) | 85..94 | 1..7 (+roof) | 9..17 |
| 7 | false front (north wall carried up flat) | 85..94 | 3..12 | 9 |
| 7 | porch (deck y 2, posts, shed roof under the false front) | 85..94 | 1..7 | 7..8 |
| 7 | steps (spruce_stairs facing south) | 88..91 | 1 | 6 |
| 7 | loading platform (east side, barrels/crates) | 93..94 | 1 | 18 (outside back wall), barrels only |

## ROOFS

| building | form | preset / style | ridge | pitch / height | overhang | notes |
|---|---|---|---|---|---|---|
| plot 0 shotgun | front-gable (gable to the lane) | `cottage` with `ridgeAxis: z`, `front: n`, material `polished_andesite` (tin, light grey), verge `birch`, `contrast: false` | along z at x 5..6, z 8..18 | 45°, roof y 7..10, ridge slab y 11 | 1 (eaves x 2, x 9; front gable z 8 over the porch; back z 18) | keep chimney 9..10 × 12..13; no dormers |
| plot 1 duplex | side-gable | `cottage`, `ridgeAxis: x`, material `mangrove` (rusted red tin) stairs/slabs, verge `dark_oak` | along x at z 12..13, x 12..23 | 45°, roof y 7..11, ridge y 12 | N/S 1 (z 8, z 17); east/west 0 (x 12 and x 23 are side columns), verge flush | chimney 17..18 × 12..13 rises through the ridge: keep; roof meets it on all 4 sides |
| plot 2 hall-and-parlour | side-gable | `cottage`, `ridgeAxis: x`, `spruce-shingle` palette, verge `birch` | along x at z 12..13, x 26..34 | 45°, roof y 7..11, ridge y 12 | N/S 1 (z 8, z 17); east and west 0 (x 35 is the side column; west is the chimney), verge flush on the gable | keep chimney 25..26 × 12..13 |
| plot 3 shotgun | front-gable (mirror of plot 0) | `cottage`, `ridgeAxis: z`, material `weathered_cut_copper` (green-painted tin), verge `dark_oak` | along z at x 41..42 | 45°, roof y 7..10, ridge y 11 | 1 (eaves x 38, x 45; gables z 8, z 18) | keep chimney 37..38 × 12..13 |
| porches (plots 0–3) | shed (lean-to) against the front wall | `shed`, low side north; or by hand: one course of stairs y 6 at z 7 rising to the eave at z 8, slab ridge at the wall | — | y 6 at z 7, y 7 at z 8 tucked under the main eave | 0 at the sides, 1 north (z 6 eave line over the step, slab) | same material + verge as the house; hand-built by the porch part if the tool won't fit under the main eave |
| plot 5 coop | small front-gable | `gable`, pitch 45, material `spruce` stairs, verge `spruce` | along z at x 65..66 | roof y 5..7 | 1 | hand-build allowed (6 wide) |
| plot 6 well | tiny gable on 4 posts | by hand: oak stairs y 5 on z 9..12, ridge slab y 6, along z | x 77..78 | — | 0 | ridge beam oak_log axis z y 5 at x 77..78; iron_chain y 4 hangs from it over the shaft, hanging lantern y 3 |
| plot 7 store | front-gable hidden behind the false front | `gable`, `ridgeAxis: z`, material `polished_andesite` (tin), pitch 0.5 (low, so the false front hides it) | along z at x 89..90, z 9..18 | roof y 8..10, ridge y 11 | sides 0 (x 84, x 95 are side columns), back 1 (z 18) | the false front (y 8..12) is the north gable wall: `keep` x 85..94, z 9. Porch: shed roof y 7 at z 7..8 hung off the false front, by hand |

## FACADES

All houses: base = brick piers + spruce/oak fence lattice skirting between piers (y 1); body = clapboard/board-and-batten y 3..6; top = eave / gable with verge. Corner boards and battens are proud of nothing (flush), the porch posts stand 2 out from the wall.

**Plot 0 shotgun (lane gable, x 3..8 at z 9):**
- Piers: bricks at y 1 at the four corners and every 3 along the long sides (z 9, 12, 15, 17) and under the porch corners (z 7).
- Skirting y 1 between piers: spruce_fence.
- Walls: birch_planks; corner posts stripped_birch_log (axis y) at x 3, x 8 corners y 3..6; sill beam y 2 is the floor deck edge.
- North front (under the porch): double door x 5..6 y 3..4 (birch_door pair, hinges outward); windows 1×2 at x 4 and x 7, y 4..5. No shutters on the front (corner posts beside them); head plate stripped_birch_log axis x along y 6 is the lintel.
- Gable triangle (z 9, above y 6): birch_planks with a 1×1 glass_pane vent at x 5..6, y 8.
- Porch: deck oak_planks y 2 at z 7..8, x 3..8; posts stripped_birch_log y 3..5 at x 3, x 8, z 7; rail birch_fence y 3 along z 7 except x 5..6; step oak_stairs facing south at x 5..6, z 6, y 1; shed roof y 6..7.
- Long sides (x 3 and x 8): windows 1 wide × 2 high, y 4..5: west (x 3) at z 11 and z 15, dark_oak_trapdoor shutters at z 10/12 and z 14/16; east (x 8) at z 10 and z 15 (the chimney is at z 12..13), shutters at z 11 and z 14/16.
- Back (z 17): back door x 6 (birch_door) y 3..4, window x 4 y 4..5.
- Chimney: bricks, deepslate_bricks band at y 9, cap: brick_slab ring stepping out at y 11 over x 9..10, stack 2×2 solid: hay_block at x 9 z 12 y 11, campfire x 9 z 12 y 12; other three cells brick_slab y 11 cap. Proud of the wall by 2.

**Plot 1 saddlebag duplex (long face north, x 13..22 at z 9):**
- Piers bricks y 1 at corners, x 17..18 under the chimney footing (full), and every 3 along.
- Walls: board-and-batten = spruce_planks field + stripped_spruce_log posts (battens) at x 13, 17, 18, 22 on the front and back, and every 2 cells (z 9, 11, 14, 16) on the gable walls, y 3..6.
- North front, symmetric about x 17.5: door x 15 (spruce_door), door x 20 (spruce_door), rhythm read from the lane (x 22→13): window 21, door 20, window 19 | posts 18..17 | window 16, door 15, window 14. All windows 1×2 y 4..5, no shutters (no room between openings); lintel = stripped_spruce_log axis x y 6 across the whole front (head plate).
- Gables (x 13 and x 22, above y 6): spruce_planks, a glass_pane vent at z 12..13, y 9.
- Porch z 7..8 full width x 13..22: deck oak_planks y 2, posts stripped_spruce_log y 3..5 at x 13, 17, 18, 22 (z 7), rail spruce_fence y 3 with gaps at x 15 and x 20 (steps), shed roof y 6..7 mangrove.
- Back (z 16): window per room at x 15 and x 20 (1×2), no back doors.
- Chimney: bricks, rises in the party wall, band deepslate_bricks y 11, brick_slab cap y 13 stepping out 1 (ring of upside-down brick_stairs at y 12 round x 16..19, z 11..14), hay y 13 + campfire y 14 at x 17 z 12.

**Plot 2 hall-and-parlour (x 26..34 at z 9):**
- Piers bricks y 1; skirting oak_fence.
- Walls: oak_planks clapboard body, corner boards stripped_birch_log (white trim) at the corners x 26 and x 34 (x 26 at z 12..13 is the chimney's brick), y 3..6. Head plate stripped_birch_log axis x y 6 along the front.
- North front: hall (west, x 27..29) and parlour (east, x 31..33), partition x 30. One door x 29 (oak_door, into the hall, behind the gate x 29..30); windows 2×2 at x 27..28 (hall) and x 32..33 (parlour), y 4..5; x 30..31 wall. No front shutters (corner boards); head plate stripped_birch_log axis x y 6.
- West gable x 26: chimney x 25..26 × z 12..13 brick, proud 1, windows at z 10 and z 15 (1×2) either side of it.
- East gable x 34: windows z 11 and z 14 (1×2), spruce_trapdoor shutters at z 10/12 and z 13/15, glass_pane vent y 9 z 12..13.
- Porch z 7..8 x 26..34: deck oak_planks y 2, posts stripped_birch_log at x 26, 30, 34 (z 7), rail birch_fence y 3 gap x 29..30, shed roof spruce y 6..7.
- Back (z 16): back door x 28 (hall → yard) y 3..4, window x 32 y 4..5.
- Chimney: bricks, band deepslate_bricks y 11, brick cap y 13 stepping out, hay+campfire y 13/14 at x 25 z 12.

**Plot 3 shotgun, mirrored (x 39..44):** plot 0 mirrored about x = 41.5: double door x 41..42, windows x 40 and x 43, chimney west at x 37..38 z 12..13; west windows z 10, z 15; east windows z 11, z 15; back door x 41. Walls jungle_planks, corner posts stripped_dark_oak_log, shutters birch_trapdoor, rail dark_oak_fence, skirting dark_oak_fence, roof weathered_cut_copper.

**Plot 5 coop (x 63..68, z 12..16):** cobblestone piers y 1 at the corners; floor spruce_planks y 1 (on the piers, fence skirting between), walls y 2..4 spruce_planks with stripped_spruce_log corners; north face: chicken door x 64 y 2 (1×1, open), keeper door x 66 y 2..3 (spruce_door); a 1×1 vent x 67 y 3 (open spruce_trapdoor); nesting boxes inside along z 15: hay_block and barrels (facing up) alternating x 64..67, y 2.

**Plot 7 company store (x 85..94):**
- Base: cobblestone piers y 1 at corners and every 3 (x 85, 88, 91, 94) + cobblestone skirting full (closed) y 1.
- Body walls y 3..7 dark_oak_planks with stripped_dark_oak_log corners.
- False front (z 9, x 85..94, y 3..12): birch_planks (painted cream) face, stepped top: y 11 full width x 85..94, y 12 at x 87..92 (a raised centre), cornice dark_oak_stairs upside down (facing south) proud 1 at z 8, y 11 across x 85..94 and y 12 over x 87..92 bracketed by dark_oak_slab; pilasters stripped_dark_oak_log at x 85 and x 94 (y 3..10) flush.
- Store name: banner letters "STORE" (5 columns) centred at x 87..91 on the band y 9..10 (black on white), via bannerWord/plaque; "CO." no.
- Front openings: double door x 89..90 y 3..4 (dark_oak_door, glass transom glass_pane y 5 above), two shop windows 2 wide × 3 high at x 86..87 and x 92..93, y 3..5 (glass_pane), goods (barrels, pots) stand inside behind them on the floor.
- Porch: deck spruce_planks y 2 z 7..8 x 85..94, posts stripped_dark_oak_log y 3..6 at x 85, 88, 91, 94 (z 7), shed roof polished_andesite slabs y 7 z 7..8, a hanging signboard "MILL CO" under the porch roof at x 89..90, z 7, y 6 (hung from the y 7 roof), lanterns hanging y 6 at x 86 and x 93 z 8.
- Sides (x 85, x 94): windows 1×2 at z 12 and z 15, y 4..5.
- Back (z 17): back door x 93 (stock door) y 3..4.

## MATERIALS

| role | block |
|---|---|
| ground | grass_block (60%), coarse_dirt (25%), podzol near the tree and coop, rooted_dirt near fences |
| lane | gravel centre, dirt_path ruts, coarse_dirt edges |
| house piers | bricks |
| store / coop / well piers | cobblestone (1 in 10 mossy_cobblestone) |
| floor decks | oak_planks (houses 0–2, porch decks), spruce_planks (store, coop) |
| plot 0 walls / trim | birch_planks / stripped_birch_log; shutters dark_oak_trapdoor; rail birch_fence |
| plot 1 walls / trim | spruce_planks / stripped_spruce_log; rail spruce_fence |
| plot 2 walls / trim | oak_planks / stripped_birch_log (white trim); shutters spruce_trapdoor; rail birch_fence |
| plot 3 walls / trim | jungle_planks / stripped_dark_oak_log; shutters birch_trapdoor; rail dark_oak_fence |
| store walls / front / trim | dark_oak_planks / birch_planks false front / stripped_dark_oak_log + dark_oak_stairs cornice |
| coop | spruce_planks / stripped_spruce_log |
| roofs | plot 0 + store: polished_andesite stairs/slabs (tin); plot 1: mangrove stairs/slabs (rusty tin); plot 2: spruce-shingle palette; plot 3: weathered_cut_copper stairs/slabs (green tin); coop: spruce; well: oak |
| chimneys | bricks, band deepslate_bricks, cap brick_slab / brick_stairs, top hay_block + campfire (lit, signal_fire) |
| glass | glass_pane |
| doors | birch_door (0), spruce_door (1, coop), oak_door (2), jungle_door (3), dark_oak_door (store) |
| fences | birch_fence front pickets (houses), spruce_fence side columns, oak_fence garden/coop/store |
| garden | farmland, wheat, carrots, potatoes, beetroots; water channel water over stone; composter; scarecrow (oak_fence y 1, hay_block y 2, carved_pumpkin y 3 facing north) |
| light | lantern (hanging under porch roofs, standing on fence posts), iron_chain |

All ids checked with `mcd blocks --check`: all known.

## OPENINGS

Doors are 1 wide × 2 high (y 3..4) unless stated; windows y 4..5. Coordinates are the wall cell.

| plot | opening | x | z | y | size |
|---|---|---|---|---|---|
| 0 | front double door | 5..6 | 9 | 3..4 | 2×2 |
| 0 | front windows | 4, 7 | 9 | 4..5 | 1×2 each |
| 0 | west windows | 3 | 11, 15 | 4..5 | 1×2 |
| 0 | east windows | 8 | 10, 15 | 4..5 | 1×2 |
| 0 | back door | 6 | 17 | 3..4 | 1×2 |
| 0 | back window | 4 | 17 | 4..5 | 1×2 |
| 0 | gable vent | 5..6 | 9 | 8 | 2×1 |
| 0 | inner partition door | 5 | 13 | 3..4 | 1×2 (open, no door leaf) |
| 1 | front doors | 15, 20 | 9 | 3..4 | 1×2 each |
| 1 | front windows | 14, 16, 19, 21 | 9 | 4..5 | 1×2 each |
| 1 | back windows | 15, 20 | 16 | 4..5 | 1×2 |
| 1 | gable vents | 13, 22 | 12..13 | 9 | 1×2 |
| 2 | front door | 29 | 9 | 3..4 | 1×2 |
| 2 | front windows | 27..28, 32..33 | 9 | 4..5 | 2×2 each |
| 2 | west windows | 26 | 10, 15 | 4..5 | 1×2 |
| 2 | east windows | 34 | 11, 14 | 4..5 | 1×2 |
| 2 | back door / window | 28 / 32 | 16 | 3..4 / 4..5 | 1×2 |
| 2 | partition door (hall→parlour) | 30 | 14 | 3..4 | 1×2 open |
| 3 | front double door | 41..42 | 9 | 3..4 | 2×2 |
| 3 | front windows | 40, 43 | 9 | 4..5 | 1×2 |
| 3 | west windows | 39 | 10, 15 | 4..5 | 1×2 |
| 3 | east windows | 44 | 11, 15 | 4..5 | 1×2 |
| 3 | back door / window | 41 / 43 | 17 | 3..4 / 4..5 | 1×2 |
| 3 | partition door | 42 | 13 | 3..4 | 1×2 open |
| 4 | garden gate | 53..54 | 5 | 1 | 2 fence gates |
| 5 | run gate | 65..66 | 5 | 1 | 2 fence gates |
| 5 | coop chicken door / keeper door / vent | 64 / 66 / 67 | 12 | 2 / 2..3 / 3 | 1×1 / 1×2 / 1×1 |
| 6 | yard opening (no gate, open path) | 77..78 | 5 | — | open |
| 7 | store double door + transom | 89..90 | 9 | 3..4 (+5 glass) | 2×3 |
| 7 | shop windows | 86..87, 92..93 | 9 | 3..5 | 2×3 each |
| 7 | side windows | 85, 94 | 12, 15 | 4..5 | 1×2 |
| 7 | back stock door | 93 | 17 | 3..4 | 1×2 |
| 0–3, 7 | front gates | 12i+5..6 | 5 | 1 | 2 fence gates (oak/birch fence_gate) |

## RESERVED

The shell leaves these cells empty (air) for later parts:

| what | cells |
|---|---|
| chimney stacks (their own part, own footing from y 1) | 9..10×12..13 y 1..12; 17..18×12..13 y 1..14; 25..26×12..13 y 1..14; 37..38×12..13 y 1..12 |
| stove cells beside each chimney (smoker/furnace, lit) | plot 0: 7, y 3, z 12; plot 1: 16 and 19, y 3, z 12; plot 2: 27, y 3, z 13; plot 3: 40, y 3, z 12 |
| bed cells + 2 clear above (y 3 bed, y 4..5 air) | plot 0: x 4..5 foot/head along z, z 15..16 (back room); plot 1: west x 14, z 14..15; east x 21, z 14..15; plot 2: hall x 27, z 14..15 and parlour x 33, z 14..15; plot 3: x 43, z 15..16 |
| porch posts (stand on the deck) | per FACADES, z 7, y 3..5 |
| porch roofs | z 7..8, y 6..7, x of each porch |
| store false-front band for the sign | x 87..91, z 8 (banners hang on the face), y 9..10 |
| store counter + job sites | counter top slabs x 86..91, z 13, y 3; job sites against the back wall z 16, y 3: composter 86, smoker 87, barrel 88 (facing up), loom 92, fletching_table 93 |
| water: garden channel, well shaft, coop/garden water_cauldrons | per SITE |
| farmland | x 49..52 and 55..58, z 7..10 and 12..15, y 0 (crops y 1) |
| tree trunk + crown | 81,y 1..6,z 15; crown 78..82×12..17 y 5..9 (keep clear of the well roof x 76..79, z 9..12) |
| lantern posts | x 0,12,…,84, 95 at z 4, y 1..4 |

## FLOORS

| mass | floor y (walk on) | interior volume (air) | rooms |
|---|---|---|---|
| plot 0 shotgun | deck y 2, stand y 3 | x 4..7, y 3..6, z 10..16 (ceiling open to the roof / loft) | front room z 10..12, partition wall z 13 (door x 5), back room z 14..16 |
| plot 1 duplex west | y 3 | x 14..16, y 3..6, z 10..15 | one room (bed, table, stove at the chimney) |
| plot 1 duplex east | y 3 | x 19..21, y 3..6, z 10..15 | one room (mirror) |
| plot 1 party wall | — | x 17..18, z 10..15: chimney z 12..13, solid spruce_planks z 10..11 and z 14..15 | — |
| plot 2 hall | y 3 | x 27..29, y 3..6, z 10..15 | hall (stove, table, bed) |
| plot 2 parlour | y 3 | x 31..33, y 3..6, z 10..15 | parlour/bedroom; partition x 30, door z 14 |
| plot 3 shotgun | y 3 | x 40..43, y 3..6, z 10..16 | front z 10..12, partition z 13 (door x 42), back z 14..16 |
| porches (0–3) | y 3 on deck y 2 | z 7..8, y 3..5 | porch (bench/rocking chair) |
| plot 5 coop | y 2 on floor y 1 | x 64..67, y 2..4, z 13..15 | nest room |
| plot 7 store | deck y 2, stand y 3 | x 86..93, y 3..7, z 10..16 | sales floor z 10..12, counter z 13, stock/back z 14..16 |
| plot 7 porch | y 3 | x 85..94, z 7..8, y 3..6 | porch with a bench and barrels at the ends |

Ceiling: houses have a top-slab ceiling at y 7 only over the back room (loft), front rooms open to the roof with king-post trusses (`trusses` in roof.json). Light: every room lantern-lit (hanging from the y 7 plate / trusses), porches hanging lanterns, yards lantern posts at the gates; every floor cell light ≥ 8.

---
# DESIGNER SECTIONS

## PALETTE

Architect ids kept exactly. By role (all checked with `mcd blocks --check`, none unknown):
- Ground: grass_block, coarse_dirt, podzol, rooted_dirt, dirt_path, gravel, dirt, stone, farmland, water.
- Piers/masonry: bricks, brick_stairs, brick_slab, deepslate_bricks, cobblestone, mossy_cobblestone, cobblestone_stairs.
- Plot 0: birch_planks, stripped_birch_log, birch_fence, birch_fence_gate, birch_door, dark_oak_trapdoor, polished_andesite (+_stairs, _slab).
- Plot 1: spruce_planks, stripped_spruce_log, spruce_fence, spruce_door, mangrove_planks/_stairs/_slab, dark_oak verge.
- Plot 2: oak_planks, stripped_birch_log, birch_fence, oak_door, spruce_trapdoor, spruce_stairs/_slab (shingle).
- Plot 3: jungle_planks, stripped_dark_oak_log, dark_oak_fence, jungle_door, birch_trapdoor, weathered_cut_copper (+_stairs, _slab), dark_oak verge.
- Decks: oak_planks, oak_stairs, oak_slab, spruce_planks (store, coop), spruce_slab.
- Store: dark_oak_planks, stripped_dark_oak_log, birch_planks, dark_oak_stairs, dark_oak_slab, dark_oak_door, glass_pane, spruce_stairs, oak_fence, oak_fence_gate.
- Coop: spruce_planks, stripped_spruce_log, spruce_stairs/_slab, spruce_trapdoor, spruce_door, hay_block, barrel.
- Garden/yard: wheat, carrots, potatoes, beetroots, composter, barrel, water_cauldron, carved_pumpkin, hay_block, oak_fence, oak_log, oak_leaves (persistent), white_wool, white_carpet, flower_pot, potted_poppy.
- Hearth: bricks, deepslate_bricks, brick_slab, brick_stairs, hay_block, campfire, smoker, furnace.
- Store job sites/furniture: composter, smoker, barrel, loom, fletching_table, chest, decorated_pot, candle, oak_pressure_plate.
- Light: lantern, iron_chain. Beds: red_bed, white_bed (via bed()).

## VOCABULARY

- `lane_strip(g, x0, x1)`: z0 and z4 coarse_dirt, z1 and z3 dirt_path, z2 gravel (z1..3 centre gravel at rest), y0.
- `lamp_post(g, x, z)`: spruce_fence y1..3, lantern hanging:false y4.
- `fence_line(g, x, z0, z1, block)`: fence, y1; connections set by the toolkit.
- `gate_pair(g, x, z, wood)`: two `<wood>_fence_gate`, facing south (open:false), at x,x+1, y1.
- `pier_skirt(g, box, pier, skirt)`: pier block y1 at listed cells; skirt fence between; ground fill y-2..0 below.
- `porch(g, x0, x1, deck, post, rail, gaps)`: deck y2 z7..8; posts y3..5 at z7 at listed x; rail fence y3 z7 except gaps; step stairs y1 z6 facing south.
- `house_walls(g, box, plank, post, openings)`: planks y3..6, corner posts axis y, head plate stripped log axis x y6, openings left air, gable fill above y6 to the roof.
- `batten_wall(g, ...)`: spruce planks with stripped_spruce_log battens at listed columns.
- `window(g, x, y, z, face, w, h)`: glass_pane connected, slab sill below (top slab), lintel log above.
- `door(g, x, z, kind, facing, hinge)`: lower+upper halves same facing/hinge, facing north; stair/slab step outside.
- `shutter(g, [x,y,z], face, wood, {height:2})`: open trapdoor lying flat each side.
- `chimney(g, x, z, height, band, capY)`: bricks 2x2 from y1, deepslate_bricks band, upside-down brick_stairs ring, brick_slab cap, hay_block at one cell under campfire (lit true, signal_fire true).
- `stove(g, x, y, z, facing)`: smoker lit true facing into room, set in chimney face line.
- `crop_bed(g, x0,x1,z0,z1, crop)`: farmland y0 (moisture 7), crop y1 age 7, water within 4.
- `channel(g, x0,x1,z)`: water y0 over stone y-1, stone sides.
- `scarecrow(g,x,z)`: oak_fence y1, hay_block y2, carved_pumpkin y3 facing north, fences as arms at y2.
- `trough(g, x0,x1,z)`: top oak_slabs on stripped log-less ground (oak_planks base y1 wall + slab) or water_cauldron.
- `coop(g)`: piers, floor, walls, nest row of hay_block/barrel facing up, chicken door open trapdoor.
- `well(g)`: cobblestone ring, water shaft, 4 oak_fence-free oak_log posts, stair roof, ridge beam, chain+lantern.
- `bench(g,x,z)`: oak_stairs x2 facing south, oak_trapdoor armrests.
- `tree(g,x,z,h)`: oak_log axis y trunk, ragged persistent leaves crown, 2 wider than trunk.
- `wash_line(g,...)`: oak_fence posts, rail, white_wool sheets.
- `false_front(g, x0,x1,z)`: birch_planks face to y10, raised centre y11..12, pilasters, upside-down dark_oak_stairs cornice.
- `store_sign(g)`: bannerWord(g,"STORE",{center:[89,10,8], face:"north", letter:"black", base:"white"}); signboard "MILL CO" hanging.
- `crate_stack(g,x,z,n)`: barrel up, chest, hay_block, 2 high.
- `woodpile(g,x,z)`: stripped logs axis x stacked.

## ROOMS

See rooms list in the answer. Interior volumes per FLOORS. Floors: oak_planks (spruce_planks store/coop) y2; stand y3. Plot 0 rooms: front x4..7 z10..12, back z14..16, partition door x5 z13. Plot 3 mirrored, door x42. Plot 1 west x14..16 z10..15; east x19..21; no connecting door (two doors, party wall). Plot 2 hall x27..29 z10..15, parlour x31..33, door x30 z14. Coop nest x64..67 y2..4 z13..15. Store sales floor x86..93 z10..12, counter/stock z13..16. No interior stairs: single storey, lofts decorative only.

## PARTS

1. P1 Shell (parts/shell.mjs): ground fill, piers, decks, walls and gable fills of houses 0-3, coop, store body and false front; every opening air.
2. P2 Roofs (parts/roofs.mjs): roof.json for 4 houses, store, coop; porch shed roofs; trusses king post.
3. P3 Fittings (parts/fittings.mjs): doors, windows, shutters, porch rails/steps, cornice, signs.
4. P4 Hearths (parts/hearths.mjs): 4 chimneys, stoves, campfire smoke.
5. P5 Yards (parts/yards.mjs): plots 4,5,6, coop details, wood pile, back steps, flower beds, loading platform.
6. P6 Lane and lights (parts/lane.mjs): lane, lamp posts, fences, gates, porch lanterns.

## CHECKLIST
- [ ] P1 shell  - [ ] P2 roofs  - [ ] P3 fittings  - [ ] P4 hearths  - [ ] P5 yards  - [ ] P6 lane+lights

## NOTES
- Keep each module in x 12i..12i+11 so it cuts out cleanly; chimneys 25..26 sit inside plot 2 (x 24..35 fits) but x 25 is also plot 2's span; plot 3 chimney x37..38 is inside plot 3.
- Plot 0 chimney x9..10 and plot 2 west x25 are inside their plots.
- Run `$MCD check`, `$MCD fit`, `$MCD walk` with rooms.json. Light every floor cell >= 8. Beds need 2 clear above.
- Never build interiors in parts; rooms' designers furnish.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (mill village kit, 8 plots, x 0..95, z 0..18, ground y 0)

Parts: P1 shell, P2 roofs, P3 fittings, P4 hearths, P5 yards, P6 lane+lights. Coordinates from plan.md.

| # | element | real construction | coordinates | part | vocab |
|---|---|---|---|---|---|
| 1 | Lane | gravel z1..3, dirt_path ruts z1 and z3, coarse_dirt edges z0,z4, y0 | x0..95 z0..4 | P6 | lane_strip |
| 2 | Lantern posts | spruce_fence y1..3 + standing lantern y4, at z4 | x 0,12,..,84,95 | P6 | lamp_post |
| 3 | Plot side fences | spruce_fence y1 (houses), oak_fence (garden/coop/store), open dirt_path (well) | x 12i, 12i+11, z5..18 | P6 | fence_line |
| 4 | Front picket + gate | birch_fence y1 at z5, 2 fence_gates (oak/birch) at x 12i+5..6, facing south | z5 | P6 | gate_pair |
| 5 | Piers + skirting | bricks (cobblestone, 1 in 10 mossy, for store/coop) at y1, fence lattice between; ground fill beneath | per FACADES | P1 | pier_skirt |
| 6 | Plank deck + porch | oak_planks y2 (spruce store), porch posts stripped logs y3..5, rail fence y3 with gap at steps; step stairs y1 z6 facing south | z6..8 | P1 (deck, posts), P3 (rail, step) | porch |
| 7 | Plot 0 shotgun | birch clapboard walls y3..6, corner posts, open lane gable, partition z13 with open door x5 | x3..8 z9..17 | P1 | house_walls |
| 8 | Plot 1 saddlebag | spruce board-and-batten (planks field + stripped log battens), solid party wall x17..18, two front doors | x13..22 z9..16 | P1 | batten_wall |
| 9 | Plot 2 hall-and-parlour | oak clapboard, birch corner boards, partition x30 door z14 | x26..34 z9..16 | P1 | house_walls |
| 10 | Plot 3 mirrored variant | jungle planks, dark oak posts, mirrored openings | x39..44 z9..17 | P1 | house_walls |
| 11 | Real windows | glass_pane in 1x2 / 2x2 openings with slab sill below and log lintel above, panes connected | OPENINGS table | P3 | window |
| 12 | Doors | both halves, same facing/hinge, facing out (north); double doors hinged mirrored | OPENINGS table | P3 | door |
| 13 | Shutters | open *_trapdoor lying flat on the wall beside windows | per FACADES | P3 | shutter |
| 14 | Tin/shingle roofs | roof tool: polished_andesite, mangrove, spruce-shingle, weathered_cut_copper; verge, overhang, ridge | ROOFS table | P2 | roof.json |
| 15 | Porch shed roofs | stairs y6 z7 rising, slab at the wall y7, same material, verge | z7..8 | P2 | porch_roof |
| 16 | Roof framing | `trusses` king post in roof.json for houses | houses | P2 | roof.json |
| 17 | Chimneys x4 | brick stack from own footing y1, deepslate_bricks band, stepped cap, hay_block + lit signal campfire at top | RESERVED | P4 | chimney |
| 18 | Stoves | lit smoker/furnace (facing room) beside chimney, y3, fed through the chimney wall | RESERVED stove cells | P4 | stove |
| 19 | Beds for families | bed() both halves, 2 clear above, door reachable (rooms' designers) | RESERVED | rooms | bed |
| 20 | Tables | fence post + top slab / pressure plate | in rooms | rooms | table |
| 21 | Kitchen garden | fence ring, farmland rows with wheat/carrots/potatoes/beetroots (age 7), centre path, bridged water channel on stone | x48..59 | P5 | crop_bed, channel |
| 22 | Composter, scarecrow, barrel, rain barrel | composter level 4, scarecrow oak_fence+hay_block+carved_pumpkin, barrel up, water_cauldron level 3 | z16..17 | P5 | scarecrow |
| 23 | Coop | cobblestone piers, spruce walls y2..4, spruce gable roof, chicken door (open trapdoor), keeper door, nesting boxes (hay_block/barrel alternating) | x63..68 z12..16 | P1 shell, P2 roof, P5 fittings | coop |
| 24 | Run, feed trough, water trough, straw | oak_fence ring; trough = oak_slab top row z8 x62..64 on fence-less ground; water_cauldron; hay_block | x60..71 | P5 | trough |
| 25 | Shared well | cobblestone ring 76..79 x 9..12 around water shaft, 4 oak posts, oak stair gable, oak_log beam, iron_chain + lantern | plot 6 | P5 | well |
| 26 | Bench | 2 oak_stairs facing south + trapdoor armrests | x74..75 z14 | P5 | bench |
| 27 | Shade tree | oak_log trunk y1..6 at 81,15, ragged persistent oak_leaves crown | plot 6 | P5 | tree |
| 28 | Wash line | oak_fence posts x73, 79; rail y4; white/colored wool sheets hung (y3) | z17 | P5 | wash_line |
| 29 | Company store | dark oak walls, birch false front stepped, cornice, pilasters, double door with transom, shop windows | x85..94 | P1 shell, P3 fittings | false_front |
| 30 | Store sign | banner letters "STORE" via bannerWord on false front band y9..10, hanging signboard "MILL CO" | x87..91 z8 | P3 | store_sign |
| 31 | Store porch | spruce deck, posts, andesite slab shed roof, steps, bench and barrels at ends | z6..8 | P1/P2/P3 | porch |
| 32 | Counter, shelves, barrels, crates, job-site blocks | rooms' designer: top slab counter x86..91 z13, composter 86, smoker 87, barrel 88, loom 92, fletching_table 93 at z16 | store room | rooms | counter |
| 33 | Loading platform | barrels/crates on outside back wall | x93..94 z18 | P5 | crate_stack |
| 34 | Lighting (no spawns) | lanterns under porch roofs, posts at gates, hanging lanterns inside | all | P6, rooms | lamp_post |
| 35 | Wood pile, back steps | stripped logs x4 y1 z18, oak_stairs back steps | plot 0 z18 | P5 | woodpile |
| 36 | Flower/herb beds | flowers on grass, 3x1 | plot 1 z17 | P5 | crop_bed |
```

### rooms.json

```json
{"entrance":[89,1,5],"rooms":[{"name":"P0 front room","box":[4,3,10,7,6,12]},{"name":"P0 back room","box":[4,3,14,7,6,16]},{"name":"P1 west flat","box":[14,3,10,16,6,15]},{"name":"P1 east flat","box":[19,3,10,21,6,15]},{"name":"P2 hall","box":[27,3,10,29,6,15]},{"name":"P2 parlour","box":[31,3,10,33,6,15]},{"name":"P3 front room","box":[40,3,10,43,6,12]},{"name":"P3 back room","box":[40,3,14,43,6,16]},{"name":"Coop nest room","box":[64,2,13,67,4,15]},{"name":"Store sales floor","box":[86,3,10,93,7,12]},{"name":"Store counter and stock","box":[86,3,13,93,7,16]}]}
```

### palette.json

```json
{"roles":{"ground":["grass_block","coarse_dirt","podzol","rooted_dirt","dirt_path","gravel","dirt","stone","farmland","water","short_grass"],"masonry":["bricks","brick_stairs","brick_slab","deepslate_bricks","cobblestone","mossy_cobblestone","cobblestone_stairs","cobblestone_slab","cobblestone_wall","mossy_cobblestone_wall"],"plot0":["birch_planks","stripped_birch_log","birch_fence","birch_fence_gate","birch_door","dark_oak_trapdoor","polished_andesite","polished_andesite_stairs","polished_andesite_slab","birch_stairs","birch_slab"],"plot1":["spruce_planks","stripped_spruce_log","spruce_fence","spruce_fence_gate","spruce_door","mangrove_planks","mangrove_stairs","mangrove_slab","dark_oak_stairs","dark_oak_slab","spruce_stairs","spruce_slab","spruce_trapdoor","birch_fence","birch_fence_gate"],"plot2":["oak_planks","stripped_birch_log","birch_fence","oak_door","spruce_trapdoor","spruce_stairs","spruce_slab","birch_fence_gate","oak_stairs","oak_slab"],"plot3":["jungle_planks","stripped_dark_oak_log","dark_oak_fence","dark_oak_fence_gate","jungle_door","birch_trapdoor","weathered_cut_copper","weathered_cut_copper_stairs","weathered_cut_copper_slab","dark_oak_stairs","dark_oak_slab","birch_fence","birch_fence_gate"],"decks":["oak_planks","oak_stairs","oak_slab","oak_trapdoor","spruce_planks","spruce_slab","oak_fence","oak_fence_gate","oak_log","oak_leaves","spruce_fence","stripped_spruce_log","birch_fence","birch_fence_gate"],"store":["dark_oak_planks","stripped_dark_oak_log","birch_planks","dark_oak_stairs","dark_oak_slab","dark_oak_door","glass_pane","spruce_stairs","oak_fence","oak_fence_gate","oak_pressure_plate","polished_andesite","polished_andesite_stairs","polished_andesite_slab","black_banner","black_wall_banner","oak_sign","oak_wall_sign","oak_hanging_sign","spruce_planks","spruce_slab","spruce_trapdoor"],"coop":["spruce_planks","stripped_spruce_log","spruce_stairs","spruce_slab","spruce_trapdoor","spruce_door","hay_block","barrel","cobblestone","cobblestone_stairs","oak_fence","oak_fence_gate","water_cauldron"],"garden":["wheat","carrots","potatoes","beetroots","composter","barrel","water_cauldron","carved_pumpkin","hay_block","oak_fence","oak_log","oak_leaves","white_wool","white_carpet","flower_pot","potted_poppy","oak_fence_gate","oak_planks","oak_slab","light_blue_wool","light_blue_carpet","poppy","cornflower"],"hearth":["bricks","deepslate_bricks","brick_slab","brick_stairs","hay_block","campfire","smoker","furnace"],"jobsite":["composter","smoker","barrel","loom","fletching_table","chest","decorated_pot","candle","oak_pressure_plate"],"light":["lantern","iron_chain"],"beds":["red_bed","white_bed"],"glass":["glass_pane"]},"objects":["lantern","iron_chain","red_bed","white_bed","campfire","smoker","furnace","barrel","composter","water_cauldron","carved_pumpkin","hay_block","loom","fletching_table","chest","decorated_pot","candle","flower_pot","potted_poppy","white_carpet","oak_pressure_plate","birch_door","spruce_door","oak_door","jungle_door","dark_oak_door","birch_fence","birch_fence_gate","spruce_fence","spruce_fence_gate","dark_oak_fence","dark_oak_fence_gate","oak_fence","oak_fence_gate","dark_oak_trapdoor","spruce_trapdoor","birch_trapdoor","oak_trapdoor","glass_pane","black_banner","black_wall_banner","oak_sign","oak_wall_sign","oak_hanging_sign","wheat","carrots","potatoes","beetroots","poppy","cornflower","oak_log","oak_leaves","white_wool","light_blue_wool","light_blue_carpet","oak_planks","oak_stairs","oak_slab","spruce_planks","spruce_stairs","spruce_slab","cobblestone","cobblestone_stairs","cobblestone_slab","cobblestone_wall","mossy_cobblestone","mossy_cobblestone_wall"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which moves into place only when the build finished.
set -eu
cd "$(dirname "$0")"
TMP="build.$$.tmp.nbt"
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
mv "$TMP" build.nbt
```

### build.mjs

```js
// Builds the mill village row (plan.md) into the file named by argv[2]: lays the ground, then runs every part in order.
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_X, SITE_Z, Y_LOW, Y_HIGH, GROUND_Y, FILL_Y0, FILL_Y1, GRASS_BLOCK, COARSE_DIRT, ROOTED_DIRT, DIRT, STONE, rng } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as hearths from "./parts/hearths.mjs";
import * as yards from "./parts/yards.mjs";
import * as lane from "./parts/lane.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import * as room7 from "./parts/room-7.mjs";
import * as room8 from "./parts/room-8.mjs";
import * as room9 from "./parts/room-9.mjs";
import * as room10 from "./parts/room-10.mjs";
import * as room11 from "./parts/room-11.mjs";

const out = process.argv[2] ?? "build.nbt";

// The grid takes plan.md's coordinates (y from Y_LOW, the well shaft, up to Y_HIGH); the toolkit's Grid refuses y < 0.
class SiteGrid extends Grid {
  inBounds(x, y, z) { return x >= 0 && x < SITE_X && y >= Y_LOW && y <= Y_HIGH && z >= 0 && z < SITE_Z; }
}
const g = new SiteGrid([SITE_X, Y_HIGH - Y_LOW + 1, SITE_Z]);

// Ground: solid fill (stone at y -2, dirt at y -1) and the surface at y 0 (grass 60%, coarse dirt 25%, rooted dirt 15%).
const pick = rng(96);
for (let x = 0; x < SITE_X; x++) for (let z = 0; z < SITE_Z; z++) {
  g.set(x, FILL_Y0, z, STONE);
  g.set(x, FILL_Y1, z, DIRT);
  const r = pick();
  g.set(x, GROUND_Y, z, r < 0.6 ? GRASS_BLOCK : r < 0.85 ? COARSE_DIRT : ROOTED_DIRT);
}

// Parts, in plan.md order. Rooms come last: each furnishes inside its own box.
runParts(g, [
  ["Shell", shell.build],
  ["Roofs", roofs.build],
  ["Fittings", fittings.build],
  ["Hearths", hearths.build],
  ["Yards", yards.build],
  ["Lane and lights", lane.build],
  ["room: P0 front room", room1.build],
  ["room: P0 back room", room2.build],
  ["room: P1 west flat", room3.build],
  ["room: P1 east flat", room4.build],
  ["room: P2 hall", room5.build],
  ["room: P2 parlour", room6.build],
  ["room: P3 front room", room7.build],
  ["room: P3 back room", room8.build],
  ["room: Coop nest room", room9.build],
  ["room: Store sales floor", room10.build],
  ["room: Store counter and stock", room11.build],
], { palette: "palette.json", roof: "roof.json" });

// The file stores y - Y_LOW, so every position is >= 0 (plan y 0 is file y 3). Same cells, shifted copy.
const file = new Grid([SITE_X, Y_HIGH - Y_LOW + 1, SITE_Z], { dataVersion: g.dataVersion });
for (const c of g) file.set(c.pos[0], c.pos[1] - Y_LOW, c.pos[2], c.block, c.state, c.nbt);
file.save(out);
console.log(JSON.stringify({ saved: out, yOffset: -Y_LOW }));
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the mill village row: palette ids (palette.json only), plan.md site coordinates, a seeded rng.
// Coordinates are plan.md's: ground surface y 0, x 0..95, z 0..18 (front = north, -z). Y_LOW..Y_HIGH is the full height.

// ---- site (plan.md SITE) ---------------------------------------------------------------------------------------------

// ---- site (plan.md SITE) ---------------------------------------------------------------------------------------------
/** Row width in x (0..95). */
export const SITE_X = 96;

/** Row depth in z (0..18). */
export const SITE_Z = 19;

/** Lowest y the build uses (the well shaft's water, y -3). */
export const Y_LOW = -3;

/** Highest y the build uses (chimney fires, roof ridges). */
export const Y_HIGH = 15;

/** Ground surface: grass/coarse dirt at y 0; standing level outdoors y 1. */
export const GROUND_Y = 0;

/** Standing level outdoors. */
export const STAND_Y = 1;

/** Solid ground fill runs y -2..-1 (stone at -2, dirt at -1). */
export const FILL_Y0 = -2;

/** Top of the solid ground fill. */
export const FILL_Y1 = -1;

/** Lane strip: z 0..4 (gravel centre z 1..3, dirt_path ruts at z 1 and 3, coarse_dirt edges z 0 and 4). */
export const LANE_Z0 = 0;

/** Lane strip south edge. */
export const LANE_Z1 = 4;

/** First plot row z (the picket fence line). */
export const PLOT_Z0 = 5;

/** Last plot row z (back fence line). */
export const PLOT_Z1 = 18;

/** Plot / module width in x. Module i covers x 12i..12i+11. */
export const MODULE_W = 12;

/** Number of plots in the row. */
export const PLOTS = 8;

/** First x of plot i. */
export const plotX0 = (i) => ...

/** Middle gate / door x pair of plot i (x 12i+5..6). */
export const gateX = (i) => ...

/** Lantern post x positions on the lane's south edge (z 4): one per module on its west column, plus x 95. */
export const LAMP_XS = [0, 12, 24, 36, 48, 60, 72, 84, 95];

/** Lantern post z (lane south edge). */
export const LAMP_Z = 4;

// ---- houses (plan.md FLOORS, FACADES, RESERVED) ----------------------------------------------------------------------
/** Brick pier / skirting levels shared by the houses. */
export const PIER_Y = 1;

/** Floor deck y (the deck is the sill of the walls). */
export const DECK_Y = 2;

/** First wall course y. */
export const WALL_Y0 = 3;

/** Last wall course y (head plate). */
export const WALL_Y1 = 6;

/** First roof course y. */
export const ROOF_Y0 = 7;

/** Front step z (stairs at y 1). */
export const STEP_Z = 6;

/** Porch deck / posts z rows (z 7..8). */
export const PORCH_Z = [7, 8];

/** Front wall z of the house bodies (z 9). */
export const FRONT_Z = 9;

/** Plot 0 shotgun body: x 3..8, z 9..17, y 1..6 (+ roof). */
export const P0_BODY = { x0: 3, x1: 8, y0: 1, y1: 6, z0: 9, z1: 17 };

/** Plot 1 saddlebag duplex body: x 13..22, z 9..16, y 1..6 (+ roof). */
export const P1_BODY = { x0: 13, x1: 22, y0: 1, y1: 6, z0: 9, z1: 16 };

/** Plot 2 hall-and-parlour body: x 26..34, z 9..16, y 1..6 (+ roof). */
export const P2_BODY = { x0: 26, x1: 34, y0: 1, y1: 6, z0: 9, z1: 16 };

/** Plot 3 shotgun body (mirror of plot 0): x 39..44, z 9..17, y 1..6 (+ roof). */
export const P3_BODY = { x0: 39, x1: 44, y0: 1, y1: 6, z0: 9, z1: 17 };

/** Chimney stacks, each [x0, y0, z0, x1, y1, z1] (own footing from y 1; cap and fire above y1). */
export const CHIMNEYS = {
  p0: [9, 1, 12, 10, 11, 13],
  p1: [17, 1, 12, 18, 13, 13],
  p2: [25, 1, 12, 26, 13, 13],
  p3: [37, 1, 12, 38, 11, 13],
};

/** Stove cells beside each chimney (lit smoker/furnace, y 3). */
export const STOVES = {
  p0: [7, 3, 12],
  p1w: [16, 3, 12],
  p1e: [19, 3, 12],
  p2: [27, 3, 13],
  p3: [40, 3, 12],
};

/** Bed cells per room, [x0, y, z0, x1, y, z1] (plan.md RESERVED): two clear blocks above (y 4..5) are kept air. */
export const BEDS = {
  p0back: [4, 3, 15, 5, 3, 16],
  p1w: [14, 3, 14, 14, 3, 15],
  p1e: [21, 3, 14, 21, 3, 15],
  p2hall: [27, 3, 14, 27, 3, 15],
  p2parlour: [33, 3, 14, 33, 3, 15],
  p3back: [43, 3, 15, 43, 3, 16],
};

/** Partition doors (open, no leaf) and entrance doors per plot, [x, z] of the wall cell. */
export const DOORS = {
  p0front: [5, 9], p0back: [6, 17], p0partition: [5, 13],
  p1front: [[15, 9], [20, 9]],
  p2front: [29, 9], p2back: [28, 16], p2partition: [30, 14],
  p3front: [41, 9], p3back: [41, 17], p3partition: [42, 13],
};

// ---- yards, coop, store, well, tree (plan.md SITE table) -------------------------------------------------------------
/** Plot 4 kitchen garden fence ring: x 48..59, z 5..18 (gate x 53..54 at z 5). */
export const GARDEN = { x0: 48, x1: 59, z0: 5, z1: 18 };

/** Plot 4 water channel: z 11, x 49..52 and 55..58 (bridged by the path x 53..54). */
export const CHANNEL_Z = 11;

/** Plot 5 coop box (floor y 1, walls y 2..4): x 63..68, z 12..16. */
export const COOP = { x0: 63, x1: 68, y0: 1, y1: 4, z0: 12, z1: 16 };

/** Plot 5 nest room inner air (plan): x 64..67, y 2..4, z 13..15. */
export const NEST = { x0: 64, y0: 2, x1: 67, y1: 4, z0: 13, z1: 15 };

/** Plot 6 well ring (cobblestone) x 76..79, z 9..12; shaft x 77..78, z 10..11, water y -3..0. */
export const WELL = { x0: 76, x1: 79, z0: 9, z1: 12 };

/** Plot 6 shade tree trunk (x 81, z 15) and crown box. */
export const TREE = { trunkX: 81, trunkZ: 15, crown: [78, 5, 12, 82, 9, 17] };

/** Plot 7 company store body: x 85..94, z 9..17, y 1..7 (+ roof); false front y 3..12 at z 9. */
export const STORE = { x0: 85, x1: 94, y0: 1, y1: 7, z0: 9, z1: 17, frontZ: 9 };

/** Store false-front band for the STORE banner: y 9..10 at x 87..91, z 8 (plan.md RESERVED). */
export const STORE_BANNER_Y = [9, 10];

// ---- palette: roles (palette.json) ------------------------------------------------------------------------------------
// ground
/** Ground surface mix (plan GROUND): 60% grass_block. */
export const GRASS_BLOCK = "grass_block";

/** Ground surface mix: 25% coarse_dirt; also lane edges. */
export const COARSE_DIRT = "coarse_dirt";

/** Ground under the tree and the coop. */
export const PODZOL = "podzol";

/** Ground near fences. */
export const ROOTED_DIRT = "rooted_dirt";

/** Lane wheel ruts. */
export const DIRT_PATH = "dirt_path";

/** Lane centre. */
export const GRAVEL = "gravel";

/** Ground fill y -1. */
export const DIRT = "dirt";

/** Ground fill y -2. */
export const STONE = "stone";

/** Garden farmland (crop beds). */
export const FARMLAND = "farmland";

/** Channel and shaft water. */
export const WATER = "water";

// masonry
/** House piers. */
export const BRICKS = "bricks";

/** Chimney cap ring. */
export const BRICK_STAIRS = "brick_stairs";

/** Chimney cap. */
export const BRICK_SLAB = "brick_slab";

/** Chimney band. */
export const DEEPSLATE_BRICKS = "deepslate_bricks";

/** Store, coop and well piers. */
export const COBBLESTONE = "cobblestone";

/** 1 in 10 pier and well blocks. */
export const MOSSY_COBBLESTONE = "mossy_cobblestone";

/** Store / well stairs. */
export const COBBLESTONE_STAIRS = "cobblestone_stairs";

// plot 0 (shotgun, birch)
/** Plot 0 walls. */
export const BIRCH_PLANKS = "birch_planks";

/** Plot 0 corner posts and head plate (also plot 2 trim). */
export const STRIPPED_BIRCH_LOG = "stripped_birch_log";

/** Plot 0 rail and garden fences. */
export const BIRCH_FENCE = "birch_fence";

/** Plot 0 front gate. */
export const BIRCH_FENCE_GATE = "birch_fence_gate";

/** Plot 0 front and back doors. */
export const BIRCH_DOOR = "birch_door";

/** Plot 0 shutters. */
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";

/** Plot 0 and plot 1 roof (tin). */
export const POLISHED_ANDESITE = "polished_andesite";

/** Roof stairs (tin). */
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";

/** Roof slabs (tin). */
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";

// plot 1 (saddlebag duplex, spruce)
/** Plot 1 walls (board-and-batten field). */
export const SPRUCE_PLANKS = "spruce_planks";

/** Plot 1 battens and posts. */
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";

/** Plot 1 side fences and skirting. */
export const SPRUCE_FENCE = "spruce_fence";

/** Plot 1 gate and fence gates. */
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";

/** Plot 1 front doors (and coop keeper door). */
export const SPRUCE_DOOR = "spruce_door";

/** Plot 1 roof (rusted tin). */
export const MANGROVE_PLANKS = "mangrove_planks";

/** Plot 1 roof stairs. */
export const MANGROVE_STAIRS = "mangrove_stairs";

/** Plot 1 roof slabs. */
export const MANGROVE_SLAB = "mangrove_slab";

/** Plot 1 and plot 3 verge stairs (dark_oak). */
export const DARK_OAK_STAIRS = "dark_oak_stairs";

/** Plot 1 and plot 3 verge slabs (dark_oak). */
export const DARK_OAK_SLAB = "dark_oak_slab";

// plot 2 (hall and parlour, oak clapboard)
/** Plot 2 walls and decks. */
export const OAK_PLANKS = "oak_planks";

/** Plot 2 front and back doors. */
export const OAK_DOOR = "oak_door";

/** Plot 2 shutters. */
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

/** Plot 2 roof (spruce shingle) and coop stairs. */
export const SPRUCE_STAIRS = "spruce_stairs";

/** Plot 2 roof (spruce shingle) slab. */
export const SPRUCE_SLAB = "spruce_slab";

// plot 3 (shotgun, jungle)
/** Plot 3 walls. */
export const JUNGLE_PLANKS = "jungle_planks";

/** Plot 3 corner posts. */
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";

/** Plot 3 side fences and skirting. */
export const DARK_OAK_FENCE = "dark_oak_fence";

/** Plot 3 front gate. */
export const DARK_OAK_FENCE_GATE = "dark_oak_fence_gate";

/** Plot 3 front and back doors. */
export const JUNGLE_DOOR = "jungle_door";

/** Plot 3 shutters. */
export const BIRCH_TRAPDOOR = "birch_trapdoor";

/** Plot 3 roof (green tin). */
export const WEATHERED_CUT_COPPER = "weathered_cut_copper";

/** Plot 3 roof stairs. */
export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs";

/** Plot 3 roof slabs. */
export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab";

// decks, porches, yards
/** Porch deck stairs and bench. */
export const OAK_STAIRS = "oak_stairs";

/** Porch deck slabs. */
export const OAK_SLAB = "oak_slab";

/** Bench armrests. */
export const OAK_TRAPDOOR = "oak_trapdoor";

/** Garden and wash-line fences; scarecrow post. */
export const OAK_FENCE = "oak_fence";

/** Garden gate (plot 4) and the coop run gate. */
export const OAK_FENCE_GATE = "oak_fence_gate";

/** Shade tree trunk, well ridge beam, bridge deck. */
export const OAK_LOG = "oak_log";

/** Shade tree crown (persistent). */
export const OAK_LEAVES = "oak_leaves";

// store
/** Store walls and sales floor. */
export const DARK_OAK_PLANKS = "dark_oak_planks";

/** Store false front face (painted cream). */
export const STORE_FALSE_FRONT = "birch_planks";

/** Store cornice (upside down). */
export const STORE_CORNICE = "dark_oak_stairs";

/** Store cornice brackets. */
export const STORE_CORNICE_SLAB = "dark_oak_slab";

/** Store front door. */
export const DARK_OAK_DOOR = "dark_oak_door";

/** Store windows and transom. */
export const GLASS_PANE = "glass_pane";

/** Store steps. */
export const STORE_STEPS = "spruce_stairs";

// coop
/** Coop nest boxes and straw. */
export const HAY_BLOCK = "hay_block";

/** Nest boxes (facing up) and store/yard barrels. */
export const BARREL = "barrel";

// garden and yard
/** Crop beds. */
export const WHEAT = "wheat";

/** Crop beds. */
export const CARROTS = "carrots";

/** Crop beds. */
export const POTATOES = "potatoes";

/** Crop beds. */
export const BEETROOTS = "beetroots";

/** Garden composter and store job site. */
export const COMPOSTER = "composter";

/** Rain barrel and well water. */
export const WATER_CAULDRON = "water_cauldron";

/** Scarecrow head. */
export const CARVED_PUMPKIN = "carved_pumpkin";

/** Wash-line sheets. */
export const WHITE_WOOL = "white_wool";

/** Rug and carpets. */
export const WHITE_CARPET = "white_carpet";

/** Flower beds and shelves. */
export const FLOWER_POT = "flower_pot";

/** Flower beds. */
export const POTTED_POPPY = "potted_poppy";

// hearth
/** Chimney fire and signal fire. */
export const CAMPFIRE = "campfire";

/** Stove beside plots 0, 1, 3 (lit). */
export const SMOKER = "smoker";

/** Stove beside plot 2. */
export const FURNACE = "furnace";

// job sites and store furniture
/** Store job site (loom). */
export const LOOM = "loom";

/** Store job site (fletching table). */
export const FLETCHING_TABLE = "fletching_table";

/** Store crates and stock. */
export const CHEST = "chest";

/** Store pottery. */
export const DECORATED_POT = "decorated_pot";

/** Store and room candles. */
export const CANDLE = "candle";

/** Pressure plate (store trade plate). */
export const OAK_PRESSURE_PLATE = "oak_pressure_plate";

// light and beds
/** Porch and room lanterns. */
export const LANTERN = "lantern";

/** Well and porch hangers. */
export const IRON_CHAIN = "iron_chain";

/** Family beds (red). */
export const RED_BED = "red_bed";

/** Family beds (white). */
export const WHITE_BED = "white_bed";

// ---- seeded rng -------------------------------------------------------------------------------------------------------
/** rng(seed) -> () => float in [0, 1) (mulberry32): the same seed gives the same build. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Mill village vocabulary, first set (plan.md VOCABULARY): lane_strip, gate_pair, house_walls, door, stove, scarecrow,
// well, wash_line, crate_stack. Same rules as h2: every helper takes its position as arguments, speaks plan.md
// coordinates (ground surface y 0, standing level y 1), writes only into air inside its own footprint, and returns
// { placed, skipped }: skipped lists the cells it was not allowed to write.
// Two exceptions, named where they apply: lane_strip lays the surface itself and well digs its own shaft, so both may
// replace the GROUND blocks below. Nothing else is ever written over ground, sand or floor.

export function lane_strip(g, x0, x1)

// gate_pair(g, x, z, wood): two <wood>_fence_gate at x and x+1 on y 1, facing south, closed. Footprint x..x+1, y 1, z.
export function gate_pair(g, x, z, wood)

// house_walls(g, [x0, z0, x1, z1], plank, post, openings, { gable }): the walls of a house footprint, y 3..6: planks on
// the four walls, `post` at the corners (axis y) and as the head plate on y 6 (axis x on the front and back walls, z on
// the ends). openings: [x0, y0, z0, x1, y1, z1] boxes left air. gable "z" or "x": the two walls across that axis carry
// a 45-degree gable triangle above y 6, closing itself at the apex ("z": the z-end walls, ridge along z).
export function house_walls(g, [x0, z0, x1, z1], plank, post, openings = [], { gable } = {})

// door(g, x, z, kind, facing, hinge, { step }): a <kind>_door on the wall cell x,z, both halves (y 3 and 4) with the same
// facing and hinge; kind is the wood word (birch, spruce, oak, jungle, dark_oak). step: an optional block id for the
// cell outside the door, on y 2 so its top is the threshold at y 3 ("oak_stairs" facing in, or a "_slab" top half).
export function door(g, x, z, kind, facing = "north", hinge = "left", { step } = {})

// stove(g, x, y, z, facing): a lit smoker at x,y,z facing into its room, with the chimney wall behind it.
export function stove(g, x, y, z, facing)

// scarecrow(g, x, z): an oak_fence post on y 1, hay_block on y 2 with fence arms east and west of it, carved_pumpkin on
// y 3 facing north. Footprint x-1..x+1 on y 2, x on y 1..3.
export function scarecrow(g, x, z)

// well(g, x0, z0): the shared well, footprint x0..x0+3, z0..z0+3 (plan: 76, 9). Cobblestone ring on y 1; a water shaft on
// the ring's inside (2x2) from y -3 to y 0, dug through the ground (the only ground it replaces). Oak_log posts at the four
// corners, y 2..4; oak_stairs roof on y 5 at the two ends rising to two oak_log ridge beams along z, with an oak_slab cap
// on y 6; iron_chain on y 4 hanging from the beam over the shaft, and a hanging lantern on y 3 below it.
export function well(g, x0, z0)

// wash_line(g, x0, x1, z, sheets, wool): oak_fence posts at x0 and x1 on y 1..4, an oak_fence rail on y 4 between them,
// and wool sheets (default white_wool) hung on y 3 under the rail at each x in `sheets`.
export function wash_line(g, x0, x1, z, sheets = [], wool = "white_wool")

// crate_stack(g, x, z, n): n crates (1 to 3) stacked on the ground from y 1 up: a barrel facing up at the bottom, a chest,
// then a hay_block. Footprint x, z, y 1..n.
export function crate_stack(g, x, z, n = 2)
```

### vocab/h2.mjs

```js
// Mill village vocabulary, second set (plan.md VOCABULARY): lamp_post, pier_skirt, batten_wall, shutter, crop_bed,
// trough, bench, false_front, woodpile. Every helper takes its position as arguments and writes only into air inside
// its own footprint; it never lays ground, sand or floor (y0 and below belong to an earlier part). Exceptions are
// named in the option that allows them. Each returns { placed, skipped }: skipped lists the cells that were not air.

// lamp_post(g, x, z): spruce fence post y1..3 with a standing lantern on top at y4. Footprint: column x,z, y1..4.
export function lamp_post(g, x, z)

// pier_skirt(g, box, pier, skirt): box = [x0, z0, x1, z1] (inclusive), the house footprint. At y1 round its perimeter:
// a pier block at each corner and every third cell from each corner along a side, and a fence skirt between them.
// Only the y1 ring is written; the ground under it is not.
export function pier_skirt(g, box, pier, skirt)

// batten_wall(g, a, b, { y0, y1, battens, plank, batten }): one straight wall line from a=[x,z] to b=[x,z] (same z,
// or same x), planks from y0 to y1 with stripped log battens at the listed positions along the line (x or z values).
export function batten_wall(g, a, b, { y0 = 3, y1 = 6, battens = [], plank = "spruce_planks", batten = "stripped_spruce_log" } = {})

// shutter(g, [x, y, z], face, wood, { height }): open trapdoors standing on the air cell in front of a window wall,
// lying flat against it. face = the way the wall looks (north for a north front). height cells up from y.
export function shutter(g, [x, y, z], face, wood = "spruce", { height = 2 } = {})

// crop_bed(g, x0, x1, z0, z1, crop, { soil }): crop plants y1 in the box, grown. The farmland at y0 is ground, so it is
// NOT written unless { soil: true } is passed, which then sets farmland (moisture 7) at y0 over the grass.
// Water within 4 cells is the channel's job (channel is its own part).
export function crop_bed(g, x0, x1, z0, z1, crop, { soil = false } = {})

// trough(g, x0, x1, z, { water }): a row along x at z. Default: oak_planks base at y1 with a bottom oak_slab top course
// at y2. water: water_cauldron level 3 at y1 in each cell instead.
export function trough(g, x0, x1, z, { water = false } = {})

// bench(g, x, z): two oak stairs at x and x+1 on row z, facing south (back to the north), with an oak trapdoor armrest at
// each end (x-1 and x+2). Writes only y1: y2 and y3 stay clear for the walk past it.
export function bench(g, x, z)

// false_front(g, x0, x1, z): the store's front wall on plane z, facing north. Birch face y3..10 across x0..x1 with
// stripped dark oak pilasters at both ends; a raised centre (x0+2..x1-2) at y11..12. A cornice of upside-down dark oak
// stairs sits proud at z-1: y11 across the full width, y12 over the raised centre. Footprint: x0..x1, y3..12, z-1..z.
export function false_front(g, x0, x1, z)

// woodpile(g, x, z, { wood }): stripped logs laid along x, two long (x and x+1) and two high (y1..2), stacked.
// Footprint: x..x+1, y1..2, z.
export function woodpile(g, x, z, { wood = "stripped_birch_log" } = {})
```

### vocab/h3.mjs

```js
// Mill village kit, plan.md VOCABULARY (H3 set): fence_line, porch, window, chimney, channel, coop, tree, store_sign.
// Coordinates are plan.md's: ground surface y 0, x and z as the caller passes them. Every helper writes only into air
// inside its own footprint, so an earlier part's cells are never overwritten. The one exception is channel(), which cuts
// the water into the ground it sits in (its footprint only).

/** A straight fence run at x from z0 to z1 (either order) on y 1; each fence connects to its neighbours in the run. */
export function fence_line(g, x, z0, z1, block)

/**
 * A porch on the front of a house: deck y 2 over z 7..8 from x0 to x1; posts y 3..5 at z 7 (post = { block, xs }, a
 * stripped log and the x of each post; a bare block id puts posts at x0 and x1); a rail fence y 3 along z 7 except at
 * `gaps`; and a step (stairs facing south, y 1, z 6) in each gap. The stairs take the deck's wood (oak_planks -> oak_stairs).
 */
export function porch(g, x0, x1, deck, post, rail, gaps = [])

/**
 * A window in an outside wall: w by h glass_pane, connected along the wall. (x, y, z) is the wall cell at the window's
 * bottom-left, seen from outside; face is the way the wall looks (north/south: the window runs along x; east/west: along z).
 * A top slab of `${wood}` sits under it and a stripped log lintel over it. Those two rows are only placed where the wall
 * is air: a closed wall keeps its own sill and head plate, so only the panes go in.
 */
export function window(g, x, y, z, face, w = 1, h = 2, wood = "birch")

/**
 * A brick chimney stack, 2x2 at x..x+1, z..z+1, from y 1. Bricks up to `height`, with a deepslate_bricks band at row
 * `band`; a ring of upside-down brick_stairs steps out at `height`; a brick_slab cap at capY (must be height + 1) with
 * a hay_block in the corner; a lit campfire (signal_fire) on the hay at capY + 1.
 */
export function chimney(g, x, z, height, band, capY)

/**
 * A water channel across x0..x1 at row z: water at row y (a source, level 0) over a stone bed at y - 1. This is the one
 * helper that cuts: it replaces the ground in its own footprint and nothing beside it. Stone banks are not laid, because
 * the beds either side of the plan's channel are farmland. The bed is skipped where the grid has no row below y.
 */
export function channel(g, x0, x1, z, y = 0)

/**
 * A shade tree on (x, z): an oak_log trunk (axis y) from y 1 to y h, and a crown of persistent oak_leaves five layers
 * deep from y h-1 to y h+3, two out from the trunk on each side, corners dropped so it reads ragged. The trunk and crown
 * only fill air.
 */
export function tree(g, x, z, h)

/**
 * A worker's coop, footprint x0..x0+5 by z0..z0+4, floor y 1, walls y 2..4 (spruce planks, stripped spruce corners) on
 * cobblestone corner piers. North face: a chicken door (open trapdoor, x0+1, y 2), a keeper door (x0+3, y 2..3) and a
 * vent (open trapdoor, x0+4, y 3). Inside on the back row (z0+3): hay_block and barrels (facing up) alternate along y 2.
 * The roof is the roof part's.
 */
export function coop(g, x0, z0)

/**
 * The company store's sign: STORE in banner letters on the false front (bannerWord: `center` is the middle letter, face
 * the way it looks) and, when `sign` is given, the hanging board (MILL CO) at that anchor under the porch roof.
 * Returns the number of blocks placed.
 */
export function store_sign(g, { center, face = "north", sign = null, banner = "STORE", board = "MILL CO" })
```

## The build library (/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs): outline

### build.mjs (library)

```js
// Authoring builds as CODE: design one bay, tile it; mirror for symmetry; protect function with a guard.
// Coordinate bookkeeping is where design time and errors go — write a short generator script with these helpers
// instead of typing hundreds of coordinates.
//
//   import { load, Grid, guard, tile, mirrorX, B, face } from "<plugin>/tools/src/build.mjs"
//   const g = guard(load("in.nbt"))                 // refuses writes into functional cells (see check.mjs)
//   runParts(g, [["shell", shellPart], ["porch", porchPart]], { palette: "palette.json" })  // later parts only add
//   tile(g, { from: 1, step: 4, count: 5, axis: "z" }, (z) => bay(g, z))
//   g.save("out.nbt")

// ---- directions -------------------------------------------------------------------------------------------------
export const DIRS = { north: [0, 0, -1], south: [0, 0, 1], west: [-1, 0, 0], east: [1, 0, 0] };

export const OPPOSITE = { north: "south", south: "north", east: "west", west: "east", up: "down", down: "up" };

export const face = {
  opposite: (f) => ...
  cw: (f) => ...
  ccw: (f) => ...
  mirrorX: (f) => ...
  mirrorZ: (f) => ...
};

// ---- block helpers: return [block, state] pairs for g.set(x, y, z, ...B.stairs(...)) ----------------------------
// Stairs `facing` = the side of the full-height back; a cornice/bracket lip toward the street uses
// facing = the INWARD direction with half: "top".
export const B = {
  stairs: (mat, facing, half = "bottom", shape = "straight") => ...
  slab: (mat, type = "bottom") => ...
  log: (mat, axis = "y") => ...
  wood: (mat, axis = "y") => ...
  pillar: (block, axis = "y") => ...
  trapdoor: (mat, facing, half = "bottom", open = false) => ...
  door: (mat, facing, half = "lower", hinge = "left") => ...
  fence: (mat) => ...
  wall: (mat) => ...
  pane: (block = "glass_pane") => ...
  lantern: (hanging = false) => ...
  chain: (axis = "y", version26 = true) => ...
  wallTorch: (facing) => ...
  block: (name) => ...
  banner: (color, patterns = [], { wall = true, facing = "north", rotation = 0, legacy = false } = {}) => ...
  sign: (wood = "oak", lines = [], { wall = true, facing = "north", rotation = 0, hanging = false, color = "black", glow = false, back = [], dataVersion = 4189 } = {}) => ...
};

// ---- placement helpers ------------------------------------------------------------------------------------------
/** Call fn(pos, i) for count positions from `from`, `step` apart (the bay rhythm). */
export function tile(_g, { from = 0, step, count, to }, fn)

/** Run `paint(set)` twice: as written, and mirrored across x = cx (x' = 2cx - x), flipping east/west facings. */
export function mirrorX(g, cx, paint)

export function mirrorZ(g, cz, paint)

/** Hollow box: walls (and optional floor/ceiling) of a cuboid. */
export function shell(g, a, b, block, { floor = true, ceiling = true, state } = {})

/** Set a box to air (carving). Air is stored, so it clears the cell when the structure is placed. */
export const carve = (g, a, b) => ...

/** Replace only where the current block matches `from` (a name or a predicate). */
export function replace(g, a, b, from, block, state)

/**
 * Wrap a grid so writes into protected cells are refused (counted, never thrown), so a decor script cannot
 * break function. protect: Set of "x,y,z" — default: the grid's own functional cells and the cells that must stay
 * clear around them (check.mjs functionalCells). `g.refused` lists what was blocked; report it.
 */
export function guard(g, protect)

/**
 * Draw blocks from text, the way Litematica stores a schematic (a palette, then one index per cell): one character per
 * block, a legend for the characters. Far fewer tokens than a set() per block, and the layout is visible as written.
 *   layers(g, [x, y, z], { "#": "oak_planks", "b": ["red_bed", { facing: "south", part: "head" }], "c": "chest" }, [
 *     ["#####", "#b c#", "#b  #"],      // y: rows run along +x, successive rows along +z
 *     ["#####", "#   #", "#   #"],      // y + 1 ...
 *   ])
 * A single layer may be passed as one array of rows. Characters not in the legend (space, ".") are left as they are.
 * Writes go through g.set, so runParts' lock and palette report apply. Returns the number of blocks placed.
 */
export function layers(g, [x0, y0, z0], legend, rowsOrLayers)

/**
 * Run a build's parts in order so each part can only ADD to what earlier parts built: a write into a cell an earlier
 * part placed (air included, so no carving) is refused, counted, never thrown, so a later part can't knock holes in
 * a wall. Cells set before runParts (the ground) stay writable: farmland and paths may replace grass. With a palette
 * (palette.json, or its object: { roles: { role: [blocks] }, objects: [blocks] }), every block placed outside it is
 * reported. Prints one line per part, writes the reports to `report` (default parts-report.json; null for none) and
 * returns them.
 * roof: a roof spec (roof.json, as for `mcd roof --spec`) laid right after the FIRST part (the shell), so every later
 * part builds around the finished roof instead of the roof tool clearing the attic, gables and lofts after them. No
 * file yet (the roof part writes it, maybe in another copy at the same time): skipped with a note, never an error.
 * sockets.json in the working directory (or reserve: a layout or path; null for none) reserves the redstone shops'
 * envelopes: every write into one is refused. A part given { carve: true } (the stair joiner) may cut through earlier parts' floors and ceilings for its
 * stairwells: cells with air straight above or below. Walls stay refused.
 *   runParts(g, [["shell", shell.build], ["stairs", stairs.build, { carve: true }], ["garden", garden.build]],
 *     { palette: "palette.json", roof: "roof.json" })
 */
export function runParts(g, list, { palette, roof, reserve, log = console.log, report = "parts-report.json" } = {})

/** Lettering in a band: plaque(g, "LEAGUE HALL", { at, face, width, height, letter?, material?, frame?, style?, relief? }) */
export const plaque = (g, text, o) => ...

/** A bed, both halves: foot at [x,y,z], the head one step toward facing (the pillow end), same colour and facing. */
export const bed = (g, [x, y, z], facing, color = "red") => ...

/** A window shutter: an open trapdoor in the cell in front of the wall (on the face side), lying flat against it.
 *  face: the way the wall looks (north for a north front); the trapdoor's facing is the face, so it lies on the wall. */
export const shutter = (g, [x, y, z], face, wood = "spruce", { height = 1 } = {}) => ...

/** A word in banner letters hung on a board, in reading order for its face: bannerWord(g, "BUTCHER", { center: [14, 10, 4], face: "north" }). */
export const bannerWord = (g, word, o) => ...

/** The sockets' fit-out (glass wall lines and back walls, spawn-proof pit floor, counters): fitSockets(g, layout, { counter, glass }) */
export const fitSockets = (g, layout, o) => ...

/** A clock face on a tower: clock(g, { center, face, radius?: 2-4, dial?, bezel?, hands?, time?: "10:10", out?: 0|1 }) */
export const clock = (g, o) => ...

/** A shop sign: signboard(g, "BAKERY", { at, face, mode: "wall"|"hanging", width?, height?, wood? }) */
export const signboard = (g, text, o) => ...

/** Banners along a row: bunting(g, { from, to, face, colors?, every?, pattern? }) */
export const bunting = (g, o) => ...

/** A profiled pilaster: pilaster(g, { at, face, height, width?, out?, material?, profile?, shoulder? }) */
export const pilaster = (g, o) => ...

/** An opening surround: surround(g, { at, face, width, height, preset?, trim?, keystone?, reveal?, door?, arch? }) */
export const surround = (g, o) => ...

/** Glazing: glazing(g, { at, face, width, height, preset: grid|shopfront|transom|sidelights, frame?, door? }) */
export const glazing = (g, o) => ...

/** A light fitting: fixture(g, { at, face, mount: bracket|arm|top|hang, lamp? }) */
export const fixture = (g, o) => ...

/** A planter: planter(g, { at, face, width, kind: box|ground, depth?, plants? }) */
export const planter = (g, o) => ...
```

## The toolkit reference (references/toolkit.md)

# Toolkit reference

`MCD="node ${CLAUDE_PLUGIN_ROOT}/tools/bin/mcd.mjs"` — pure Node 20+, no install. First use downloads the
Minecraft client jar for the needed version from Mojang (sha1-verified) into `~/.cache/minecraft-design/`, or
uses `$MC_CLIENT_JAR`, the official launcher's or Prism Launcher's local jars. Nothing copyrighted ships here.

## Coordinates and facing (read this once)

- Files: every command reads a structure `.nbt` or a Litematica `.litematic` (all regions, in one box); `g.save()`
  and `mcd convert` write either, by extension. Block-entity data and entities survive both ways.
- Structure-local: `x` east, `y` up, `z` south. `0 ≤ x < size[0]` etc.
- Conventional front for new builds: **north (−z)**, the street at `z < 0`. `mcd render` auto-detects the front
  from exposed windows/doors; override with `--front n|s|e|w`.
- Walking into a building that faces north, you face **south (+z)**; east (+x) is on your **left**.
- `facing` on blocks:
  - **stairs**: the side of the full-height back. A cornice/bracket whose lip points at the street:
    `half: "top"`, `facing` = the direction *into* the wall. A roof slope rising to the north: `facing: "north"`.
  - **trapdoor**: the side it hinges from when open; closed `half: "top"` sits in the top of the cell.
  - **wall torch / wall sign / wall banner**: the direction it *points out* (away from the wall).
  - **repeater / comparator**: `facing` points toward the *input* (signal flows the opposite way).
  - **logs**: `axis: x|y|z`.
- `mcd states <block>` lists every valid property and value for a block in the target version; `mcd blocks
  --grep <re>` lists valid ids (ids change: 26.x renamed `chain` → `iron_chain`); `mcd blocks --check a,b,c` says
  which ids are real and suggests near names for the rest. Use them instead of guessing.
- `mcd walk build.nbt --rooms rooms.json` floods the cells a player can stand in (jump one up with headroom, drop up
  to three, through doors and gates, up ladders, vines, scaffolding and water columns such as a soul-sand water
  elevator) from the entrance and says, per room box, whether it's reached, unreachable, or
  partly blocked by furniture. rooms.json: `{"entrance": [x,y,z], "rooms": [{"name", "box": [x0,y0,z0,x1,y1,z1]}]}`.
- `mcd rooms build.nbt --rooms rooms.json [--only name,...] [--out rooms.png]` shows every room: a dollhouse view
  (everything above the room cut away, from a front corner) and, for rooms 5+ wide both ways, an eye view inside.
- `layers(g, [x, y, z], legend, rows)` (build library) draws blocks from text the way Litematica stores them: a
  legend of characters, one character per block, rows along +x, successive rows along +z, layer by layer. Use it for any
  layout of many different blocks (a furnished room, a facade panel); it costs a fraction of a set() per block.
  `mcd plan build.nbt --rooms rooms.json [--only name]` prints each room's floor as that grid ('#' wall, 'D' doorway,
  'W' window, 'o' already there, '.' free floor) with the origin to pass to layers().
- `mcd room build.nbt --rooms rooms.json --only "<room>"` is a room designer's one check after each rebuild: the walk
  verdict with the floor cells a player can't reach (marked `x` on the floor grid, which shows the furniture as `o`),
  the light levels at the feet, and lantern spots (hanging under the ceiling where there's headroom, else against a
  wall) that would lift the dark and dim cells to 8+. Exits 1 until the room is walkable with no dark cell.
- `mcd light build.nbt --rooms rooms.json [--only name]` (or `--y <feet y>` for a whole floor level) maps block light
  the way the game spreads it (each source at its vanilla level, one less per block, stopped by full blocks): each
  floor cell's level as 0-9/A-F, with min, mean and the DARK (0, mobs spawn) and dim (1-7) counts. Design lighting
  with it: the renderer has no night.

## Commands

| Command | Does |
|---|---|
| `render <f.nbt> [--out s.png] [--front d] [--ground y] [--cut y] [--eye x,y,z --look x,y,z [--label t]]... [--view "name:x,y,z->x,y,z"]... [--tiles dir]` | The look sheet: 3 street views at eye height, 4 elevations, 2 front-corner isos, optional cutaway and interior eye views. `--view` adds a named exterior camera with sun shadows (e.g. `"downstream:28,14.5,40->31,18,22"`, the iconic view of a house over a waterfall). `--tiles` also writes each view as its own PNG (zoom into one with Read). |
| `compare <before> <after> [--out c.png]` | Before \| after sheets side by side, same cameras. |
| `convert <in> <out>` | Structure `.nbt` ↔ Litematica `.litematic`, by extension (schematic version 7 for 1.20.5+, 6 before). Use `.litematic` for builds over 48 blocks a side, which a structure block can't place in one go. |
| `roof <in.nbt> <out.nbt> --style <s> [--pitch p] [--eave e] [--material m] [--ridge r] [--dormers 2:e] [--pediment n] [--tower x,z,w,h,top] [--chimney x,z] [--keep box] [--spec roof.json]` / `roof <in.nbt> --detect` | Re-roof a build by style name: detects the eave and footprint, strips the old roof, builds the new one (see roofs.md). `--detect` only reports what it found. |
| `check <f.nbt> [after.nbt] [--contract c.json] [--site site.json] [--json]` | (A contract file adds to the automatic redstone protection.) Census, walkability, largest blank surfaces (interior and exterior separately); with two files the FUNCTION report: protected cells unchanged, keep-clear cells clear, warnings for new conductive/triggering/feeding neighbours. `--site` adds the landscape checks (see landscaping.md). Exit 1 on any violation. |
| `info <f.nbt>` | Size, DataVersion → version, census, block entities, functional cell count, unknown block ids. |
| `blocks [--grep re]` / `states <block>` | Valid ids / states for the version. |
| `new <build.mjs> [--from in.nbt] [--size x,y,z] [--out out.nbt]` | Scaffold a generator script wired to the build library (with `--from`, writes are guarded). |
| `concept "<subject>" --out c.png [--size s] [--palette p] [--provider codex\|gemini] [--ref img]... [--model m] [--raw]` | A builder's reference sheet (front elevation + 3/4, one scale, no scene). Codex CLI image tool when installed (ChatGPT plan, no key, ~1 min; `--ref` redraws from a given image), else Gemini (`GEMINI_API_KEY`, Nano Banana 2.1 by default). Measured: this prompt shape matters more than the model; 2–3 candidates across providers, picked against the brief, add useful variety. |
| `assets [--version v]` | Pre-fetch the client jar. |

Version: `--version` › `$MCD_VERSION` › the file's DataVersion › latest release.

Render notes: no light engine (light sources show as blocks, not glow); interior eye views skip sun shadows;
block-entity blocks (chests, signs, beds, banners, heads) render as simple textured boxes; entities (item
frames, armour stands) are not drawn. Keep `--look` inside the build for interior views.

## Build library (`tools/src/build.mjs`)

```js
import { load, Grid, guard, tile, mirrorX, mirrorZ, shell, carve, replace, B, face, DIRS } from ".../tools/src/build.mjs";
const g = guard(load("in.nbt"));          // or: new Grid([w, h, d], { dataVersion })
g.set(x, y, z, ...B.stairs("dark_oak", "south", "top"));   // [block, state] helpers: stairs slab log wood trapdoor door fence wall lantern chain wallTorch pane block
g.fill([x0, y0, z0], [x1, y1, z1], "stone_bricks");
tile(g, { from: 1, step: 4, to: 19 }, (z, i) => bay(z, i));  // the bay rhythm
mirrorX(g, cx, (set) => set(x, y, z, block, state));          // symmetric pair, facings mirrored
shell(g, a, b, "spruce_planks", { floor: true, ceiling: false });
carve(g, a, b);                            // stores air (clears the cell on placement)
replace(g, a, b, "spruce_planks", "stone_bricks");
g.save("out.nbt");                          // never overwrite the input
console.log(g.refused);                     // guarded writes that were refused (report them)
```

Shape brushes (also exported from `build.mjs`): curved forms — `dome`, `cylinder`, `minaret`, `arch` (+ `circleCells`,
`ring`, `disc`, `revolve`) — see `shapes-curved.md`; massing — `setbacks`, `gableRoof`, `hipRoof`, `fins`, `parapet`,
`cornice`, `falseFront`, `stepGable` — see `shapes-massing.md`. Each is `fn(g, opts)`, writes through `g.set` (so
`guard()` still protects function), and returns `{cells, refused, bounds}`.

`guard(grid)` refuses writes into the grid's functional cells and their keep-clear cells (or a set you pass);
it never throws — check `g.refused`. `runParts(g, [["shell", shell.build], ["garden", garden.build]], { palette:
"palette.json" })` runs a build's parts in order so each can only add into air: writes into an earlier part's cells
(air included) are refused and reported, the ground laid before it stays writable, and blocks outside the palette
are reported per part. With `roof: "roof.json"` (a `mcd roof --spec` file) it lays the roof right after the first
part, so later parts build around it instead of the roof tool clearing attics and gables after them; no file yet means
the roof is skipped with a note. A part given `{ carve: true }` as a third element (the stair joiner) may cut through
earlier floors and ceilings (cells with air straight above or below), never walls. `mcd reskin in.nbt out.nbt --swap
spruce=dark_oak,red=blue[,bricks=mud_bricks] [--box ...]` swaps materials on a finished build, form for form, states
kept (a wood or dye word swaps every block named with it; a full block id swaps itself and its stairs, slab and wall);
`mcd variant <run> --name n [--swap ...] [--roof '{json}']` does it into `<run>/variants/n/` with a card, re-running
the build's code when the roof changes. `mcd overworld palette.json [--write]` lists (drops) nether and end blocks. The Grid keeps block-entity NBT (sign text, chest contents) and entities and
writes them back unchanged; cells you don't touch round-trip byte-for-byte.

Grow the box with `g.resize([w, h, d], [dx, dy, dz])` (a shift grows toward −); a shift moves every coordinate,
so re-derive any contract coordinates after shifting.

## Banners, signs and other block entities

Banners, signs, chests, beds, bells, mob heads, decorated pots and shulker boxes are entity-rendered in vanilla, and
`mcd render` draws them with their entity models and textures:
- **Banners:** the cloth in its base colour plus every dyed pattern from the block entity.
- **Signs:** their text, glowing text drawn brighter.
- **Other entity-rendered blocks:** a neutral box, listed under `unknownBlocks` as "entity-rendered, approximated".

Author banners and signs with the build helpers. Each returns `[block, state, nbt]` with valid block-entity NBT
that round-trips through save and load:

```js
g.set(x, y, z, ...B.banner("cyan", [["stripe_center", "white"], ["border", "black"]], { facing: "north" }));   // wall banner
g.set(x, y, z, ...B.banner("red", [["cross", "yellow"]], { wall: false, rotation: 8 }));                       // standing, faces north
g.set(x, y, z, ...B.sign("spruce", ["PERMIT", "OFFICE"], { facing: "north", color: "black", glow: false }));
```
- **Banner patterns:** `stripe_center`, `stripe_top`, `stripe_bottom`, `stripe_left`, `stripe_right`,
  `stripe_middle`, `border`, `curly_border`, `cross`, `straight_cross`, `rhombus`, `circle`, `flower`, `globe`,
  `gradient`, `gradient_up`, `half_horizontal`, `half_vertical`, `triangle_top`, `triangle_bottom`, `bricks`,
  `small_stripes`, `diagonal_left`, `diagonal_right` (the full list is under `textures/entity/banner/`).
- **Colours:** the 16 dye names.
- **NBT format:** banners use the 1.20.5+ `patterns` list (`legacy: true` writes the older `Patterns` /
  `Pattern` / `Color` form). Sign text is written as JSON components below data version 4325 (1.21.5) and as plain
  string components from 1.21.5 on (`dataVersion` option; the grid's default is 1.21.4).
- **Standing `rotation`:** 0 faces south, 4 west, 8 north, 12 east. Wall banners and signs hang on the block behind
  them and face `facing`.

## How things sit: `mcd fit`

`$MCD fit build.nbt --rooms rooms.json` (and the FIT lines of `$MCD room`) lists what a player sees wrong from inside,
each with its cell: anything **on a bottom slab** (half a block of air under it), floor decor **floating** over air,
a **broken bed** (one half, or halves that don't match), a **floating shutter** (an open trapdoor with air behind
it), **bookshelf overuse** (more than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with
one way in, or a long stretch no walk between its openings passes). The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves), `shutter(g, [x, y, z], face, wood,
{ height })` (flat on the wall), `bannerWord(g, word, { center, face })` (letters in reading order).

## Review card

One image of a build for a glance or a reviewer (prints one JSON object; non-zero exit and a stderr message on error):

- `mcd card <f.nbt> --out card.png [--tiles dir] [--front n] [--reuse]` — render (close-ups, `MCD_TILE_SCALE=2`) and compose the card (street | front-left, front-right | back, plus the roof close-up row; tiles fit 700x700, white). `--reuse` skips the render when `dir/street.png` exists. `{"card","tiles","views":[...]}`
- `mcd card <f.nbt> --out eye.png --tiles dir --layout eye` — the eye-level card: only what a player sees from the ground (street | down-the-street left, right | back), sky trimmed, so a roof weighs what it weighs in the game.

## Inspection

Cheap, deterministic checks to run after every pass, before judging a render by eye. Each has `--json`.

- **Glance and close-ups** — `$MCD render house.nbt --closeups --tiles tiles/` adds a row of tiles to the sheet: a
  *glance* tile (the street view at 320 px: what reads at a glance) and close-ups at ≥ 12 px per block of the
  entrance (door cells), the eave band, each facade's busiest region, and every small feature visible from outside
  (signs, banners, lanterns, pots, finials). Each tile is labelled with what it frames and its px/block; the JSON lists
  the box and side of each. For any other spot:
  `$MCD zoom house.nbt --at 12,3,0 [--radius 3] [--from n|s|e|w] [--out zoom.png]` (default side: the one with a clear
  line of sight, front first; cells far in front of the spot are left out so they cannot hide it).
- **Change report** — `$MCD diff before.nbt after.nbt --png diff.png [--json] [--fail-empty]`: changed cells by kind
  (added / removed / replaced / state) and block, their groups and boxes, the faces they show on, how many are enclosed
  (never show) or interior-only; with `--png`, changed pixels per standard view and a BEFORE | AFTER pair cropped to
  the change for the two views that changed most. `--fail-empty` exits 1 when nothing changed, when no view shows a
  pixel of the change, or when every changed cell is enclosed — a pass that wrote nothing is a failure, not a no-op.
- **Palette** — `$MCD palette house.nbt`: visible blocks classed into roles by where they sit (walls field, trim and
  edges, roof, base, openings, accents, plants), each with its main materials and measured tone (texture average
  from the client jar). Flags, each with a concrete suggestion: roof in the walls' tone; trim invisible on its wall
  (`trim: stone_bricks on stone_bricks walls -> tuff_bricks or smooth_stone`); an outlier block used a handful of
  times that clashes with everything around it; more than 3 accent colour families; dark detail on a dark ground
  (or light on light).
- **Structure** — `$MCD check house.nbt` now always reports STRUCTURE: floating groups (not connected to the
  lowest layer through face or edge contact), unsupported hanging/mounted blocks (a hanging lantern with nothing
  above, a standing banner or lantern on air, a wall sign with nothing behind), orphans (one block sticking out
  sideways or dangling, touching the build on one face), and enclosed cells (a change there never shows; with two
  files, how many changed cells are enclosed). Report only; the exit code is unchanged.
