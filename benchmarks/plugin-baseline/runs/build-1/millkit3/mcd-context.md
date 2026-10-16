# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Mill village housing kit 3: one sample row of 8 modules

## SITE

- Row 96 wide (x 0..95), 19 deep (z 0..18). Front faces NORTH (-z), the lane side; x runs along the lane. Same grid as kits 1 and 2.
- Ground: fill y -2..-1 (stone y -2, dirt y -1), surface **y 0** (grass_block patched with coarse_dirt; podzol + rooted_dirt by fences, barn and oven). Standing level outdoors y 1.
- Lane z 0..4, y 0, x 0..95: gravel centre z 1..3 with dirt_path ruts at z 1 and z 3, coarse_dirt edges z 0 and z 4.
- Lantern posts at the lane's south edge z 4, x = 0, 12, 24, 36, 48, 60, 72, 84 (+ x 95): spruce_fence y 1..3, standing lantern y 4 (exactly kits 1 and 2).
- Module cut: module i = x 12i..12i+11, z 0..18, y -2..top. Nothing crosses x 12i / 12i+11 below y 7; eaves and stacks above y 7 stay inside the plot (an eave may sit over its own side column).
- Side columns x 12i and 12i+11, z 5..18: spruce_fence y 1 (as kits 1 and 2); front line z 5 a picket fence (per plot, MATERIALS) with a 2-wide gate at x 12i+5..6; back line z 18 spruce_fence unless a stack stands there.
- Houses (common section): piers y 1, deck y 2 (stand y 3), ground walls y 3..6, upper floor block y 7 (stand y 8), upper walls y 8..11. Front step z 6 (one stair at y 1 facing south, top level with the deck y 2), porch z 7..8, body from z 9 (except where stated).
- Chimney rule used: an exterior chimney's fire sits 1 outside the wall, its stack 2 deep x 3 wide round the flue; side stacks only where the wall is 3+ in from the side column, otherwise on the back wall (stack z 17..18).

| plot | mass | x0..x1 | y0..y1 | z0..z1 |
|---|---|---|---|---|
| 0 double shotgun | body (1 storey, front gable), two units | 1..10 | 1..6 (+roof) | 9..16 |
| 0 | party wall (2 thick, full height to the ridge) | 5..6 | 3..11 | 9..16 |
| 0 | west unit / east unit interiors | 2..4 / 7..9 | 3..6 | 10..15 |
| 0 | shared front porch (deck, shed roof) | 1..10 | 1..7 | 7..8 |
| 0 | front steps (2 wide) | 5..6 | 1 | 6 |
| 0 | twin back stack (two flues x 4 and x 7) | 3..8 | 1..10 | 17..18 |
| 0 | back stoops (one slab each) | 2 and 9 | 2 | 17 |
| 1 Creole cottage | body (1 storey, side gable) | 15..22 | 1..6 (+roof) | 10..17 |
| 1 | engaged galerie (under the main roof) | 15..22 | 1..6 | 7..9 |
| 1 | front steps | 17..18 | 1 | 6 |
| 1 | west gable-end chimney (exterior) | 13..14 | 1..14 | 12..14 |
| 2 American Foursquare | body (2 storeys, square) | 27..34 | 1..11 (+roof) | 9..16 |
| 2 | full-width front porch (1 storey, hipped) | 27..34 | 1..7 | 7..8 |
| 2 | front steps | 29..30 | 1 | 6 |
| 2 | front dormer (hipped, on the front slope) | 29..32 | 12..15 | 10..12 |
| 2 | west chimney (exterior, living-room fire) | 25..26 | 1..16 | 11..13 |
| 3 Queen Anne | main body (2 storeys, hip + front cross gable) | 39..45 | 1..11 (+roof) | 9..16 |
| 3 | corner tower (3 stages, projects 2 forward and 1 east) | 43..46 | 1..15 (+cap to 22) | 7..10 |
| 3 | wraparound porch: front leg | 37..42 | 1..7 | 7..8 |
| 3 | wraparound porch: west leg | 37..38 | 1..7 | 9..14 |
| 3 | front steps | 41..42 | 1 | 6 |
| 3 | back chimney (kitchen) | 40..42 | 1..16 | 17..18 |
| 4 gable-front-and-wing | front gable block (1.5 storeys) | 53..58 | 1..8 (+roof to 12) | 9..16 |
| 4 | side wing (1 storey + low loft, shares wall x 53) | 49..53 | 1..6 (+roof to 10) | 12..16 |
| 4 | porch in the angle | 49..52 | 1..7 | 9..11 |
| 4 | porch steps | 51..52 | 1 | 8 |
| 4 | back chimney on the wing (kitchen) | 50..52 | 1..12 | 17..18 |
| 5 mule barn | barn (gambrel, hay loft) | 61..68 | 1..5 walls, loft 6..7 (+roof to 12) | 9..15 |
| 5 | wagon lean-to (east, open on 2 sides) | 69..70 | 1..5 | 9..15 |
| 5 | paddock (fenced, behind the barn) | 61..70 | 1 | 16..18 |
| 5 | hay hoist beam over the loft door | 64..65 | 10 | 8 |
| 6 bake-oven + cistern yard | picnic pavilion (6 posts, gable roof) | 74..81 | 1..4 (+roof to 7) | 7..11 |
| 6 | long table + 2 benches | 76..79 | 1 | 8..10 |
| 6 | brick bread oven (vault) | 73..77 | 1..4 | 14..17 |
| 6 | oven stack (rises from the vault's back) | 74..76 | 1..9 | 16..17 |
| 6 | oven apron (stone, working side) | 73..77 | 0 | 13 |
| 6 | water tank on legs | 79..82 | 1..9 | 14..17 |
| 6 | rain barrels + tap cauldron | 79..82 | 1 | 13 |
| 7 company duplex | body (2 storeys, brick, two units) | 85..94 | 1..11 (+roof) | 9..16 |
| 7 | party wall (2 thick) | 89..90 | 3..11 | 9..16 |
| 7 | west unit / east unit interiors | 86..88 / 91..93 | 3..11 | 10..15 |
| 7 | two-storey porch (deck y 2, gallery deck y 7), under the main roof | 85..94 | 1..11 | 7..8 |
| 7 | front steps (2 wide, one per unit side by side) | 88..91 | 1 | 6 |
| 7 | two back stacks | 86..88 and 91..93 | 1..15 | 17..18 |

## ROOFS

| building | form | preset / style | ridge | height | overhang | notes |
|---|---|---|---|---|---|---|
| 0 double shotgun | front gable to the lane, one roof over both units | `cottage`, `ridgeAxis: z`, `front: n`, material `red_nether_brick` (oxblood painted tin), verge `stripped_birch_log`, slab ridge | along z at x 5..6, z 8..17 | eaves y 7 (x 0 / x 11), ridge y 12 (45°) | 1 all round (sides over the side columns, front z 8, back z 17) | keep the stack x 3..8 z 17..18; front gable triangle (z 9, y 7..11) is the wall's: clapboard with a 2-wide louvred vent; trusses `stripped_birch_log` (king post) |
| 0 porch | shed under the gable | by hand: red_nether_brick_stairs facing south at z 7 y 7, slabs y 7 at z 8 tucked under the main eave; gingerbread brackets (upside-down birch stairs) under the beam y 6 at each post | — | y 7 | 0 | verge board stripped_birch at x 1 / x 10 ends |
| 1 Creole cottage | side gable, steep, ONE plane sweeping from the ridge over the galerie | `cottage`, `ridgeAxis: x`, material `dark_oak` (dark cypress shingle, auto-mixed), verge `stripped_dark_oak_log`, ridge slab | along x at z 12, x 15..22 | eaves y 6 at z 6 (front) and z 18 (back), ridge y 12 (45°) | N/S 1 (z 6 over the steps, z 18); E/W 0 (gable ends flush x 15 / x 22) | footprint x 15..22 z 7..17 (galerie included); keep stack x 13..14 z 12..14; gables are wall (cherry boards); a 1-cell kick (bottom slab row) at the front eave reads as the bellcast |
| 2 Foursquare | hipped, square, moderate | style `hip`, pitch 0.75, material `nether_brick` (dark asphalt), eave `nether_brick_slab`, ridge `polished_blackstone_brick_slab` | short ridge along x at z 12..13, x 30..31 | eaves y 12, ridge y 15 | 1 all round (x 26, x 35, z 8, z 17) | keep stack x 25..26 z 11..13; front dormer is a part's job by hand (its own hip, eave y 15, ridge slab y 16, nether_brick); trusses `stripped_birch_log` |
| 2 porch | low hip, full width | by hand: nether_brick_stairs at y 7 round x 26..35 z 7..8 (hip corners), slab top y 8 against the body wall | — | y 7..8 | 1 front | under the upper windows (y 9..10) |
| 3 Queen Anne body | steep hip with a front cross gable | style `hip`, pitch 1, palette `slate` (patterned grey slate), ridge stone_brick slab | hip ridge along z at x 42, z 12..13 | eaves y 12, ridge y 16 | 1 all round | footprint x 39..45 z 9..16 minus the tower x 43..45 z 9..10; keep stack x 40..42 z 17..18 |
| 3 front cross gable | front gable over x 39..42 | own rect, `gable`, `ridgeAxis: z`, `front: n`, slate | along z at x 40..41, z 8..12 | eaves y 12, peak y 14 | 1 front (z 8) | gable triangle z 9 y 12..13 is the wall's: fishscale shingle (birch, MATERIALS); valley into the hip |
| 3 tower | tall pyramid/cone cap | `tower-cap`, material `copper` palette (weathered/oxidized), finial lightning_rod | apex over x 44..45 z 8..9 | eaves y 16, apex y 22 | 1 (x 42..47, z 6..11) | sits on the tower stage top y 15 |
| 3 porch | low hip, wraps the corner | by hand: slate stairs (cobbled_deepslate_stairs) at y 7 along z 7 x 37..42 and along x 37 z 7..14, hip corner at (37, 7); slab top y 8 against the walls | — | y 7..8 | 0 | spindle frieze under the beam (see FACADES) |
| 4 front gable | steep front gable to the lane | `cottage`, `ridgeAxis: z`, `front: n`, material `mud_brick` (weathered cedar shingle), verge `stripped_birch_log` | along z at x 55..56, z 8..17 | eaves y 9, ridge y 12 | 1 front/back/east (x 59 over the side column); 0 west where the wing meets | gable triangle z 9 is wall; keep nothing |
| 4 wing | side gable, lower | own rect, `gable`, `ridgeAxis: x`, mud_brick | along x at z 14, x 49..53 | eaves y 7 (z 11 / z 17), ridge y 10 | N/S 1, W 0 (x 49 flush) | dies into the front gable block's west wall/slope at x 53; keep stack x 50..52 z 17..18 |
| 4 porch | shed in the angle | by hand: mud_brick_stairs facing north at y 7 along z 9 x 49..52, slabs y 7 z 10..11 under the wing eave | — | y 7 | 0 | |
| 5 mule barn | gambrel along z (gable to the lane) | `barn` preset (barn-red palette, quartz barge boards, cupola) | along z at x 64..65, z 8..16 | eaves y 7, break ~y 10, ridge y 12 | 1 front/back, 1 sides (x 60 west over the side column, x 69 east sits over the lean-to's top) | front gable (z 9, y 7..11) is wall: vertical boards with the loft door; trusses `stripped_spruce_log` |
| 5 lean-to | shed off the barn's east wall | by hand: dark_oak_stairs facing west (high side at the barn) y 5 at x 69, y 4 at x 70, z 8..16 | — | y 4..5 | 1 front/back | on stripped_spruce_log posts |
| 6 pavilion | low open gable, ridge along x | `gable`, `ridgeAxis: x`, pitch 0.5, material `dark_prismarine` (green tin), verge `stripped_oak_log` | along x at z 9, x 73..82 | eaves y 5 (z 6 / z 12), ridge y 7 | 1 all round | trusses `stripped_oak_log` (king post, seen from the tables) |
| 6 oven | brick vault, no tile roof | by hand: brick_stairs upside-down turned inward along the vault's long sides y 4, brick_slab crown y 4 down the middle | — | y 4 | — | stack runs on through |
| 6 tank | conical lid | by hand: spruce_slab ring y 9, spruce_stairs facing outward at the edge | — | y 9..10 | 0 | |
| 7 company duplex | low hip over body AND the two-storey porch | style `hip`, pitch 0.5, material `stone_brick` (grey slate/asbestos shingle), eave `stone_brick_slab`, ridge `polished_andesite_slab` | short ridge along x at z 11..12, x 89..90 | eaves y 12, ridge y 15 | 1 all round (z 6 over the steps, z 17, x 84 / x 95 over the side columns) | footprint x 85..94 z 7..16; keep the stacks x 86..88 and x 91..93 z 17..18 |

## FACADES

Common: piers y 1 at corners and every 3 along each wall and under porch posts; skirting between piers y 1 (lattice = open trapdoors of the house's trim wood, or the fence named); deck y 2; walls from y 3. Windows 1 wide x 2 high (y 4..5 ground, y 9..10 upper) unless stated, glass_pane in the wall plane, a top-slab sill one cell outside (not where a porch deck already is). Corner boards flush, head plate at y 6 (and y 11 on two storeys).

**Plot 0 double shotgun (x 1..10):** piers `bricks`, skirting `birch_trapdoor` lattice. Walls `light_blue_terracotta` (dusty-blue clapboard) y 3..6 and the front gable triangle; corner boards + head plate `stripped_birch_log` (white); a white frieze board `birch_slab` (top) under the front eave. Front (z 9), symmetrical about the party wall: doors x 4 and x 7 (both `bamboo_door`, tall: door y 3..4 + glass_pane transom y 5), windows x 2 and x 9 (1x3 floor-length, y 3..5, the New Orleans "shotgun" window) with `dark_oak_trapdoor` shutters full height on the OUTER side of each window only, at x 1 and x 10 (z 8, y 3..5). Party wall x 5..6 shows on the front as a 2-wide white pilaster `stripped_birch_log` y 3..6. Gable: 2-wide louvred vent `birch_trapdoor` (open) x 5..6 y 9, a sunburst of birch_slab rays round it. Porch: deck `dark_oak_planks` y 2; posts `stripped_birch_log` y 3..6 at x 1, 4, 7, 10 (z 7) — the steps x 5..6 between the two middle posts; beam `stripped_birch_log` axis x y 6; gingerbread brackets `birch_stairs` upside-down under the beam each side of each post; rail `birch_fence` y 3 except x 5..6. Sides x 1 / x 10: windows at z 11 and z 15 (z 12 and z 14 stay solid for the bed heads). Back (z 16): back doors x 2 and x 9, the twin stack between them.

**Plot 1 Creole cottage (x 15..22):** piers `bricks` with a continuous brick front plinth y 1 under the galerie. Walls `cherry_planks` (pink painted board) y 3..6; corner boards and head plate `stripped_dark_oak_log`. Front (z 10, under the galerie): TWO pairs of French doors, x 16..17 and x 20..21 (`dark_oak_door` pairs, hinges outward, y 3..4) each with a glass_pane transom y 5 and board-and-batten shutters `warped_trapdoor` (green) folded flat beside each pair at x 15/x 18 and x 19/x 22 (z 9, y 3..5); x 18..19 between the pairs plain wall. Galerie z 7..9: deck `dark_oak_planks` y 2, slim posts `dark_oak_fence` y 3..5 at x 15, 19, 22 (z 7) topped by a `stripped_dark_oak_log` beam axis x y 6 (the roof's front eave rests on it); low rail `dark_oak_fence` y 3 between posts except x 17..18 (steps). Ceiling of the galerie = the roof's underside (open, rafters show). Gable ends x 15 / x 22: cherry boards to the ridge, a 1x1 attic window at z 12 y 9 (east only; west is the stack). West wall windows z 11 and z 16 (clear of the stack z 12..14); east wall windows z 12 and z 15. Back (z 17): windows x 17 and x 20 y 4..5, no back door. The brick stack stands proud on the west gable, `bricks` with a `deepslate_bricks` band, running up beside the verge to y 14.

**Plot 2 American Foursquare (x 27..34):** brick foundation `bricks` y 1..2 continuous (no piers: a 1910s house). Walls `yellow_terracotta` (ochre clapboard) y 3..11; corner boards `stripped_birch_log`; a white belt course `birch_slab` (top) at y 7 flush round all four sides (the floor line); a frieze board `stripped_birch_log` axis x/z at y 11 under the deep eave. Front (z 9): door x 30 (`spruce_door`, y 3..4) with a glass sidelight x 29 (y 3..4) and transom y 5 x 29..30; window x 28; a 2-wide window x 32..33 (y 4..5). Upper (z 9): windows x 28..29 and x 32..33 (2-wide pairs, y 9..10). Dormer (z 10 face): windows x 30..31 y 13, walls `yellow_terracotta`, corners birch. Porch: deck `dark_oak_planks` y 2; columns at x 27 and x 34 and x 31 (z 7): `bricks` pedestal y 3, `stripped_birch_log` square column y 4..5, beam `stripped_birch_log` y 6; balustrade `birch_fence` y 3 except steps x 29..30; brick cheeks (brick_wall) each side of the steps at x 28 and x 31 z 6. Sides: west x 27 windows z 10 and z 15 (y 4..5) and z 10, z 15 (y 9..10), chimney between at z 11..13; east x 34 windows z 11, z 14 both storeys. Back (z 16): door x 32 (to a slab stoop z 17), windows x 29 y 4..5, x 29 and x 32 y 9..10.

**Plot 3 Queen Anne (x 37..46), the superintendent's:** foundation `stone_bricks` y 1..2 continuous (`mossy_stone_bricks` 1 in 10 at the base). Ground storey walls `crimson_planks` (plum clapboard) y 3..6; a `stripped_birch_log` belt y 7; upper storey y 8..11 **fishscale shingle**: alternate rows of `birch_planks` and `birch_slab` (top, set flush) every other course — cream against the plum; gable triangle (z 9, y 12..13) the same fishscale with a 1x1 round vent (`birch_trapdoor`). Corner boards `stripped_birch_log`. Front (z 9, x 39..42): double door x 41..42 (`dark_oak_door` pair, y 3..4) with stained transom `orange_stained_glass_pane` y 5; window pair x 39..40 (y 4..5) in a shallow bay: a `birch_slab` (top) hood y 6 at z 8 over it; upper window pair x 40..41 y 9..10. Tower (x 43..46, z 7..10): plum ground stage y 3..6, fishscale stage y 8..11, open belvedere y 12..15: windows on all three exposed faces at every stage — north face x 44..45 (y 4..5, y 9..10), east face z 8..9 (y 4..5, y 9..10), and in the belvedere glass_pane all round x 44..45 / z 8..9 y 13..14 with `birch_fence` mullion corners; string course `birch_slab` (top) at y 12 proud 1 round the tower; tower cap above. Porch: deck `dark_oak_planks` y 2; turned posts at (37,7), (40,7), (37,10), (37,14); the front leg ends against the tower wall x 43 (no post there): posts `stripped_birch_log` y 3 base, `birch_fence` y 4..5 (the turned shaft), beam `stripped_birch_log` y 6; spindle frieze `birch_trapdoor` (top, closed) hung under the beam between posts; brackets `birch_stairs` upside-down at each post; balustrade `birch_fence` y 3 except the steps x 41..42 and a side exit at x 37..38 z 14 (step south to the garden). West wall x 39: windows z 11 and z 14 (both storeys), a 2-wide stained window `orange_stained_glass_pane` z 12..13 y 9..10 at the stair landing. East wall x 45: windows z 12 and z 15 (both storeys). Back (z 16): back door x 44 y 3..4 (slab stoop z 17), windows x 39 y 4..5 and y 9..10; the brick stack x 40..42 with `deepslate_bricks` band and 2 corbelled courses (constant width, no crown).

**Plot 4 gable-front-and-wing (x 49..58):** piers `cobblestone` (1 in 10 mossy), skirting `oak_fence`. Walls `cyan_terracotta` (blue-grey painted clapboard); corner boards + head plates `stripped_birch_log`; gable block walls y 3..8 (knee course y 8), wing walls y 3..6. Front gable face (z 9, x 53..58): two tall windows x 54 and x 57 (y 4..5), attic pair x 55..56 y 9..10, a `birch_trapdoor` vent x 55..56 y 11; verge boards birch. Wing front (z 12, x 49..53): door x 51 (`spruce_door`) y 3..4, window x 50 y 4..5; gable block west wall (x 53) at z 10: second door onto the porch, `spruce_door` y 3..4. Porch: deck `dark_oak_planks` y 2; posts `stripped_birch_log` y 3..6 at (49,9), (52,9), (49,11); rail `birch_fence` y 3 except x 51..52 at z 9 (steps). East wall x 58: windows z 11 and z 14 (y 4..5), z 12 y 9 (attic). Wing west end x 49: window z 14 y 4..5, small gable vent z 14 y 8. Back: the wing's back wall carries the stack x 50..52; gable block back (z 16): door x 55 y 3..4 (slab stoop z 17), window x 57 y 4..5.

**Plot 5 mule barn (x 61..70):** barn floor packed: `coarse_dirt`/`packed_mud` y 0, stand y 1; plinth `cobblestone` y 1 round the walls except doors. Walls y 2..5 vertical board-and-batten: `stripped_dark_oak_log` axis y field with `stripped_spruce_log` axis y battens at every corner and at x 63, 66 on the gables; head plate `stripped_spruce_log` y 5. Front gable (z 9): big doors x 64..65 (opening y 1..3: `spruce_door` pair y 1..2 + a `stripped_spruce_log` beam above at y 4, y 3 open as a transom of `spruce_trapdoor` open); loft door x 64..65 y 8..9 (opening, `spruce_trapdoor` doors folded open on the wall either side at x 63 / x 66), hay hoist beam `spruce_fence` y 10 at z 8 x 64..65 with an `iron_chain` + lantern hook. Small windows (open `spruce_trapdoor` shutters, no glass) at stall heads: west x 61 z 11 and z 13 y 3; east x 68 z 11 y 3 (under the lean-to roof: a feed hatch). Back (z 15): door x 64..65 y 1..2 to the paddock. Lean-to: posts `stripped_spruce_log` y 1..3 at (70, 9), (70, 12), (70, 15); open front and east; wagon parked inside x 69..70 z 9..12 (bed of `spruce_slab` top y 2, wheels `dark_oak_trapdoor` open on the sides y 1..2, tongue `spruce_fence` at (69, 1, 13)); smithing table (69, 14), cauldron (69, 15) as the leather worker's tub. Paddock: `spruce_fence` y 1 along z 16 x 66..70 with a `spruce_fence_gate` at x 64..65 z 16 (barn back doors open into it), water trough `water_cauldron` (68, 17), composter (61, 17), hay bale (62, 17), coarse_dirt + podzol ground.

**Plot 6 bake-oven and cistern yard (x 72..83):** ground gravel + coarse_dirt, a `dirt_path` from the gate x 77..78 straight to the pavilion and on to the oven apron. Pavilion: 6 posts `stripped_oak_log` y 1..4 at (74,7), (81,7), (74,9), (81,9), (74,11), (81,11); plates `stripped_oak_log` axis x y 4 along z 7 and z 11, ties axis z at x 74 and x 81; floor `dark_oak_planks` y 0 (flush with ground). Long table `spruce_slab` (top) on `spruce_fence` legs, y 1 over x 76..79 z 9; benches `spruce_stairs` along z 8 and z 10 (x 76..79), seats facing the table. Oven: plinth `cobbled_deepslate` y 1 x 73..77 z 14..17; brick walls `bricks` y 2..3; vault crown y 4 (upside-down brick_stairs inward + brick_slab); mouth x 75 z 14 y 2..3 open north with a `brick_stairs` upside-down lintel at y 4 over it (proud 1 at z 13 is NOT allowed: keep it in the wall line); chamber x 74..76 z 15 y 2..3 air; fire at the back x 75 z 16 y 2 (lit campfire, hay_block in the plinth y 1 under it); flue x 75 z 16 y 3..8, the stack `bricks` x 74..76 z 16..17 with `deepslate_bricks` band y 7, mouth open at y 9 (top of masonry y 8). Peel rack: `spruce_trapdoor` shelves on the stack's side x 73 y 3; flour sacks (`white_wool`) + barrels at (73,13) and (77,13). Water tank: legs `stripped_spruce_log` y 1..4 at (79,14), (82,14), (79,17), (82,17), X-braces `spruce_fence` y 2..3 between the north legs; platform `spruce_planks` y 5 x 79..82 z 14..17; staves `spruce_planks` y 6..8 ring with a `stripped_spruce_wood` hoop course y 7, interior x 80..81 z 15..16 water y 6..7; lid y 9 (see ROOFS); a `ladder` up the west side: on a `stripped_spruce_log` post at (79, 16) y 1..4 and the stave above, facing west at (78, 16) y 1..8. Spout: `spruce_trapdoor` + water_cauldron tap at (80, 13) y 1, rain barrels `barrel` facing up at (79,13), (82,13), (81,13).

**Plot 7 company duplex (x 85..94):** foundation `bricks` y 1..2 continuous. Walls `bricks` y 3..11, a `stone_bricks` water table y 2 and `smooth_stone_slab` (top) sills; lintels: `stone_brick_slab` (top) flush over every opening; a `stone_bricks` belt y 7; cornice `stone_brick_stairs` upside-down facing out under the eave y 11, proud 1. Party wall shows on the front as a 2-wide brick pier x 89..90 rising full height. Front (z 9), mirrored: doors x 88 and x 91 (`dark_oak_door`, y 3..4, transom y 5); windows x 86..87 and x 92..93 (2 wide, y 4..5); upper: doors x 88 and x 91 (y 8..9) out to the gallery, windows x 86..87 and x 92..93 (y 9..10). Two-storey porch: square 1x1 brick piers `bricks` y 3..11 at x 85, 89, 90, 94 (z 7) — the middle pair x 89..90 divides the two families' porches; lower deck `dark_oak_planks` y 2, gallery deck `dark_oak_planks` y 7 over z 7..8 (its underside the lower porch ceiling); railings `birch_fence` y 3 (gap x 88 and x 91 = each unit's step) and y 8 full; a solid `bricks` divider on the gallery at x 89..90 already the pier. Sides x 85 / x 94: windows z 11 and z 14 both storeys. Back (z 16): blank brick behind the two stacks x 86..88 / x 91..93; no back door (light from the side windows).

## MATERIALS

| role | block |
|---|---|
| ground | grass_block 60%, coarse_dirt 25%, podzol + rooted_dirt by fences/barn/oven, packed_mud barn floor, gravel yard (6) |
| lane | gravel centre, dirt_path ruts, coarse_dirt edges |
| piers / foundations | bricks (0, 1, 2, 7), stone_bricks + mossy_stone_bricks (3), cobblestone + mossy_cobblestone (4, barn plinth) |
| porch decks | dark_oak_planks (kit 1 oak, kit 2 spruce) |
| interior floors | jungle_planks (houses), spruce_planks (barn loft) |
| 0 walls / trim / shutters / door / rail | light_blue_terracotta / stripped_birch_log + birch_slab + birch_stairs / dark_oak_trapdoor / bamboo_door / birch_fence |
| 1 walls / trim / shutters / doors / posts+rail | cherry_planks / stripped_dark_oak_log / warped_trapdoor / dark_oak_door / dark_oak_fence |
| 2 walls / trim / door / columns / rail | yellow_terracotta / stripped_birch_log + birch_slab / spruce_door / bricks + stripped_birch_log / birch_fence + brick_wall |
| 3 walls / shingle / trim / doors / glass / posts | crimson_planks / birch_planks + birch_slab (fishscale) / stripped_birch_log + birch_trapdoor + birch_stairs / dark_oak_door / glass_pane + orange_stained_glass_pane / stripped_birch_log + birch_fence |
| 4 walls / trim / doors / rail | cyan_terracotta / stripped_birch_log + birch_trapdoor / spruce_door / birch_fence, skirting oak_fence |
| 5 barn walls / battens / doors / lean-to | stripped_dark_oak_log / stripped_spruce_log / spruce_door + spruce_trapdoor / dark_oak_stairs roof |
| 6 pavilion / oven / tank | stripped_oak_log + spruce_slab + spruce_stairs / bricks + cobbled_deepslate + brick_stairs + brick_slab + deepslate_bricks / stripped_spruce_log + spruce_planks + spruce_slab + ladder |
| 7 walls / dressings / door / rail | bricks / stone_bricks + stone_brick_slab + stone_brick_stairs + smooth_stone_slab / dark_oak_door / birch_fence |
| roofs | 0 red_nether_brick; 1 dark_oak; 2 nether_brick + polished_blackstone_brick ridge; 3 slate palette + copper tower cap; 4 mud_brick; 5 barn-red; 6 dark_prismarine; 7 stone_brick + polished_andesite ridge. None repeats a kit 1/2 roof. |
| chimneys | bricks + deepslate_bricks band, flue walled; fire = lit campfire (signal_fire) with hay_block in the floor below; above the roof masonry only, constant width |
| glass | glass_pane; orange_stained_glass_pane transom/landing (3 only) |
| front pickets | 0 birch_fence, 1 dark_oak_fence, 2 birch_fence, 3 birch_fence with stone_bricks gate piers, 4 oak_fence, 5 spruce_fence, 6 dark_oak_fence, 7 brick_wall low wall; side columns spruce_fence y 1 |
| yards | campfire, hay_block, barrel, water_cauldron, cauldron, composter, smithing_table, white_wool, iron_chain, lantern |
| light | lantern (hanging under porch ceilings, from loft/ceiling beams, standing on fence posts and tables) |

Checked with `mcd blocks --check`: all known (26.3) except `chain` (use `iron_chain`).

## OPENINGS

(x, y, z; doors 1 wide x 2 high; windows glass_pane; "door" includes both halves)

| plot | opening | coords |
|---|---|---|
| 0 | front doors + transoms | x 4 and x 7, y 3..4 (+ y 5 glass), z 9 |
| 0 | front tall windows | x 2 and x 9, y 3..5, z 9 |
| 0 | gable vent | x 5..6, y 9, z 9 |
| 0 | side windows | x 1 and x 10 at z 11 and z 15, y 4..5 |
| 0 | back doors | x 2 and x 9, y 3..4, z 16 |
| 0 | hearth mouths | x 4 and x 7, y 3, z 16 (chimney part cuts them) |
| 0 | partition doors (front room to back room, partition z 13) | x 4 and x 7, y 3..4, z 13 |
| 1 | French door pairs + transoms | x 16..17 and x 20..21, y 3..4 (+ y 5 glass), z 10 |
| 1 | west windows | x 15 at z 11 and z 16, y 4..5 |
| 1 | east windows | x 22 at z 12 and z 15, y 4..5; attic x 22 z 12 y 9 |
| 1 | back windows | x 17 and x 20, y 4..5, z 17 |
| 1 | hearth mouth | x 15, y 3, z 13 |
| 2 | front door / sidelight / transom | door x 30 y 3..4; sidelight x 29 y 3..4; transom x 29..30 y 5; z 9 |
| 2 | front windows | x 28 y 4..5; x 32..33 y 4..5; x 28..29 and x 32..33 y 9..10; z 9 |
| 2 | dormer windows | x 30..31, y 13, z 10 |
| 2 | side windows | x 27 at z 10, z 15; x 34 at z 11, z 14; y 4..5 and y 9..10 |
| 2 | back door / windows | door x 32 y 3..4; windows x 29 y 4..5, x 29 and x 32 y 9..10; z 16 |
| 2 | hearth mouth | x 27, y 3, z 12 |
| 3 | front double door / transom | x 41..42, y 3..4 / y 5, z 9 |
| 3 | front windows | x 39..40 y 4..5; x 40..41 y 9..10; z 9 |
| 3 | tower windows | north x 44..45 z 7 at y 4..5 and y 9..10; east x 46 z 8..9 at y 4..5 and y 9..10; belvedere x 44..45 at z 7, x 46 at z 8..9 and x 43 at z 8..9, y 13..14 (glazed on all three exposed faces) |
| 3 | west windows | x 39 at z 11 and z 14, y 4..5 and y 9..10; stained pair z 12..13 y 9..10 |
| 3 | east windows | x 45 at z 12 and z 15, y 4..5 and y 9..10 |
| 3 | back door / windows | door x 44 y 3..4; window x 39 y 4..5 and y 9..10; z 16 |
| 3 | hearth mouth | x 41, y 3, z 16 |
| 4 | front gable windows | x 54 and x 57 y 4..5; x 55..56 y 9..10; vent x 55..56 y 11; z 9 |
| 4 | porch doors | wing x 51 y 3..4 z 12; gable block west wall x 53 y 3..4 z 10 |
| 4 | wing window | x 50 y 4..5 z 12; west end x 49 z 14 y 4..5 |
| 4 | east windows | x 58 at z 11 and z 14 y 4..5; z 12 y 9 |
| 4 | back door / window | door x 55 y 3..4 z 16; window x 57 y 4..5 z 16 |
| 4 | hearth mouth | x 51, y 3, z 16 |
| 5 | barn front doors | x 64..65, y 1..3, z 9 |
| 5 | loft door | x 64..65, y 8..9, z 9 |
| 5 | back doors to paddock | x 64..65, y 1..2, z 15 |
| 5 | stall hatches (shuttered, no glass) | x 61 at z 11 and z 13, y 3; x 68 z 11 y 3 |
| 5 | paddock gate | x 64..65, y 1, z 16 |
| 6 | oven mouth | x 75, y 2..3, z 14 |
| 7 | front doors + transoms | x 88 and x 91, y 3..4 (+ y 5), z 9 |
| 7 | front windows | x 86..87 and x 92..93, y 4..5 and y 9..10, z 9 |
| 7 | gallery doors | x 88 and x 91, y 8..9, z 9 |
| 7 | side windows | x 85 and x 94 at z 11 and z 14, y 4..5 and y 9..10 |
| 7 | hearth mouths | x 87 and x 92, y 3, z 16 |
| all | gates in the front fence | x 12i+5..6, y 1, z 5 |

## RESERVED

The shell leaves these as air / unbuilt; the named part builds them.

| what | coords | part |
|---|---|---|
| chimney stacks (whole column from footing y 1 to top; fire 1 outside the wall at stand level y 3 on a hay_block in the deck layer y 2; flue 1x1 up to the mouth) | 0: x 3..8 z 17..18, fires (4,3,17) and (7,3,17), top y 10; 1: x 13..14 z 12..14, fire (14,3,13), top y 14; 2: x 25..26 z 11..13, fire (26,3,12), top y 16; 3: x 40..42 z 17..18, fire (41,3,17), top y 16; 4: x 50..52 z 17..18, fire (51,3,17), top y 12; 6: oven stack x 74..76 z 16..17, fire (75,2,16), top y 8 (mouth y 9); 7: x 86..88 and x 91..93 z 17..18, fires (87,3,17) and (92,3,17), top y 15 | chimney (`chimney(g, { wall, into, top })` with wall = the mouth cell, into = the room side) |
| stair flights (flight(): top step IN the upper floor y 7) | 2: x 33, z 15→11 facing north, steps y 3..7, hole in floor y 7 x 33 z 11..14, step out at z 10, rail x 32 z 11..14 y 8; 3: x 44, z 15→11 facing north, hole y 7 x 44 z 11..14, landing z 10 (lit by the stained window); 4 (attic): x 54, z 15→11 facing north, hole y 7 x 54 z 11..14, out at z 10; 7 west: x 88, z 15→11 facing north, hole y 7 x 88 z 11..14; 7 east: x 91, z 15→11 facing north, hole y 7 x 91 z 11..14; 5 loft: ladder on the inside of the west wall x 62, z 14, y 1..6, hole in the loft floor (62, 6, 14) | stairs |
| front steps (top level with deck y 2) | 0: x 5..6 z 6; 1: x 17..18 z 6; 2: x 29..30 z 6; 3: x 41..42 z 6; 4: x 51..52 z 8; 7: x 88 and x 91 z 6 | porch |
| porch posts and piers | as listed in FACADES (on z 7, plot 4 on z 9/x 49) | porch |
| tower stage floors | 3: y 7 (x 44..45 z 8..9, joined to the upper hall), y 12 (belvedere floor, reached by a ladder on the tower's inner west wall: ladder at (44, 8..12, 9) facing east against (43, y, 9), hole (44, 12, 9) with an open trapdoor) | stairs |
| beds (whole, head to a solid wall, 2 clear above) | 0: per unit 2 — west unit: head (2, 3, 12) foot (3, 3, 12) facing west, head (2, 3, 14) foot (3, 3, 14) facing west; east unit mirrored: heads (9, 3, 12) and (9, 3, 14) facing east; 1: 4 — east chamber 2 beds, the furnisher places them, heads to the solid east wall x 22 (z 11, z 13 are solid there) and the back wall z 17 in the cabinets; 2: upstairs 4 (2 bedrooms, heads to the west wall x 27 at z 12..13 and east x 34 at z 12..13 between windows); 3: upstairs 3 + 1 in the tower room; 4: attic 2 (heads to the knee walls under the ridge ends z 16) + ground bedroom 1; 7: per unit 2 upstairs + 1 down (heads to the party wall x 89 / x 90) | furnisher |
| barn stalls | stall partitions `spruce_fence` y 1..2 at z 12 for x 62..63 and x 66..67; stall fronts on the aisle `spruce_fence` y 1 at x 63 and x 66 with `spruce_fence_gate`s at (63, 1, 11), (63, 1, 13), (66, 1, 11), (66, 1, 13); hay_block feed racks at the stall heads x 62 / x 67 z 10 and z 14; loft hay bales stacked y 7..8 x 62..63 and x 66..67 | barn fit-out |
| loft floor | `spruce_planks` y 6 over x 62..67 z 10..14, with the ladder hole (62, 6, 14) and a hay drop hole over the aisle (64..65, 6, 12) | barn fit-out |
| pavilion table and benches | x 76..79 z 8..10 y 1 | yard |
| tank water | x 80..81 z 15..16 y 6..7 | yard |

## FLOORS

| mass | floor (block / stand) | interior volume (air) | rooms |
|---|---|---|---|
| 0 west unit | y 2 / y 3 | x 2..4, y 3..6, z 10..15; partition z 13 (door x 4) | front room (bed, table) z 10..12; back kitchen-bedroom z 14..15 (stove by the hearth at x 4 z 16, bed) |
| 0 east unit | y 2 / y 3 | x 7..9, y 3..6, z 10..15; partition z 13 (door x 7) | mirror of the west |
| 0 porch | y 2 / y 3 | x 1..10, z 7..8, y 3..5 | shared porch: two rockers (stairs), a lantern under the eave |
| 1 Creole | y 2 / y 3 | x 16..21, y 3..6, z 11..16; partition x 18 (door at z 15), cross partition z 14 (doors x 17 and x 20) | west salle (hearth on x 15 z 13, table, stove) x 16..17 z 11..13; east chamber x 19..21 z 11..13 (2 beds); rear cabinets z 15..16: west x 16..17 (1 bed), east x 19..21 (1 bed) |
| 1 galerie | y 2 / y 3 | x 15..22, z 7..9, y 3..5 | galerie: rockers, bench, hanging lanterns |
| 2 ground | y 2 / y 3 | x 28..33, y 3..6, z 10..15; partitions x 31 (z 10..12, door z 11) and z 13 (x 28..30, door x 29) | living (NW, fireplace x 27 z 12), dining (SW), stair hall (NE, stair x 33), kitchen (SE, stove by the back door) |
| 2 upper | y 7 / y 8 | x 28..33, y 8..11, z 10..15; partition x 31 and z 13 | 2 front bedrooms (2 beds each: NW x 28..30 z 10..12, NE x 32..33 with the stairwell), back bedroom + sewing room |
| 3 ground | y 2 / y 3 | x 40..44, y 3..6, z 10..15 + tower x 44..45 z 8..9; partitions x 42 (z 10..12) and z 13 | parlour (front, with the bay), stair hall (x 43..44), dining (back west), kitchen (back east, stove by the hearth x 41 z 16) |
| 3 upper | y 7 / y 8 | x 40..44, y 8..11, z 10..15 + tower room x 44..45 z 8..9 | master bedroom (front, opening into the tower room), 2 back bedrooms; 4 beds total |
| 3 belvedere | y 12 / y 13 | x 44..45, y 13..15, z 8..9 | lookout, lantern |
| 3 porch | y 2 / y 3 | front x 37..42 z 7..8, west x 37..38 z 9..14, y 3..5 | wraparound porch: swing (chains from the beam), rockers |
| 4 gable block ground | y 2 / y 3 | x 54..57, y 3..6, z 10..15; partition z 13 (door x 56) | parlour (front), bedroom (back) |
| 4 attic | y 7 / y 8 | x 54..57, y 8..10, z 10..15 (headroom ≥2 at x 55..56) | attic bedroom, 2 beds |
| 4 wing | y 2 / y 3 | x 50..52, y 3..6, z 13..15 | kitchen (hearth at x 51 z 16, table) |
| 4 porch | y 2 / y 3 | x 49..52, z 9..11, y 3..5 | porch in the angle: bench, wash stand |
| 5 barn ground | y 0 / y 1 | x 62..67, y 1..5, z 10..14 | 4 mule stalls (x 62..63 and x 66..67, z 10..11 and z 13..14), aisle x 64..65 |
| 5 hay loft | y 6 / y 7 | x 62..67, y 7..11, z 10..14 (under the gambrel) | hay loft: hay bales, loft door to the front |
| 5 lean-to | y 0 / y 1 | x 69..70, y 1..3, z 9..15 | wagon, smithing table, cauldron |
| 6 pavilion | y 0 / y 1 | x 74..81, y 1..3, z 7..11 | open pavilion, long table |
| 7 each unit ground | y 2 / y 3 | west x 86..88, east x 91..93; y 3..6; z 10..15; partition z 13 (door at x 86 / x 93) | front parlour, back kitchen (hearth at x 87 / x 92 z 16) |
| 7 each unit upper | y 7 / y 8 | same, y 8..11; partition z 13 | front bedroom (gallery door), back bedroom; 2–3 beds per unit |
| 7 gallery | y 7 / y 8 | x 85..94, z 7..8, y 8..10 (divided at x 89..90) | sleeping porch, rockers |

---
# DESIGNER SECTIONS (below the architect's form; nothing above is changed)

Corrections to ids (checked with `$MCD blocks --check`): the architect's `red_nether_brick`, `nether_brick`, `mud_brick` mean the plural full blocks **`red_nether_bricks`, `nether_bricks`, `mud_bricks`** (their `_stairs`/`_slab` keep the singular: `red_nether_brick_stairs`, `nether_brick_slab`, `mud_brick_stairs`). `chain` is `iron_chain`. Walls of `light_blue_terracotta`, `yellow_terracotta`, `cyan_terracotta` are the architect's; keep.

## PALETTE

By role (all verified):
- Ground: grass_block, coarse_dirt, podzol, rooted_dirt, dirt_path, gravel, packed_mud, stone (y -2), dirt (y -1).
- Piers/foundations: bricks (+brick_stairs, brick_slab, brick_wall); stone_bricks (+mossy_stone_bricks 1 in 10, stone_brick_stairs/slab/wall); cobblestone (+mossy_cobblestone, cobblestone_wall); cobbled_deepslate (+_stairs, _slab); deepslate_bricks (band).
- Decks/floors: dark_oak_planks (porch decks, + dark_oak_slab, dark_oak_stairs, dark_oak_fence, dark_oak_trapdoor, dark_oak_door); jungle_planks (house floors, + jungle_slab); spruce_planks (+spruce_slab, spruce_stairs, spruce_fence, spruce_fence_gate, spruce_trapdoor, spruce_door) barn loft, tables, pavilion.
- Walls: 0 light_blue_terracotta; 1 cherry_planks (+cherry_slab); 2 yellow_terracotta; 3 crimson_planks, birch_planks + birch_slab (fishscale); 4 cyan_terracotta; 5 stripped_dark_oak_log + stripped_spruce_log; 6 stripped_oak_log; 7 bricks.
- Trim: stripped_birch_log, stripped_birch_wood (cut ends), birch_slab, birch_stairs, birch_fence, birch_trapdoor, bamboo_door; stripped_dark_oak_log (1); stripped_oak_log (6); stone_bricks family (7); smooth_stone_slab (sills).
- Roofs: red_nether_bricks (+red_nether_brick_stairs, _slab) / dark_oak (planks, stairs, slab, the shingle mix) / nether_bricks (+_stairs, _slab) + polished_blackstone_brick_slab / slate palette: cobbled_deepslate, deepslate_tile or stone_brick stairs+slab (patterned grey) + stone_brick_slab ridge, copper tower cap: weathered_cut_copper, oxidized_cut_copper (+_stairs, _slab), copper_block / mud_bricks (+mud_brick_stairs, _slab) / barn-red palette (red_terracotta-style via `barn` preset) / dark_prismarine (+_stairs, _slab) / stone_bricks + polished_andesite_slab.
- Shutters/louvres: dark_oak_trapdoor (0), warped_trapdoor (1), spruce_trapdoor (5, 6), birch_trapdoor (vents, frieze).
- Glass: glass_pane, orange_stained_glass_pane (3).
- Fire/functional: campfire (lit true, signal_fire true), hay_block, furnace (lit), smoker (lit), iron_trapdoor (optional thin flue wall), cauldron, water_cauldron, composter, smithing_table, barrel, ladder, iron_chain, lantern, lightning_rod, white_wool, hay (hay_block bales), bell none.
- Beds (colours differ per house): 0 west blue_bed/east cyan_bed; 1 pink_bed; 2 yellow_bed; 3 purple_bed; 4 lime_bed; 7 west red_bed/east orange_bed.
- Plants: oak_leaves/jungle_leaves persistent true, azalea, lilac, peony, rose_bush, cornflower, poppy, dandelion, sunflower, short_grass, fern, hay for the paddock, wheat/farmland not needed.

## VOCABULARY

All helpers take absolute coordinates (the plot offset is 12*i already applied by the caller). `g` = the build grid. Doors: both halves, facing out of the house. Pane connections via the toolkit helpers.

- `lane_strip(g, x0, x1)`: z0 and z4 coarse_dirt, z1 and z3 dirt_path, z2 gravel, y0; fill y-2 stone, y-1 dirt.
- `lamp_post(g, x)`: spruce_fence y1..3 at z4 + standing lantern y4 (hanging false).
- `fence_run(g, plot, wood, gateX)`: side columns x12i and x12i+11 z5..18 spruce_fence y1; front picket z5 of `wood` (a fence or brick_wall) with a 2-wide gap x12i+5..6 filled by a `*_fence_gate` pair (or open path); back z18 spruce_fence except where a stack stands.
- `pier_line(g, x0, z0, x1, z1, block, skirt)`: piers y1 at ends and every 3rd, skirting between = `skirt` (open trapdoors on the face or a fence) y1.
- `clapboard_wall(g, box, field, corner, plate)`: wall y3..top of `field`, corner boards `corner` axis y, head plate axis x/z at y6 (and y11); a floor-line belt at y7 where the plan says; openings left AIR.
- `gable_infill(g, z, x0, x1, y0, y1, field)`: triangle of wall block inside a front gable, narrowing by 1 each side per course.
- `fishscale(g, box, a, b)`: rows alternate full `a` block course and top `b` slab course every other row (plot 3 upper storey).
- `window(g, x, y, z, face, w, h, sill)`: glass_pane w x h in the wall plane with connection states; top-slab sill one cell out (`smooth_stone_slab` / trim slab) unless a deck is there; lintel over.
- `door_unit(g, x, y, z, face, wood, transom)`: both halves, hinge left, facing out; glass_pane transom at y+2 if asked; step slab out.
- `french_pair(g, x0, y, z, face)`: two dark_oak_door halves, hinges outward at x0 and x0+1, transom of two glass_pane.
- `shutter(g, [x,y,z], face, wood, {height})` (toolkit): open trapdoor lying flat on the wall.
- `bracket(g, x, y, z, face, wood)`: upside-down `*_stairs` under a beam, facing along the beam (gingerbread / porch bracket).
- `porch_run(g, x0, x1, z0, z1, posts[], beam, rail, deck, deckY)`: deck at deckY, posts y3..5 (or the turned posts), beam y6 axis x, rail y3 with a gap at the steps, brackets at posts.
- `turned_post(g, x, z)`: stripped_birch_log y3, birch_fence y4..5 (a thin turned shaft), bracket pair at the top.
- `front_steps(g, x0, x1, z)`: `*_stairs` y1 facing south (the walking-up direction is north, so stairs face north; high side toward the deck), top level with deck y2; `facing` per the toolkit's `states`.
- `stair_run(g, from, facing, toY, material, width)` = `flight()`; top step flush in the upper floor layer y7; rail on the open side with a gap at the top.
- `ladder_run(g, x, y0, y1, z, facing)`: ladder on a solid wall block, one per block, trapdoor open on the hole.
- `chimney_stack(g, {wall|at, into, top, material, thin})` = `chimney()`: fire outside the wall at stand level y3 on a hidden hay_block in the deck layer y2 (campfire `lit:"true"`, `signal_fire:"true"`), mouth cut through the wall with an upside-down-stair lintel, flue 1x1 air walled all round, stack `bricks` constant width through the roof, `deepslate_bricks` band a little below the cap, cap a ring of brick_slab stepping out 1 (no crown), mouth 1-2 courses above the roof.
- `hearth_face(g, x, z, facing)`: inside the wall: stone_bricks surround (3 wide x 2 high), mouth cell air, upside-down stair lintel; a `brick_slab` hearth step in front (top slab).
- `stove(g, x, y, z)`: lit `furnace` (facing the room) or `smoker`, with a `iron_trapdoor` closed on top as a flue plate; stands beside the hearth wall.
- `bed_set(g, footXYZ, facing, colour)` = `bed()`; head toward `facing`, into a solid wall, 2 clear above.
- `table_set(g, x, y, z, len, dir)`: spruce_fence legs + top spruce_slab; `chair(g, x, y, z, facing)`: spruce_stairs.
- `dresser(g, x, y, z, facing)`: barrel + chest side by side with a pot on top; `shelf(g, x, y, z, face)`: top slab with flower_pot/decorated_pot/candle.
- `rocker(g, x, y, z, facing)`: dark_oak_stairs facing in, a spruce_trapdoor open behind as the back.
- `hanging_lantern(g, x, y, z)`: lantern hanging:true under a beam or iron_chain from the ceiling; `swing_seat(g, x0, x1, y, z)`: two iron_chain y(3..5) from the beam, a spruce_slab top seat.
- `mule_stall(g, x0, z0, dir)`: spruce_fence partition y1..2 + gate at the aisle, hay_block rack at the head, `hay` trough (barrel up), packed_mud floor.
- `hay_stack(g, box)`: hay_block stacked, a gap row; `wagon(g, x, z, dir)`: spruce_slab top bed y2 on 4 dark_oak_trapdoor open wheels, spruce_fence tongue.
- `water_tank(g, x0, z0)`: 4 stripped_spruce_log legs, spruce_planks platform y5, ring staves y6..8 with a stripped_spruce_wood hoop, water inside y6..7, slab/stair lid, ladder up the side.
- `bread_oven(g, x, z)`: cobbled_deepslate plinth, bricks walls, upside-down brick_stairs vault with brick_slab crown, mouth north 1 wide, inner chamber, hidden-hay lit campfire at the back, flue into the stack.
- `rain_barrels(g, xs, z)`: `barrel` facing up in a row, `water_cauldron` tap with a spruce_trapdoor spout.
- `picnic_table(g, x0, x1, z)`: top slab on fence legs y1 + spruce_stairs benches on both long sides, seats facing the table.
- `pavilion_posts(g, ...)`: stripped_oak_log y1..4 posts, plates axis x/z at y4.
- `rafter_tails(g, x, z0, z1, y)`: spruce_fence stubs every 2 under an eave.
- `garden_bed(g, box, flower)`: coarse_dirt + podzol bed edged with fence, flowers on grass/dirt only.
- `cornice(g, x0, x1, z, y)`: upside-down `stone_brick_stairs` facing out under the eave (plot 7).
- `quoin_corner(g, x, z)`: alternate stripped_birch_log / the field block (restraint: plots 2, 7 only).

## ROOMS

Floors: jungle_planks (houses; ground floor block y2, stand y3; upper floor block y7, stand y8), barn spruce loft y6. Every room lantern-lit (hanging from the head plate or tie beam, standing lanterns on tables), floor light >= 8. Boxes are inner air. Some architect doorway positions had to be resolved by the designer (noted per room).

| room | box [x0,y0,z0,x1,y1,z1] | purpose / ways in |
|---|---|---|
| P0 west front room | 2,3,10, 4,6,12 | bed (head 2,3,12 west) + table; door x4 z9; partition z13, door x4 z13 |
| P0 west back room | 2,3,14, 4,6,15 | bed (head 2,3,14 west), stove at (4,3,15) by hearth mouth (4,3,16); back door x2 z16 |
| P0 east front room | 7,3,10, 9,6,12 | mirror: bed head (9,3,12) east; door x7 z9; door x7 z13 |
| P0 east back room | 7,3,14, 9,6,15 | bed head (9,3,14), stove at (7,3,15); back door x9 z16 |
| P0 shared porch | 1,3,7, 10,5,8 | two rockers, lantern; steps x5..6 z6 |
| P1 galerie | 15,3,7, 22,5,9 | rockers, bench, hanging lanterns; steps x17..18 z6 |
| P1 salle | 16,3,11, 17,6,13 | hearth mouth (15,3,13), stove, table; French doors x16..17 z10; door x17 z14 to cabinet |
| P1 east chamber | 19,3,11, 21,6,13 | 2 beds: heads (21,3,11) and (21,3,13) facing east, foot x20; French doors x20..21 z10; door x20 z14 |
| P1 west cabinet | 16,3,15, 17,6,16 | 1 bed head (16,3,16) foot (16,3,15) facing south; door x17 z14; window west z16 |
| P1 east cabinet | 19,3,15, 21,6,16 | 1 bed head (21,3,16) foot (21,3,15); door x20 z14; door x18 z15 links the cabinets |
| P2 living room | 28,3,10, 30,6,12 | parlour, hearth (27,3,12) west wall; front door x30 z9; door x29 z13 to dining; door x31 z11 to the hall |
| P2 dining room | 28,3,14, 30,6,15 | table; open east x31 z14..15; door x29 z13 |
| P2 stair hall | 32,3,10, 33,6,12 | flight x33 z15->11; ways: door x31 z11, opening (32,3,13) to kitchen |
| P2 kitchen | 31,3,13, 32,6,15 | stove at (31,3,15); back door x32 z16; cupboard under the flight x33 |
| P2 front bedroom | 28,8,10, 30,11,12 | 2 beds heads (28,8,10),(28,8,11) west, foot x29; door (31,8,10) from the landing; door x29 z13 to back bedroom |
| P2 landing | 32,8,10, 33,11,10 | stair top x33 z11, rail x32 z11..14; door x31 z10 (moved from z11: the rail occupies x32 z11) |
| P2 back bedroom | 28,8,14, 33,11,15 | 2 beds heads (28,8,15) and (33,8,15) south, foot z14; door x29 z13; windows x29, x32 z16 above head height |
| P3 front porch + wrap | 37,3,7, 42,5,8 and 37,3,9, 38,5,14 | swing (chains from beam) at x39..40 z7, rockers; steps x41..42 z6; side exit z14 |
| P3 parlour | 40,3,10, 41,6,12 | bay window x39..40 z9, piano-free sitting room; opening x42 z10 to the hall |
| P3 stair hall | 42,3,10, 44,6,13 | double door x41..42 z9 (x42 is its cell); flight x44 z15->11; arch (43,3,14) |
| P3 kitchen-dining | 40,3,14, 43,6,15 | hearth mouth (41,3,16), stove (41,3,15), table; back door x44 z16 opens onto the flight foot (44,3,15); opening x42..43 z13 from the hall |
| P3 master bedroom | 40,8,10, 42,11,12 | 1 bed head (40,8,11) west; opens at (43,8,10); tower-room window |
| P3 upper landing | 43,8,10, 44,11,13 | stair top, hole x44 z11..14, rail; to tower room via ladder cell (44,8,9) |
| P3 back bedroom | 40,8,14, 43,11,15 | 2 beds heads (40,8,15),(42,8,15) south; door (42,8,13) |
| P3 tower room | 44,8,8, 45,11,9 | 1 bed head (45,8,8) foot (44,8,8) east, ladder (44,8..12,9); windows N and E |
| P3 belvedere | 44,13,8, 45,15,9 | lookout, lantern, glazed all round; ladder from (44,12,9) |
| P4 porch in the angle | 49,3,9, 52,5,11 | bench, wash stand; steps x51..52 z8; doors x51 z12 and (53,3..4,10) |
| P4 parlour | 55,3,10, 57,6,12 | front room of the gable block; west door (53,3,10) -> (54,3,10); partition z13 door x56 |
| P4 ground bedroom | 55,3,14, 57,6,15 | 1 bed head (57,3,15) foot (56,3,15) east; back door x55 z16 |
| P4 stair strip | 54,3,10, 54,6,15 | flight x54 z15->11, step out (54,3,10)->(54,8,10) |
| P4 wing kitchen | 50,3,13, 52,6,15 | hearth mouth (51,3,16), stove (52,3,15), table; door x51 z12 |
| P4 attic bedroom | 54,8,10, 57,10,15 | 2 beds heads (55,8,15),(56,8,15) south, foot z14; headroom at x55..56; stair top (54,8,10) |
| P5 barn aisle + stalls | 62,1,10, 67,5,14 | four stalls x62..63 and x66..67 (z10..11, z13..14), aisle x64..65, door x64..65 z9 and back z15 |
| P5 hay loft | 62,7,10, 67,11,14 | hay bales, loft door x64..65 z9 y8..9, ladder (62,y1..6,14) |
| P5 wagon lean-to | 69,1,9, 70,3,15 | wagon (z9..12), smithing table (69,1,14), cauldron (69,1,15); open on 2 sides |
| P6 pavilion | 74,1,7, 81,3,11 | long table x76..79 z9, benches z8 and z10; path from gate x77..78 |
| P6 oven court | 73,1,13, 77,3,13 | apron y0 z13, flour sacks and barrels, peel rack; mouth (75,2..3,14) |
| P7 west parlour | 86,3,10, 88,6,12 | bed head (86,3,10) foot (87,3,10) west; front door x88 z9; door x86 z13 to kitchen; flight starts x88 z15 |
| P7 west kitchen | 86,3,14, 87,6,15 | hearth (87,3,16), stove (87,3,15); table; stair foot (88,3,15) east of it |
| P7 west bedroom front | 86,8,10, 88,11,12 | bed head (86,8,10) foot (87,8,10) west; gallery door x88 z9 |
| P7 west bedroom back | 86,8,14, 87,11,15 | bed head (86,8,15) foot (87,8,15) west; door x86 z13; landing x88 |
| P7 east parlour / kitchen / bedrooms | 91,3,10, 93,6,12 / 92,3,14, 93,6,15 / 91,8,10, 93,11,12 / 92,8,14, 93,11,15 | mirror of the west unit: beds heads x93 facing east; door x93 z13; hearth (92,3,16); flight x91 |
| P7 gallery | 85,8,7, 94,10,8 | sleeping porch, rockers; two units divided by the pier x89..90 |

Stairs: P2 x33 z15->11 (steps y3..7); P3 x44 z15->11; P4 x54 z15->11; P7 x88 and x91 z15->11; barn ladder x62 z14 y1..6; tower ladder (44, 8..12, 9) facing east; tank ladder x78 z16.

## PARTS

1. **Shell A, plots 0-3**: `parts/shell_a.mjs`. Piers/foundations, decks, ground and upper floors (leave stair holes), walls with corner boards and plates, partitions, stair flights, tower stages, every opening left AIR.
2. **Shell B, plots 4-7**: `parts/shell_b.mjs`. Same for plot 4 and 7; plot 5 barn crib walls, plinth, stall partitions, loft floor, lean-to posts; plot 6 pavilion posts and plates, oven plinth + walls + vault, tank legs/platform/staves.
3. **Roofs**: `parts/roofs.mjs`. roof.json per building (trusses in each trim log), porch roofs, dormer, tower cap, lean-to, tank lid; leave `keep` for stacks.
4. **Fittings**: `parts/fittings.mjs`. Windows, doors, French pairs, shutters, brackets, porch posts/rails, front steps, gable vents, signs, hoist beam, lanterns on porches; fishscale shingle on plot 3.
5. **Chimneys, hearths and ovens**: `parts/chimneys.mjs`. 9 stacks + oven stack via chimney(), hearth faces, stoves, the oven fire; after the roofs.
6. **Grounds and yards**: `parts/grounds.mjs`. Lane, lamp posts, fences, gates, paths, paddock, trough, composter, hay, garden beds, rain barrels, wagon, benches, planting.

## Notes for workers

- Keep every opening and RESERVED cell as AIR in parts 1-2; part 4 fills openings, part 5 builds stacks after roofs cut back.
- Nothing crosses x12i / x12i+11 below y7; eaves and stacks above y7 stay in the plot. Run `$MCD check`, `fit --rooms`, `walk`, `light`.
- Stacks: `chimney(g, { wall: [x,3,z], into: "north", top })` for back-wall hearths (z16 mouth, fire z17); plot 1 wall (15,3,13) into "east" (fire (14,3,13)); plot 2 wall (27,3,12) into "east" (fire (26,3,12)); oven `{ at: [75,2,16], ... }`. Roof stops against the stack.
- Architect doorway conflicts resolved above: P2 upper door at z10 not z11 (rail at x32); P3 partition x42 only z11..12; P7 partitions z13 span x86..87 / x92..93 because the flights fill x88 / x91.
- Beds: heads to solid wall cells (y8 or y3 solid even where a window sits above), two clear above.
```

### elements.md

```markdown
# Required elements (mill village kit 3)

Coordinates from plan.md. Parts: P1 shell A (plots 0-3), P2 shell B (4-7), P3 roofs, P4 fittings, P5 chimneys/hearths/ovens, P6 grounds. Roof blocks use the plural ids red_nether_bricks / nether_bricks / mud_bricks.

## Whole site
- [ ] Lane x0..95 z0..4: gravel z2, dirt_path z1 and z3, coarse_dirt z0 and z4, y0; fill y-2 stone, y-1 dirt. P6 `lane_strip`.
- [ ] Lantern posts x=0,12,..,84,95 z4: spruce_fence y1..3 + standing lantern y4. P6 `lamp_post`.
- [ ] Plot fences: side columns x12i, x12i+11 z5..18 spruce_fence y1; front picket z5 with 2-wide fence_gate x12i+5..6; back z18. P6 `fence_run`.
- [ ] Module cut: nothing crosses x12i / x12i+11 below y7; eaves and stacks inside the plot. All parts.
- [ ] Every room lit (floor light >= 8), porches hanging lanterns, no mob spawn. P4 `hanging_lantern`.

## Plot 0 double shotgun (x1..10)
- [ ] Two 3-wide units x2..4 / x7..9, z10..15 under one front gable, party wall x5..6 full height, light_blue_terracotta clapboard, birch trim. P1 `clapboard_wall`, `pier_line`.
- [ ] Two front doors x4, x7 (bamboo_door + glass transom y5), floor-length windows x2, x9 y3..5 with dark_oak_trapdoor shutters outer side only. P4 `door_unit`, `window`, `shutter`.
- [ ] Shared porch x1..10 z7..8, posts x1,4,7,10, beam y6, gingerbread brackets, shed roof, steps x5..6. P4 `porch_run`, `bracket`, `front_steps`; P3.
- [ ] Gable louvre vent x5..6 y9 (open birch_trapdoor) with birch_slab sunburst. P4.
- [ ] Red_nether_bricks front-gable roof, birch verge, king-post truss. P3.
- [ ] Twin back stack x3..8 z17..18, flues x4 and x7, fires (4,3,17),(7,3,17), hearth mouths (4,3,16),(7,3,16), top y10. P5 `chimney_stack`.
- [ ] 4 beds (2 per unit, heads to outer walls), stoves (4,3,15),(7,3,15), tables. Furnishers.

## Plot 1 Creole cottage (x15..22)
- [ ] Side-gable cherry_planks body z10..17, engaged galerie z7..9 under the same roof plane, dark_oak slim posts x15,19,22, beam y6. P1/P3/P4.
- [ ] Steep dark_oak roof with bellcast kick slab row at the front eave, open rafters over the galerie. P3.
- [ ] Two French-door pairs x16..17, x20..21 z10, warped_trapdoor shutters. P4 `french_pair`.
- [ ] West gable-end exterior chimney x13..14 z12..14 fire (14,3,13), top y14, bricks + deepslate band. P5.
- [ ] 4 beds (east chamber 2, two cabinets 1 each), salle stove. Furnishers.

## Plot 2 Foursquare (x27..34)
- [ ] Two-storey yellow_terracotta box y3..11, brick foundation y1..2, birch belt y7, frieze y11. P1.
- [ ] Hipped nether_bricks roof, deep eave, polished_blackstone_brick ridge; front hipped dormer x29..32 y12..15 with windows x30..31 y13. P3.
- [ ] Full-width porch z7..8: bricks pedestals + birch columns x27,31,34, hip porch roof y7..8, brick_wall cheeks at the steps. P4 `porch_run`.
- [ ] Stair x33 z15->11 y3..7 with rail x32 z11..14. P1 `stair_run`.
- [ ] West chimney x25..26 z11..13 fire (26,3,12), top y16. P5.
- [ ] 4 beds upstairs; stoves; back stoop z17. Furnishers.

## Plot 3 Queen Anne (x37..46)
- [ ] Plum crimson_planks ground storey, birch fishscale shingle upper storey and gable. P1/P4 `fishscale`.
- [ ] Steep slate hip + front cross gable x39..42, valley. P3.
- [ ] Corner tower x43..46 z7..10, 3 stages, glazed belvedere y13..14, copper cone cap to y22 with lightning_rod, string course y12. P1/P3/P4.
- [ ] Wraparound porch: front z7..8 x37..42, west leg x37..38 z9..14; turned posts (37,7),(40,7),(37,10),(37,14); spindle frieze birch_trapdoor; brackets; swing. P4 `turned_post`, `swing_seat`.
- [ ] Orange stained transom and landing window. P4.
- [ ] Back chimney x40..42 z17..18 fire (41,3,17), top y16, deepslate band, 2 corbelled courses. P5.
- [ ] 4 beds (master 1, back 2, tower room 1). Furnishers.

## Plot 4 gable-front-and-wing (x49..58)
- [ ] Front gable block x53..58 (1.5 storey) cyan_terracotta, mud_bricks steep gable roof, verge birch. P1/P3.
- [ ] Side wing x49..53 z12..16, lower side-gable roof dying into the block. P1/P3.
- [ ] Porch in the angle x49..52 z9..11, posts (49,9),(52,9),(49,11), shed roof, steps x51..52 z8. P4.
- [ ] Attic stair x54 z15->11; attic bedroom 2 beds. P1.
- [ ] Back chimney x50..52 z17..18 fire (51,3,17), top y12. P5.

## Plot 5 mule barn + wagon shed (x61..70)
- [ ] Barn 4 stalls (spruce_fence partitions z12, gates, hay_block racks), aisle x64..65, hay loft y6 with bales, loft ladder x62 z14. P2 `mule_stall`, `hay_stack`, `ladder_run`.
- [ ] Gambrel barn roof, big doors x64..65, loft door y8..9, hoist beam + iron_chain at z8. P3/P4.
- [ ] Lean-to x69..70: wagon, smithing_table (69,1,14), cauldron (69,1,15) leather tub; open 2 sides. P2/P6 `wagon`.
- [ ] Paddock z16..18 x61..70, fence, gate x64..65, water_cauldron trough (68,1,17), composter (61,1,17), hay. P6.

## Plot 6 bake-oven + cistern yard (x72..83)
- [ ] Pavilion x74..81 z7..11, 6 posts, plates, dark_prismarine gable roof, table + 2 benches x76..79. P2/P3/P6 `picnic_table`.
- [ ] Brick bread oven x73..77 z14..17 with vault, mouth (75,2..3,14), hidden-hay lit campfire (75,2,16), stack x74..76 z16..17 top y8 mouth y9. P2 `bread_oven`, P5.
- [ ] Water tank on legs x79..82 z14..17 with water, lid, ladder. P2 `water_tank`.
- [ ] Rain barrels (79,1,13),(81,1,13),(82,1,13), tap cauldron (80,1,13). P6 `rain_barrels`.

## Plot 7 company duplex (x85..94)
- [ ] Brick two-storey duplex, party wall x89..90, belt y7, cornice upside-down stone_brick_stairs. P2 `cornice`.
- [ ] Two-storey porch z7..8, brick piers x85,89,90,94, gallery deck y7, railings. P4.
- [ ] Doors x88, x91 and gallery doors y8..9. P4.
- [ ] Two back stacks x86..88 / x91..93 z17..18 fires (87,3,17),(92,3,17), top y15. P5.
- [ ] Stairs x88 and x91 z15->11; 3 beds per unit. P2 / furnishers.
```

### rooms.json

```json
{"entrance":[41,1,5],"rooms":[{"name":"P0 west front room","box":[2,3,10,4,6,12]},{"name":"P0 west back room","box":[2,3,14,4,6,15]},{"name":"P0 east front room","box":[7,3,10,9,6,12]},{"name":"P0 east back room","box":[7,3,14,9,6,15]},{"name":"P0 shared porch","box":[1,3,7,10,5,8]},{"name":"P1 galerie","box":[15,3,7,22,5,9]},{"name":"P1 salle","box":[16,3,11,17,6,13]},{"name":"P1 east chamber","box":[19,3,11,21,6,13]},{"name":"P1 west cabinet","box":[16,3,15,17,6,16]},{"name":"P1 east cabinet","box":[19,3,15,21,6,16]},{"name":"P2 living room","box":[28,3,10,30,6,12]},{"name":"P2 dining room","box":[28,3,14,30,6,15]},{"name":"P2 stair hall","box":[32,3,10,33,6,12]},{"name":"P2 kitchen","box":[31,3,13,32,6,15]},{"name":"P2 front bedroom","box":[28,8,10,30,11,12]},{"name":"P2 landing","box":[32,8,10,33,11,10]},{"name":"P2 back bedroom","box":[28,8,14,33,11,15]},{"name":"P3 wraparound porch","box":[37,3,7,42,5,8]},{"name":"P3 parlour","box":[40,3,10,41,6,12]},{"name":"P3 stair hall","box":[42,3,10,44,6,13]},{"name":"P3 kitchen-dining","box":[40,3,14,43,6,15]},{"name":"P3 master bedroom","box":[40,8,10,42,11,12]},{"name":"P3 upper landing","box":[43,8,10,44,11,13]},{"name":"P3 back bedroom","box":[40,8,14,43,11,15]},{"name":"P3 tower room","box":[44,8,8,45,11,9]},{"name":"P3 belvedere","box":[44,13,8,45,15,9]},{"name":"P4 porch in the angle","box":[49,3,9,52,5,11]},{"name":"P4 parlour","box":[55,3,10,57,6,12]},{"name":"P4 ground bedroom","box":[55,3,14,57,6,15]},{"name":"P4 stair strip","box":[54,3,10,54,6,15]},{"name":"P4 wing kitchen","box":[50,3,13,52,6,15]},{"name":"P4 attic bedroom","box":[54,8,10,57,10,15]},{"name":"P5 barn aisle and stalls","box":[62,1,10,67,5,14]},{"name":"P5 hay loft","box":[62,7,10,67,11,14]},{"name":"P5 wagon lean-to","box":[69,1,9,70,3,15]},{"name":"P6 pavilion","box":[74,1,7,81,3,11]},{"name":"P6 oven court","box":[73,1,13,77,3,13]},{"name":"P7 west parlour","box":[86,3,10,88,6,12]},{"name":"P7 west kitchen","box":[86,3,14,87,6,15]},{"name":"P7 west bedroom front","box":[86,8,10,88,11,12]},{"name":"P7 west bedroom back","box":[86,8,14,87,11,15]},{"name":"P7 east parlour","box":[91,3,10,93,6,12]},{"name":"P7 east kitchen","box":[92,3,14,93,6,15]},{"name":"P7 east bedroom front","box":[91,8,10,93,11,12]},{"name":"P7 east bedroom back","box":[92,8,14,93,11,15]},{"name":"P7 gallery","box":[85,8,7,94,10,8]}]}
```

### palette.json

```json
{"roles":{"ground":["grass_block","coarse_dirt","podzol","rooted_dirt","dirt_path","gravel","packed_mud","stone","dirt"],"foundation":["bricks","brick_stairs","brick_slab","brick_wall","stone_bricks","mossy_stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall","cobblestone","mossy_cobblestone","cobblestone_wall","cobbled_deepslate","cobbled_deepslate_stairs","cobbled_deepslate_slab","deepslate_bricks"],"decks_floors":["dark_oak_planks","dark_oak_slab","dark_oak_stairs","jungle_planks","jungle_slab","spruce_planks","spruce_slab","spruce_stairs"],"walls":["light_blue_terracotta","cherry_planks","cherry_slab","yellow_terracotta","crimson_planks","birch_planks","cyan_terracotta","stripped_dark_oak_log","stripped_spruce_log","stripped_oak_log","stripped_spruce_wood"],"trim":["stripped_birch_log","stripped_birch_wood","birch_slab","birch_stairs","smooth_stone_slab","polished_andesite_slab","smooth_quartz","smooth_quartz_slab","smooth_quartz_stairs","birch_fence"],"roof":["red_nether_bricks","red_nether_brick_stairs","red_nether_brick_slab","nether_bricks","nether_brick_stairs","nether_brick_slab","polished_blackstone_brick_slab","deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","weathered_cut_copper","weathered_cut_copper_stairs","weathered_cut_copper_slab","oxidized_cut_copper","oxidized_cut_copper_stairs","oxidized_cut_copper_slab","copper_block","mud_bricks","mud_brick_stairs","mud_brick_slab","dark_prismarine","dark_prismarine_stairs","dark_prismarine_slab","mangrove_planks","mangrove_slab","mangrove_stairs","stone_bricks","stone_brick_stairs","stone_brick_slab","spruce_planks","spruce_stairs","spruce_slab"],"glass":["glass_pane","orange_stained_glass_pane"],"doors_shutters":["bamboo_door","dark_oak_door","spruce_door","dark_oak_trapdoor","warped_trapdoor","spruce_trapdoor","birch_trapdoor","iron_trapdoor"],"fences":["spruce_fence","spruce_fence_gate","dark_oak_fence","birch_fence","oak_fence","dark_oak_fence_gate","birch_fence_gate","oak_fence_gate"],"fire_functional":["campfire","hay_block","furnace","smoker","cauldron","water_cauldron","composter","smithing_table","barrel","ladder","iron_chain","lantern","lightning_rod","white_wool"],"plants":["oak_leaves","jungle_leaves","azalea","lilac","peony","rose_bush","cornflower","poppy","dandelion","sunflower","short_grass","fern"],"planned_furnishings":["blue_bed","cyan_bed","pink_bed","yellow_bed","purple_bed","lime_bed","red_bed","orange_bed","flower_pot"],"wagon_wheel_approximation":["polished_blackstone_button"]},"objects":["blue_bed","cyan_bed","pink_bed","yellow_bed","purple_bed","lime_bed","red_bed","orange_bed","flower_pot","lantern","spruce_fence","spruce_fence_gate","dark_oak_fence","dark_oak_fence_gate","birch_fence","birch_fence_gate","oak_fence","oak_fence_gate","spruce_door","dark_oak_door","spruce_trapdoor","dark_oak_trapdoor","warped_trapdoor","birch_trapdoor","glass_pane","orange_stained_glass_pane","hay_block","barrel","ladder","iron_chain","campfire","white_wool","lightning_rod","oak_leaves","jungle_leaves","azalea","rose_bush","peony","lilac","poppy","dandelion","sunflower","short_grass","fern","dark_oak_planks","dark_oak_slab","dark_oak_stairs","spruce_planks","spruce_slab","spruce_stairs","stripped_dark_oak_log","stripped_spruce_log","stripped_oak_log","bricks","brick_stairs","brick_slab","brick_wall","polished_blackstone_button"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which must read back as a structure, then replaces build.nbt.
set -eu
cd "$(dirname "$0")"
MCD_JS=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
node "$MCD_JS" info "$tmp" > /dev/null
mv "$tmp" build.nbt
echo "build.nbt written"
```

### build.mjs

```js
// Builds build.nbt from scratch: the site's ground, then every part in plan order (runParts locks each part's blocks).
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y } from "./vocab/base.mjs";
import * as shellA from "./parts/shell_a.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as shellB from "./parts/shell_b.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as chimneys from "./parts/chimneys.mjs";
import * as grounds from "./parts/grounds.mjs";
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
import * as room12 from "./parts/room-12.mjs";
import * as room13 from "./parts/room-13.mjs";
import * as room14 from "./parts/room-14.mjs";
import * as room15 from "./parts/room-15.mjs";
import * as room16 from "./parts/room-16.mjs";
import * as room17 from "./parts/room-17.mjs";
import * as room18 from "./parts/room-18.mjs";
import * as room19 from "./parts/room-19.mjs";
import * as room20 from "./parts/room-20.mjs";
import * as room21 from "./parts/room-21.mjs";
import * as room22 from "./parts/room-22.mjs";
import * as room23 from "./parts/room-23.mjs";
import * as room24 from "./parts/room-24.mjs";
import * as room25 from "./parts/room-25.mjs";
import * as room26 from "./parts/room-26.mjs";
import * as room27 from "./parts/room-27.mjs";
import * as room28 from "./parts/room-28.mjs";
import * as room29 from "./parts/room-29.mjs";
import * as room30 from "./parts/room-30.mjs";
import * as room31 from "./parts/room-31.mjs";
import * as room32 from "./parts/room-32.mjs";
import * as room33 from "./parts/room-33.mjs";
import * as room34 from "./parts/room-34.mjs";
import * as room35 from "./parts/room-35.mjs";
import * as room36 from "./parts/room-36.mjs";
import * as room37 from "./parts/room-37.mjs";
import * as room38 from "./parts/room-38.mjs";
import * as room39 from "./parts/room-39.mjs";
import * as room40 from "./parts/room-40.mjs";
import * as room41 from "./parts/room-41.mjs";
import * as room42 from "./parts/room-42.mjs";
import * as room43 from "./parts/room-43.mjs";
import * as room44 from "./parts/room-44.mjs";
import * as room45 from "./parts/room-45.mjs";
import * as room46 from "./parts/room-46.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(1);
}

// The stair joiner carves its stairwells through the shell's floors (carve: true, by name); every other part only adds into air.
// The roof is roof.json's, laid after the first part; it is skipped while roof.json doesn't exist.
const PARTS = [
  ["Shell A (plots 0-3)", shellA.build],
  ["Stairs and ladders", stairs.build],
  ["Shell B (plots 4-7)", shellB.build],
  ["Roofs", roofs.build],
  ["Fittings", fittings.build],
  ["Chimneys, hearths and ovens", chimneys.build],
  ["Grounds and yards", grounds.build],
  ["room: P0 west front room", room1.build],
  ["room: P0 west back room", room2.build],
  ["room: P0 east front room", room3.build],
  ["room: P0 east back room", room4.build],
  ["room: P0 shared porch", room5.build],
  ["room: P1 galerie", room6.build],
  ["room: P1 salle", room7.build],
  ["room: P1 east chamber", room8.build],
  ["room: P1 west cabinet", room9.build],
  ["room: P1 east cabinet", room10.build],
  ["room: P2 living room", room11.build],
  ["room: P2 dining room", room12.build],
  ["room: P2 stair hall", room13.build],
  ["room: P2 kitchen", room14.build],
  ["room: P2 front bedroom", room15.build],
  ["room: P2 landing", room16.build],
  ["room: P2 back bedroom", room17.build],
  ["room: P3 wraparound porch", room18.build],
  ["room: P3 parlour", room19.build],
  ["room: P3 stair hall", room20.build],
  ["room: P3 kitchen-dining", room21.build],
  ["room: P3 master bedroom", room22.build],
  ["room: P3 upper landing", room23.build],
  ["room: P3 back bedroom", room24.build],
  ["room: P3 tower room", room25.build],
  ["room: P3 belvedere", room26.build],
  ["room: P4 porch in the angle", room27.build],
  ["room: P4 parlour", room28.build],
  ["room: P4 ground bedroom", room29.build],
  ["room: P4 stair strip", room30.build],
  ["room: P4 wing kitchen", room31.build],
  ["room: P4 attic bedroom", room32.build],
  ["room: P5 barn aisle and stalls", room33.build],
  ["room: P5 hay loft", room34.build],
  ["room: P5 wagon lean-to", room35.build],
  ["room: P6 pavilion", room36.build],
  ["room: P6 oven court", room37.build],
  ["room: P7 west parlour", room38.build],
  ["room: P7 west kitchen", room39.build],
  ["room: P7 west bedroom front", room40.build],
  ["room: P7 west bedroom back", room41.build],
  ["room: P7 east parlour", room42.build],
  ["room: P7 east kitchen", room43.build],
  ["room: P7 east bedroom front", room44.build],
  ["room: P7 east bedroom back", room45.build],
  ["room: P7 gallery", room46.build],
];

function buildWith(roof) {
  const g = new Grid(SITE_SIZE);
  g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], "grass_block");
  runParts(g, PARTS, { palette: "palette.json", roof });
  return g;
}

// While the shell is still a stub there are no walls to roof: build without the roof then (as the sibling kits do).
let g;
try {
  g = buildWith("roof.json");
} catch (e) {
  if (!/no walls found/.test(e.message)) throw e;
  console.log(`roof: skipped, ${e.message} (the shell has no walls yet)`);
  g = buildWith(undefined);
}
g.save(out);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palette ids (palette.json's ids only), plan.md's site coordinates, and a seeded rng: every part imports from here.
// The grid is 0-based, so the grass surface y 0 is its bottom layer; the buried foundation (y -2..-1) is not stored.

// ---- site ---------------------------------------------------------------------------------------------------------

// ---- site ---------------------------------------------------------------------------------------------------------
export const SITE_SIZE = [96, 25, 19]; // grid build.mjs makes: x 0..95, y 0..24 (tower apex y 22, rod y 23), z 0..18

export const GROUND_Y = 0; // grass_block surface: the bottom layer of the grid

export const STAND_Y = 1; // outdoor standing level (the player stands on y1)

export const LANE_Z = [0, 4]; // lane rows z0..4 at y0: coarse edges z0/z4, dirt_path ruts z1/z3, gravel z2

export const LAMP_XS = [0, 12, 24, 36, 48, 60, 72, 84, 95]; // lamp posts on the lane's south edge z4

export const PLOT_WIDTH = 12; // module cut: plot i is x 12i..12i+11

export const PLOTS = 8; // plots 0..7

/** The first x of plot i (x 12i). */
export const plotX0 = (i) => ...

/** The plot index that owns column x (x 12i..12i+11). */
export const plotOf = (x) => ...

// Masses from plan.md's SITE table: { plot, mass, box: [x0, y0, z0, x1, y1, z1] } in inclusive absolute cells.
export const MASSES = [

// ---- palette: one constant per palette.json id, the role after each -------------------------------------------------
export const GRASS_BLOCK = "grass_block"; // ground

export const COARSE_DIRT = "coarse_dirt"; // ground

export const PODZOL = "podzol"; // ground

export const ROOTED_DIRT = "rooted_dirt"; // ground

export const DIRT_PATH = "dirt_path"; // ground

export const GRAVEL = "gravel"; // ground

export const PACKED_MUD = "packed_mud"; // ground

export const STONE = "stone"; // ground

export const DIRT = "dirt"; // ground

export const BRICKS = "bricks"; // foundation

export const BRICK_STAIRS = "brick_stairs"; // foundation

export const BRICK_SLAB = "brick_slab"; // foundation

export const BRICK_WALL = "brick_wall"; // foundation

export const STONE_BRICKS = "stone_bricks"; // foundation

export const MOSSY_STONE_BRICKS = "mossy_stone_bricks"; // foundation

export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // foundation

export const STONE_BRICK_SLAB = "stone_brick_slab"; // foundation

export const STONE_BRICK_WALL = "stone_brick_wall"; // foundation

export const COBBLESTONE = "cobblestone"; // foundation

export const MOSSY_COBBLESTONE = "mossy_cobblestone"; // foundation

export const COBBLESTONE_WALL = "cobblestone_wall"; // foundation

export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // foundation

export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // foundation

export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab"; // foundation

export const DEEPSLATE_BRICKS = "deepslate_bricks"; // foundation

export const DARK_OAK_PLANKS = "dark_oak_planks"; // decks_floors

export const DARK_OAK_SLAB = "dark_oak_slab"; // decks_floors

export const DARK_OAK_STAIRS = "dark_oak_stairs"; // decks_floors

export const JUNGLE_PLANKS = "jungle_planks"; // decks_floors

export const JUNGLE_SLAB = "jungle_slab"; // decks_floors

export const SPRUCE_PLANKS = "spruce_planks"; // decks_floors

export const SPRUCE_SLAB = "spruce_slab"; // decks_floors

export const SPRUCE_STAIRS = "spruce_stairs"; // decks_floors

export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta"; // walls

export const CHERRY_PLANKS = "cherry_planks"; // walls

export const CHERRY_SLAB = "cherry_slab"; // walls

export const YELLOW_TERRACOTTA = "yellow_terracotta"; // walls

export const CRIMSON_PLANKS = "crimson_planks"; // walls

export const BIRCH_PLANKS = "birch_planks"; // walls

export const CYAN_TERRACOTTA = "cyan_terracotta"; // walls

export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log"; // walls

export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log"; // walls

export const STRIPPED_OAK_LOG = "stripped_oak_log"; // walls

export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood"; // walls

export const STRIPPED_BIRCH_LOG = "stripped_birch_log"; // trim

export const STRIPPED_BIRCH_WOOD = "stripped_birch_wood"; // trim

export const BIRCH_SLAB = "birch_slab"; // trim

export const BIRCH_STAIRS = "birch_stairs"; // trim

export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // trim

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // trim

export const SMOOTH_QUARTZ = "smooth_quartz"; // trim

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // trim

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // trim

export const RED_NETHER_BRICKS = "red_nether_bricks"; // roof

export const RED_NETHER_BRICK_STAIRS = "red_nether_brick_stairs"; // roof

export const RED_NETHER_BRICK_SLAB = "red_nether_brick_slab"; // roof

export const NETHER_BRICKS = "nether_bricks"; // roof

export const NETHER_BRICK_STAIRS = "nether_brick_stairs"; // roof

export const NETHER_BRICK_SLAB = "nether_brick_slab"; // roof

export const POLISHED_BLACKSTONE_BRICK_SLAB = "polished_blackstone_brick_slab"; // roof

export const DEEPSLATE_TILES = "deepslate_tiles"; // roof

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // roof

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // roof

export const WEATHERED_CUT_COPPER = "weathered_cut_copper"; // roof

export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs"; // roof

export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab"; // roof

export const OXIDIZED_CUT_COPPER = "oxidized_cut_copper"; // roof

export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs"; // roof

export const OXIDIZED_CUT_COPPER_SLAB = "oxidized_cut_copper_slab"; // roof

export const COPPER_BLOCK = "copper_block"; // roof

export const MUD_BRICKS = "mud_bricks"; // roof

export const MUD_BRICK_STAIRS = "mud_brick_stairs"; // roof

export const MUD_BRICK_SLAB = "mud_brick_slab"; // roof

export const DARK_PRISMARINE = "dark_prismarine"; // roof

export const DARK_PRISMARINE_STAIRS = "dark_prismarine_stairs"; // roof

export const DARK_PRISMARINE_SLAB = "dark_prismarine_slab"; // roof

export const MANGROVE_PLANKS = "mangrove_planks"; // roof

export const MANGROVE_SLAB = "mangrove_slab"; // roof

export const MANGROVE_STAIRS = "mangrove_stairs"; // roof

export const GLASS_PANE = "glass_pane"; // glass

export const ORANGE_STAINED_GLASS_PANE = "orange_stained_glass_pane"; // glass

export const BAMBOO_DOOR = "bamboo_door"; // doors_shutters

export const DARK_OAK_DOOR = "dark_oak_door"; // doors_shutters

export const SPRUCE_DOOR = "spruce_door"; // doors_shutters

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor"; // doors_shutters

export const WARPED_TRAPDOOR = "warped_trapdoor"; // doors_shutters

export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // doors_shutters

export const BIRCH_TRAPDOOR = "birch_trapdoor"; // doors_shutters

export const IRON_TRAPDOOR = "iron_trapdoor"; // doors_shutters

export const SPRUCE_FENCE = "spruce_fence"; // fences

export const SPRUCE_FENCE_GATE = "spruce_fence_gate"; // fences

export const DARK_OAK_FENCE = "dark_oak_fence"; // fences

export const BIRCH_FENCE = "birch_fence"; // fences

export const OAK_FENCE = "oak_fence"; // fences

export const CAMPFIRE = "campfire"; // fire_functional

export const HAY_BLOCK = "hay_block"; // fire_functional

export const FURNACE = "furnace"; // fire_functional

export const SMOKER = "smoker"; // fire_functional

export const CAULDRON = "cauldron"; // fire_functional

export const WATER_CAULDRON = "water_cauldron"; // fire_functional

export const COMPOSTER = "composter"; // fire_functional

export const SMITHING_TABLE = "smithing_table"; // fire_functional

export const BARREL = "barrel"; // fire_functional

export const LADDER = "ladder"; // fire_functional

export const IRON_CHAIN = "iron_chain"; // fire_functional

export const LANTERN = "lantern"; // fire_functional

export const LIGHTNING_ROD = "lightning_rod"; // fire_functional

export const WHITE_WOOL = "white_wool"; // fire_functional

export const OAK_LEAVES = "oak_leaves"; // plants

export const JUNGLE_LEAVES = "jungle_leaves"; // plants

export const AZALEA = "azalea"; // plants

export const LILAC = "lilac"; // plants

export const PEONY = "peony"; // plants

export const ROSE_BUSH = "rose_bush"; // plants

export const CORNFLOWER = "cornflower"; // plants

export const POPPY = "poppy"; // plants

export const DANDELION = "dandelion"; // plants

export const SUNFLOWER = "sunflower"; // plants

export const SHORT_GRASS = "short_grass"; // plants

export const FERN = "fern"; // plants

export const BLUE_BED = "blue_bed"; // object

export const CYAN_BED = "cyan_bed"; // object

export const PINK_BED = "pink_bed"; // object

export const YELLOW_BED = "yellow_bed"; // object

export const PURPLE_BED = "purple_bed"; // object

export const LIME_BED = "lime_bed"; // object

export const RED_BED = "red_bed"; // object

export const ORANGE_BED = "orange_bed"; // object

export const FLOWER_POT = "flower_pot"; // object

// ---- rng ------------------------------------------------------------------------------------------------------------
/** A seeded random source (mulberry32): rng(seed)() -> 0..1, the same sequence for the same seed. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Part h1 of the mill village kit 3 (VOCABULARY in plan.md). Absolute coordinates; the caller applies the plot offset.
// Every helper writes only into air (place()), so nothing an earlier part built is overwritten; a refused cell is
// reported in the result, never thrown. Two named exceptions: lane_strip lays the ground it is named for, and
// mule_stall's floor and porch_run's gap are options that say so.
// Conventions: `face` = the way a thing looks out of its wall (the wall is the cell behind it, at x - facing).
// bed_set's facing is the head direction (the head is against the wall it points at), as in the toolkit's bed().

/** Site lane (P6): z0 and z4 coarse_dirt, z1 and z3 dirt_path, z2 gravel at groundY; dirt at groundY-1, stone at
 *  groundY-2 under each. The footprint is the ground itself, so this is the one helper that writes non-air. */
export function lane_strip(g, x0, x1, groundY = 0)

/** One wall line, box = [x0, y0, z0, x1, y1, z1] with x0 == x1 or z0 == z1; y0..y1 is the wall height. The field
 *  fills it; corner boards (log, axis y) stand at both ends; head plates (log along the wall) at y6 and y11; a floor
 *  belt at y7 when opts.belt is given (block or [block, state]); opts.openings (boxes) are left AIR. */
export function clapboard_wall(g, box, field, corner, plate, opts = {})

/** Door in a wall, facing out (`face`): both halves at (x, y) and (x, y+1), hinge left, all or nothing. Optional:
 *  a glass_pane transom at y+2 in the wall plane, and a step slab one cell out at y. */
export function door_unit(g, x, y, z, face, wood, transom = false)

/** Porch (P4): deck over x0..x1, z0..z1 at deckY; posts [x, z, block?] at y3..5 (stripped_birch_log unless opts.post);
 *  a log beam along x at y6 on each post row; a rail at y3 along the front row z0 with opts.gap = [xa, xb] left open
 *  for the steps; opts.bracket = wood for upside-down stair brackets under the beam at the front and back post rows. */
export function porch_run(g, x0, x1, z0, z1, posts, beam, rail, deck, deckY, opts = {})

/** Ladder (P5/P6): one ladder per block from y0 to y1 at (x, z). `facing` is the way it faces out of its wall, so the
 *  solid block behind it is at x - facing; a cell with no solid wall behind is refused. opts.hatch = wood: an open
 *  trapdoor in the hole at y1+1, hinged on the wall. */
export function ladder_run(g, x, y0, y1, z, facing, opts = {})

/** Bed (rooms): foot at [x, y, z], head one step toward `facing`, its head cell against a solid wall, on a solid floor,
 *  with 2 clear blocks above both halves. Places nothing unless all of that holds. Writes the states red_bed has
 *  (facing, part) and no others. */
export function bed_set(g, [x, y, z], facing, colour = "red")

/** Shelf (rooms): a top slab (spruce by default) at (x, y, z) against the wall behind it (x - face), with one item on
 *  its top at y+1: flower_pot, decorated_pot or candle. All or nothing. */
export function shelf(g, x, y, z, face, item = "flower_pot", wood = "spruce")

/** Mule stall (P5): a 2 x 2 pen at x0..x0+1, z0..z0+1, the aisle on the `dir` side (east | west). Row z0: spruce_fence
 *  partition y1..2 on the aisle column, hay_block rack at y1 on the back column. Row z0+1: spruce_fence_gate on the
 *  aisle column facing dir, barrel facing up as the trough on the back column. opts.floor: packed_mud at y0 (off by
 *  default: an earlier part owns the floor). */
export function mule_stall(g, x0, z0, dir, opts = {})

/** Bread oven (P6), footprint x..x+4, z..z+3, y..y+3 (plinth at y, default 1). Plinth cobbled_deepslate, with a
 *  hay_block under the campfire at the back (x+2, z+2). Brick walls at y+1..y+2 with a 1-wide mouth on the north
 *  side (x+2, z) left AIR. Lit campfire at (x+2, y+1, z+2). Upside-down brick_stairs vault at y+3 (the mouth's lintel
 *  included) with a brick_slab top crown; the flue cell (x+2, y+3, z+2) stays AIR for the stack. */
export function bread_oven(g, x, z, y = 1)

/** Rafter tails (P3): spruce_fence stubs at (x, y, z) every 2 blocks from z0 to z1, under an eave. */
export function rafter_tails(g, x, z0, z1, y)
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md (VOCABULARY, part 2): lamp_post, gable_infill, french_pair, turned_post,
// chimney_stack, table_set, rocker, hay_stack, rain_barrels, garden_bed.
// Each takes its position as arguments and writes only into air. A multi-block piece is all-or-nothing: if any
// cell of its footprint is not air it writes nothing and returns false. gable_infill fills the air cells of its
// triangle and returns how many it placed.

// Lamp post on the lane's south edge: spruce_fence y..y+2, standing lantern at y+3 on top of it.
export function lamp_post(g, x, z = 4, y = 1)

// Triangle of wall in the plane z: course y0 spans x0..x1, each course up narrows by one cell per side.
// Fills air only, so cells that are already built (or reserved openings) are left alone.
export function gable_infill(g, z, x0, x1, y0, y1, field)

// Two closed dark_oak_door leaves at x0 and x0+1 (both halves each), hinges on the outer edges, a glass_pane
// transom over each leaf at y+2. face = the way the front looks out; the pair runs along x, so north or south.
export function french_pair(g, x0, y, z, face)

// Turned porch post: stripped_birch_log base at y, birch_fence shaft at y+1..y+2, and one upside-down birch stair
// bracket either side at y+2, each one's back against the post. beam = the axis the porch beam runs along (x or z).
export function turned_post(g, x, z, y = 3, beam = "x")

// Exterior chimney (the toolkit's chimney()). Air only, with one exception: cut: true lets the planned cells in
// the wall plane (the mouth and its lintel) replace the house wall. The plan is measured on a recording proxy first,
// so a refused chimney writes nothing.
export function chimney_stack(g, { cut = false, ...opts })

// Table: spruce_fence legs at the two ends (y), a spruce_slab top at y+1 across len cells. dir = x/east/west or
// z/north/south. The cells past each end at y and y+1 must be air: that 2-high lane stays clear to walk past.
export function table_set(g, x, y, z, len, dir)

// Rocker: a dark_oak_stairs seat at (x, y, z) whose back faces away from where the sitter looks; an open
// spruce_trapdoor behind it as the back. facing = the way the sitter looks. The cell behind the back must be a
// wall or rail (the trapdoor hangs on it), and the cells in front of the seat at y and y+1 must be air.
export function rocker(g, x, y, z, facing)

// Hay bales in the box [x0, y0, z0, x1, y1, z1]: full rows along x, one row in two along z, so a gap row runs
// between the stacks. All or nothing.
export function hay_stack(g, [x0, y0, z0, x1, y1, z1])

// A row of barrels (open top, facing up) at y along z at the xs, and a water_cauldron tap at tapX (default: the cell
// between the first two barrels). The spout is an open spruce_trapdoor on the cell in front of the tap.
// Support for the spout is not checked here; it needs a block behind it in the grounds part.
export function rain_barrels(g, xs, z, y = 1, tapX = xs[0] + 1)

// Garden bed on the grounds part's soil: a spruce_fence edging round the box [x0, y, z0, x1, z1] at standing level y
// (all or nothing), then flower on every other interior cell where the block below is grass or dirt (optional: a
// cell that's taken or not on soil is skipped). flower = a single-block id such as "poppy".
export function garden_bed(g, [x0, y, z0, x1, z1], flower)
```

### vocab/h3.mjs

```js
// Vocabulary helpers, set 3: fence runs, shingles, shutters, steps, a hearth face, a chair, a hanging lantern,
// a wagon, a picnic table and a cornice. Absolute coordinates; the caller applies the plot offset (12 * i).
// Every helper writes only into air (a cell that is not air is skipped, never overwritten) and returns how many
// blocks it placed. States are written exactly as `mcd states` lists them for 26.x (no waterlogged keys on these).

/**
 * Plot fences: side columns at x0 and x0 + 11 (z 5..18), a front picket at z 5 of `wood` (a fence or brick_wall)
 * with a 2-wide gate at gateX..gateX+1, and a back line at z 18. x0 = the plot's west x (12 * i). `gate` is the wood
 * of the gate. `open` = [[xa, xb], ...] spans of the back line left clear for a stack. All at y 1.
 */
export function fence_run(g, x0, wood, gateX, { gate = "spruce", open = [] } = {})

/**
 * Fishscale shingles over the box [x0, y0, z0, x1, y1, z1]: each row alternates between a full course of block `a`
 * (e.g. birch_planks) and a top-slab course of `b` (e.g. birch_slab), starting with the full course at y0.
 */
export function fishscale(g, [x0, y0, z0, x1, y1, z1], a, b)

/**
 * A window shutter: an open trapdoor in the cell at [x, y, z] (one cell out from the wall), hinged on the `facing`
 * side so it lies flat against the wall behind it. `height` cells stacked upward from y.
 */
export function shutter(g, [x, y, z], facing, wood = "spruce", { height = 1 } = {})

/**
 * Front steps at y 1 from x0 to x1 on row z, one stair per cell, facing south (the full back toward the deck, the
 * walk up from the lane runs north to south). `material` is the wood of the stairs.
 */
export function front_steps(g, x0, x1, z, { material = "dark_oak" } = {})

/**
 * A hearth face set into a wall at mouth [x, y, z]: stone_bricks around the mouth (3 wide, 2 high, the mouth cell
 * itself left as it is), an upside-down stone-brick stair lintel over it, and a top brick slab in front of it in the
 * room. facing = the way the mouth looks, into the room (north for a hearth on a back wall at the south of its room).
 */
export function hearth_face(g, x, y, z, facing)

/**
 * A spruce stair chair at [x, y, z] for a sitter facing `facing` (toward the table). The stair's full back is on the
 * far side, so its facing is the opposite of the sitter's. Leave the two cells in front of it clear at y+1..y+2.
 */
export function chair(g, x, y, z, facing)

/**
 * A lantern hanging at [x, y, z]. If the cell above is solid it hangs from it; otherwise iron chain runs up from the
 * lantern to the first solid block within `reach` cells. Places nothing (returns 0) when there is no ceiling to hang
 * from or the lantern cell is not air.
 */
export function hanging_lantern(g, x, y, z, { reach = 4 } = {})

/**
 * A wagon at x (two cells wide, x..x+1) with its bed four long from z to z+3: a spruce slab top bed at y 2, four
 * open dark-oak trapdoor wheels under the corners at y 1, and a spruce fence tongue at the front end (z-1 when dir is
 * north, z+4 when dir is south).
 */
export function wagon(g, x, z, dir = "north", { wood = "spruce", wheel = "dark_oak" } = {})

/**
 * A picnic table: a top slab on spruce fence legs at x0 and x1, row z, with a spruce stair bench on each long side
 * (z-1 facing north, z+1 facing south) so each bench's back is away from the table. Slab top at y 2, legs and
 * benches at y 1.
 */
export function picnic_table(g, x0, x1, z)

/**
 * A cornice under an eave on row z from x0 to x1 at height y: upside-down stone-brick stairs whose lip points out
 * (out = the street side, north for a north front), so each stair's back is into the wall.
 */
export function cornice(g, x0, x1, z, y, { out = "north", material = "stone_brick" } = {})
```

### vocab/h4.mjs

```js
// Vocabulary share h4: the ten helpers plan.md's VOCABULARY names for this share (pier_line, window, bracket, stair_run,
// stove, dresser, swing_seat, water_tank, pavilion_posts, quoin_corner). Every position and facing is an argument; nothing
// is hard-wired to a spot. Each helper writes only into air: a cell that already holds a block is refused and listed in
// `refused`, never overwritten (quoin_corner's replace option is the one exception). Each returns { cells, refused }.

// ---- pier_line: a foundation line along x or z: piers at the ends and every 3rd cell, skirting between -----------
// (x0,z0)-(x1,z1) is a straight line at height y. skirt: a fence, wall or block id, or an open trapdoor id
// (e.g. "birch_trapdoor" for a lattice), hinged on the side that `facing` names.
export function pier_line(g, x0, z0, x1, z1, block, skirt, { y = 1, facing = "north" } = {})

// ---- window: a glass_pane w x h in the wall plane ---------------------------------------------------------------
// (x, y, z) = the window's lowest cell on the wall, faceOut = the outward side (north/south walls run along x, east/west
// along z). Panes connect to their neighbours in the window only. Sill: a top slab one cell outside, under the window,
// skipped where the cell is not air (a deck is there). Openings are the shell's, so no lintel is written here.
export function window(g, x, y, z, faceOut, w, h, { sill = "smooth_stone" } = {})

// ---- bracket: an upside-down wood stair under a beam (gingerbread / porch bracket) ----------------------------
// face = the way the lip points (out to the street); the stair's back is against the beam, on the wall side.
export function bracket(g, x, y, z, faceOut, wood)

// ---- stair_run: a straight flight of wood stairs walked up toward `facing` (flight()'s convention: facing = the way
// you walk up). [x, y, z] = the first, lowest step; toY = the y of the top step (the upper floor's own layer). Width runs
// to the right of facing. An upside-down stair hangs under each step as a stringer. Writes into air only: no headroom is
// cut, so the caller keeps the floor above clear. Returns landing: the feet cell on the upper floor.
export function stair_run(g, [x, y, z], facing, toY, material, width = 1)

// ---- stove: a lit furnace (or smoker) at (x, y, z), its front facing the room; a closed iron trapdoor lies on top ----
// as the flue plate. Stands against the hearth wall; the cells in front of it are never written (the 2-high lane).
export function stove(g, x, y, z, facing, { kind = "furnace" } = {})

// ---- dresser: a barrel and a chest side by side (the chest to the right of facing), a flower pot on the barrel --------
export function dresser(g, x, y, z, facing)

// ---- swing_seat: a spruce slab seat (top half) from x0 to x1 at (y, z), hung by an iron chain at each end up to the beam ---
// beamY = the beam's y (default y+3, so the chains take y+1..y+2). The beam itself is the caller's.
export function swing_seat(g, x0, x1, y, z, { beamY = y + 3 } = {})

// ---- water_tank: a 4 x 4 tank on four stripped spruce legs, with its footprint at x0..x0+3, z0..z0+3 ----------------
// legs y..y+3, platform y+4, staves y+5..y+7 (a stripped spruce hoop at y+6), water in the 2 x 2 core at y+5..y+6,
// spruce slab lid at y+8. y defaults to 1 (the plot's stand level), so the lid is at y9 as plan.md's ROOMS has it.
export function water_tank(g, x0, z0, { y = 1 } = {})

// ---- pavilion_posts: the posts and plates of a picnic pavilion over x0..x1 x z0..z1 ------------------------------------
// Posts at both long sides (the ends and the middle), standing y..top-1; plates lie at y = top, axis x on the z edges and
// axis z on the x edges. The roof and the tables are the caller's.
export function pavilion_posts(g, x0, x1, z0, z1, { y = 1, top = 4, wood = "stripped_oak" } = {})

// ---- quoin_corner: a corner column of alternating quoins (stripped log, axis y) and field blocks, y0..y1 -----------
// Quoins sit at y0, y0+2, ...; a null field leaves the in-between cells unwritten. replace: lay the column over a wall
// that is already built (the default writes into air only).
export function quoin_corner(g, x, z, { y0, y1, field = null, quoin = "stripped_birch", replace = false } = {})
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

/** A hearth and its chimney: the fire at the BOTTOM, smoke up a flue, the stack set INTO the wall so the room loses no
 *  space. Give wall = [x, floor level, z], a cell of the outside wall at the hearth's floor level, and into = the side the
 *  room is on: the campfire goes one cell OUTSIDE the wall (an exterior chimney), the wall cell becomes the hearth's
 *  mouth with a lintel over it, and the flue rises outside the wall with the house wall as its room side. (Or give
 *  at = the campfire's cell and open = the side its mouth faces, for an interior chimney set into a partition.)
 *  top = the flue's last course (1-2 over the roof where it leaves it; the mouth is open above). The flue is a 1 x 1
 *  column of air walled on all four sides at every level: the house wall below the roof, and from the roof up the
 *  chimney's own masonry (never the roof's tiles), or with thin: "iron" | "copper" | a wood, an open trapdoor lying
 *  flat against the flue where there is only air beside it (a slim pipe above the roof). Build it after the roof. */
export const chimney = (g, { wall, into, at, open = "south", top, material = "bricks", thin = null, lintel = true, roofY }) => ...

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
leads to: a jump), a **chimney fire** fault (a campfire on top of a stack, shut in a stack with no
firebox mouth, its smoke blocked before the sky, a flue open at the side, or roof tiles walling the flue), a
**chimney in the room** (a hearth or flue in a room's floor space instead of set into the wall), a **floating shutter** (an open trapdoor with air behind it), **bookshelf overuse** (more
than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with one way in, or a long stretch no
walk between its openings passes). The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves; refuses a cell that isn't air and returns
false), `flight(g, { from, facing, to, material, width })` (a flight whose last step is in the upper floor's own layer,
headroom cut, stringer under it), `chimney(g, { wall: [x, floorY, z], into, top, material, thin })` (an exterior chimney: the fire
just outside the wall, its mouth cut through it, hay in the floor, a 1 x 1 air flue to the sky, masonry through the
roof, thin trapdoors above it), `shutter(g, [x, y, z], face, wood, { height })`
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
