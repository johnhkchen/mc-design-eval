# St Patrick's Cathedral, New York: plan of form

All coordinates are LOCAL to each plot (x0, z0 = the plot box's corner, y 0 = its lowest ground).
Ground convention: GROUND value g = the walking level; built masses start at y 0 and fill solid down to y 0 under every built cell (the hidden plinth below the ground line is fine, nothing floats).

## SITE

**Orientation (overrides the generic "front faces north").** Plot 0 is built as the maps show it: the WEST FRONT faces **-x** (Fifth Avenue, low x); the nave runs along +x to the Lady Chapel at high x (Madison side). 51st St is to the north (z 0), 50th St to the south (z 41). The long axis of the church is **z = 20** (everything mirrors across it). Ground: 2 at the west half, 1 at the east; the church floor is one level throughout.

### Plot 0: the cathedral (105 x 42, x 0..104, z 0..41, limit y 96)

| mass | x | y | z | notes |
|---|---|---|---|---|
| Plinth / church floor block | whole built footprint | 0..2 | as below | floor top at y 2, interior walk y 3; polished andesite plinth course y 0..2 outside |
| West steps (Fifth Ave) | 0..3 | 2 | 14..26 | x 0 bottom slab at y 2 (walk 2.5), x 1..3 full blocks y 2 (walk 3.0 = church floor); 13 wide; lamp posts at (0, 3, 13) and (0, 3, 27) |
| North tower (square) | 0..10 | 0..43 | 3..13 | 11 x 11; corner buttresses 2 x 2 at its four corners stepping in at y 14 and y 30 |
| South tower (square) | 0..10 | 0..43 | 27..37 | mirror of the north tower |
| Tower parapet + corner pinnacles | each tower's rim | 44..45 (parapet), 44..54 (pinnacles) | | pinnacles 2 x 2 to y 49, then 1 x 1 to y 53, end rod y 54 |
| North spire (octagonal, openwork) | 1..9 | 44..87 | 4..12 | octagon widths: 9 (y 44..53), 7 (y 54..63), 5 (y 64..73), 3 (y 74..81), 1 (y 82..87); centre (5, z 8) |
| North spire lucarnes | the 4 cardinal faces of the octagon | 44..52 | | small gabled dormers, 3 wide, 1 proud of the octagon face |
| North spire cross | 5 | 88..92 | 8 | diorite_wall shaft y 88..92, arms at y 91 (z 7 and z 9), end rod tip y 93 |
| South spire + lucarnes + cross | 1..9 | 44..93 | 28..36 | mirror; centre (5, z 32) |
| Centre west front (between towers) | 4..10 | 0..33 | 14..26 | front wall plane x 4; above it the great gable |
| Great west gable | 4..6 | 34..41 | 14..26 | triangle 45 deg: y 34 at z 14 and z 26, apex y 41 at z 20; pierced parapet on its rake; finial cross y 42..44 at (4, z 20) |
| Gable flanking pinnacles | 4..5 | 30..44 | 13 and 27 | 2 x 2 slender pinnacles between gable and towers |
| Nave high vessel | 11..45 | 0..33 (walls) | 14..26 | clerestory walls z 14 and z 26; 6 bays of 5, piers at x 10, 16, 22, 28, 34, 40, 46 |
| North nave aisle | 11..45 | 0..20 | 4..13 | outer wall z 4, buttress piers z 3 at each pier x |
| South nave aisle | 11..45 | 0..20 | 27..36 | outer wall z 36, buttress piers z 37 |
| Crossing | 46..58 | 0..33 | 14..26 | 13 x 13; fleche on top |
| Fleche | 51..53 | 41..58 | 19..21 | 3 x 3 open lantern y 42..47 (copper roof stairs over), octagon-ish spire 1 wide y 48..56, lightning rod y 57..58 |
| North transept (high vessel) | 46..58 | 0..33 | 0..13 | end facade z 0 |
| South transept (high vessel) | 46..58 | 0..33 | 27..40 | end facade z 40 |
| Transept aisles (4) | 39..45 and 59..65 | 0..22 | 0..13 and 27..40 | low wings either side of each transept arm |
| Transept end turrets (4) | 44..46 and 58..60 | 0..42, pinnacle to 47 | 0..2 and 38..40 | 3 x 3 stair turrets at the high vessel's corners, octagonal top y 34..42, spirelet y 43..47 |
| Choir high vessel | 59..79 | 0..33 | 14..26 | piers at x 64, 70, 76 (bays x 65..69, 71..75, 59..63 inside transept aisle line) |
| Choir apse (3-sided) | 80..84 | 0..33 | 14..26 tapering | wall cells: x 80..81 z 14 and z 26; x 82 z 15 / 25; x 83 z 16 / 24; x 84 z 17..23 (east face) |
| North choir aisle | 66..83 | 0..20 | 6..13 | outer wall z 6, buttress piers z 5 |
| South choir aisle | 66..83 | 0..20 | 27..34 | outer wall z 34, buttress piers z 35 |
| Ambulatory chapels N / S | 84..89 | 0..20 | 9..14 and 26..31 | low polygonal-ish blocks; corner buttresses with pinnacles |
| Lady Chapel | 85..99 | 0..21 (walls) | 16..24 | walls z 16 and z 24, buttress piers z 15 and z 25 at x 88, 92, 96 |
| Lady Chapel apse | 100..104 | 0..21 | wall cells: x 100 z 16..24; x 101 z 17..23; x 102..103 z 18..22; x 104 z 19..21 | 5-sided end |
| Lawns | unbuilt footprint cells (z 0..2 west of x 39 and east of x 65 are NOT footprint, leave) | 1..2 | e.g. x 84..101 z 15 strip, x 69..86 z 35, x 87..89 z 32..33 | grass with 3 small trees (oak, crowns radius 2, top <= y 12) at (93, z 12), (93, z 28), (70, z 37) only where footprint |

### Plot 1: Archbishop's Residence (19 x 15, x 0..18, z 0..14, limit y 30). Front: north on 51st St (z 0); east face on Madison (x 18).

| mass | x | y | z | notes |
|---|---|---|---|---|
| Garden (walled), cathedral side | 0..3 | 0..3 | 0..9 | wall 1 thick on x 0 and z 9, height y 0..2, coping slab y 3; lawn + 2 shrubs inside |
| Main block | 4..18 | 0..13 (walls) | 0..9 | 15 x 10, three storeys |
| Rear wing | 6..16 | 0..13 | 10..14 | 11 x 5; walls x 6, x 16, z 14 |
| North cross-gable bay | 9..13 | 0..19 | 0..1 | 5-wide gabled bay, 1 proud of the face (front x 9..13 z 0, main wall z 1) |
| East cross-gable bay | 17..18 | 0..19 | 3..7 | 5-wide gabled bay on Madison, main east wall x 17 |
| Chimneys | 2..3 / 17..18 | to y 22 | 4..5 / 11..12 | 2 x 2 exterior stacks: west stack x 2..3 z 4..5 in the garden against main wall x 4; wing stack x 17..18 z 11..12 against the wing's east wall x 16 |
| Entrance | 10..12 | 0 | 0 | door (11, 1..2, 1) recessed 1 in the gable bay; bottom slabs at (10..12, 0, 0) as the single half step (street walk 0 → 0.5 → floor 1) |

Main walls: north z 1 (except the bay at z 0), west x 4 (garden side), east x 17 (bay at x 18), south z 9 / wing z 14.

### Plot 2: The Rectory (18 x 15, x 0..17, z 0..14, limit y 34). Twin of plot 1, mirrored north-south. Front: south on 50th St (z 14); east on Madison (x 17).

| mass | x | y | z | notes |
|---|---|---|---|---|
| Garden, cathedral side | 0..3 | 1..3 | 5..14 | low wall on x 0 and z 14 (y 1..3, slab coping y 4), lawn and shrubs inside |
| Main block | 4..17 | 0..15 (walls) | 5..14 | 14 x 10, three storeys (ground 1..2: floor block y 2); walls x 4, x 16, z 13 |
| North wing | 4..15 | 0..15 | 0..4 | 12 x 5; walls x 4, x 15, z 0 |
| South cross-gable bay | 8..12 | 0..21 | 13..14 | 5 wide, 1 proud of the south wall z 13 |
| East cross-gable bay | 16..17 | 0..21 | 7..11 | main east wall x 16 |
| Chimneys | 2..3 / 16..17 | to y 24 | 8..9 / 1..2 | 2 x 2 exterior stacks: west stack x 2..3 z 8..9 in the garden against main wall x 4; wing stack x 16..17 z 1..2 against the wing's east wall x 15 |
| Entrance | 9..11 | 2 | 14 | door (10, 3..4, 13) in the south bay; bottom slabs at (9..11, 2, 14) as the half step (street walk 2.5 → floor 3) |

Main walls of the rectory: west x 4 (z 5..14), south z 13 (bay to z 14), east x 16 (bay to x 17), north wing walls x 4, x 15, z 0.

## ROOFS

No preset fits a Gothic cathedral (the `church` preset is a stave church), so **the cathedral roofs are built by hand** (gableRoof / hipRoof brushes) from stairs at 45 deg, never full blocks on the surface (stairs and bottom slabs: no mob spawns).

| roof | form | eave | ridge | notes |
|---|---|---|---|---|
| Nave | gable along x, x 11..45 | first course y 34 at z 13 and z 27 (overhang 1 over the clerestory walls) | y 41 at z 20 (copper slab cap y 42) | 45 deg; meets the great west gable (x 4..6) and the crossing |
| Transepts | gable along z, x 45..59, z 0..40 | y 34 at x 45 and x 59 | y 41 at x 52 | runs through the crossing: nave and choir ridges die into it (valleys) |
| Choir | gable along x, x 59..79 | y 34 at z 13 / 27 | y 41 at z 20 | |
| Apse | half-pyramid (hip) over x 80..84 | y 34 | apex y 41 at (80, z 20) | stairs follow the 3-sided wall |
| Ridge crest | whole nave/transept/choir ridge | | y 42 | waxed_oxidized_cut_copper_slab, with a small copper cross-finial at each gable apex |
| Nave + choir aisles | lean-to (shed) | outer y 19 | y 22 against the clerestory | 1 in 3 slope: deepslate_tile_slab / stairs; pierced parapet y 19..20 on outer wall |
| Transept aisles | lean-to toward the transept | y 19 | y 23 | same build |
| Ambulatory chapels | flat deck of bottom slabs y 21 with pierced parapet | | | lanterns on deck |
| Lady Chapel | gable along x, x 85..99, apse half-hip x 100..104 | y 22 at z 15 / 25 | y 26 at z 20, copper ridge y 27 | 45 deg; meets the apse below its eave |
| Tower tops | flat deck y 44 (bottom slabs) inside parapet, spire rises from it | | | lit |
| Residence (plot 1) | steep gable (preset `cottage` geometry is wrong in material: use **`--style gable`, pitch 1.2, material palette `dark-slate`, overhang 1, verge polished_diorite stairs**) | y 14 | y 20 along x over main block; wing ridge y 19 along z; cross-gables to y 19 | chimneys pass through (keep boxes) |
| Rectory (plot 2) | same as plot 1, mirrored | y 16 | y 22 | |

## FACADES

### West front (x 0..10, faces -x): the hero face
- **Base** y 0..2 polished andesite plinth, flush; only the buttresses stand proud.
- **Towers**: 4 stages divided by string courses of polished_diorite_stairs (upside down, 1 proud) at y 14, y 22, y 30, y 43.
  - Stage 1 (y 3..13): side portal on each tower's west face: opening z 7..9 (north) / z 31..33 (south), y 3..10, pointed; 2 layered arch orders recessed (x 0 arch, x 1 arch, copper doors at x 2).
  - Stage 2 (y 15..21): blind tracery panel (diorite_wall mullions in a calcite field), recessed 1.
  - Stage 3 (y 23..29): one tall lancet per face, 3 wide.
  - Belfry (y 31..42): two tall louvred openings per face, each 2 wide y 32..41, pointed heads; louvres of **polished_diorite_slab** (top) every other course with air between (pale louvres), bell visible inside (bell hung from the y 42 ceiling at the tower centre).
  - Corner buttresses 2 x 2 at every tower corner, proud by 1 on both faces, set back 1 at y 14 and y 30 (with polished_diorite_stairs weatherings), ending as the y 44..54 corner pinnacles.
- **Spires**: octagon shell, each ring course alternating diorite_wall and calcite blocks, with every third course a ring of air gaps between posts (lace); edges (the 8 corners) carry crockets: smooth_quartz_stairs sticking out every 3 courses. Lucarnes (gabled dormers) on the 4 cardinal faces at y 44..52.
- **Centre** (x 4 plane, z 14..26):
  - Main portal: opening z 18..22 (5 wide), y 3..12, pointed head; three layered orders: x 4 (outer arch, z 17..23), x 5 (z 18..22), doors at x 6 (central pair of copper doors z 19..21... 3 wide with the middle as a trumeau of polished diorite at z 20: doors z 18..19 and 21..22, y 3..4).
  - Over the portal a gable (wimperg) proud 1 at x 3: y 13..18 rising to apex (3, 18, 20), crocketed with smooth_quartz_stairs, finial end rod y 19.
  - Gallery y 19..21: 5 small pointed arches (diorite_wall columns) across z 15..25, recessed 1.
  - **Rose window** centred (x 4, y 26, z 20), diameter 9 (y 22..30, z 16..24): stone ring of polished_diorite, 8 spokes of diorite_wall, coloured stained glass between, set at x 5 (1 recessed), lit from behind.
  - Upper arcade y 31..33, then the great gable y 34..41 with pierced parapet on the rake.
- **Lamps**: two lamp posts at the step ends, (0, 3..5, 13) and (0, 3..5, 27): polished_blackstone_wall 3 tall + lantern on top at y 6.

### Nave, choir, transept sides (faces ±z)
- **Aisle walls** (z 4 / z 36; choir z 6 / z 34): plinth y 0..2, body y 3..18, string course y 18 (upside-down polished_diorite_stairs, 1 proud), pierced parapet y 19..20 (diorite_wall with air every other cell).
  - One lancet per bay: 3 wide, y 6..15, pointed head (stairs), at the bay centre (nave bays centred x 13, 19, 25, 31, 37, 43; choir x 67, 73, 79... choir aisle bays x 66..69, 71..75, 77..83 centred 67, 73, 80).
- **Buttress piers** at each pier x on the aisle wall line, 1 proud (z 3 / z 37, choir z 5 / z 35), 1 wide, y 0..22 with weathering slabs at y 10 and y 18, and a **pinnacle** on top y 23..27 (diorite_wall shaft, smooth_quartz_stairs crockets, end rod tip y 28).
- **Flying buttresses**: from each pier top (y 22) to the clerestory wall at y 30: a single arched rib 1 wide in the pier's x plane, rising over the aisle roof: z 4 (y 22) → z 13 (y 30) north; mirror south (choir: z 6 → z 13). Underside upside-down polished_diorite_stairs (the curve), top a polished_diorite_slab coping. Over the transept aisles one flyer per transept side at z 6 and z 34 (x 39..45 / 59..65 rising east-west toward x 46 / 58).
- **Clerestory** (z 14 / z 26, y 23..33): one window per bay, 3 wide, y 24..31, pointed; pierced parapet y 33..34 above (the roof eave sits behind it); a small pinnacle where each flyer lands (y 31..35).
- **Transept ends** (z 0 / z 40): portal centred x 52 (opening x 50..54, y 3..11, 2 orders, copper doors), above it a large pointed window x 48..56, y 15..30 with tracery (diorite_wall mullions every 2), the gable y 34..41, flanked by the turrets.
- **Apse / Lady Chapel**: tall lancets in every face (Lady Chapel 3 wide, y 5..18 between buttresses at x 86..87, 89..91, 93..95, 97..99; apse faces 1 each), buttress pinnacles to y 26, pierced parapet y 21.

### Residences (plots 1 and 2)
- Plinth y 0..1 polished_andesite; body calcite with polished_diorite quoins (paired, 2 long 1 short) at corners; string courses (polished_diorite_slab top, 1 proud) under each upper storey's windows.
- Storey windows square-headed below, pointed (Gothic) on the top floor and in the gables; 2 wide x 2 tall, sill slab under each, every 3 cells along the faces.
- Front door: pointed arch of upside-down polished_diorite_stairs, dark_oak_door, lanterns either side.

## MATERIALS

| role | block id | share / note |
|---|---|---|
| Wall body (marble) | calcite (55 %), polished_diorite (30 %), diorite (15 %) | soft pale grey-white mix, never all one; diorite more at the plinth and buttress bases |
| Dressed trim, arches, sills, weatherings | polished_diorite_stairs, polished_diorite_slab, polished_diorite | (calcite has no stairs) |
| Tracery, mullions, pierced parapets, spire lace, pinnacle shafts | diorite_wall | |
| Crockets, finials, crisp highlights | smooth_quartz_stairs, smooth_quartz_slab, end_rod | sparse |
| Plinth / base / steps | polished_andesite, polished_andesite_slab | slightly darker base course |
| Main roof | deepslate_tile_stairs (80 %), cobbled_deepslate_stairs (20 % in irregular patches), deepslate_tile_slab at eaves | dark grey slate |
| Ridge crest, fleche, small caps | waxed_oxidized_cut_copper_slab / _stairs / waxed_oxidized_cut_copper | verdigris, waxed so it never changes |
| Fleche lantern sides | waxed_oxidized_copper_grate | |
| Stained glass (lancets) | purple_stained_glass_pane, blue_stained_glass_pane, red_stained_glass_pane, yellow_stained_glass_pane | blue dominant, red + purple, yellow points |
| Rose window glass | blue_stained_glass, red_stained_glass, purple_stained_glass, yellow_stained_glass (full blocks) | |
| Light behind glass | ochre_froglight | one cell behind every pane/glass |
| Doors (bronze) | waxed_exposed_copper_door | portals; residences dark_oak_door |
| Lamp posts | polished_blackstone_wall + lantern | |
| Residence roofs | deepslate_tile_stairs/slab ("dark-slate"), verges polished_diorite_stairs | |
| Residence chimneys | polished_diorite body, deepslate_bricks band, polished_diorite_slab cap | (pale, matching marble) |
| Residence windows | glass_pane with ochre_froglight lamp or lantern behind in about half | |
| Ground | grass_block, moss_block patches, smooth_stone sidewalk, oak_log + oak_leaves (persistent) trees | |

Checked with `mcd blocks --check`: all exist. `chain` is reported missing only because the toolkit tracks the newer name `iron_chain`; on 1.21.1 it is `chain`. The plan uses no chains (lanterns hang under blocks).

## OPENINGS

Pointed heads: upside-down polished_diorite_stairs meeting at the centre over a 3-wide opening; panes recessed 1 behind the wall face, froglight behind them.

| opening | where (x, y, z) | size |
|---|---|---|
| Main west portal | x 4..6 recess, y 3..12, z 18..22 | 5 wide, doors at x 6 (z 18..19, 21..22, y 3..4), trumeau z 20 |
| Tower side portals | x 0..2 recess, y 3..10, z 7..9 and z 31..33 | 3 wide, copper doors at x 2 y 3..4 |
| Rose window | x 5, y 22..30, z 16..24 | diameter 9 |
| Tower stage-3 lancets | each tower face centre, y 23..29 | 3 wide (west face z 7..9 / 31..33; north tower north face x 4..6 at z 3; south tower south face x 4..6 at z 37) |
| Belfry openings | each face, y 32..41 | two of 2 wide: west faces z 5..6 + z 10..11 (north), z 29..30 + z 34..35 (south); side faces x 2..3 + x 7..8 |
| Nave aisle lancets | z 4 and z 36, y 6..15, x 12..14, 18..20, 24..26, 30..32, 36..38, 42..44 | 3 wide |
| Nave clerestory | z 14 and z 26, y 24..31, same x as aisle lancets | 3 wide |
| Choir aisle lancets | z 6 and z 34, y 6..15, x 66..68, 72..74, 79..81 | 3 wide |
| Choir clerestory | z 14 / z 26, y 24..31, x 60..62, 66..68, 72..74; apse faces x 82 z 17 / 23 and x 84 z 19..21 | 3 wide |
| Transept portals | z 0 and z 40, x 50..54, y 3..11 | 5 wide, copper doors y 3..4 at x 51..53 (z 1 / z 39 recess) |
| Transept great windows | z 0 / z 40, x 48..56, y 15..30 | 9 wide with tracery |
| Transept aisle lancets | z 0 / z 40, x 41..43 and 61..63, y 6..15 | 3 wide |
| Lady Chapel lancets | z 16 / z 24, y 5..18, x 86..87, 89..91, 93..95, 97..99; apse x 101 z 18 / 22, x 104 z 20 | 2-3 wide |
| Ambulatory chapel windows | z 9 / z 31, y 6..14, x 85..87 | 3 wide |
| Residence (plot 1) | door (11, 1..2, 1) in the north bay; windows 2 x 2 at y 2..3, 6..7, 10..11 at x 5..6, 15..16 (north face z 1), z 2..3 on the east wall x 17 and z 12..13 on the wing east wall x 16 (stack at z 11..12 between), plus the bays' centre windows | |
| Rectory (plot 2) | door (10, 3..4, 13) in the south bay; windows 2 x 2 at y 4..5, 8..9, 12..13, x 5..6, 14..15 (south face z 13), z 5..6 and z 12..13 on x 16 | |

## RESERVED (the shell leaves these empty)

- Every window and door opening above (air until the glazier); the cell behind each window is reserved for the froglight.
- Rose window disc x 5, y 22..30, z 16..24 (tracery + glass part only).
- Tower belfry interiors x 2..8, y 31..42 (bell at (5, 41, 8) and (5, 41, 32), hung from y 42).
- Spire interiors (open lace: air inside the octagon shell).
- Fleche lantern x 51..53, y 42..47, z 19..21 (open sides).
- Lamp post cells (0, 3..6, 13) and (0, 3..6, 27); tree cells listed in SITE.
- Residence chimney boxes (plot 1: x 2..3 z 4..5 and x 17..18 z 11..12; plot 2: x 2..3 z 8..9 and x 16..17 z 1..2) from y 0 to their tops: the roof cuts back from them.

## FLOORS

| mass | floor block | walk level | interior volume |
|---|---|---|---|
| Cathedral (all parts) | y 2 | y 3 | nave x 11..45 z 15..25 y 3..33 (exterior only: interior stays dark/hollow except the light layer behind glass) |
| Towers | y 2; belfry floor y 30 | y 3 / y 31 | x 2..8 z 5..11 (north), z 29..35 (south) |
| Residence (plot 1) | y 0, y 4, y 8, attic y 12 | 1, 5, 9, 13 | main x 5..16 z 2..8, wing x 7..15 z 10..13 |
| Rectory (plot 2) | y 2, y 6, y 10, attic y 14 | 3, 7, 11, 15 | main x 5..15 z 6..12, wing x 5..14 z 1..4 |

# DESIGNER SECTIONS

## PALETTE
- marble: calcite, polished_diorite, diorite (55/30/15). Trim: polished_diorite_stairs/_slab, polished_diorite. Tracery: diorite_wall, iron_bars (rare). Highlights: smooth_quartz_stairs/_slab, end_rod.
- base: polished_andesite, polished_andesite_slab, smooth_stone (sidewalk).
- roof: deepslate_tile_stairs/_slab, cobbled_deepslate_stairs, waxed_oxidized_cut_copper_slab/_stairs/waxed_oxidized_cut_copper, waxed_oxidized_copper_grate.
- glass: purple/blue/red/yellow_stained_glass_pane and _stained_glass (rose), ochre_froglight behind, glass_pane (residences).
- doors: waxed_exposed_copper_door, dark_oak_door. Lamps: polished_blackstone_wall, lantern, end_rod. Bell: bell.
- ground: grass_block, moss_block, oak_log, oak_leaves(persistent). Residence chimney: polished_diorite, deepslate_bricks, polished_diorite_slab.
- 1.21.1 only: use `chain` never iron_chain; no pale oak. All ids in plan MATERIALS were checked.

## VOCABULARY
- marble_wall(box, faces): fill with hashed mix calcite/polished_diorite/diorite; more diorite below y 3 and at buttress bases.
- plinth(box): polished_andesite y0..2 (fill down to ground).
- string_course(x0,z0,x1,z1,y,face): upside-down polished_diorite_stairs, 1 proud.
- pointed_head(cx,y,face,w): upside-down polished_diorite_stairs on both sides of a w-wide opening, meeting at the centre, keystone polished_diorite.
- lancet(cx,y0,y1,face,w=3): opening w wide, pointed head, panes colored (blue 50%, red/purple 35%, yellow 15%) set 1 behind the face, mullion diorite_wall every 2, ochre_froglight 1 behind; sill polished_diorite_slab.
- portal_arch(center,face,orders,w,h): orders recessed 1 each, each a pointed_head; doors waxed_exposed_copper_door pair facing out, trumeau polished_diorite.
- louvre_opening(cx,y0,y1,face): 2-wide opening, polished_diorite_slab(top) at alternate courses, air between, pointed head.
- tower_buttress(corner,y): 2x2 diorite/calcite, set back 1 at y14 and y30 with polished_diorite_stairs weatherings, ends in pinnacle.
- pinnacle(x,y,z,h): diorite_wall shaft, smooth_quartz_stairs crockets every 2, end_rod tip.
- pierced_parapet(line,y): diorite_wall alternating with air, polished_diorite_slab coping.
- spire_ring(center,width,y): octagon ring of diorite_wall/calcite alternating; every third ring only posts at corners with air between; widths 9,7,5,3,1.
- crocket(x,y,z,face): smooth_quartz_stairs facing out on octagon edges every 3 courses.
- lucarne(face,y): 3-wide gabled dormer, 1 proud, quartz_stairs gable, lancet pane.
- spire_cross(x,y,z): diorite_wall shaft 5 tall, arms at y91, end_rod tip.
- rose_window(center,r=4): ring polished_diorite, 8 diorite_wall spokes, stained glass blocks in sectors, ochre_froglight behind.
- tracery_window(box): lancet-like 9 wide with diorite_wall mullions every 2 and pointed head.
- gable_roof_x/gable_roof_z(box,eaveY,ridgeY): 45deg deepslate_tile_stairs, 20% cobbled_deepslate patches, ridge copper slab.
- lean_to(box,low,high): shed of deepslate_tile_stairs/slab.
- flyer(pierX,z0,y0,z1,y1,side): arch rib of stairs upside-down underneath, slab coping.
- fleche(center): lantern grate + copper stairs roof + 1-wide spire + rod.
- lamp_post(x,y,z): polished_blackstone_wall x3 + lantern.
- slab_ramp: bottom slab x0 then full blocks x1..3 (steps 3 then landing); never stairs.
- roof_light(box): lantern/end_rod on decks, light level >=8 on every roof and terrace.
- house_window(x,y,z,pointed): 2x2 glass_pane, sill slab, lintel, lit by lantern/froglight in about half.
- quoin(corner): alternating polished_diorite long/short.
- chimney: call chimney() per card; tree(x,z): oak_log 5 + persistent oak_leaves radius 2.

## ROOMS
Exterior only; interiors dark except behind glass. Few rooms, light-only.
- Nave (x11..45,y3..33,z15..25): lit by froglight behind windows plus hanging lanterns down centre.

## PARTS
1. Marble shell: plan SITE masses, plinth, floors, piers, walls, openings left as air, pierced parapets.
2. West front and towers: towers, portals, gable, rose-window opening, belfries, steps.
3. Roofs: all roofs, ridge, fleche base, lean-tos, lady chapel, residence roofs later.
4. Spires and pinnacles: spires, crockets, lucarnes, crosses, pinnacles, flyers, fleche.
5. Glazing and light: lancets, rose window, froglight, lamps, lawns, roof light, steps.
6. Residences: plots 1 and 2 complete (shell, roof, chimneys, windows, gardens).

## Notes
- West front faces -x; axis z=20. Stay inside footprint, height <=96 (tallest ~93).
- Build in site orientation, openings as air for P5. Use hashed variation, not noise.
- Spires must be lace (air gaps) to read openwork from the air; roofs dark against pale walls.
- P1 shell done: hollow walls, no caps; towers/centre front x0..10 left to P2; openings (lancets y6..16, clerestory y24..32, portals) unplaced; roofs must cover high vessel and aisles (no ceilings).
