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
