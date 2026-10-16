# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Mill village housing kit 2: one sample row of 8 modules

## SITE

- Row 96 wide (x 0..95), 19 deep (z 0..18). Front faces NORTH (-z), the lane side; x runs along the lane. Same grid as kit 1.
- Ground: solid fill y -2..-1 (stone y -2, dirt y -1), surface **y 0** (grass_block patched with coarse_dirt; podzol + rooted_dirt under trees and by the smokehouse). Standing level outdoors y 1.
- Lane z 0..4, y 0, x 0..95: gravel centre z 1..3 with dirt_path ruts at z 1 and z 3, coarse_dirt edges z 0 and z 4.
- Lantern posts at the lane's south edge z 4, x = 0, 12, 24, 36, 48, 60, 72, 84 (+ x 95): spruce_fence y 1..3, standing lantern y 4 (exactly kit 1).
- Module cut: module i = x 12i..12i+11, z 0..18, y -2..top (each carries its lane strip and lantern post). Nothing of plot i crosses x 12i or 12i+11 below y 7; roof eaves and chimney caps above y 7 stay inside the plot too.
- Side columns x 12i and 12i+11, z 5..18: low fence y 1 (per plot below), front line z 5 picket fence with a 2-wide gate at x 12i+5..6, back line z 18 fence. Orchard (6) side columns open dirt_path between hedge stubs.
- Houses (common section): brick or stone piers y 1, plank deck y 2, ground storey stand y 3 (walls y 3..6), upper floor block y 7 (stand y 8, walls y 8..11), front step z 6 (one stair at y 1, facing south = up toward the deck, top level with deck y 2), porch z 7..8, body from z 9.

| plot | mass | x0..x1 | y0..y1 | z0..z1 |
|---|---|---|---|---|
| 0 dogtrot | west pen (log, 1 storey) | 1..4 | 1..6 (+roof) | 9..15 |
| 0 | breezeway (open, decked, under the roof) | 5..6 | 2 (deck) .. 6 | 9..15 |
| 0 | east pen | 7..10 | 1..6 | 9..15 |
| 0 | front porch (full width, shed roof) | 1..10 | 1..6 | 7..8 |
| 0 | front step (2 wide) / back step out of breezeway | 5..6 | 1 | 6 / 16 |
| 0 | rear chimney (fieldstone, own footing, on the west pen's back wall) | 2..3 | 1..fire y 13 | 16..17 |
| 0 | woodblock + chopping stump in the back yard | 8..9 | 1 | 17 |
| 1 camelback | front block (1 storey, front gable) | 15..20 | 1..6 (+roof) | 9..12 |
| 1 | camel hump (2 storeys over the rear rooms) | 15..20 | 1..11 (+roof) | 13..17 |
| 1 | front porch (shed) | 15..20 | 1..6 | 7..8 |
| 1 | front step | 17..18 | 1 | 6 |
| 1 | chimney (exterior, west side of the hump) | 13..14 | 1..fire y 17 | 14..15 |
| 2 I-house | main body (2 storeys, 1 room deep, 3 bays) | 25..34 | 1..11 (+roof) | 9..16 |
| 2 | two-storey front porch (full width: deck y 2, gallery deck y 7) | 25..34 | 1..11 | 7..8 |
| 2 | front steps (2 wide) | 29..30 | 1 | 6 |
| 2 | west end chimney (1-wide shaft built in the gable wall) | 25 | 1..fire y 19 | 12 |
| 2 | east end chimney | 34 | 1..fire y 19 | 12 |
| 2 | back yard: bench + wash bench with barrels | 26..33 | 1 | 17 |
| 3 pyramid cottage | square-ish body (10 x 9) | 37..46 | 1..6 (+roof) | 9..17 |
| 3 | central hearth mass (brick, 4 rooms' stoves back onto it) | 41..42 | 1..6 | 11..14 |
| 3 | central chimney stack (2x2) above it | 41..42 | 7..fire y 15 | 12..13 |
| 3 | front porch across the front (shed) | 37..46 | 1..6 | 7..8 |
| 3 | front step | 41..42 | 1 | 6 |
| 4 boarding house | body (2 storeys, side gable) | 49..58 | 1..11 (+roof) | 9..16 |
| 4 | long front porch (1 storey, shed) | 49..58 | 1..6 | 7..8 |
| 4 | front steps | 53..54 | 1 | 6 |
| 4 | kitchen chimney (in the west end wall, breast into the kitchen) | 49..50 | 1..fire y 19 | 12..13 |
| 4 | back yard: wash bench, rain barrel (water_cauldron), outhouse-free | 50..57 | 1 | 17 |
| 5 work yard | smokehouse (log crib on fieldstone plinth, front gable) | 61..65 | 1..4 (+roof y 5..8) | 12..16 |
| 5 | smokehouse vent / smoke stack (1-wide shaft, back wall centre) | 63 | 1..fire y 10 | 17 |
| 5 | woodpile lean-to (4 posts, shed roof) | 67..70 | 1..4 | 14..17 |
| 5 | wash kettle (campfire pit y 0, water_cauldron y 1, cobble kerb) | 68 | 0..1 | 9 |
| 5 | rinse tubs (barrels facing up) + washboard (trapdoor on a barrel) | 69..70 | 1 | 9 |
| 5 | bench (spruce_stairs facing south, trapdoor arms) | 61..62 | 1 | 9 |
| 5 | chopping block + axe stump (stripped_oak_log y 1) | 66 | 1 | 11 |
| 6 orchard | pecan tree NW (trunk / crown) | trunk 74, crown 72..77 | 1..6 / 5..10 | trunk 8, crown 6..10 |
| 6 | pecan tree NE | trunk 81, crown 79..83 | 1..6 / 5..10 | trunk 9, crown 7..11 |
| 6 | pecan tree SW (swing branch) | trunk 74, crown 72..77 | 1..7 / 6..11 | trunk 15, crown 13..17 |
| 6 | swing: branch log axis x | 75..76 | 6 | 15 |
| 6 | picnic table (with stair benches each side) | 77..78 | 1 | 11..13 |
| 6 | bee yard: 4 beehives, wildflowers round | 79..82 | 1 | 15..17 |
| 6 | bee_nest under the NE crown's branch | 82 | 5 | 9 |
| 6 | path gate -> table -> hives (dirt_path) | 77..78 | 0 | 6..15 |
| 7 bungalow | body (1 storey, front gable, low) | 85..94 | 1..6 (+roof) | 10..17 |
| 7 | deep engaged porch (under the main roof) | 85..94 | 1..6 | 7..9 |
| 7 | front steps (brick cheeks) | 88..91 | 1 | 6 |
| 7 | brick chimney (west wall, straddles living/kitchen partition) | 85..86 | 1..fire y 12 | 13..14 |
| 7 | front walk: brick path gate -> steps; two shrubs | 89..90 | 0 | 5 |

(Camelback has no back door: z 18 is the fence line.)

## ROOFS

| building | form | preset / style | ridge | height | overhang | notes |
|---|---|---|---|---|---|---|
| 0 dogtrot | side gable, ONE roof over both pens and the breezeway | `cottage`, `ridgeAxis: x`, material `exposed_cut_copper` (weathered brown tin), verge `stripped_oak_log`/oak, ridge slab | along x at z 12, x 1..10 | y 7..11, ridge y 12 (45°) | N/S 1 (eaves z 8 over porch, z 16); E/W 0 (verge flush at x 1, x 10) | keep chimney 2..3 x 16..17; trusses `stripped_oak_log` (king post, visible from the breezeway) |
| 0 porch | shed against the front eave | by hand: exposed_cut_copper_stairs facing south at z 7 y 6, slab row z 8 y 7 under the main eave | — | y 6..7 | 0 sides | same verge |
| 1 camelback front | front gable to the lane | `cottage`, `ridgeAxis: z`, `front: n`, material `stone` (galvanized tin) + `stone_slab` ridge, verge `stripped_pale_oak_log` | along z at x 17..18, z 8..12 | y 7..9, ridge slab y 10 | 1 (eaves x 14, x 21, gable z 8) | dies into the hump's north wall at z 13 (the hump wall carries on up through it) |
| 1 camel hump | front gable over the 2-storey rear | same, own rect | along z at x 17..18, z 13..18 | y 12..14, ridge slab y 15 | 1 (x 14, x 21, back gable z 18) | keep chimney 13..14 x 14..15; north gable triangle of the hump (z 13, y 12..14) is wall, give as `keep` |
| 1 porch | shed | by hand, stone stairs y 6 z 7, slab y 7 z 8 | — | — | — | |
| 2 I-house | side gable | `cottage`, `ridgeAxis: x`, palette `dark-slate` (deepslate tiles), verge `smooth_quartz`/quartz_stairs | along x between z 12 and 13, x 25..34 | y 12..16, ridge y 17 | N/S 1 (z 8, z 17); E/W 0 (gable ends flush at x 25, x 34) | keep chimney cells x 25 z 12, x 34 z 12; gable triangles are white wall |
| 2 porch | two-storey: shed roof over the gallery | by hand: deepslate_tile_stairs facing south y 11 at z 7, slab y 11 top at z 8 meeting the main eave (y 12, z 8) | — | y 11 | 0 sides | quartz fascia under the edge |
| 3 pyramid | true pyramid (hip to a point/short ridge) | style `hip`, pitch 1, material `polished_granite` stairs/slabs (red-painted tin), ridge slab | short ridge x 41..42 at z 12..13 | y 7..11, cap y 12 | 1 all round (x 36, x 47, z 8, z 18) | keep stack 41..42 x 12..13 (stack rises through the apex, roof whole round it) |
| 3 porch | hipped porch roof / shed | by hand, polished_granite_stairs y 6 at z 7 + hip corners at x 37, x 46; slab y 7 at z 8 | — | y 6..7 | 0 | |
| 4 boarding | side gable | `cottage`, `ridgeAxis: x`, material `tuff_bricks` (tuff_brick_stairs/slab, grey-olive tin) with polished_tuff eave, verge `stripped_oak_log` | along x between z 12 and 13, x 49..58 | y 12..16, ridge y 17 | N/S 1; E/W 0 | keep chimney 49..50 x 12..13 |
| 4 porch | long shed | by hand: tuff_brick_stairs facing south y 6 at z 7, slab y 7 at z 8 (below the upper windows y 9..10) | — | y 6..7 | 0 | |
| 5 smokehouse | small steep front gable | `gable`, `ridgeAxis: z`, material `blackstone` stairs/slabs (sooty), verge `spruce` | along z at x 63, z 11..17 | y 5..7, ridge y 8 | west 0 (eave flush at x 61), east 1 (x 66), N/S 1 (z 11, z 17) | keep vent shaft x 63 z 17 |
| 5 lean-to | shed, high side at the back fence | by hand: spruce_slab (bottom) y 4 over x 67..70 z 14..17 | — | y 4 | 0 | on spruce_fence posts |
| 6 orchard | none | — | — | — | — | crowns only |
| 7 bungalow | low front gable to the lane, one roof over porch and body | `gable`, `ridgeAxis: z`, `front: n`, pitch 0.5, material `oxidized_cut_copper` (green asphalt-shingle read) + mix of weathered_cut_copper, verge `smooth_quartz` with exposed rafter tails (spruce_fence stubs under the eave every 2) | along z at x 89..90, z 6..18 | y 7..9, ridge slab y 10 | 1 front (gable at z 6 over the steps), 1 back (z 18), sides 0 (x 85 / x 94 eave flush) | keep chimney 85..86 x 13..14; deep gable front with a vent (spruce_trapdoor louvre) in the triangle |

## FACADES

Common: piers y 1 (one material per house) at corners and every 3 along each wall and under porch corners; skirting between piers (fence/lattice) y 1; deck y 2; walls from y 3. Porch posts on the porch's front line z 7, rails y 3 with a gap at the step. Corner boards flush. Windows sit in the wall plane with a top-slab sill outside (z 8 under front windows only where not on a porch deck) and the head plate as lintel.

**Plot 0 dogtrot (x 1..10):** fieldstone piers `cobblestone` (1 in 10 mossy). Pens are log cribs: `oak_log` with axis along each wall's run (x on N/S walls, z on E/W walls), corners alternating axis per course (notched look), chinking reads in the bark seams. Breezeway x 5..6 open full height y 3..6 front (z 9) and back (z 15), a `stripped_oak_log` beam (axis x) at y 6 across each end. Front (z 9): one window per pen 1x2 at x 2 and x 9, y 4..5, `spruce_trapdoor` shutters at x 3 / x 8 (one per window, the side toward the breezeway; outer side is the corner). Pens open into the breezeway: doors at x 4 z 12 (west pen) and x 7 z 12 (east pen). Porch: deck spruce_planks y 2, posts stripped_oak_log y 3..5 at x 1, 5, 6, 10 (z 7) — the two centre posts frame the breezeway; rail oak_fence y 3 except x 5..6. Back (z 15): window x 9 y 4..5 (east pen); west pen back wall carries the chimney. Gables x 1, x 10: oak_log continues up in the triangle; vent 1x1 glass_pane at z 12, y 9. Breezeway: a bench (spruce_stairs) along x 5 at z 11, a water bucket stand (cauldron) x 6 z 14, saddle/tools on the wall.

**Plot 1 camelback (x 15..20):** piers `bricks`; skirting `acacia_fence` (y 1). Walls `acacia_planks` (ochre-yellow painted clapboard), corner boards + head plates `stripped_pale_oak_log` (white trim): corners y 3..11 on the hump, y 3..6 on the front block; a white plate (axis x/z) at y 6 all round and at y 11 on the hump. Front (z 9): double door x 17..18 y 3..4 (acacia_door pair) (shotgun double door), windows 1x2 at x 16 and x 19 y 4..5, `mangrove_trapdoor` shutters (oxblood) at x 15 and x 20 outside. Gable triangle z 9: acacia_planks with a glass_pane vent x 17..18 y 8. Long sides x 15 / x 20: windows y 4..5 at z 11 and z 15; hump upper storey windows y 9..10 at z 14 and z 16 on both sides (west side upper at z 16 only, the chimney is at z 14..15). Hump north wall (z 13, above the front roof y 9..11 and its gable triangle) acacia, 2-wide window x 17..18 y 10 looking over the front roof. Back (z 17): window x 17..18 y 4..5 (2 wide), upper window x 17..18 y 9..10. Porch posts stripped_pale_oak_log at x 15, 20 (z 7), rail acacia_fence gap x 17..18, deck spruce_planks y 2.

**Plot 2 I-house (x 25..34):** piers `bricks` with a continuous brick foundation course y 1..2 on the front (masonry plinth, status), skirting none. Walls `white_terracotta` (white-painted clapboard) y 3..11; corner boards `smooth_quartz` pilasters x 25 and x 34 (z 9 and z 16) y 3..11; string course `quartz_slab` (top) at y 7 front, between storeys, flush; cornice `quartz_stairs` upside-down facing north at z 8, y 11 under the eave, proud 1. Symmetric 3-bay front (z 9): ground: windows 1x2 at x 27 and x 32 (y 4..5), centre double door x 29..30 y 3..4 (`pale_oak_door`) with a glass_pane transom y 5; upper: windows x 27, x 32 y 9..10, double door x 29..30 y 8..9 out to the gallery. Shutters `warped_trapdoor` (dark green) both sides of every front window: x 26 and x 28 / x 31 and x 33, at z 8, y 4..5 and y 9..10. Two-storey porch: posts `stripped_pale_oak_log` y 3..10 at x 25, 28, 31, 34 (z 7); lower deck spruce_planks y 2, gallery deck spruce_planks y 7 over z 7..8 (its underside is the lower porch ceiling); balustrade `pale_oak_fence` y 3 (gap x 29..30) and y 8 (full). End gables x 25 / x 34: windows y 4..5 and y 9..10 at z 10 and z 14 (either side of the chimney at z 12), the brick chimney strip runs up the white gable at z 12 from y 1 to the cap. Back (z 16): door x 29 y 3..4, windows x 27, x 32 (y 4..5), x 27, x 32 (y 9..10); back stoop top slab at z 17, x 29.

**Plot 3 pyramid cottage (x 37..46):** piers `bricks`, skirting `dark_oak_fence`. Walls `pale_oak_planks` (grey-white weatherboard) y 3..6, corner boards `stripped_dark_oak_log`, head plate stripped_dark_oak_log y 6 all round. Front (z 9): double door x 41..42 y 3..4 (`mangrove_door`), windows 1x2 at x 39 and x 44 y 4..5 with `mangrove_trapdoor` shutters x 38/x 40 and x 43/x 45 at z 8 (on the porch). Sides x 37 / x 46: windows y 4..5 at z 11 and z 15 (one per room). Back (z 17): back door x 41 y 3..4 (back hall), windows x 39 and x 44. Porch posts stripped_dark_oak_log y 3..5 at x 37, 40, 43, 46 (z 7), rail dark_oak_fence gap x 41..42, deck spruce_planks y 2. Chimney stack bricks with deepslate_bricks band, rising out of the apex.

**Plot 4 boarding house (x 49..58):** piers `cobblestone`, skirting `spruce_fence`. Board-and-batten: field `mangrove_planks` (company oxblood), battens `stripped_oak_log` (axis y) every 3rd cell on the front/back (x 49, 52, 55, 58) and at z 9, 16 on the ends (z 12..13 is the chimney on the west end), y 3..11; a belt `stripped_oak_log` axis x at y 7 (floor line) all round, head plate at y 11. Front (z 9) is long and regular: ground windows 1x2 y 4..5 at x 50, 51, 56, 57 + double door x 53..54 (`spruce_door`); upper windows y 9..10 at x 50, 51, 53, 54, 56, 57 (six). No shutters (company house). Hanging signboard "BOARDING" under the porch roof at x 53..54, z 7, y 5. Porch posts stripped_oak_log y 3..5 at x 49, 52, 55, 58 (z 7), rail spruce_fence gap x 53..54, deck spruce_planks, two rocking chairs (stairs) and a wash stand. Ends: windows y 4..5 and y 9..10 at z 15 (west, behind chimney) and z 11, z 14 (east). Back (z 16): back door x 56 y 3..4, windows x 51, x 53 y 4..5; upper x 51, 56.

**Plot 5 work yard (x 60..71):** side and back fences `oak_fence`, front picket oak_fence with a 2-wide gate x 65..66. Smokehouse x 61..65 z 12..16: plinth `cobblestone` y 1 all round, walls `stripped_spruce_log` (horizontal crib, axis per wall run) y 2..4, door `spruce_door` x 63 z 12, y 1..2 in a gap of the plinth (floor = packed_mud y 0 inside). Gable z 12 above y 4: spruce_planks with an open trapdoor vent x 63 y 6. Inside: lit `smoker` x 63 z 15 y 1 against the back wall, the vent shaft above it in the back wall (chimney size 1 at x 63 z 17, outside the back wall, cobblestone, fire y 10; a 1x1 hole in the back wall at x 63 y 2 joins the smoker to it), hams = barrels (facing down) hung by iron_chain from the tie beams y 4 at x 62, 64 z 13..15, trapdoors on the walls as racks. Lean-to: spruce_fence posts y 1..3 at x 67, 70 z 14 and z 17, slab roof y 4; woodpile `stripped_oak_log` axis x y 1..2 under it at x 67..70 z 16..17, `oak_log` rounds axis y at z 15 x 68..69 (y 1). Kettle: a campfire lit at y 0 (sunk, ring of cobblestone at y 0 round it), water_cauldron level 3 on it at y 1, x 68 z 9. Ground: packed coarse_dirt + gravel apron.

**Plot 6 orchard (x 72..83):** side columns: dirt_path open, with `azalea` bushes at z 5 and z 18 ends only. Front line z 5: `jungle_fence` picket (y 1) with gate x 77..78. Trees: trunks `jungle_log` (axis y), 2 short limbs axis x/z at y 5; crowns `jungle_leaves` + 30% `oak_leaves` (persistent), broad and flat-bottomed (pecan spreads), 5 across. Picnic table: `spruce_slab` type top at y 1 over x 77..78 z 11..13; benches spruce_stairs at x 76 (facing west back) and x 79 (facing east), z 11..13. Swing: iron_chain y 3..5 at x 76 z 15 from the branch (y 6) down to a seat `spruce_slab` (top) at y 2. Bee yard: `beehive` facing north at x 79..82 z 17 y 1 on the ground, flowers (cornflower, oxeye_daisy, dandelion, azure_bluet) on grass round them at z 15..16; a `bee_nest` under the NE limb.

**Plot 7 bungalow (x 85..94):** continuous brick foundation y 1 (`bricks`) under body and porch, floors spruce_planks y 2. Walls `bricks` y 3..6 with top-slab `smooth_quartz_slab` window sills; head plate/frieze `stripped_pale_oak_log` axis x at y 6 (white band). Front gable triangle over the porch (z 7, above the beam y 6) and the body's front wall z 10 above y 6: `pale_oak_planks` shingles with a 2-wide louvred vent `spruce_trapdoor` (open) at x 89..90 y 8. Porch z 7..9: deck `spruce_planks` y 2; tapered posts at x 85, 88, 91, 94 (z 7): `bricks` pedestal y 3, `brick_wall` y 4, `stripped_pale_oak_log` y 5; porch beam `stripped_pale_oak_log` axis x at y 6 across x 85..94 z 7, level with the wall plate. Rail none between pedestals except `brick_wall` low cheeks at the steps. Front (z 10): door x 89 y 3..4 (`oak_door`), sidelight glass_pane x 90 y 3..4; paired windows 2x2 at x 86..87 and x 92..93 y 4..5. Sides x 85 / x 94: windows 2x2 at z 15..16 (kitchen west, bedroom east) y 4..5, and x 94 z 12 1x2. Back (z 17): back door x 88 y 3..4 from the kitchen, window x 92..93. Exposed rafter tails under both side eaves every 2 cells (spruce_fence y 6 hung under the stair edge). Chimney `bricks` with a `deepslate_bricks` band, rising through the west slope, slab cap.

## MATERIALS

| role | block |
|---|---|
| ground | grass_block 60%, coarse_dirt 25%, podzol + rooted_dirt under trees / by the smokehouse, packed_mud yard floor |
| lane | gravel centre, dirt_path ruts, coarse_dirt edges |
| piers | bricks (1, 2, 3), cobblestone 10% mossy_cobblestone (0, 4, 5 plinth) |
| decks / floors | spruce_planks (all porches and floors in this kit; kit 1 is oak) |
| 0 dogtrot walls / trim / shutters / rail | oak_log / stripped_oak_log / spruce_trapdoor / oak_fence |
| 1 camelback walls / trim / shutters / rail / door | acacia_planks / stripped_pale_oak_log / mangrove_trapdoor / acacia_fence / acacia_door |
| 2 I-house walls / trim / cornice / shutters / posts / rail / door | white_terracotta / smooth_quartz + quartz_slab / quartz_stairs / warped_trapdoor / stripped_pale_oak_log / pale_oak_fence / pale_oak_door |
| 3 pyramid walls / trim / shutters / rail / door | pale_oak_planks / stripped_dark_oak_log / mangrove_trapdoor / dark_oak_fence / mangrove_door |
| 4 boarding walls / battens / rail / door | mangrove_planks / stripped_oak_log / spruce_fence / spruce_door |
| 5 smokehouse walls / plinth / roof | stripped_spruce_log / cobblestone / blackstone_stairs + blackstone_slab, spruce verge |
| 6 trees | jungle_log trunks, jungle_leaves + oak_leaves (persistent) |
| 7 bungalow walls / trim / gable shingle / posts / door | bricks / stripped_pale_oak_log + smooth_quartz_slab sills / pale_oak_planks / bricks + brick_wall + stripped_pale_oak_log / oak_door |
| roofs | 0 exposed_cut_copper (brown tin); 1 stone + stone_slab (galvanized); 2 dark-slate palette (deepslate_tile_stairs/slab); 3 polished_granite_stairs/slab (red tin); 4 tuff_brick_stairs/slab (olive-grey); 5 blackstone; 7 oxidized_cut_copper + weathered mix (green) |
| chimneys | bricks + deepslate_bricks band (1, 2, 3, 4, 7); cobblestone + stone_bricks band (0, smokehouse); cap brick_slab / brick_stairs (stone_brick_slab on 0); hay_block + lit campfire (signal_fire) inside the flue via chimney() |
| glass | glass_pane |
| fences | front pickets: pale_oak_fence (2), dark_oak_fence (3), oak_fence (0, 5), acacia_fence (1), spruce_fence (4), jungle_fence (6), brick_wall cheeks (7); side columns spruce_fence y 1 (as kit 1) except plot 6 open path |
| work yard | water_cauldron, campfire (lit, sunk), smoker (lit), barrel, stripped_oak_log, oak_log, iron_chain, spruce_trapdoor |
| orchard | beehive, bee_nest, cornflower, oxeye_daisy, dandelion, azure_bluet, azalea, spruce_slab, spruce_stairs, iron_chain |
| light | lantern (hanging under porch roofs and from ceilings, standing on fence posts), iron_chain |

All ids checked with `mcd blocks --check`: all known (26.3). None repeats a kit-1 wall wood or roof material.

## OPENINGS

(x, y, z; doors 1 wide x 2 high unless stated; windows glass_pane)

| plot | opening | coords |
|---|---|---|
| 0 | breezeway open ends (no door) | x 5..6, y 3..6, z 9 and z 15 |
| 0 | west pen door (to breezeway) | x 4, y 3..4, z 12 |
| 0 | east pen door | x 7, y 3..4, z 12 |
| 0 | front windows | x 2 and x 9, y 4..5, z 9 |
| 0 | back window | x 9, y 4..5, z 15 |
| 0 | gable vents | x 1 and x 10, y 9, z 12 |
| 1 | front double door | x 17..18, y 3..4, z 9 |
| 1 | front windows | x 16, x 19, y 4..5, z 9 |
| 1 | side windows ground | x 15 and x 20 at z 11 and z 16, y 4..5 (west z 16 is clear of the chimney at z 14..15) |
| 1 | hump upper side windows | x 20 at z 14 and z 16, x 15 at z 16, y 9..10 |
| 1 | hump north window (over the front roof) | x 17..18, y 10, z 13 |
| 1 | back windows | x 17..18, y 4..5 and y 9..10, z 17 |
| 2 | front double door / transom | x 29..30, y 3..4 / y 5, z 9 |
| 2 | gallery double door | x 29..30, y 8..9, z 9 |
| 2 | front windows | x 27, x 32, y 4..5 and y 9..10, z 9 |
| 2 | end windows | x 25 and x 34 at z 10 and z 14, y 4..5 and y 9..10 |
| 2 | back door / windows | door x 29 y 3..4 z 16; windows x 27, x 32 at y 4..5 and y 9..10, z 16 |
| 3 | front double door | x 41..42, y 3..4, z 9 |
| 3 | front windows | x 39, x 44, y 4..5, z 9 |
| 3 | side windows | x 37 and x 46 at z 11 and z 15, y 4..5 |
| 3 | back door / windows | door x 41 y 3..4 z 17; windows x 39, x 44 y 4..5 z 17 |
| 4 | front double door | x 53..54, y 3..4, z 9 |
| 4 | front windows | ground x 50, 51, 56, 57 y 4..5; upper x 50, 51, 53, 54, 56, 57 y 9..10; z 9 |
| 4 | end windows | west x 49 z 15 y 4..5 and y 9..10; east x 58 z 11 and z 14, y 4..5 and y 9..10 |
| 4 | back door / windows | door x 56 y 3..4 z 16; windows x 51, x 53 y 4..5; x 51, x 56 y 9..10; z 16 |
| 5 | smokehouse door | x 63, y 1..2, z 12 |
| 5 | smokehouse vent (open trapdoor) | x 63, y 6, z 12 |
| 6 | (none) | — |
| 7 | front door / sidelight | door x 89, sidelight x 90, y 3..4, z 10 |
| 7 | front paired windows | x 86..87 and x 92..93, y 4..5, z 10 |
| 7 | side windows | x 85 z 15..16 y 4..5; x 94 z 15..16 and z 12, y 4..5 |
| 7 | back door / window | door x 88 y 3..4 z 17; window x 92..93 y 4..5 z 17 |
| 7 | gable louvres | x 89..90, y 8, z 7 (porch gable) |
| all | gates in the front fence | x 12i+5..6, y 1, z 5 |

## RESERVED

The shell leaves these as air / unbuilt; the named part builds them.

| what | coords | part |
|---|---|---|
| chimney footings + stacks (whole column from y 1 to the cap, incl. cap step-out one ring wider at the top 3 courses) | 0: x 2..3 z 16..17; 1: x 13..14 z 14..15; 2: x 25 z 12 and x 34 z 12 (crown x 24..26 / 33..35, z 11..13 above y 16); 3: hearth x 41..42 z 11..14 y 1..6 + stack x 41..42 z 12..13; 4: x 49..50 z 12..13; 5: x 63 z 17; 7: x 85..86 z 13..14 | chimney |
| stair flights (steps + headroom; upper floor holes) | 1: x 19, z 11..15, y 3..7 facing south, hole in floor y 7 at x 19 z 13..14; 2: x 30, z 10..14, y 3..7 facing south, hole y 7 x 30 z 10..13, rail x 29 z 10..13 y 8, step out west onto x 29 z 14; 4: z 15, x 57..53, y 3..7 facing west, hole y 7 x 54..56 z 15, step out at x 52 z 15 | stairs |
| front steps (top level with deck y 2) | 0: x 5..6 z 6; 1: x 17..18 z 6; 2: x 29..30 z 6; 3: x 41..42 z 6; 4: x 53..54 z 6; 7: x 88..91 z 6 | porch |
| porch posts (y 3..5 or to y 10) | listed in FACADES (on z 7) | porch |
| kettle pit | x 68 z 9 y 0 (campfire replaces the ground block) + cobblestone ring x 67..69 z 8..10 y 0 | yard |
| tree trunks / swing | x 74 z 8, x 81 z 9, x 74 z 15 (y 1..7); swing x 76 z 15 y 2..5 | orchard |
| beds (head against a solid wall, 2 clear above) | 0: W pen x 3 foot z 13 head z 14 facing south (head against the back wall z 15); E pen x 9 foot z 11 head z 10 facing north; 1: upstairs x 16 and x 17, foot z 15 head z 16 facing south; front room x 16 foot z 11 head z 10 facing north; 2: upstairs west x 26 and x 27, east x 32 and x 33, foot z 14 head z 15 facing south; 3: one bed each NE/SE/SW room against the outer walls; 4: west bunk room x 50..53 head z 10 foot z 11 facing north (4), east room x 55..57 (3); 7: bedroom x 92..93 foot z 15 head z 16 facing south | furnisher |

## FLOORS

| mass | floor (block / stand) | interior volume (air) | rooms |
|---|---|---|---|
| 0 west pen | y 2 / y 3 | x 2..3, y 3..6, z 10..14 (open to the roof, tie beam y 7) | kitchen-hall: stove (furnace) against the chimney back wall z 15 at x 2..3, table, bed |
| 0 east pen | y 2 / y 3 | x 8..9, y 3..6, z 10..14 | bedroom |
| 0 breezeway | y 2 / y 3 | x 5..6, y 3..6, z 9..15 (open both ends) | open hall, bench, water |
| 0 porch | y 2 / y 3 | x 1..10, z 7..8, y 3..5 | porch |
| 1 front room | y 2 / y 3 | x 16..19, y 3..6, z 10..12 (open to front roof) | parlour/bedroom |
| 1 kitchen (under hump) | y 2 / y 3 | x 16..19, y 3..6, z 14..16 (partition z 13 x 16..18, door x 17; x 19 open for the stair) | kitchen: stove by the west wall x 16 z 14..15 (chimney outside), table |
| 1 camel bedroom | y 7 / y 8 | x 16..19, y 8..11, z 14..16 (+ z 13 row is the hump's north wall) | bedroom; rail x 18 z 13..14 y 8 |
| 2 ground: west room / hall / east room | y 2 / y 3 | west x 26..27, hall x 29..30, east x 32..33; z 10..15; y 3..6; partitions x 28 and x 31 (doors at z 11) | parlour (west, stove x 26 z 12 against the chimney), stair hall, dining/kitchen (east, stove x 33 z 12) |
| 2 upper | y 7 / y 8 | same plan, y 8..11 | two bedrooms + upper hall (gallery doors) |
| 3 rooms (4) | y 2 / y 3 | NW x 38..40 z 10..12; NE x 43..45 z 10..12; SW x 38..40 z 14..16; SE x 43..45 z 14..16; partitions z 13 (x 38..40, x 43..45) and the hearth mass x 41..42 z 11..14; vestibule x 41..42 z 10; back hall x 41..42 z 15..16; y 3..6 | front: parlour (NW), kitchen (NE); back: two bedrooms; each room's stove/furnace against the hearth mass (x 40 or x 43, z 11..12 / z 14) |
| 4 ground | y 2 / y 3 | x 50..57, y 3..6, z 10..15 (one room; the flight along z 15) | shared kitchen + long table (x 52..56 z 11..12), smoker against the chimney breast x 51 z 12..13 |
| 4 upper | y 7 / y 8 | x 50..57, y 8..11, z 10..15: partition z 13 (doors x 51, x 56), partition x 54 z 10..12; hall z 14..15 | west bunk room x 50..53 z 10..12 (4 beds), east bunk room x 55..57 z 10..12 (3 beds), landing hall |
| 5 smokehouse | ground y 0 (packed_mud) / y 1 | x 62..64, y 1..4, z 13..15 | smoke room |
| 7 bungalow | y 2 / y 3 | x 86..93, y 3..6, z 11..16: partition z 14 (x 87..93, door x 91), partition x 90 z 15..16 | living room front (x 86..93 z 11..13, fireplace face x 87 z 13); kitchen x 86..89 z 15..16 (stove x 86 z 15 against the chimney); bedroom x 91..93 z 15..16 |
| 7 porch | y 2 / y 3 | x 85..94, z 7..9, y 3..5 | deep porch, swing bench, rockers |

Ceilings: single-storey rooms open to the roof with tie beams/trusses (`trusses` in each roof.json, stripped log of the house's trim). Light: every room lantern-lit (hanging from the y 7 plate or the upper ceiling), porches hanging lanterns, yard lantern posts at the gates; every floor cell light ≥ 8.

## PALETTE

Architect's ids kept exactly (all verified by `mcd blocks --check`). Roles and shapes:
- Piers/foundation: bricks (+ brick_stairs, brick_slab, brick_wall); cobblestone (+ mossy_cobblestone 10%, cobblestone_wall/stairs/slab); stone_bricks, deepslate_bricks band.
- Decks/floors: spruce_planks (+ spruce_stairs, spruce_slab, spruce_fence, spruce_trapdoor, spruce_door); packed_mud (smokehouse).
- Walls: oak_log, stripped_oak_log, stripped_oak_wood (0, 4 trim); acacia_planks + acacia_fence/door/slab (1); white_terracotta, smooth_quartz (+ _slab, quartz_stairs), pale_oak_door/fence, stripped_pale_oak_log (2, 1 trim, 7); pale_oak_planks (3, 7 gable), stripped_dark_oak_log, dark_oak_fence (3); mangrove_planks, mangrove_trapdoor, mangrove_door (4 field, 1/3 shutters); stripped_spruce_log, blackstone (5); bricks (7).
- Shutters: spruce_trapdoor (0), mangrove_trapdoor (1, 3), warped_trapdoor (2).
- Roofs: exposed_cut_copper (+_stairs, _slab) / stone, stone_slab / deepslate_tile_stairs,_slab / polished_granite_stairs,_slab / tuff_brick_stairs,_slab, polished_tuff / blackstone_stairs,_slab / oxidized_cut_copper + weathered_cut_copper (stairs, slab). Truss logs: stripped log of each house's trim.
- Glass: glass_pane. Doors both halves.
- Fire/functional: furnace (lit), smoker (lit), campfire (lit, sunk), hay_block, cauldron, water_cauldron, barrel, iron_chain, lantern, beehive, bee_nest.
- Plants: jungle_log, jungle_leaves, oak_leaves (persistent true), azalea, cornflower, oxeye_daisy, dandelion, azure_bluet, grass_block, coarse_dirt, podzol, rooted_dirt, dirt_path, gravel.
- Beds: red_bed (0), blue_bed (1), white_bed (2), green_bed (3), brown_bed (4), yellow_bed (7).

## VOCABULARY

Helpers (several sessions each write a share; all take the plot offset `ox = 12*i`):
- `lane_strip(g, x0, x1)` gravel/dirt_path/coarse_dirt rows as in SITE; `lamp_post(g, x)` fence y1..3 + lantern y4 at z4.
- `fence_run(g, plot, wood, gateX)` side columns y1, back z18, front picket z5 with a 2-gap gate.
- `pier_line(g, x0,z0,x1,z1, block)` piers y1 at corners and every 3rd, skirting between.
- `clapboard_wall(g, box, field, trim)` wall y3..top, corner boards axis y, plates axis x/z at floor lines; openings left as air.
- `log_crib_wall(g, box, log)` log courses with axis along run, corners alternate per course.
- `window(g, x, y, z, face, w, h)` glass_pane with connections, sill top slab outside, lintel; `shutter_pair(g, ...)` via shutter().
- `door_pair(g, x, y, z, face, wood)` both halves, hinge mirrored for doubles, facing out; step slab outside.
- `porch_run(g, x0, x1, z, posts[], rail, deck, storeys)` deck y2, posts, rail with gap, shed roof by stairs facing south + slab row; `front_steps(g, x0, x1, z)` stairs y1 facing south.
- `stair_run(g, from, facing, to, material, width)` = flight(); the last step in the floor layer; rail on open side.
- `chimney_stack(g, at, top, size, material, band)` = chimney(): own footing, 2 above roof, band, slab cap, lit hay + campfire, `lit:"true"`, `signal_fire:"true"`.
- `hearth_nook(g, x, y, z, facing)` lit furnace in stone with chimney-side wall; `smoker_nook`.
- `bed_set(g, footXYZ, facing, colour)` = bed(); `table_set(g, x,y,z,len)` fence posts + top slabs; `chair(g, ...)` stairs.
- `hanging_lantern(g, x,y,z)` lantern hanging:true under a block/chain; `hanging_sign(g, text, x,y,z)` signboard hanging.
- `ham_rack(g, xs, zs, y)` iron_chain column from the tie beam + barrel facing down; `woodpile(g, box)`; `kettle(g, x, z)`.
- `pecan_tree(g, trunk, height, crown)` jungle_log axis y, two limbs, flattened leaf crown 30% oak, persistent; `swing(g, ...)`; `picnic_table(g, ...)`; `beehive_row(g, x0,x1,z)`.
- `tapered_post(g, x, z)` bricks y3, brick_wall y4, stripped_pale_oak_log y5.
- `rafter_tails(g, x, z0, z1, y)` spruce_fence stubs every 2 under eave.

## ROOMS

Floor material spruce_planks unless noted; every room lantern-lit hanging from the plate/ceiling. Boxes below (inner air). Furnishers: one focal piece, 1-wide lanes, no furniture in doorway cells.

| room | box | notes |
|---|---|---|
| D0 west pen (kitchen-hall) | 2,3,10, 3,6,14 | furnace x2 z14, table, bed x3 foot z13; door x4 z12 |
| D0 east pen (bedroom) | 8,3,10, 9,6,14 | bed x9 foot z11 head z10; door x7 z12 |
| D0 breezeway | 5,3,9, 6,6,15 | open both ends, bench, cauldron |
| D0 porch | 1,3,7, 10,5,8 | rocker, hanging lanterns |
| C1 front room | 16,3,10, 19,6,12 | parlour/bed, door x17..18 z9; stair at x19 |
| C1 kitchen | 16,3,14, 19,6,16 | stove x16, table; door x17 z13 |
| C1 camel bedroom | 16,8,14, 19,11,16 | 2 beds; stair top x19 z15 |
| H2 west room | 26,3,10, 27,6,15 | parlour, stove x26 z12; door x28 z11 |
| H2 stair hall | 29,3,10, 30,6,15 | front door z9, back door x29 z16; stair x30 |
| H2 east room | 32,3,10, 33,6,15 | dining/kitchen, stove x33 z12; door x31 z11 |
| H2 upper west | 26,8,10, 27,11,15 | bedroom, 2 beds |
| H2 upper hall | 29,8,10, 30,11,15 | gallery doors z9; stair top x29 z14 |
| H2 upper east | 32,8,10, 33,11,15 | bedroom, 2 beds |
| P3 NW parlour | 38,3,10, 40,6,12 | stove x40 |
| P3 NE kitchen | 43,3,10, 45,6,12 | stove x43, table |
| P3 SW bedroom | 38,3,14, 40,6,16 | bed on outer wall |
| P3 SE bedroom | 43,3,14, 45,6,16 | bed on outer wall |
| P3 vestibule | 41,3,10, 42,6,10 | door z9, openings to NW/NE at x40/x43 z10? use x40..43 z10 gaps |
| P3 back hall | 41,3,15, 42,6,16 | back door x41 z17 |
| B4 kitchen-hall | 50,3,10, 57,6,15 | long table x52..56 z11..12, smoker x51; stair z15 x57..53 |
| B4 west bunks | 50,8,10, 53,11,12 | 4 beds, door x51 z13 |
| B4 east bunks | 55,8,10, 57,11,12 | 3 beds, door x56 z13 |
| B4 landing hall | 50,8,14, 57,11,15 | stair top x52 z15 |
| S5 smoke room | 62,1,13, 64,4,15 | smoker x63 z15, hams |
| W7 living room | 86,3,11, 93,6,13 | fireplace x87 z13, door x89 z10 |
| W7 kitchen | 86,3,15, 89,6,16 | stove x86 z15, back door x88 z17 |
| W7 bedroom | 91,3,15, 93,6,16 | bed x92 foot z15; door x91 z14 |
| W7 porch | 85,3,7, 94,5,9 | swing bench, rockers |

Stairs: plot 1 x19 z11..15; plot 2 x30 z10..14; plot 4 z15 x57..53 (RESERVED table).

## PARTS

1. Shell A (plots 0-3): piers, decks, walls, floors, openings as air, stair flights, partitions. `parts/shell_a.mjs`.
2. Shell B (plots 4-7): same, plus smokehouse crib, ham racks, bungalow. `parts/shell_b.mjs`.
3. Roofs: roof.json per building (trusses), hand porch roofs, rafter tails. `parts/roofs.mjs`.
4. Windows, doors, porches, shutters, signs, tapered posts, lanterns on porches. `parts/fittings.mjs`.
5. Chimneys and hearths: all 14 stacks, smokehouse vent, hearth mass, fireplace face. `parts/chimneys.mjs`.
6. Grounds and yards: lane, fences, lamp posts, trees, orchard, bee yard, work yard, kettle, woodpile, gardens. `parts/grounds.mjs`.

## Notes for workers
- Keep every opening and RESERVED cell as air in P1/P2. P4 fills openings, P5 builds chimneys through roofs left by `keep`.
- Nothing crosses x12i / x12i+11 below y7. Run `$MCD check`, `fit`, `walk`.
- Chimney fires inside flues only, `lit:"true"`.
```

### elements.md

```markdown
# Required elements (mill village kit 2)

Coordinates are from plan.md. [ ] = checklist. "Part" = the part that builds it (P1 shell A plots 0-3, P2 shell B plots 4-7, P3 roofs, P4 doors/windows/porch fittings, P5 chimneys + hearths, P6 grounds + yards).

## Whole site
- [ ] Lane z0..4, x0..95: gravel z1..3 centre, dirt_path ruts z1 and z3, coarse_dirt edges z0, z4; solid fill y-2 stone, y-1 dirt, surface y0 grass/coarse_dirt patches. P6, `lane_strip`.
- [ ] Lantern posts x=0,12,..,84,95 at z4: spruce_fence y1..3 + standing lantern y4. P6, `lamp_post`.
- [ ] Plot fences: side columns x12i, x12i+11 z5..18 spruce_fence y1 (plot 6 open path); front picket z5 with 2-wide gate gap x12i+5..6; back line z18. P6, `fence_run`.
- [ ] Module cut: nothing crosses x12i / x12i+11 below y7; eaves and caps inside plot.

## Plot 0 dogtrot (x1..10)
- [ ] Two log pens (x1..4 and x7..10, z9..15), oak_log cribs, alternating axis per course at corners; piers cobblestone y1 (1 in 10 mossy). P1 `log_crib_wall`, `pier_line`.
- [ ] Open breezeway x5..6 z9..15: deck spruce_planks y2, open full height at z9 and z15, stripped_oak_log beam axis x at y6 across each end; bench (spruce_stairs x5 z11 facing east), cauldron x6 z14. P1/P4 `bench`.
- [ ] ONE side-gable roof over both pens and the breezeway, exposed_cut_copper, king-post truss in stripped_oak_log visible from the breezeway. P3.
- [ ] Front porch x1..10 z7..8, posts x1,5,6,10 stripped_oak_log y3..5, oak_fence rail except x5..6, shed roof. P4 `porch_run`.
- [ ] Front steps x5..6 z6 and back step z16 (stairs top level with deck). P4 `front_steps`.
- [ ] Rear fieldstone chimney x2..3 z16..17 on its own footing, lit signal fire via chimney(), fire y13. P5.
- [ ] Furnace stove x2 z14 (west pen, by chimney wall), table, 2 beds (W pen x3 foot z13 head z14; E pen x9 foot z11 head z10). Furnishers.
- [ ] Woodblock + stump x8..9 z17: stripped_oak_log y1 + oak_log y1. P6.

## Plot 1 camelback (x15..20)
- [ ] Front block 1 storey z9..12 + hump 2 storeys z13..17, acacia_planks, stripped_pale_oak_log corner boards and plates; bricks piers. P1.
- [ ] Two front-gable roofs (stone + stone_slab ridge), front one dying into the hump wall at z13. P3.
- [ ] Inside stair x19 z11..15 y3..7 facing south, hole x19 z13..14, rail x18 z13..14 y8. P1 `stair_run`.
- [ ] Exterior chimney x13..14 z14..15 fire y17, with stove by west wall x16 z14..15. P5.
- [ ] Double door x17..18 z9 (acacia_door pair), mangrove_trapdoor shutters, porch + step. P4.
- [ ] Beds: upstairs x16, x17 (foot z15 head z16 S); front room x16 foot z11 head z10. Furnishers.

## Plot 2 I-house (x25..34)
- [ ] Two-storey, 3-bay white_terracotta body z9..16, quartz pilasters at corners, quartz_slab string course y7, quartz_stairs cornice. P1/P4.
- [ ] Two-storey front porch z7..8: posts x25,28,31,34 y3..10, decks y2 and y7, pale_oak_fence balustrades. P4 `porch_run` (two-storey).
- [ ] Central stair hall, flight x30 z10..14 y3..7 facing south. P1 `stair_run`.
- [ ] End chimneys x25 and x34 z12, 1-wide strip in the gable wall, crown wider above y16, fire y19. P5.
- [ ] dark-slate side-gable roof, quartz verge; porch shed roof y11. P3.
- [ ] Double door + transom z9, gallery double door y8..9, warped_trapdoor shutters pairs. P4.
- [ ] Beds upstairs x26/x27 and x32/x33 foot z14 head z15; stoves x26 z12 and x33 z12. Back yard bench + wash bench with barrels x26..33 z17. P6.

## Plot 3 pyramid cottage (x37..46)
- [ ] Square-ish body z9..17, pale_oak_planks, dark_oak corner boards. P1.
- [ ] True pyramid hip polished_granite, cap y12, stack rising through the apex. P3.
- [ ] Central brick hearth mass x41..42 z11..14 y1..6, stack x41..42 z12..13, fire y15, four furnaces back onto it. P5.
- [ ] Four rooms + vestibule + back hall; beds NE/SE/SW against outer walls. P1/furnishers.
- [ ] Porch across front, hipped ends, mangrove double door, shutters. P4.

## Plot 4 boarding house (x49..58)
- [ ] Board-and-batten mangrove_planks, stripped_oak_log battens at x49,52,55,58 and belt y7. P1/P4.
- [ ] Long porch z7..8, five posts, spruce_fence rail gap x53..54, hanging sign "BOARDING" x53..54 z7 y5, two rocking chairs. P4 `hanging_sign`, `rocker`.
- [ ] Shared kitchen + long table x52..56 z11..12; smoker/furnace at breast x51 z12..13. Furnishers.
- [ ] Stair along z15 x57..53 facing west, y3..7, hole x54..56 z15, step out x52 z15. P2 `stair_run`.
- [ ] West bunk room (4 beds) and east (3) = 7 beds, hall z14..15. Furnishers.
- [ ] Kitchen chimney in the west end wall x49..50 z12..13, fire y19. P5.
- [ ] Tuff-brick side-gable roof. P3. Back yard wash bench, water_cauldron rain barrel. P6.

## Plot 5 work yard (x60..71)
- [ ] Smokehouse x61..65 z12..16: cobblestone plinth, stripped_spruce_log crib y2..4, packed_mud floor, spruce_door x63 z12, blackstone gable roof. P2/P3.
- [ ] Smoker lit x63 z15 y1; flue hole x63 y2 z16..17 to vent stack x63 z17 (chimney size 1, fire y10). P5.
- [ ] Hanging hams: barrels (facing down) hung by iron_chain from tie beams y4 at x62, 64 z13..15; trapdoor racks on walls. P2 `ham_rack`.
- [ ] Woodpile lean-to x67..70 z14..17: spruce_fence posts, bottom spruce_slab roof y4, stripped_oak_log stack axis x y1..2, oak_log rounds. P6 `woodpile`.
- [ ] Wash kettle x68 z9: sunk lit campfire y0 in cobblestone ring, water_cauldron level 3 y1. P6 `kettle`.
- [ ] Rinse tubs (barrels up) + washboard x69..70 z9; bench x61..62 z9; chopping block x66 z11. P6.

## Plot 6 orchard + bee yard (x72..83)
- [ ] 3 pecan trees (jungle_log trunks, broad persistent jungle/oak crowns). P6 `pecan_tree`.
- [ ] Swing: branch log axis x y6 x75..76 z15, iron_chain x76 z15 y3..5, spruce_slab top seat y2. P6 `swing`.
- [ ] Picnic table x77..78 z11..13 (top slabs on y1 posts? slab type top at y1 on a fence post row) with stair benches x76, x79. P6 `picnic_table`.
- [ ] Bee yard: 4 beehives x79..82 z17, bee_nest x82 y5 z9 under limb, wildflowers z15..16. P6 `beehive_row`.
- [ ] dirt_path gate -> table -> hives x77..78 z6..15. P6.

## Plot 7 bungalow (x85..94)
- [ ] Brick body z10..17, continuous brick foundation, pale_oak band y6. P2.
- [ ] Low front gable (pitch 0.5) over porch and body, oxidized/weathered copper mix, spruce_fence rafter tails, louvre vent x89..90 y8. P3.
- [ ] Deep porch z7..9, tapered posts x85,88,91,94 (bricks y3, brick_wall y4, log y5), beam y6, brick_wall cheeks at steps x88..91 z6. P4 `tapered_post`.
- [ ] Brick chimney x85..86 z13..14, fire y12, deepslate band. P5. Living fireplace face x87 z13.
- [ ] Door x89 + sidelight, paired 2x2 windows. P4. Brick path + shrubs P6.
- [ ] Bedroom bed x92 or x93 foot z15 head z16 S; kitchen stove x86 z15.

## Everywhere
- [ ] Lit: all room floor cells light >= 8; hanging lanterns under porch roofs; no mob spawn.
- [ ] Beds: head against solid wall, 2 clear above, reachable from door.
```

### rooms.json

```json
{"entrance":[29,1,5],"rooms":[{"name":"Dogtrot west pen","box":[2,3,10,3,6,14]},{"name":"Dogtrot east pen","box":[8,3,10,9,6,14]},{"name":"Dogtrot breezeway","box":[5,3,9,6,6,15]},{"name":"Dogtrot porch","box":[1,3,7,10,5,8]},{"name":"Camelback front room","box":[16,3,10,19,6,12]},{"name":"Camelback kitchen","box":[16,3,14,19,6,16]},{"name":"Camelback bedroom","box":[16,8,14,19,11,16]},{"name":"I-house west room","box":[26,3,10,27,6,15]},{"name":"I-house stair hall","box":[29,3,10,30,6,15]},{"name":"I-house east room","box":[32,3,10,33,6,15]},{"name":"I-house upper west bedroom","box":[26,8,10,27,11,15]},{"name":"I-house upper hall","box":[29,8,10,30,11,15]},{"name":"I-house upper east bedroom","box":[32,8,10,33,11,15]},{"name":"Pyramid NW parlour","box":[38,3,10,40,6,12]},{"name":"Pyramid NE kitchen","box":[43,3,10,45,6,12]},{"name":"Pyramid SW bedroom","box":[38,3,14,40,6,16]},{"name":"Pyramid SE bedroom","box":[43,3,14,45,6,16]},{"name":"Pyramid vestibule","box":[41,3,10,42,6,10]},{"name":"Pyramid back hall","box":[41,3,15,42,6,16]},{"name":"Boarding house kitchen-hall","box":[50,3,10,57,6,15]},{"name":"Boarding west bunk room","box":[50,8,10,53,11,12]},{"name":"Boarding east bunk room","box":[55,8,10,57,11,12]},{"name":"Boarding landing hall","box":[50,8,14,57,11,15]},{"name":"Smokehouse smoke room","box":[62,1,13,64,4,15]},{"name":"Bungalow living room","box":[86,3,11,93,6,13]},{"name":"Bungalow kitchen","box":[86,3,15,89,6,16]},{"name":"Bungalow bedroom","box":[91,3,15,93,6,16]},{"name":"Bungalow porch","box":[85,3,7,94,5,9]}]}
```

### palette.json

```json
{"roles":{"piers":["bricks","brick_stairs","brick_slab","brick_wall","cobblestone","mossy_cobblestone","cobblestone_wall","cobblestone_stairs","cobblestone_slab","stone_bricks","deepslate_bricks","stone_brick_stairs","stone_brick_slab"],"decks":["spruce_planks","spruce_stairs","spruce_slab","spruce_fence","spruce_trapdoor","spruce_door","packed_mud","spruce_fence_gate","pale_oak_fence_gate","pale_oak_stairs","pale_oak_slab"],"walls":["oak_log","stripped_oak_log","stripped_oak_wood","acacia_planks","acacia_fence","acacia_door","acacia_slab","white_terracotta","smooth_quartz","smooth_quartz_slab","quartz_stairs","pale_oak_door","pale_oak_fence","stripped_pale_oak_log","pale_oak_planks","stripped_dark_oak_log","dark_oak_fence","mangrove_planks","mangrove_door","stripped_spruce_log","blackstone"],"shutters":["mangrove_trapdoor","warped_trapdoor"],"roofs":["exposed_cut_copper","exposed_cut_copper_stairs","exposed_cut_copper_slab","stone","stone_slab","deepslate_tile_stairs","deepslate_tile_slab","polished_granite_stairs","polished_granite_slab","tuff_brick_stairs","tuff_brick_slab","polished_tuff","blackstone_stairs","blackstone_slab","oxidized_cut_copper","oxidized_cut_copper_stairs","oxidized_cut_copper_slab","weathered_cut_copper","weathered_cut_copper_stairs","weathered_cut_copper_slab","stone_stairs","deepslate_tiles"],"glass":["glass_pane"],"plants":["jungle_log","jungle_leaves","oak_leaves","azalea","cornflower","oxeye_daisy","dandelion","azure_bluet","grass_block","coarse_dirt","podzol","rooted_dirt","dirt_path","gravel","short_grass","allium","peony"],"beds":["red_bed","blue_bed","white_bed","green_bed","brown_bed","yellow_bed"],"functional_and_decorative":["furnace","smoker","campfire","hay_block","cauldron","water_cauldron","barrel","iron_chain","lantern","beehive","bee_nest","spruce_sign"]},"objects":["furnace","smoker","campfire","hay_block","cauldron","water_cauldron","barrel","iron_chain","lantern","beehive","bee_nest","spruce_fence","pale_oak_fence","spruce_fence_gate","pale_oak_fence_gate","spruce_door","pale_oak_door","mangrove_door","glass_pane","mangrove_trapdoor","warped_trapdoor","spruce_trapdoor","spruce_sign","spruce_stairs","spruce_slab","pale_oak_stairs","pale_oak_slab","stripped_dark_oak_log","jungle_log","cornflower","oxeye_daisy","dandelion","azure_bluet","allium","peony","short_grass","azalea","oak_leaves","jungle_leaves"]}
```

### make.sh

```sh
#!/usr/bin/env bash
# Makes build.nbt from scratch: node build.mjs into a temp file, then moved into place (a failed run leaves build.nbt alone).
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp ./.build.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
```

### build.mjs

```js
// Builds the whole row: ground, then every part in order, into the path given as the first argument.
// Usage: node build.mjs <out.nbt>   (make.sh runs this into a temp file, then moves it into place)
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { GRASS_BLOCK, SIZE, SITE } from "./vocab/base.mjs";

// Part order is the build order: later parts only add, and earlier parts' blocks are locked.
const PARTS = [
  ["Shell A plots 0-3", "parts/shell_a.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs"],
  ["Shell B plots 4-7", "parts/shell_b.mjs"],
  ["Roofs", "parts/roofs.mjs"],
  ["Windows, doors and porches", "parts/fittings.mjs"],
  ["Chimneys and hearths", "parts/chimneys.mjs"],
  ["Grounds and yards", "parts/grounds.mjs"],
  ["room: Dogtrot west pen", "parts/room-1.mjs"],
  ["room: Dogtrot east pen", "parts/room-2.mjs"],
  ["room: Dogtrot breezeway", "parts/room-3.mjs"],
  ["room: Dogtrot porch", "parts/room-4.mjs"],
  ["room: Camelback front room", "parts/room-5.mjs"],
  ["room: Camelback kitchen", "parts/room-6.mjs"],
  ["room: Camelback bedroom", "parts/room-7.mjs"],
  ["room: I-house west room", "parts/room-8.mjs"],
  ["room: I-house stair hall", "parts/room-9.mjs"],
  ["room: I-house east room", "parts/room-10.mjs"],
  ["room: I-house upper west bedroom", "parts/room-11.mjs"],
  ["room: I-house upper hall", "parts/room-12.mjs"],
  ["room: I-house upper east bedroom", "parts/room-13.mjs"],
  ["room: Pyramid NW parlour", "parts/room-14.mjs"],
  ["room: Pyramid NE kitchen", "parts/room-15.mjs"],
  ["room: Pyramid SW bedroom", "parts/room-16.mjs"],
  ["room: Pyramid SE bedroom", "parts/room-17.mjs"],
  ["room: Pyramid vestibule", "parts/room-18.mjs"],
  ["room: Pyramid back hall", "parts/room-19.mjs"],
  ["room: Boarding house kitchen-hall", "parts/room-20.mjs"],
  ["room: Boarding west bunk room", "parts/room-21.mjs"],
  ["room: Boarding east bunk room", "parts/room-22.mjs"],
  ["room: Boarding landing hall", "parts/room-23.mjs"],
  ["room: Smokehouse smoke room", "parts/room-24.mjs"],
  ["room: Bungalow living room", "parts/room-25.mjs"],
  ["room: Bungalow kitchen", "parts/room-26.mjs"],
  ["room: Bungalow bedroom", "parts/room-27.mjs"],
  ["room: Bungalow porch", "parts/room-28.mjs"],
];

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// A part whose file isn't written yet is skipped (its worker's copy may still be a stub or missing): make.sh must still produce a build.
const list = [];
for (const [name, file] of PARTS) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) {
    console.error(`skip: ${file} is missing, ${name} is not built`);
    list.push([name, () => {}]);
    continue;
  }
  const mod = await import(path);
  list.push([name, typeof mod.build === "function" ? mod.build : () => {}]);
}

const g = new Grid(SIZE);

// Ground: the surface row at y 0 (grass_block). Plan y -2..-1 (stone and dirt fill) is below the grid, which only holds y >= 0.
g.fill([0, SITE.SURFACE_Y, 0], [SITE.W - 1, SITE.SURFACE_Y, SITE.D - 1], GRASS_BLOCK);

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} cells`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json only), the site, and a seeded rng.
// Import what you need: import { SPRUCE_PLANKS, SITE, rng } from "../vocab/base.mjs";

/** Site footprint and levels: 96 x 19 plan, surface y 0, standing level y 1, build top y 21 (grid y 0..21). */
export const SITE = { W: 96, D: 19, H: 22, SURFACE_Y: 0, STAND_Y: 1, PLOT_W: 12, PLOTS: 8, LANE_Z0: 0, LANE_Z1: 4, FRONT_Z: 0 };

/** Full grid size, passed to new Grid(). */
export const SIZE = [SITE.W, SITE.H, SITE.D];

/** Lantern post x positions on the lane's south edge (z 4); the last is the far end at x 95. */
export const LAMP_POST_XS = [0, 12, 24, 36, 48, 60, 72, 84, 95];

/** x of plot i's left edge (module cut: plot i spans x 12i..12i+11). */
export const plotX0 = (i) => ...

/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1). Same seed, same sequence. */
export function rng(seed)

// ---- piers and foundation: brick and cobble family --------------------------------------------------------------
/** Brick pier block. */
export const BRICKS = "bricks";

/** Brick stair (pier skirt, step). */
export const BRICK_STAIRS = "brick_stairs";

/** Brick slab. */
export const BRICK_SLAB = "brick_slab";

/** Brick wall (tapered post band). */
export const BRICK_WALL = "brick_wall";

/** Cobblestone (fieldstone plinth, kerbs). */
export const COBBLESTONE = "cobblestone";

/** Mossy cobblestone (about 10% of the plinth). */
export const MOSSY_COBBLESTONE = "mossy_cobblestone";

/** Cobblestone wall. */
export const COBBLESTONE_WALL = "cobblestone_wall";

/** Cobblestone stair. */
export const COBBLESTONE_STAIRS = "cobblestone_stairs";

/** Cobblestone slab. */
export const COBBLESTONE_SLAB = "cobblestone_slab";

/** Stone brick band on piers. */
export const STONE_BRICKS = "stone_bricks";

/** Deepslate brick band on piers. */
export const DEEPSLATE_BRICKS = "deepslate_bricks";

// ---- decks, floors and joinery --------------------------------------------------------------------------------
/** Spruce plank deck and floor. */
export const SPRUCE_PLANKS = "spruce_planks";

/** Spruce stair (steps, bench seats). */
export const SPRUCE_STAIRS = "spruce_stairs";

/** Spruce slab (table tops, ledges). */
export const SPRUCE_SLAB = "spruce_slab";

/** Spruce fence (posts, rails, rafter tails). */
export const SPRUCE_FENCE = "spruce_fence";

/** Spruce trapdoor (shutters, shelves, washboard). */
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

/** Spruce door (both halves). */
export const SPRUCE_DOOR = "spruce_door";

/** Packed mud (smokehouse floor). */
export const PACKED_MUD = "packed_mud";

// ---- walls and trim -------------------------------------------------------------------------------------------
/** Oak log (roof verge, trusses on trim). */
export const OAK_LOG = "oak_log";

/** Stripped oak log (trusses, corner posts). */
export const STRIPPED_OAK_LOG = "stripped_oak_log";

/** Stripped oak wood (all-sided log, trim). */
export const STRIPPED_OAK_WOOD = "stripped_oak_wood";

/** Acacia planks (house 1 field). */
export const ACACIA_PLANKS = "acacia_planks";

/** Acacia fence. */
export const ACACIA_FENCE = "acacia_fence";

/** Acacia door. */
export const ACACIA_DOOR = "acacia_door";

/** Acacia slab. */
export const ACACIA_SLAB = "acacia_slab";

/** White terracotta (house 2 field). */
export const WHITE_TERRACOTTA = "white_terracotta";

/** Smooth quartz (house 2 trim, verge, sills). */
export const SMOOTH_QUARTZ = "smooth_quartz";

/** Smooth quartz slab. */
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";

/** Quartz stair (fascia, verge). */
export const QUARTZ_STAIRS = "quartz_stairs";

/** Pale oak door. */
export const PALE_OAK_DOOR = "pale_oak_door";

/** Pale oak fence. */
export const PALE_OAK_FENCE = "pale_oak_fence";

/** Stripped pale oak log (house 2 trim, tapered posts, verge). */
export const STRIPPED_PALE_OAK_LOG = "stripped_pale_oak_log";

/** Pale oak planks (house 3 gable). */
export const PALE_OAK_PLANKS = "pale_oak_planks";

/** Stripped dark oak log (house 3 trim). */
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";

/** Dark oak fence (house 3). */
export const DARK_OAK_FENCE = "dark_oak_fence";

/** Mangrove planks (house 4 field). */
export const MANGROVE_PLANKS = "mangrove_planks";

/** Mangrove door (house 1 and 3 accents). */
export const MANGROVE_DOOR = "mangrove_door";

/** Stripped spruce log (house 5 trim). */
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";

/** Blackstone (smokehouse walls and roof). */
export const BLACKSTONE = "blackstone";

/** Bricks (house 7 field). */
export const BRICKS_WALL = "bricks";

// ---- shutters ---------------------------------------------------------------------------------------------------
/** Mangrove trapdoor (shutters, houses 1 and 3). */
export const MANGROVE_TRAPDOOR = "mangrove_trapdoor";

/** Warped trapdoor (shutters, house 2). */
export const WARPED_TRAPDOOR = "warped_trapdoor";

// ---- roofs ------------------------------------------------------------------------------------------------------
/** Exposed cut copper (weathered brown tin roof). */
export const EXPOSED_CUT_COPPER = "exposed_cut_copper";

/** Exposed cut copper stair (roof edge). */
export const EXPOSED_CUT_COPPER_STAIRS = "exposed_cut_copper_stairs";

/** Exposed cut copper slab (roof edge, ridge). */
export const EXPOSED_CUT_COPPER_SLAB = "exposed_cut_copper_slab";

/** Stone (galvanized tin roof, house 1). */
export const STONE = "stone";

/** Stone slab (house 1 ridge). */
export const STONE_SLAB = "stone_slab";

/** Deepslate tile stair (house 2 roof). */
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";

/** Deepslate tile slab (house 2 roof). */
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";

/** Polished granite stair (pyramid roof). */
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";

/** Polished granite slab (pyramid roof). */
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";

/** Tuff brick stair (boarding house roof). */
export const TUFF_BRICK_STAIRS = "tuff_brick_stairs";

/** Tuff brick slab (boarding house roof). */
export const TUFF_BRICK_SLAB = "tuff_brick_slab";

/** Polished tuff (boarding house eave). */
export const POLISHED_TUFF = "polished_tuff";

/** Blackstone stair (smokehouse roof). */
export const BLACKSTONE_STAIRS = "blackstone_stairs";

/** Blackstone slab (smokehouse roof). */
export const BLACKSTONE_SLAB = "blackstone_slab";

/** Oxidized cut copper (bungalow roof). */
export const OXIDIZED_CUT_COPPER = "oxidized_cut_copper";

/** Oxidized cut copper stair (bungalow roof). */
export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs";

/** Oxidized cut copper slab (bungalow roof). */
export const OXIDIZED_CUT_COPPER_SLAB = "oxidized_cut_copper_slab";

/** Weathered cut copper (bungalow roof mix). */
export const WEATHERED_CUT_COPPER = "weathered_cut_copper";

/** Weathered cut copper stair (bungalow roof mix). */
export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs";

/** Weathered cut copper slab (bungalow roof mix). */
export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab";

// ---- glass ------------------------------------------------------------------------------------------------------
/** Glass pane (all windows). */
export const GLASS_PANE = "glass_pane";

// ---- plants and ground -----------------------------------------------------------------------------------------
/** Jungle log (pecan tree trunks and limbs). */
export const JUNGLE_LOG = "jungle_log";

/** Jungle leaves (pecan crowns, persistent). */
export const JUNGLE_LEAVES = "jungle_leaves";

/** Oak leaves (crown fill, persistent). */
export const OAK_LEAVES = "oak_leaves";

/** Azalea (shrubs). */
export const AZALEA = "azalea";

/** Cornflower (bee yard). */
export const CORNFLOWER = "cornflower";

/** Oxeye daisy (bee yard). */
export const OXEYE_DAISY = "oxeye_daisy";

/** Dandelion (bee yard, gardens). */
export const DANDELION = "dandelion";

/** Azure bluet (bee yard, gardens). */
export const AZURE_BLUET = "azure_bluet";

/** Grass block (surface y 0). */
export const GRASS_BLOCK = "grass_block";

/** Coarse dirt (surface patches, lane edges). */
export const COARSE_DIRT = "coarse_dirt";

/** Podzol (under trees, by the smokehouse). */
export const PODZOL = "podzol";

/** Rooted dirt (under trees, by the smokehouse). */
export const ROOTED_DIRT = "rooted_dirt";

/** Dirt path (lane ruts, gate paths). */
export const DIRT_PATH = "dirt_path";

/** Gravel (lane centre). */
export const GRAVEL = "gravel";

// ---- fire, functional and furnishing objects -------------------------------------------------------------------
/** Furnace (lit: stove and hearth nooks). */
export const FURNACE = "furnace";

/** Smoker (lit: smokehouse, kitchen smoker). */
export const SMOKER = "smoker";

/** Campfire (lit, sunk: kettle, chimney fires). */
export const CAMPFIRE = "campfire";

/** Hay block (chimney signal fire base). */
export const HAY_BLOCK = "hay_block";

/** Cauldron (empty). */
export const CAULDRON = "cauldron";

/** Water cauldron (rain barrel, kettle water). */
export const WATER_CAULDRON = "water_cauldron";

/** Barrel (storage, rinse tubs, hams). */
export const BARREL = "barrel";

/** Iron chain (ham racks, hanging lanterns). */
export const IRON_CHAIN = "iron_chain";

/** Lantern (standing and hanging light). */
export const LANTERN = "lantern";

/** Beehive (bee yard). */
export const BEEHIVE = "beehive";

/** Bee nest (under the NE crown). */
export const BEE_NEST = "bee_nest";

// ---- beds (colour per house) -----------------------------------------------------------------------------------
/** Red bed (house 0). */
export const RED_BED = "red_bed";

/** Blue bed (house 1). */
export const BLUE_BED = "blue_bed";

/** White bed (house 2). */
export const WHITE_BED = "white_bed";

/** Green bed (house 3). */
export const GREEN_BED = "green_bed";

/** Brown bed (house 4). */
export const BROWN_BED = "brown_bed";

/** Yellow bed (house 7). */
export const YELLOW_BED = "yellow_bed";
```

### vocab/h1.mjs

```js
// vocab/h1.mjs: group 1 of plan.md VOCABULARY (lane, piers, window, porch, chimney, table, ham rack, pecan tree,
// beehive row). Every helper takes its own position; nothing is hard-wired to a spot.
// Writes go into air only (g.isAir). Each helper returns { placed, skipped } and a refused cell is listed in skipped,
// never overwritten. The exception is lane_strip, whose footprint IS the surface row it replaces.
// Positions plan.md's signatures leave out (y, z, front, facing) come as a trailing options object, defaulted to plan.md.

/** Lane surface from x0 to x1, five rows from z: coarse_dirt edges, dirt_path ruts, gravel centre (plan SITE).
 *  The lane is the surface itself, so it replaces the grass at row y (default 0) and writes nothing under it. */
export function lane_strip(g, x0, x1, { z = 0, y = 0 } = {})

/** Piers on the outline x0,z0..x1,z1: at both ends of every edge and every 3rd cell along it, h courses from row y.
 *  The cells between piers get `skirt` (a fence keeps its run along the edge), or stay open when skirt is null. */
export function pier_line(g, x0, z0, x1, z1, block, { y = 1, h = 1, skirt = null } = {})

/** A w x h band of glass panes in a wall that faces `face`. (x, y, z) is the band's lowest cell at its start: the lowest x
 *  on a north/south wall, the lowest z on an east/west wall. The panes connect along the wall. `sill` (a material name)
 *  lays top slabs one cell out in front of the bottom row; null means no sill. The lintel is the wall's own block, so
 *  it is not written here. */
export function window(g, x, y, z, face = "north", w = 1, h = 1, { sill = null } = {})

/** A porch along the street front: the front line is row z, x0..x1, and the porch is two deep toward the house (away
 *  from it when front is south). Posts at each x in `posts`, y 3 up. A deck at y 2 (plus a gallery deck at y 7 when
 *  storeys is 2). A rail at y 3 along the front line, left open over the gap [gx0, gx1] for the steps; a full
 *  balustrade at y 8 on a two-storey porch. Shed roof when `roof` names a material: stairs on the front line, facing
 *  the house, with a slab row behind. Storey 1: posts to y 5, roof at y 6, slab row at y 7. Storey 2: posts to y 10,
 *  roof at y 11, slab row top-type at y 11. */
export function porch_run(g, x0, x1, z, posts, rail, deck, storeys = 1,

/** A chimney stack, built by chimney() from the build library: at = [x, base y, z] of the shaft's north-west cell, top =
 *  the course its campfire sits in, size 1 or 2. The footing, crown and cap belong to the stack. Writes go through the
 *  air-only sink, so anything already standing in the flue or crown is skipped and reported. */
export function chimney_stack(g, at, top, size = 1, material = "bricks", band = undefined)

/** A table: spruce_fence legs at both ends and every 3rd cell, and a spruce_slab top row (type top) one course up,
 *  resting on the legs. Footprint: len cells along x at z, rows y and y+1. Nothing is placed at y+2, so the lane past it
 *  stays 2 high. */
export function table_set(g, x, y, z, len)

/** Hams: a barrel (facing down) hung on an iron_chain at every x in xs and z in zs. The chain is in row y, under the tie
 *  beam at y+1 (the beam is not written here); the barrel hangs in row y-1. Footprint: xs x zs, rows y-1..y. */
export function ham_rack(g, xs, zs, y)

/** A pecan: a jungle_log trunk from trunk = [x, y, z] up `height` logs, two short limbs one log under the top (axis x on
 *  the +x side, axis z on the +z side), and a flat, broad crown of leaves over the box crown = [x0, y0, z0, x1, y1, z1].
 *  The crown's bottom corners are left out. About 30% of the leaves are oak, placed by position so every run matches. */
export function pecan_tree(g, [x, y0, z], height, [cx0, cy0, cz0, cx1, cy1, cz1])

/** A row of beehives standing on the ground: x0..x1 at z, on row y (default 1), all facing `facing` (default north). */
export function beehive_row(g, x0, x1, z, { y = 1, facing = "north" } = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md VOCABULARY (share h2): lamp_post, clapboard_wall, shutter_pair, front_steps,
// hearth_nook, hanging_lantern, woodpile, swing, tapered_post. Palette ids are literals; nothing is imported from
// vocab.mjs or the other vocab/ files. Every helper takes the grid first, then its position (the cell it is anchored
// on, and its facing where it has one), then an optional opts object, and returns { placed, skipped, clipped, box }:
// box is the footprint it may write. A write outside the box throws; a cell that is not air is skipped, so nothing is
// laid under ground, floors or earlier parts' blocks.

/** A standing lamp post on the lane's edge: spruce fence y..y+2, standing lantern at y+3. (x, y, z) = the fence's foot. */
export function lamp_post(g, x, y, z)

/**
 * Wall shell over box [x0,y0,z0,x1,y1,z1]: the outer ring only (no floor, no ceiling). field: a plain block id for the
 * walls; trim: a LOG id (e.g. stripped_pale_oak_log) for the corner boards (axis y) and the plates at y0 and y1 (axis
 * along the run). opts.open: boxes [x0,y0,z0,x1,y1,z1] left as air (window and door openings).
 */
export function clapboard_wall(g, box, field, trim, { open = [] } = {})

/**
 * A pair of open trapdoor shutters beside a window. (x, y, z) = the window's first cell on its wall, bottom-left as seen
 * from outside; face = the way the wall looks (north for a north wall); width = the window's width along the wall;
 * height = shutter rows. Shutters go in the cell in front of the wall, one each side of the window.
 */
export function shutter_pair(g, x, y, z, face, wood, { width = 1, height = 2 } = {})

/** Front steps: a row of stairs at height y from x0 to x1 on row z, rising toward facing (south: up toward the deck). */
export function front_steps(g, x0, x1, y, z, { facing = "south", material = "spruce" } = {})

/**
 * A lit furnace on a stone hearth against a chimney wall. (x, y, z) = the furnace cell on the standing level; facing =
 * the way its front looks (into the room, away from the chimney wall). A stone-brick mantle sits above it. Only these two
 * cells are written: the floor and the 2-high lane in front of the furnace stay clear.
 */
export function hearth_nook(g, x, y, z, facing)

/**
 * A hanging lantern under a block: (x, y, z) = the lantern's cell. Hangs only when the cell above is solid; with air above
 * it places nothing and returns hung: false (the ceiling must be built first).
 */
export function hanging_lantern(g, x, y, z)

/**
 * A woodpile lean-to over box [x0,y0,z0,x1,y1,z1]: spruce fence posts at the corners (y0..y1-1), a spruce slab roof row
 * at y1 over the whole box, stripped oak logs stacked along x in the two back rows (y0..y0+1), oak log rounds on the
 * front row between the posts.
 */
export function woodpile(g, [x0, y0, z0, x1, y1, z1])

/**
 * A tree swing: a spruce slab seat (top half) at (x, y, z), an iron chain up to y+3, and a jungle log branch along x at
 * y+4 over x-1..x, the chain hanging from its x cell.
 */
export function swing(g, x, y, z)

/** A tapered porch post: bricks at y, a brick wall post at y+1, a stripped pale oak log cap at y+2. (x, y, z) = the base. */
export function tapered_post(g, x, y, z)
```

### vocab/h3.mjs

```js
// Helpers from plan.md VOCABULARY (h3): fence_run, log_crib_wall, door_pair, stair_run, bed_set, hanging_sign, kettle,
// picnic_table, rafter_tails. Each takes its position (and facing) as arguments and writes only into air, so it never
// replaces an earlier part's block or the ground. Two exceptions, both inside their own footprint: stair_run with
// { carve: true } clears headroom through a built floor, and kettle sinks its campfire into the y 0 surface.
// Every helper returns { placed, skipped }.

/** Plot fences in one row. plot is the plot index i (ox = 12 * i): side columns (spruce_fence at x ox and ox+11,
 *  z 5..18, y 1), a picket front at z 5 (`${wood}_fence`, x ox+1..ox+10) with a 2-wide gap at gateX..gateX+1, and a back
 *  line at z 18 (`${wood}_fence`). sides: false leaves the side columns open (plot 6's dirt_path). */
export function fence_run(g, plot, wood, gateX, { sides = true } = {})

/** A log pen wall: every perimeter cell of box [x0,y0,z0,x1,y1,z1] is a log with its axis along the wall's run (x on the
 *  N/S walls, z on the E/W walls). Corners alternate per course (axis x on even courses, z on odd) so the notches
 *  interlock. keep: boxes left as air (window and door openings). */
export function log_crib_wall(g, box, log, { keep = [] } = {})

/** A double door in a wall: two doors side by side, both facing out (face), hinges mirrored (left, then right), both halves
 *  written. (x, y, z) is the left door's lower cell; the pair runs along x on a north or south wall, along z on an east or
 *  west one. The step is a bottom `${wood}_slab` on the cell outside each door, at the door's base y. */
export function door_pair(g, x, y, z, face, wood)

/** A straight flight from `from` (the first step, on the lower floor) up to the upper floor's block layer at y = to, with
 *  flight()'s steps, headroom and stringers, written air-only. A rail (`${material}_fence`) runs at y to+1 on the right of
 *  the walk, beside each cell the flight passes through the upper floor. carve: true lets the headroom cut through a built
 *  floor. material is a wood name (spruce, mangrove). */
export function stair_run(g, from, facing, to, material, width = 1, { carve = false } = {})

/** A bed, both halves: foot at [x,y,z], head one step toward facing (the pillow end). Places nothing unless both cells are
 *  air and two cells above each half are clear (headroom). Keep the head against a solid wall (the caller's layout). */
export function bed_set(g, [x, y, z], facing, colour = "red")

/** A hanging sign at [x,y,z], hung from the block above it (the roof or beam). Places nothing when the block above is air.
 *  text: lines split on "\n". rotation: 0..15 (8 faces north, the lane). */
export function hanging_sign(g, text, x, y, z, { wood = "mangrove", rotation = 8 } = {})

/** A wash kettle: a lit campfire sunk into the surface at (x, 0, z), a cobblestone kerb round it at y 0, and a water cauldron
 *  (level 3) on the fire at y 1. The only y 0 cells it replaces are its own pit and kerb. */
export function kettle(g, x, z)

/** A picnic table: a spruce slab top (type top) across x..x+1, z..z+len-1 at y, with a spruce stair bench on each side
 *  (x-1 facing west, x+2 facing east). Defaults match plot 6: picnic_table(g, 77, 11) with len 3 at y 1. */
export function picnic_table(g, x, z, len = 3, y = 1)

/** Rafter tails: spruce_fence stubs at x, y, every 2 cells from z0 to z1 (under the eave). */
export function rafter_tails(g, x, z0, z1, y)
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

/** A bed, both halves: foot at [x,y,z], the head one step toward facing (the pillow end), same colour and facing.
 *  Both cells must be air (a bed never replaces a wall block); the head goes against a solid wall, never a window or
 *  a door. Returns true when placed, false (placing nothing) when a cell is taken. */
export const bed = (g, [x, y, z], facing, color = "red") => ...

/** A straight flight of stairs a player walks up without jumping: from = the first step's cell (standing on the lower
 *  floor), facing = the way you walk up, to = the y of the UPPER FLOOR's own block layer. The last step is set in that
 *  layer, flush with the floor you step out onto, so a storey of h (floor to floor) takes h steps. Clears 2 blocks of
 *  headroom over every step (cutting the floor above where the flight passes) and hangs an upside-down stair under each
 *  step as a stringer. width runs to the right of facing. Returns { steps, landing: [x,y,z] (feet on the upper floor), notes }. */
export const flight = (g, { from: [x, y, z], facing, to, material = "oak", width = 1, stringer = true }) => ...

/** A chimney stack with its fire inside a crown: at = [x, base y, z] (the shaft's north-west cell), top = the course the
 *  campfire sits in (2+ above the roof it passes), size 1|2. The crown, one wider than the shaft, walls the hay and the
 *  campfire on all four sides and rises one course above the fire, with a slab cap; see chimney.mjs. */
export const chimney = (g, { at: [x, y, z], top, size = 1, material = "bricks", band, fire = true, signal = true }) => ...

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
a **broken bed** (one half, or halves that don't match), a **bed in the wall** (set into the wall line), a **bed
against an opening** (its head at a window, a pane or a door, or at nothing), a **bed backwards** (foot against the
wall, head out in the room), **stairs end short** (a walked flight whose top step is a full block under the floor it
leads to: a jump), an **exposed chimney fire** (a campfire with open sky above and air beside it or its hay, or no
course of masonry above it), a **floating shutter** (an open trapdoor with air behind it), **bookshelf overuse** (more
than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with one way in, or a long stretch no
walk between its openings passes). The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves; refuses a cell that isn't air and returns
false), `flight(g, { from, facing, to, material, width })` (a flight whose last step is in the upper floor's own layer,
headroom cut, stringer under it), `chimney(g, { at: [x, baseY, z], top, size, material, band })` (the shaft and a crown
that walls in the hay and the campfire, one course below the mouth), `shutter(g, [x, y, z], face, wood, { height })`
(flat on the wall), `bannerWord(g, word, { center, face })` (letters in reading order).

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
