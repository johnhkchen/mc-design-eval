# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# West Crissy Field / Presidio: architect's plan

Exterior only (no rooms). All coordinates are ROW coordinates: x as in the brief's plot ranges (plot 0 starts at x 0,
plot 9 at x 149); plot-local x = x - plot x0. North = low z (the bay front), east = high x. y 0 = the plot's
1-block smooth_stone ground; walls start at y 1. Every mass below sits only on `#` cells of its footprint map
(1 map char = 2x2 blocks); the maps' 2-block jogs are kept as clean steps. The irregular outlines are resolved
as a MAIN MASS (tall, gabled/hipped) plus LEAN-TOS (low sheds with one-slope roofs) on the leftover `#` cells,
which is how these old Army sheds actually grew. Nothing leaves its plot; no roof, flag or plant above the cap.

## SITE

| plot | x | z | cap | ground |
|---|---|---|---|---|
| 0 warehouse | 0..28 | 0..38 | y10 | smooth_stone y0; lawn strips (grass_block replacing y0) on `.` cells along the west side x0..3 z0..15 and south-west x0..13 z28..38; paved apron (smooth_stone) north of the doors |
| 1 army admin | 29..56 | 0..22 | y10 | lawn x29..46 z0..3 (front), x49..56 z18..22 |
| 2 army housing | 57..83 | 0..19 | y10 | lawn x57..66 z0..1, x69..83 z18..19 |
| 3 storehouse | 84..97 | 0..35 | y9 | paved yard (smooth_stone) on all `.` cells (loading yard, east and west) |
| 4 office | 98..107 | 0..10 | y8 | path x102..103 z10 to door; lawn rest of z10 |
| 5 bike shop | 108..118 | 0..8 | y7 | paved z8 strip |
| 6 coast guard | 119..131 | 0..11 | y10 | lawn on `.` cells; flagpole x120 z1; path x126..127 z0 (door) |
| 7 OCC | 132..139 | 0..7 | y8 | lawn corners |
| 8 garage | 140..148 | 0..8 | y6 | lawn on `.` cells |
| 9 boathouse | 149..155 | 0..7 | y6 | smooth_stone, lawn tufts on `.` |

Masses (inclusive coordinates; "walls" = solid wall shell from y1 to the given top course):

**Plot 0, WAREHOUSE (climbing gym).** Main hall in four sections whose ridges step south-east with the footprint's diagonal.

| mass | x | z | walls y | role |
|---|---|---|---|---|
| W1 north hall | 8..17 | 2..11 | 1..5 | gable N-S, front gable on z2 |
| W2 middle hall | 8..21 | 12..17 | 1..5 | gable N-S |
| W3 cross hall | 2..23 | 18..25 | 1..5 | gable E-W (the widest part: a cross hangar) |
| W4 south hall | 16..25 | 26..35 | 1..5 | gable N-S |
| V vestibule (front doors) | 12..15 | 0..1 | 1..4 | flat roof, sign band |
| lean-to a | 4..7 | 4..7 | 1..3 | shed roof sloping west |
| lean-to b | 6..7 | 8..13 | 1..3 | sloping west |
| lean-to c | 18..19 | 8..11 | 1..3 | sloping east |
| lean-to d | 4..7 | 16..17 | 1..3 | sloping west |
| lean-to e | 0..1 | 18..23 | 1..3 | sloping west |
| lean-to f | 24..25 | 22..25 | 1..3 | sloping east |
| lean-to g | 2..9 | 26..27 | 1..3 | sloping south |
| lean-to h | 12..15 | 26..27 | 1..3 | sloping south (x10..11 z26..27 stays open: a loading notch) |
| lean-to i | 14..15 | 28..33 | 1..3 | sloping west |
| lean-to j | 26..27 | 28..35 | 1..3 | sloping east |
| lean-to k | 16..23 | 36..37 | 1..3 | sloping south |

**Plot 1, ARMY ADMINISTRATION (Mission Revival).**

| mass | x | z | walls y | role |
|---|---|---|---|---|
| A main block | 31..54 | 4..17 | 1..4 | 2 storeys, hip roof |
| A1 entrance pavilion | 47..52 | 0..3 | 1..4 | 2 storeys, projects 4 north, own hip |
| A2 front arcade (loggia) | 39..46 | 2..3 | 1..2 piers | one storey, open arcade, lean-to roof y3 |
| A3 rear wing | 33..42 | 18..21 | 1..4 | 2 storeys, hip joined to A |
| lean-to west | 29..30 | 6..13 | 1..2 | slope west, roof y3 |
| lean-to east | 55..56 | 12..17 | 1..2 | slope east |
| rear lean-to | 31..32 & 43..48 | 18..19 | 1..2 | slope south |
| back stoop shed | 33..34 | 22 | 1..2 | slab roof y3 |

**Plot 2, ARMY HOUSING (sister, wood siding).**

| mass | x | z | walls y | role |
|---|---|---|---|---|
| H main block | 57..82 | 2..15 | 1..4 | 2 storeys, gable E-W |
| H1 front porch | 67..82 | 0..1 | posts y1..2 | porch deck + lean-to roof y3 against the z2 wall |
| H2 rear lean-to | 59..82 | 16..17 | 1..2 | slope south, roof y3 |
| H3 back kitchen | 59..68 | 18..19 | 1..2 | continues H2's lean-to |

**Plot 3, LONG STOREHOUSE (swim school).** Three gabled sections stepping east as they go south.

| mass | x | z | walls y | role |
|---|---|---|---|---|
| L1 north | 86..93 | 0..7 | 1..3 | gable N-S, front gable on z0 |
| L2 middle | 86..95 | 8..25 | 1..3 | gable N-S |
| L3 south | 88..97 | 26..35 | 1..3 | gable N-S |
| dock shed west | 84..85 | 0..5 | 1..2 | lean-to, slope west, roof y3 |
| lean-to east | 96..97 | 22..25 | 1..2 | slope east |

**Plot 4, SMALL OFFICE.** O: x98..107, z0..9, walls y1..4 (2 storeys), hip roof. z10 is the path/lawn row.

**Plot 5, BIKE SHOP.** S: x108..117, z1..7, walls y1..5 (one tall shop storey); the z0 row x108..117 is the shop's
covered front (piers at x108 and x117, z0, y1..5; awning over x109..116). Side bay x118, z4..5, walls y1..3, slab roof y4.

**Plot 6, COAST GUARD STATION (1915).**

| mass | x | z | walls y | role |
|---|---|---|---|---|
| C main block | 121..130 | 4..9 | 1..4 | 2 storeys, red hip, cupola |
| C1 front pavilion | 125..128 | 0..3 | 1..4 | 2 storeys, pedimented gable facing north |
| C2 entry porch | 123..124 | 2..3 | 1..2 | one storey, flat roof y3 with quartz slab rail |
| C3 west bay | 119..120 | 6..7 | 1..2 | lean-to roof y3 |
| C4 rear kitchen | 123..128 | 10..11 | 1..2 | lean-to roof y3 sloping south |
| cupola | 125..126 | 6..7 | y7..10 | 2x2 lookout on the ridge (see ROOFS) |
| flagpole | 120 | 1 | y1..9 | stone_brick_wall foot y1, end_rod pole y2..9 |

**Plot 7, OCEAN CLIMATE CENTER.** Cross plan: N-S arm x134..137 z0..7 and E-W arm x132..139 z2..5, walls y1..4 (2 storeys).

**Plot 8, SHOP AND GARAGE.**

| mass | x | z | walls y | role |
|---|---|---|---|---|
| G garage | 142..145 | 0..5 | 1..3 | gable N-S, wide door on z0 |
| G1 east shop | 146..147 | 2..7 | 1..2 | lean-to sloping east |
| G2 back | 144..145 | 6..7 | 1..2 | lean-to sloping south |
| G3 west | 140..141 | 2..3 | 1..2 | lean-to sloping west |
| G4 bin | 146..147 | 8 | 1..2 | slab roof y3 |

**Plot 9, 1890 BOATHOUSE.**

| mass | x | z | walls y | role |
|---|---|---|---|---|
| B boathouse | 151..154 | 2..5 | 1..2 | steep gable N-S |
| B1 door bay | 153..154 | 0..1 | 1..2 | small gable N-S, big door on z0 (to the water) |
| lean-to east | 155 | 2..3 | 1..2 | slab roof y3 |
| lean-to west | 149..150 | 4..5 | 1..2 | slope west, roof y3 |
| lean-to south | 151..152 | 6..7 | 1..2 | slope south, roof y3 |

No stairs to the street anywhere: every door sits on y1 one above ground y0, reached by one smooth_stone_slab
(bottom) in the cell in front of it (accessible half step, 2 wide where the door is 2 wide).

## ROOFS

Two roof palettes, chosen per building as the concept has them:
- **GREY** (custom mix): polished_andesite 6, andesite 3, stone 1 (stairs: polished_andesite_stairs, andesite_stairs,
  stone_stairs); eave course stone_brick_stairs; ridge polished_andesite_slab; verge quartz_stairs (white barge board).
- **RED** = preset palette `red-tile` (brick, granite, polished granite, mangrove; mud-brick eave, quartz verge).

| roof | form | footprint (rects) | y (first course) | ridge | top | overhang | palette | preset / note |
|---|---|---|---|---|---|---|---|---|
| W3 | gable, ridge along x | 2..23 x 18..25 | 6 | z21..22, y9 | ridge slab y10 | 1 (gables to x1 / x24) | GREY | `granary` without monitor = style gable pitch 1; BUILD FIRST |
| W1 | gable, ridge along z | 8..17 x 2..11 | 6 | x12..13, y10 | y10 | 1 (x7, x18; north verge at z1 over the vestibule roof) | GREY | style gable, maxHeight 5; south end dies into W2 |
| W2 | gable, ridge along z | 8..21 x 12..17 | 6 | x14..15, y9 | ridge slab y10 | 1 | GREY | pitch ~0.6 (span 14, capped by y10: `--why "brief cap y10, broad low Army warehouse gable"`); south end runs into W3's north slope (valley) |
| W4 | gable, ridge along z | 16..25 x 26..35 | 6 | x20..21, y10 | y10 | 1 | GREY | north end runs into W3's south slope |
| W lean-tos a..k | shed, one course | each lean-to rect | 4 | — | y4 | 0 (they sit under the hall eaves) | GREY stairs facing up toward the hall, outer row stone_brick_stairs | BY HAND in the part |
| V vestibule | flat | 12..15 x 0..1 | 5 | — | y5 | 0 | smooth_stone_slab deck, quartz_slab coping on the north edge | BY HAND |
| A | hip, ridge along x | 31..54 x 4..17 + 33..42 x 18..21 (T) | 5 | z10..11, x38..47, y9 | ridge slab y10 | 1 | RED | preset `civic` geometry (45° hip) without its pediment; rear wing A3 joins as a T valley |
| A1 | hip | 47..52 x 0..3 | 5 | x49..50, y7 | y8 | 1 on E/W/N, north eave at z0 (no overhang past z0: overhang N 0) | RED | its back runs into A's north slope |
| A2 arcade + side lean-tos | shed | their rects | 3 | — | y3 | 0 | brick_stairs + brick_slab | BY HAND |
| H | gable, ridge along x | 57..82 x 2..15 | 5 | z8..9, y9 | ridge slab y10 | W 0 (gable flush on x57, plot edge), E 1 (to x83), N 1 over the porch roof, S 1 | GREY | preset `cottage` geometry, material GREY, pitch ~0.7, maxHeight 5; west gable end on the plot edge |
| H1 porch | shed against z2 wall | 67..82 x 0..1 | 3 | — | y3 | 0 | polished_andesite_stairs facing south, slab row at z1 | BY HAND |
| H2/H3 | shed | 59..82 x 16..17, 59..68 x 18..19 | 3 | — | y3 | 0 | GREY stairs | BY HAND |
| L1, L2, L3 | gable, ridge along z, low | 86..93 x 0..7 / 86..95 x 8..25 / 88..97 x 26..35 | 4 | L1 x89..90, L2 x90..91, L3 x92..93, all y7 | ridge slab y8 | 1 on the long sides; north gable of L1 overhang N 0 (plot edge z0); L3 south 0 (z35 edge) | RED | style gable pitch 0.6; ridges step east 1 then 2 at the section joints (the step reads the diagonal); each section's gable end shows where it is wider than its neighbour |
| L lean-tos | shed | 84..85 x 0..5, 96..97 x 22..25 | 3 | — | y3 | 0 | brick_stairs | BY HAND |
| O | hip, short ridge along x | 98..107 x 0..9 | 5 | z4..5, x102..103, y8 | y8 | 1 on E/W/S, N 0 (plot edge) | RED | preset `civic` (45° hip), maxHeight 4, no pediment |
| S | gable, ridge along x | 108..117 x 1..7 | 6 | z4, y7 | y7 | 1 north (eave at z0 over the shop front), 1 south (z8), E/W 0 | RED | pitch 0.5 (cap y7); BY TOOL |
| C | hip, ridge along x | 121..130 x 4..9 + 125..128 x 0..3 | 5 | z6..7, x123..128, y7 | y7 (cupola above) | 1 except N of C1 (0) | RED | preset `civic`: hip with the pediment ON C1's north face (quartz pediment, Colonial Revival); keep = cupola cells x125..126 z6..7 y7..10 |
| cupola | box + cap by hand | 125..126 x 6..7 | 7 | — | y10 | — | quartz_block base y7, glass_pane y8 (all 4 cells), dark_prismarine_slab y9 (green trim), lightning_rod y10 at x125 z6 | BY HAND, after the roof |
| C2, C3, C4 | flat / shed | their rects | 3 | — | y3 | 0 | C2 quartz_slab deck; C3/C4 brick_stairs | BY HAND |
| OCC | hip over the cross (union) | 134..137 x 0..7 + 132..139 x 2..5 | 5 | crossing at x135..136 z3..4, y7 | y7 (ridge slab y8 allowed) | 0 on the plot edges (N z0, S z7, W x132, E x139) | RED | style hip pitch 1 |
| G | gable, ridge along z | 142..145 x 0..5 | 4 | x143..144, y5 | ridge slab y6 | N 0 (z0 edge), 1 E/W/S | RED | style gable pitch 1 |
| G1..G4 | shed / slab | their rects | 3 | — | y3 | 0 | brick_stairs / brick_slab | BY HAND |
| B | steep gable, ridge along z | 151..154 x 2..5 | 3 | x152..153, y5 | ridge slab y6 | 1 on E, W and S (over the lean-tos), N 0 | RED | style gable pitch 1.5 (steep 1890 boathouse) |
| B1 | gable, ridge along z | 153..154 x 0..1 | 3 | y4 | y4 (brick_slab ridge) | 0 | RED | BY HAND: two brick_stairs per course, gable to the north over the big door |
| B lean-tos | shed | their rects | 3 | — | y3 | 0 | brick_stairs | BY HAND |

Roof order in each plot: main mass first (W3 before W1/W2/W4; A before A1), then joining roofs, then lean-tos,
cupola last. Gable triangles (W1 north face, W3 E/W ends, W4 south, H E/W ends, L gables, G, B) are WALL: same
material as the wall below (the roof tool's gable infill = the wall block), with the quartz verge.

## FACADES

| building | base (y1) | body | string / cornice | openings rhythm | ornament (depth) |
|---|---|---|---|---|---|
| 0 warehouse | polished_andesite plinth course y1 all round | white_concrete y2..5 | the roof's eave course is the cornice; gable ends get a quartz_stairs verge | tall windows 2 wide, y2..4, every 4 cells along every long wall, starting 2 in from each corner | window frames: quartz_block jambs flush; sill quartz_slab at y1 proud 1 (outside the wall, on `.` cells only where the cell is inside the plot); dark_prismarine sliding-door panels flush |
| vestibule V | polished_andesite y1 | white_concrete | dark_prismarine fascia board y3..4 on z0 (x12..15), sign letters set into it | double door x13..14 | lanterns on the jambs |
| 1 admin | stone_bricks plinth y1 | smooth_sandstone (cream stucco) y2..4 | cut_sandstone string course at y3 (between storeys), flush | PAIRED windows, 2 panes wide, at y2 and y4 (positions in OPENINGS) | warped_trapdoor shutters beside every pair (green, flat on the wall, 1 proud); A2 arcade: smooth_sandstone piers, upside-down smooth_sandstone_stairs arches between them (Mission arches) |
| 2 housing | stone_bricks y1 | white_concrete y2..4, with the y3 course in quartz_block (a lighter band reads as the siding line) | y3 band; eaves | windows 1 wide singles at y2 and y4 every 3 cells, porch door centre | warped_trapdoor shutters on upper windows; porch posts birch_fence on quartz_slab bases; porch rail birch_fence between posts at y1, open at the door |
| 3 storehouse | polished_andesite y1 | smooth_sandstone y2..3 | — | loading doors on the WEST face (x86 for L1/L2, x88 for L3) every 4 cells, 2 wide, y1..3; small windows on the east face y2 every 4 | dark_prismarine door panels; quartz verge |
| 4 office | stone_bricks y1 | white_concrete y2..4 | quartz_block corner quoins y1..4 at the 4 corners, flush | 2 windows per storey on N, E, W, S (y2 and y4), door N centre | warped_trapdoor shutters; quartz_block lintel IN the wall at y3 over the door (no hood: the north wall is on the plot edge) |
| 5 bike shop | stone_bricks y1 (piers) | white_concrete y2..5 | fascia z1 y4..5 white_concrete with banner letters "BIKES" | shopfront glass at z1 x109..116 y1..3 except the door | dark_prismarine awning at z0 y3: dark_prismarine_stairs facing south x109..116 (slopes down to the street), lantern under the awning at x112 |
| 6 coast guard | stone_bricks y1 | white_concrete y2..4 (clapboard white) | dark_prismarine window frames (green trim) | windows singles at y2 and y4, every 2 cells on C1's north face (x125, x128 at y2; x125..128 row at y4 as a 4-pane window), C main block N face x122..123 / x129..130 each storey | C1 pediment by the roof preset (quartz); green trim: warped_trapdoor shutters every window; porch C2 quartz_slab rail on its roof |
| 7 OCC | stone_bricks y1 | white_concrete y2..4 | — | door N x135..136; window singles y2/y4 on arms' ends | quartz_block pilasters at x134 and x137 on z0, flush; warped_trapdoor shutters |
| 8 garage | stone_bricks y1 | white_concrete y2..3 | — | wide door N | dark_prismarine door panel framed by quartz_block |
| 9 boathouse | white_concrete y1..2 (no plinth: wooden shed on the beach) | white_concrete | — | big door N on B1 | birch_planks door frame, dark_prismarine door panels |

Ornament depth rule (all plots): footprints touch the plot edges on several sides, so NOTHING projects past a wall
that lies on a plot edge (z0 fronts of plots 1A1, 4, 5, 6C1, 7, 8, 9B1; west/east plot edges). Relief there is made
by recessing (glass set in, door one cell in) never by projecting.

## MATERIALS

| role | block id |
|---|---|
| white walls (0, 2, 4, 6, 7, 8, 9) | white_concrete |
| cream stucco (1, 3) | smooth_sandstone |
| cream string course (1) | cut_sandstone |
| white trim, quoins, frames, verge, sills, coping | quartz_block, quartz_slab, quartz_stairs |
| plinth / base course | stone_bricks (1, 2, 4, 5, 6, 7, 8); polished_andesite (0, 3) |
| green trim, door panels, awning | dark_prismarine, dark_prismarine_stairs, dark_prismarine_slab |
| green shutters | warped_trapdoor (open, flat on the wall) |
| walk-in doors | spruce_door (both halves) |
| glass | glass_pane (connected) |
| red roofs | palette `red-tile`; hand roofs bricks / brick_stairs / brick_slab |
| grey roofs | GREY mix above; hand roofs polished_andesite_stairs / polished_andesite_slab |
| porch posts, rails | birch_fence; porch deck = the ground y0 under the porch replaced by birch_planks |
| ground | smooth_stone (y0); paths smooth_stone_slab steps; lawns grass_block; hedges oak_leaves (persistent) |
| flag | end_rod pole, stone_brick_wall foot, white_wall_banner with US pattern (red stripes, blue canton) |
| light | lantern (hanging under eaves / on fence arms; standing inside on the floor y1 where hidden) |
| sign letters | banners (sign writer), white on dark_prismarine boards |

All checked with `mcd blocks --check`: all exist in 1.21.1 (no pale oak, no iron_chain: chains are `chain`).

## OPENINGS

Doors are 1 or 2 wide, y1..2, spruce_door unless stated. Windows glass_pane. All openings are left as AIR by the shell.

| plot | face | opening | cells |
|---|---|---|---|
| 0 | V north z0 | main double door | x13..14, y1..2 (the fascia is y3..4 above it) |
| 0 | W1 north z2 | sliding-door panel (dark_prismarine, set IN the opening) | x9..10, y1..4 |
| 0 | W1 north gable z2 | tall gable window | x12..13, y6..7 (in the gable triangle) |
| 0 | W3 east z19..20 face x23 | big sliding door | z19..20, y1..4 (dark_prismarine panel) |
| 0 | hall long walls | tall windows 2 wide, y2..4 | W1 east x17: z4..5; W1 west x8: z2..3; W2 east x21: z14..15; W2 west x8: z14..15; W3 north z18: x20..21; W3 south z25: x18..19; W4 east x25: z28..29, z32..33; W4 west x16: z34..35 |
| 0 | lean-to faces | small windows 1 wide y2 | every 4 cells on their outer face |
| 1 | A1 north z0 | main door (double) | x49..50, y1..2; window pair x49..50 y4 above |
| 1 | A1 north z0 | windows | x47, x52 at y2 and y4 (singles) |
| 1 | A north z4 (behind arcade x39..46 and open x31..38, x53..54) | paired windows | x32..33, x35..36 at y2 and y4; x40..41, x44..45 at y4 only (arcade below); arcade door x42..43 y1..2 into A |
| 1 | A2 arcade z2 | arches (open) | x40..41, x43..44 (piers x39, x42, x45..46), y1..2 open |
| 1 | A east x54 / x56 lean-to | paired windows | x54 at z6..7 and z9..10, y2 and y4 |
| 1 | A west x31 above lean-to | upper windows | z8..9, z11..12 at y4 |
| 1 | A south / A3 | paired windows | A3 south z21: x36..37, x39..40 at y2, y4; A south z17: x50..51, x53..54 at y2, y4 |
| 2 | H north z2 (behind porch x67..82) | front door | x74..75, y1..2 |
| 2 | H north z2 | windows singles | y2: x59, x62, x65, x69, x72, x78, x81; y4: x59, x62, x65, x69, x72, x74, x75, x78, x81 |
| 2 | H east x82 / west x57 | windows | z5, z8, z12 at y2 and y4; attic window z8..9 y6 in each gable |
| 2 | H south over lean-to | upper windows | x60, x64, x70, x76, x80 at y4 |
| 3 | L1 north z0 | big loading door | x89..90, y1..3; window x92 y2 |
| 3 | west faces | loading doors 2 wide y1..3 | L1 x86: z6..7? (dock shed covers z0..5) z6..7 is L1/L2 joint → none; L2 x86: z10..11, z14..15, z18..19, z22..23; L3 x88: z28..29, z32..33 |
| 3 | east faces | windows 1 wide y2 | L1 x93: z2, z5; L2 x95: z10, z14, z18; L3 x97: z28, z31, z34 |
| 4 | north z0 | door | x102..103 y1..2 (double) |
| 4 | all faces | windows singles y2 and y4 | N: x99, x100, x105, x106; E/W (x107/x98): z2, z3, z6, z7; S z9: x100, x105 |
| 5 | front z1 | shop door (double) | x112..113 y1..2 |
| 5 | front z1 | shop windows | x109..111, x114..116, y1..3; x112..113 y3 glass transom |
| 5 | x118 bay east face | side door | x118 z4, y1..2, facing east |
| 6 | C1 north z0 | main door | x126..127 y1..2; windows x125, x128 y2; y4 x125..128 |
| 6 | C north z4 | windows | x121..122, x129..130 at y2 and y4 (pairs); C2 porch door x124 z2 y1..2 |
| 6 | C east x130 | windows | z5, z8 at y2, y4 |
| 6 | C west x121 | windows | z4..5 y4, z8..9 y2, y4 (C3 covers z6..7 below y3) |
| 7 | north z0 | door | x135..136 y1..2; window pair y4 |
| 7 | arms | windows | W x132 z3..4 y2,y4; E x139 z3..4 y2,y4; S z7 x135..136 y2,y4 |
| 8 | north z0 | garage door | dark_prismarine panel x143..144 y1..2 between quartz_block jambs x142, x145 (y1..3) |
| 8 | G1 east x147 | door | z4 y1..2 |
| 9 | B1 north z0 | big boat door | x153..154 y1..2: dark_prismarine panel, birch_planks frame above y3 (gable) |
| 9 | B west x151 | window | z3 y2 |

## RESERVED

| what | cells | who |
|---|---|---|
| flagpole + flag | x120 z1 y1..9; banners x121..122 z1 y8..9 | flag part (lawn under it stays) |
| cupola | x125..126 z6..7 y7..10 | roof keep, cupola part |
| sign bands | plot 0: "GYM" on the vestibule fascia z0 x12..15 y3..4 (letters set into the wall, `material: null`, nothing proud past z0); plot 5: "BIKES" banners in the z0 cells x110..114 y4..5, hung on the z1 fascia | sign writer |
| awning | plot 5 z0 x109..116 y3 | shop part |
| porch deck + posts | plot 2 x67..82 z0..1 y0..3 | porch part |
| arcade piers + arches | plot 1 x39..46 z2..3 y1..3 | arcade part |
| door-step slabs | the cell outside every door at y1 (one bottom smooth_stone_slab, as wide as the door; inside the plot only) | path part |

## FLOORS

Exterior-only kit: interiors are hollow, unfurnished, lit. Ground floor of every building = y0 (smooth_stone, may be
re-laid as birch_planks inside). Two-storey buildings (1, 2, 4, 6, 7) carry an upper floor deck at y3 (birch_planks,
leaving a 1-high view through upper windows at y4); single-storey (0, 3, 5, 8, 9) have none.
Interior volumes: the mass rects above, inset by the 1-cell wall, from y1 to the course under the roof.
Light: lanterns inside every mass on the floor (y1) every 6 cells and under every lean-to roof; outside a lantern
hanging under the eave each side of every main door; lamp posts (spruce_fence + lantern) on the lawns of plots 0, 1, 2, 6.

---
# DESIGNER'S SECTIONS

## PALETTE

Architect's MATERIALS kept verbatim. Shape variants and decor (all checked with `$MCD blocks --check`; `chain` is valid 1.21.1 but the toolkit lists only iron_chain, so no chains are used).

| role | block ids |
|---|---|
| white walls | white_concrete; sill/trim quartz_block, quartz_slab, quartz_stairs |
| cream stucco | smooth_sandstone, smooth_sandstone_stairs, smooth_sandstone_slab, cut_sandstone |
| plinth | stone_bricks, stone_brick_stairs, stone_brick_slab, stone_brick_wall; polished_andesite |
| green trim | dark_prismarine, dark_prismarine_stairs, dark_prismarine_slab; warped_trapdoor (open) |
| grey roof | polished_andesite(_stairs/_slab), andesite_stairs, stone_stairs, stone_brick_stairs eave |
| red roof | bricks, brick_stairs, brick_slab (+ preset red-tile) |
| openings | glass_pane, spruce_door |
| porch | birch_planks, birch_fence |
| ground | smooth_stone, smooth_stone_slab, grass_block, coarse_dirt, dirt_path, oak_leaves (persistent), oak_log |
| flag | end_rod, stone_brick_wall, white_wall_banner (+ red/blue patterns), lightning_rod |
| light | lantern (hanging true/false), spruce_fence |
| flowers | poppy, azure_bluet (on grass) |

## VOCABULARY

Each helper takes absolute row coordinates.
- `wallBox(g, [x0,z0,x1,z1], y0, y1, mat)`: hollow wall shell, plinth row y1 in the plinth block, openings later cut as air.
- `plinth(g, rect, block)`: y1 course round the rect.
- `floorDeck(g, rect, y, "birch_planks")`: upper deck.
- `leanTo(g, rect, y, dir, stairMat, edgeMat)`: one course of bottom stairs facing UP the slope (facing = toward the hall), outer row edgeMat.
- `window(g, x, y, z, face, w, h)`: glass_pane w x h set flush in the wall, quartz_slab sill (top) below on the wall's inside row, lintel quartz at top when the wall is thicker than glass.
- `tallWindow(g, x, z, face)`: window w2 h3 from y2..4, quartz jambs.
- `shutter(g, pos, face, "warped", {height})`: the toolkit shutter, open warped_trapdoor flat on the wall each side of a window; skip where the cell is outside the plot.
- `slidingDoor(g, x, z, face, w, h)`: dark_prismarine panel flush in the opening, quartz_block jambs.
- `doorPair(g, x, z, face)`: spruce_door lower+upper both, same facing, hinge left/right, facing out.
- `arcade(g, x0, x1, z, y)`: piers 1 wide at given xs, arches = smooth_sandstone_stairs half top facing toward each other over the 2-wide bays.
- `porch(g, x0, x1, z0, z1)`: deck birch_planks y0, birch_fence posts every 3 on quartz_slab bases, rail fence y1 open at the door, roof polished_andesite_stairs shed y3.
- `awning(g, x0, x1, z, y)`: dark_prismarine_stairs facing south.
- `cupola(g)`: per ROOFS.
- `flag(g)`: pole + banner per RESERVED.
- `doorStep(g, x, z, face, w)`: bottom smooth_stone_slab.
- `lawn(g, rect)`, `hedge(g, rect)`, `smallTree(g, x, z)`: grass_block at y0; hedge oak_leaves 1 high persistent; trunk oak_log 4 high + leaf crown of persistent oak_leaves (wider by 2), kept inside the plot and under the cap.
- `lampPost(g, x, z)`: spruce_fence y1..3 + lantern y4 on top.
- `floorLantern(g, x, y, z)`, `eaveLantern(g, x, y, z)`: standing lantern on the floor; hanging lantern under a roof edge.

## ROOMS

Exterior-only kit (architect): each mass is a hollow, unfurnished, lit volume, interiors inset 1 from the mass rect, y1..(roof course - 1). No rooms are designed or furnished; lanterns only. Two-storey buildings have a deck at y3 (birch_planks); no stairs are built.

## PARTS

1. Shells, plots 0-3 (`parts/shell-a.mjs`): wallBox, plinth, floorDeck for the masses of plots 0..3, arcade piers; leaves every opening air.
2. Shells, plots 4-9 (`parts/shell-b.mjs`): the same for plots 4..9.
3. Roofs, plots 0-3 (`parts/roofs-a.mjs`): roof.json per roof row, gable infill, then lean-tos, V flat roof, A2/H1/H2 by hand.
4. Roofs, plots 4-9 (`parts/roofs-b.mjs`): roofs O, S, C, OCC, G, B, B1, lean-tos, then the cupola.
5. Facade fittings (`parts/fittings.mjs`): OPENINGS table: windows, doors, sliding doors, shutters, arches, awning, signs, flag, pediment check.
6. Grounds and light (`parts/grounds.mjs`): door steps, lawns, paths, hedges, trees, lamp posts, interior and eave lanterns; run last.

## Notes for workers
- Nothing outside a plot or above its cap; plot 9 sits at x149..155, the cap in the SITE table.
- Build in row coordinates; z0 faces are on the plot edge: recess, never project.
- Build order inside a plot: main mass, joining masses, lean-tos. Roofs: W3 before W1/W2/W4; A before A1.
- Every door sits at y1 over ground y0; the slab step is inside the plot only where there is room (z0 doors have none: leave a flush threshold).
- Run `$MCD check` and `$MCD roof ... --dry-run` after each part.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (checklist)

All coordinates are plan.md's row coordinates (y0 = ground). Part numbers refer to PARTS in plan.md.

- [ ] **Shells, 10 buildings on their footprints** (P1 plots 0-3, P2 plots 4-9): white_concrete / smooth_sandstone walls on a plinth course (stone_bricks or polished_andesite), every mass from plan.md's tables, openings left AIR. Helpers: `wallBox`, `plinth`.
- [ ] **Diagonal footprints as block steps**: the hall sections W1..W4 and L1..L3 and the lean-tos step with the map; no diagonal block lines. P1.
- [ ] **Warehouse hall roofs W1-W4 (grey gable, broad)**: roof tool, GREY mix, ridge polished_andesite_slab, quartz_stairs verge; gable triangles in white_concrete. P3.
- [ ] **Lean-to sheds**: one course of stairs facing up toward the hall, outer row stone_brick_stairs (grey) or brick_stairs (red). `leanTo`. P3/P4.
- [ ] **Red clay-tile hipped roof, admin building 1**: roof preset civic, palette red-tile, ridge y10. P3.
- [ ] **Grey gable + porch, housing 2**: GREY gable E-W, porch deck birch_planks y0 x67..82 z0..1, birch_fence posts on quartz_slab bases, lean-to roof y3. `porch`. P3, P5.
- [ ] **Mission arcade, plot 1 x39..46 z2..3**: piers smooth_sandstone, arches = upside-down smooth_sandstone_stairs between piers, brick_stairs shed roof y3. `arcade`. P1 (piers), P5 (arches).
- [ ] **Storehouse loading doors, plot 3**: 2-wide doors y1..3 filled dark_prismarine panels flush; row on west faces per OPENINGS. `slidingDoor`. P5.
- [ ] **Warehouse sliding doors + tall windows** (plot 0): dark_prismarine panels, quartz jambs, 2-wide windows y2..4 with quartz_slab sills. `tallWindow`, `slidingDoor`. P5.
- [ ] **Paired windows + green shutters** (1, 2, 4, 6, 7): glass_pane, quartz sill slab, warped_trapdoor open shutters flat beside. `window`, `shutter`. P5.
- [ ] **Coast guard cupola** x125..126 z6..7 y7..10: quartz_block base y7, glass_pane y8, dark_prismarine_slab cap y9, lightning_rod y10 at x125 z6. `cupola`. P4.
- [ ] **Coast guard pediment**: quartz by the civic preset on C1 north face. P4.
- [ ] **Flagpole and US flag**: stone_brick_wall foot x120 z1 y1, end_rod y2..9, white_wall_banner flag with red/white stripes and blue canton hung x121..122 z1 y8..9 (banner patterns: stripes red, canton blue, from the toolkit's `B.banner`). `flag`. P5.
- [ ] **Bike shop front**: glass shopfront x109..116 z1 y1..3, double door x112..113, dark_prismarine_stairs awning z0 y3 facing south, lantern x112, "BIKES" banners x110..114 z0 y4..5 on the fascia. `awning`, `bannerWord`. P5.
- [ ] **Sign "GYM"** on vestibule fascia x12..15 z0 y3..4 (plaque, material null). P5.
- [ ] **Garage door** plot 8 x143..144 dark_prismarine panel between quartz jambs x142, x145. P5.
- [ ] **Boathouse door** plot 9 x153..154 y1..2 dark_prismarine panel, birch_planks frame y3, steep red roof. P4/P5.
- [ ] **Door steps**: one bottom smooth_stone_slab outside each door, inside the plot only (accessible half step). `doorStep`. P6.
- [ ] **Lawns, paths, hedges, trees**: grass_block patches (coarse_dirt edges), smooth_stone_slab paths, persistent oak_leaves hedges; per SITE. `lawn`, `hedge`, `smallTree`. P6.
- [ ] **Lamp posts** on lawns of plots 0, 1, 2, 6: spruce_fence 3 high + lantern. `lampPost`. P6.
- [ ] **Lighting, no spawns**: lanterns on floor y1 every 6 cells inside each mass and under lean-tos; hanging lanterns by each main door. `floorLantern`, `eaveLantern`. P6.
- [ ] **Upper floor deck y3** in two-storey buildings (1, 2, 4, 6, 7): birch_planks. P1/P2.
```

### rooms.json

```json
{"entrance":[126,1,-1],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"white":["white_concrete","quartz_block","quartz_slab","quartz_stairs"],"cream":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab","cut_sandstone"],"plinth":["stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall","polished_andesite"],"green_trim":["dark_prismarine","dark_prismarine_stairs","dark_prismarine_slab","warped_trapdoor"],"grey_roof":["polished_andesite","polished_andesite_stairs","polished_andesite_slab","andesite","andesite_stairs","stone","stone_stairs","stone_brick_stairs"],"red_roof":["bricks","brick_stairs","brick_slab","granite","polished_granite","mangrove_planks","mud_bricks","mud_brick_stairs","quartz_block","quartz_stairs"],"openings":["glass_pane","spruce_door"],"porch":["birch_planks","birch_fence","quartz_slab"],"ground":["smooth_stone","smooth_stone_slab","grass_block","coarse_dirt","dirt_path","oak_leaves","oak_log"],"flag":["end_rod","stone_brick_wall","white_wall_banner","lightning_rod"],"light":["lantern","spruce_fence"],"flowers":["poppy","azure_bluet"],"White walls, siding relief, window frames and porch trim":["white_concrete","quartz_block","quartz_stairs","quartz_slab"],"Cream stucco and shop walls":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab"],"Wood details and material-key swatch":["birch_planks","birch_stairs","birch_slab"],"Green trim, awnings and decorative large door panels":["dark_prismarine","dark_prismarine_stairs","dark_prismarine_slab"],"Red roofs, hips, eaves and ridges":["bricks","brick_stairs","brick_slab"],"Grey roofs, verges and ridges":["polished_andesite","polished_andesite_stairs","polished_andesite_slab"],"Windows":["glass_pane"],"Doors, shutters, crate details and porch rails":["spruce_door","spruce_trapdoor","spruce_fence"],"Ground, paths, foundations and entrance steps":["smooth_stone","smooth_stone_slab","stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"Lawns and hedges":["grass_block","oak_leaves"],"Lighting, flag and metal details":["lantern","white_banner","iron_bars"]},"objects":["glass_pane","spruce_door","warped_trapdoor","lantern","spruce_fence","end_rod","lightning_rod","white_wall_banner","poppy","azure_bluet"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then replaces build.nbt.
set -eu
cd "$(dirname "$0")"
tmp=$(mktemp ./.build.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv -f "$tmp" build.nbt
```

### build.mjs

```js
// Crissy West build: lays the site ground, runs the six parts in plan.md order, saves the .nbt given as argv[2].
// Run from this directory (make.sh does): palette.json and roof.json are read from the working directory.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// the parts, in the order the plan builds them; a part whose file is not written yet is skipped with a note
const here = dirname(fileURLToPath(import.meta.url));
const PARTS = [
  ["shells plots 0-3", "parts/shell-a.mjs"],
  ["shells plots 4-9", "parts/shell-b.mjs"],
  ["roofs plots 0-3", "parts/roofs-a.mjs"],
  ["roofs plots 4-9 and cupola", "parts/roofs-b.mjs"],
  ["facade fittings", "parts/fittings.mjs"],
  ["grounds and light", "parts/grounds.mjs"],
];
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(join(here, module))) {
    console.log(`part ${name}: ${module} not written yet, skipped`);
    continue;
  }
  const part = await import(join(here, module));
  list.push([name, part.build]);
}

// the full site grid (1.21.1 data version: the server's), with the plot ground laid at y0
const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], SMOOTH_STONE);

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palette ids (palette.json only), plan.md site coordinates, and a seeded rng for the crissy-west build.

// ---- palette: plan.md PALETTE, one constant per block id ------------------------------------------------------------

// ---- palette: plan.md PALETTE, one constant per block id ------------------------------------------------------------
/** White walls (plots 0, 2, 4, 6, 7, 8, 9). */
export const WHITE_CONCRETE = "white_concrete";

/** Sill, trim, quoin, frame and verge block. */
export const QUARTZ_BLOCK = "quartz_block";

/** Quartz bottom slab: sills, deck coping, C2 rail. */
export const QUARTZ_SLAB = "quartz_slab";

/** Quartz stairs: gable verges and barge boards. */
export const QUARTZ_STAIRS = "quartz_stairs";

/** Cream stucco (plots 1, 3). */
export const SMOOTH_SANDSTONE = "smooth_sandstone";

/** Cream stucco stairs: Mission arches (upside down) in the A2 arcade. */
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";

/** Cream stucco slab. */
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

/** Cream string course (plot 1 storey line at y3). */
export const CUT_SANDSTONE = "cut_sandstone";

/** Plinth and base course (plots 1, 2, 4, 5, 6, 7, 8). */
export const STONE_BRICKS = "stone_bricks";

/** Plinth stairs. */
export const STONE_BRICK_STAIRS = "stone_brick_stairs";

/** Plinth slab. */
export const STONE_BRICK_SLAB = "stone_brick_slab";

/** Flag pole foot (plot 6). */
export const STONE_BRICK_WALL = "stone_brick_wall";

/** Plinth course on plots 0 and 3, and the grey roof mix. */
export const POLISHED_ANDESITE = "polished_andesite";

/** Green trim, door panels, awning. */
export const DARK_PRISMARINE = "dark_prismarine";

/** Green trim and awning stairs (facing south). */
export const DARK_PRISMARINE_STAIRS = "dark_prismarine_stairs";

/** Green trim slab (cupola band). */
export const DARK_PRISMARINE_SLAB = "dark_prismarine_slab";

/** Green shutters, open flat on the wall. */
export const WARPED_TRAPDOOR = "warped_trapdoor";

/** Grey roof mix (6 parts), stairs. */
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";

/** Grey roof ridge slab. */
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";

/** Grey roof mix (3 parts). */
export const ANDESITE = "andesite";

/** Grey roof mix stairs. */
export const ANDESITE_STAIRS = "andesite_stairs";

/** Grey roof mix (1 part). */
export const STONE = "stone";

/** Grey roof mix stairs. */
export const STONE_STAIRS = "stone_stairs";

/** Red roof palette (red-tile): bricks, brick stairs and slab. */
export const BRICKS = "bricks";

/** Red roof stairs. */
export const BRICK_STAIRS = "brick_stairs";

/** Red roof slab. */
export const BRICK_SLAB = "brick_slab";

/** Red roof palette (red-tile) mix. */
export const GRANITE = "granite";

/** Red roof palette (red-tile) mix. */
export const POLISHED_GRANITE = "polished_granite";

/** Red roof palette (red-tile) mix. */
export const MANGROVE_PLANKS = "mangrove_planks";

/** Red roof eave (red-tile). */
export const MUD_BRICKS = "mud_bricks";

/** Red roof eave stairs (red-tile). */
export const MUD_BRICK_STAIRS = "mud_brick_stairs";

/** Windows (connected panes). */
export const GLASS_PANE = "glass_pane";

/** Walk-in doors (both halves). */
export const SPRUCE_DOOR = "spruce_door";

/** Porch deck. */
export const BIRCH_PLANKS = "birch_planks";

/** Porch posts and rails. */
export const BIRCH_FENCE = "birch_fence";

/** Ground (y0) and the ground under the warehouse. */
export const SMOOTH_STONE = "smooth_stone";

/** Bottom door-step slab and paths. */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

/** Lawns. */
export const GRASS_BLOCK = "grass_block";

/** Ground mix. */
export const COARSE_DIRT = "coarse_dirt";

/** Path replacement. */
export const DIRT_PATH = "dirt_path";

/** Hedges and tree crowns (persistent). */
export const OAK_LEAVES = "oak_leaves";

/** Tree trunks. */
export const OAK_LOG = "oak_log";

/** Flagpole (flag part). */
export const END_ROD = "end_rod";

/** Cupola ridge rod (plot 6). */
export const LIGHTNING_ROD = "lightning_rod";

/** Flag banner and sign banners (patterns set in NBT). */
export const WHITE_WALL_BANNER = "white_wall_banner";

/** Hanging and standing lanterns. */
export const LANTERN = "lantern";

/** Lamp posts and light fences. */
export const SPRUCE_FENCE = "spruce_fence";

/** Flower bed on the lawns. */
export const POPPY = "poppy";

/** Flower bed on the lawns. */
export const AZURE_BLUET = "azure_bluet";

// ---- site: plan.md SITE table (row coordinates, inclusive) -----------------------------------------------------------
/** Full site size [x, y, z]: x 0..155, y 0..10 (highest course: cupola lightning rod), z 0..38. */
export const SITE_SIZE = [156, 11, 39];

/** Ground course y (each plot's smooth_stone ground). */
export const GROUND_Y = 0;

/** First wall course y (the plinth row). */
export const WALL_Y = 1;

/** The nine plots: x and z ranges inclusive, cap = the highest block y allowed. */
export const PLOTS = [

// ---- seeded random -----------------------------------------------------------------------------------------------------
/** rng(seed): a function returning the next float in [0, 1) from a 32-bit seed (mulberry32; same seed, same sequence). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers from plan.md VOCABULARY: wallBox, leanTo, shutter, arcade, cupola, lawn, lampPost.
// Every helper takes its position as arguments (row coordinates), writes only its own footprint, and writes only
// into air. A cell that is already filled (ground, an earlier part's wall or roof) is refused, not overwritten:
// the call returns { placed, refused } where refused lists [x, y, z, block] for each cell it left alone.
// The lawn is the one helper that writes into ground: it turns the plot's smooth_stone at its y into grass.

/**
 * Hollow wall shell on the rect [x0, z0, x1, z1] from y0 up to y1 (both included): the perimeter only, no floor, no
 * roof. plinthMat, when given, is the bottom course (y0): the plinth row. Openings are cut later, as air.
 */
export function wallBox(g, [x0, z0, x1, z1], y0, y1, mat, plinthMat)

/**
 * One course of bottom stairs over the rect [x0, z0, x1, z1] at height y. dir is the way the roof falls ("west" for a
 * lean-to that is sloping west, as in plan.md); its stairs face up the slope, toward the hall (the opposite of dir).
 * The outer row (the low edge) is edgeMat's stairs, the rest stairMat's.
 */
export function leanTo(g, [x0, z0, x1, z1], y, dir, stairMat, edgeMat)

/**
 * A window shutter: open trapdoor (default warped) lying flat on the wall, on the cell at [x, y, z] (the bottom cell),
 * `height` cells up. wallFace is the way the wall looks. plot: [x0, z0, x1, z1]; a cell outside it is skipped.
 */
export function shutter(g, [x, y, z], wallFace, wood = "warped", { height = 1, plot } = {})

/**
 * Mission arcade along the row z from x0 to x1, base y: piers of smooth_sandstone at y and y+1, and over each 2-wide bay
 * an arch of upside-down smooth_sandstone_stairs at y+2 facing each other. Bays start one cell in from x0 and repeat
 * every 3; a cell in no full bay is a pier, so x0..x1 = 39..46 gives piers 39, 42, 45, 46 and bays 40-41, 43-44.
 */
export function arcade(g, x0, x1, z, y)

/**
 * Lookout cupola on the 2x2 footprint [x0..x0+1, z0..z0+1]: quartz_block base at y0, glass_pane (connected to its
 * neighbours in the footprint) at y0+1, dark_prismarine_slab cap at y0+2, lightning_rod at [x0, y0+3, z0].
 * plan.md: cupola([125, 6], 7) is the coast guard's.
 */
export function cupola(g, [x0, z0], y0 = 7)

/**
 * Lawn on the rect [x0, z0, x1, z1] at ground height y (default 0): grass_block replaces the smooth_stone there (or air).
 * Any other block at y is left alone and reported in refused.
 */
export function lawn(g, [x0, z0, x1, z1], y = 0)

/** Lamp post on the lawn at [x, z]: spruce_fence posts at y..y+2 with a standing lantern on top at y+3 (y default 1). */
export function lampPost(g, x, z, y = 1)
```

### vocab/h2.mjs

```js
// Helpers from plan.md VOCABULARY: plinth, window, slidingDoor, porch, flag, hedge, floorLantern.
// Every helper takes its position (and facing) as arguments, writes only its own footprint, and writes only into air.
// A filled or out-of-bounds cell, or one below the helper's floor (y < 1, or y < 0 for the porch deck), is refused,
// not overwritten: the call returns { placed, refused } where refused lists [x, y, z, block] for each cell left alone.
// Three explicit exceptions, each an option: plinth({ over }) and slidingDoor's jambs (frame) replace the wall cells
// they are set in; the porch deck (deck) replaces the y0 ground under its own footprint. Nothing else touches y0.

/** Plinth course: the y course round the rect [x0, z0, x1, z1] (inclusive), one full block of `block`.
 *  Air only unless over: the wall shell already fills y1, so the plinth replaces it with over: true. */
export function plinth(g, [x0, z0, x1, z1], block, { y = 1, over = false } = {})

/** Glass window of w x h cells from [x, y, z] (the wall's first cell at its bottom-left, looking along the wall),
 *  face = the way the wall looks. Panes connect along the wall; a quartz_slab sill sits proud of the wall, outside,
 *  under the glass (y - 1). With a 1-cell wall there is no lintel course. */
export function window(g, x, y, z, face, w, h, { sill = true } = {})

/** Sliding-door panel: dark_prismarine flush in the opening, the opening is w wide from [x, z] and runs from y1 to
 *  y h (inclusive). Quartz jambs stand in the wall cells either side (frame: false leaves them out). */
export function slidingDoor(g, x, z, face, w, h, { frame = true } = {})

/** Porch on the front rows z0 (outer) and z1 (against the house wall), x0..x1 inclusive: birch_planks deck at y0
 *  (replaces the ground under the porch only), birch_fence posts every 3 from x0 (and at x1) on quartz_slab bases at
 *  y1 with the post at y2, a rail fence at y1 along z0 between the posts, open over the cells in open = [xa, xb],
 *  and a one-course shed roof at y3: polished_andesite_stairs facing south on z0, polished_andesite_slab on z1. */
export function porch(g, x0, x1, z0, z1, { open = null, deck = true } = {})

/** Flagpole with a two-cell US cloth: stone_brick_wall foot at y1, end_rod pole y2..top (top = 9 by default) at [x, z].
 *  The cloth is two wall banners at x + 1 (y top-1 and top), facing west, hung on a white_concrete backing at x + 2. */
export function flag(g, x, z, { top = 9 } = {})

/** Hedge: persistent oak_leaves, one course at y (default 1), over the rect [x0, z0, x1, z1] (inclusive). */
export function hedge(g, [x0, z0, x1, z1], { y = 1 } = {})

/** Standing lantern on the floor at [x, y, z]: needs a solid block under it and two cells of headroom above, else it is
 *  refused whole. Lanterns are the only furniture here (plan.md ROOMS: no rooms are furnished). */
export function floorLantern(g, x, y, z)
```

### vocab/h3.mjs

```js
// Named helpers from plan.md VOCABULARY (this file's share): floorDeck, tallWindow, doorPair, awning, doorStep,
// smallTree, eaveLantern. Each takes its position (and facing, where it has one) as arguments; plan.md's numbers are
// only what the caller passes in. Every helper writes only the cells of the footprint its arguments define, and only
// into air: a cell an earlier part built (wall, ground, floor) is skipped and reported, never overwritten. The one
// exception is tallWindow's quartz jambs, which replace the wall beside the opening (plan.md's window frame).
// Each returns { placed, refused, skipped } (lists of [x, y, z]) so a caller can report what did not land.

/** Upper-storey deck: birch_planks (or `material`) over the inclusive rect [x0, z0, x1, z1] at height y. */
export function floorDeck(g, [x0, z0, x1, z1], y, material = "birch_planks")

/**
 * Two-wide, three-high window at y2..4 in a wall. (x, z) is the first cell of the run on the wall: the run goes +x on a
 * north/south face (wall row z), +z on an east/west face (wall column x). Glass fills the opening, quartz_slab top
 * sill sits on the inside row at y1, and quartz_block jambs replace the wall on either side (jambs: false to skip).
 */
export function tallWindow(g, x, z, face, { jambs = true } = {})

/** A spruce door, both halves, in the opening at (x, z): facing out along `face`, hinge "left" or "right". */
export function doorPair(g, x, z, face, { hinge = "left" } = {})

/** One course of dark_prismarine stairs along x0..x1 at row z, height y. `facing` is the high back (plan: south). */
export function awning(g, x0, x1, z, y, facing = "south")

/**
 * The accessible half step outside a door of width w starting at (x, z) on `face`: bottom smooth_stone_slab at y1 in
 * the cell in front of it. Pass `inside` ([x0, z0, x1, z1]) to keep it on the plot; a door on the plot edge gets none.
 */
export function doorStep(g, x, z, face, w, { inside } = {})

/**
 * Small tree on the ground at (x, z): oak_log trunk at y1..4, persistent oak_leaves crown (5 wide at y3..4 with the
 * corners off, 3 wide at y5). Pass `inside` and `cap` to keep the crown on the plot and under the cap. Writes no ground.
 */
export function smallTree(g, x, z, { inside, cap } = {})

/**
 * Hanging lantern at (x, y, z), under a roof edge. A hanging light hangs from a block above, so it is refused (not
 * placed) when the cell above is air.
 */
export function eaveLantern(g, x, y, z)
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
 *  flat against the flue where there is only air beside it (a slim pipe above the roof). Build it after the roof.
 *  It lays its own footing down to the ground and overwrites what is in its cells: call it directly, never through a
 *  helper that writes only into air (that helper refuses the whole stack over one filled cell). */
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
walk between its openings passes). With `street` in rooms.json it also walks the **way in**, street to main door (with `entrances`, each building's or
module's, from the street straight in front of it),
and lists a **steep approach** (a stair or a full-block step on it, more than 3 half-steps without a 2-long landing,
1 wide, or no level cell before the door): the approach standard, `$MCD approach` alone. The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves; refuses a cell that isn't air and returns
false), `flight(g, { from, facing, to, material, width })` (a flight whose last step is in the upper floor's own layer,
headroom cut, stringer under it), `chimney(g, { wall: [x, floorY, z], into, top, material, thin })` (an exterior chimney: the fire
just outside the wall, its mouth cut through it, hay in the floor, a 1 x 1 air flue to the sky, masonry through the
roof, thin trapdoors above it, its own footing; call it directly, never through an air-only helper), `shutter(g, [x, y, z], face, wood, { height })`
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
