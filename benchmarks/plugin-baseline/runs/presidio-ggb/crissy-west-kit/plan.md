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
