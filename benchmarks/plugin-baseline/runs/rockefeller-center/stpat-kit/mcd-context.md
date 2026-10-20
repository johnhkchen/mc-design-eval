# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS (plot 0 = cathedral unless noted; coords local per plan.md)

Part keys: P1 shell, P2 west front+towers, P3 roofs, P4 spires+pinnacles+flyers, P5 glazing+light, P6 residences, (grounds inside P5/P6).

| # | element | construction (block by block) | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Latin-cross massing | calcite/polished_diorite/diorite mix walls from y 0, plinth polished_andesite y0..2, floor y2 | plan SITE table | P1 | marble_wall, plinth |
| 2 | Twin towers 11x11 | marble_wall 4 stages, polished_diorite_stairs (upside down) string courses y14/22/30/43, corner buttresses 2x2 | x0..10 z3..13 / z27..37 | P2 | marble_wall, string_course, tower_buttress |
| 3 | Belfry louvres + bell | 2-wide openings y32..41, polished_diorite_slab(top) every other course, pointed head; `bell` attachment ceiling hung from y42 beam at (5,41,8),(5,41,32) | belfry faces | P2 | louvre_opening, pointed_head |
| 4 | Twin openwork spires | octagon rings 9/7/5/3/1: diorite_wall posts alternating calcite, every 3rd ring air gaps, quartz_stairs crockets on 8 edges, lucarnes y44..52, cross y88..92 | x1..9 z4..12 / z28..36 y44..93 | P4 | spire_ring, crocket, lucarne, spire_cross |
| 5 | Great west gable + 3 portals | layered pointed arches x4,x5, doors x6 (waxed_exposed_copper_door), trumeau z20, wimperg gable x3, gallery 5 arches | x3..6 z14..26 | P2 | portal_arch, pointed_head |
| 6 | ROSE WINDOW | 9-dia wheel centre (5,26,20): polished_diorite ring, 8 diorite_wall spokes, stained glass blocks, ochre_froglight behind at x6 | x5 y22..30 z16..24 | P5 | rose_window |
| 7 | Nave/choir/transept roofs | deepslate_tile_stairs 45deg (cobbled_deepslate patches), waxed_oxidized_cut_copper_slab ridge y42, valleys at crossing | ROOFS table | P3 | gable_roof_x, gable_roof_z, ridge_cap |
| 8 | Aisle lean-to roofs | deepslate_tile_stairs/slab, pierced parapet | aisles | P3 | lean_to, pierced_parapet |
| 9 | Flèche | open 3x3 lantern oxidized copper grate sides y42..47, copper stairs roof, spike y48..58 | x51..53 z19..21 | P4 | fleche |
| 10 | Flying buttresses | rib 1 wide, upside-down polished_diorite_stairs curve, slab coping, z4->z13 | each pier x | P4 | flyer |
| 11 | Buttress piers + pinnacles | piers y0..22, weathering slabs y10,18, pinnacle diorite_wall + quartz_stairs + end_rod | pier x rows | P4 | pier, pinnacle |
| 12 | Pointed lancets, stained glass LIT | glass panes blue/red/purple/yellow in lancet, pointed head, ochre_froglight one cell behind | OPENINGS table | P5 | lancet |
| 13 | Pierced parapets | diorite_wall with air every other cell | aisle y19..20, clerestory y33..34 | P1/P3 | pierced_parapet |
| 14 | Transept ends + turrets | portals, 9-wide tracery window, gables, 4 stair turrets with spirelets | z0/z40 | P1/P5 | portal_arch, tracery_window, pinnacle |
| 15 | Choir apse + ambulatory chapels + Lady Chapel | per SITE table, lower roofs | x80..104 | P1/P3 | marble_wall, lean_to |
| 16 | West steps + lamp posts | slab x0, full blocks x1..3, polished_blackstone_wall + lantern | x0..3 z13..27 | P5 | lamp_post, slab_ramp |
| 17 | Lawns/trees | grass, moss patches, oak persistent | SITE | P5 | tree |
| 18 | Roof/terrace lighting | lanterns on decks, end_rod pinnacles lit; every tower deck lit | towers, chapels | P5 | roof_light |
| 19 | Archbishop's Residence | calcite + diorite quoins, dark-slate gable roof, 2 chimneys (chimney()), garden wall | plot 1 | P6 | house_window, quoin, chimney |
| 20 | Rectory | mirrored twin | plot 2 | P6 | same |
| 21 | Spire floodlight | lit froglight/end_rod bands at spire bases | spires | P5 | roof_light |
```

### rooms.json

```json
{"entrance":[3,3,20],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "marble": ["calcite", "polished_diorite", "diorite"],
    "trim": ["polished_diorite_stairs", "polished_diorite_slab", "polished_diorite"],
    "tracery": ["diorite_wall", "iron_bars"],
    "highlight": ["smooth_quartz_stairs", "smooth_quartz_slab", "end_rod"],
    "base": ["polished_andesite", "polished_andesite_slab", "smooth_stone"],
    "roof": ["deepslate_tile_stairs", "deepslate_tile_slab", "cobbled_deepslate_stairs"],
    "copper": ["waxed_oxidized_cut_copper_slab", "waxed_oxidized_cut_copper_stairs", "waxed_oxidized_cut_copper", "waxed_oxidized_copper_grate"],
    "glass": ["purple_stained_glass_pane", "blue_stained_glass_pane", "red_stained_glass_pane", "yellow_stained_glass_pane", "purple_stained_glass", "blue_stained_glass", "red_stained_glass", "yellow_stained_glass", "glass_pane"],
    "light": ["ochre_froglight"],
    "doors": ["waxed_exposed_copper_door", "dark_oak_door"],
    "lamps": ["polished_blackstone_wall", "lantern"],
    "bell": ["bell"],
    "ground": ["grass_block", "moss_block", "oak_log", "oak_leaves"],
    "chimney": ["deepslate_bricks"]
  },
  "objects": []
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only when the build succeeds.
set -eu
cd "$(dirname "$0")"
tmp="$(mktemp ./build.nbt.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv -f "$tmp" build.nbt
```

### build.mjs

```js
// Builds the whole site (one grid) from scratch: ground first, then every part in plan order. Usage: node build.mjs <out.nbt>
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, PLOT_X } from "./vocab/base.mjs";

const out = process.argv[2] ?? "build.nbt";
const PARTS = [
  ["marble shell", "parts/shell.mjs"],
  ["west front and towers", "parts/westfront.mjs"],
  ["roofs", "parts/roofs.mjs"],
  ["spires pinnacles flyers", "parts/spires.mjs"],
  ["glazing and light", "parts/glazing.mjs"],
  ["residences", "parts/residences.mjs"],
];

// Ground from the brief's per-cell maps (site.json): a cell with walking level L (L >= 1) is solid from y 0 to L-1,
// grass on top and dirt below. Only footprint cells ('#') get ground. Laid before runParts, so parts may replace it.
// dirt is the hidden fill below the ground line: not a palette block, and laid before runParts, so it is never reported.
function layGround(g) {
  const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));
  let n = 0;
  for (const plot of Object.values(site)) {
    const width = plot.x1 - plot.x0 + 1, depth = plot.z1 - plot.z0 + 1;
    plot.footprint.forEach((row, j) => [...row].forEach((ch, i) => {
      const level = plot.ground[j][i];
      if (ch !== "#" || level < 1) return;
      for (let dx = 0; dx < plot.cell; dx++) for (let dz = 0; dz < plot.cell; dz++) {
        const x = i * plot.cell + dx, z = j * plot.cell + dz;
        if (x >= width || z >= depth) continue;
        for (let y = 0; y < level; y++) g.set(PLOT_X[plot.n] + x, y, z, y === level - 1 ? "grass_block" : "dirt");
        n++;
      }
    }));
  }
  return n;
}

// A part whose file is not there yet (its worker has not written it) is an empty part, never a failed build.
async function loadPart(name, path) {
  const file = fileURLToPath(new URL(`./${path}`, import.meta.url));
  if (!existsSync(file)) { console.log(`part ${name}: ${path} not there yet; built as empty`); return () => {}; }
  return (await import(file)).build;
}

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });   // the server is 1.21.1
console.log(`ground: ${layGround(g)} footprint columns laid`);
const list = [];
for (const [name, path] of PARTS) list.push([name, await loadPart(name, path)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} blocks, size ${SITE_SIZE.join(" x ")}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json only), plan.md site coordinates, and a seeded rng.
// Coordinates are SITE grid coordinates unless a name says LOCAL; use site(plot, x, z) to turn a plot-local x, z into site.

// ---- palette (palette.json ids) -----------------------------------------------------------------------------------

// ---- palette (palette.json ids) -----------------------------------------------------------------------------------
export const CALCITE = "calcite";                                   // marble body, 55 %

export const POLISHED_DIORITE = "polished_diorite";                 // marble body 30 %, trim, quoins, rose-window ring

export const DIORITE = "diorite";                                   // marble body 15 %, more at plinth and buttress bases

export const POLISHED_DIORITE_STAIRS = "polished_diorite_stairs";   // trim: pointed heads, string courses, weatherings

export const POLISHED_DIORITE_SLAB = "polished_diorite_slab";       // trim: sills, copings, louvre tops

export const DIORITE_WALL = "diorite_wall";                         // tracery, mullions, pierced parapets, spire lace, shafts

export const IRON_BARS = "iron_bars";                               // rare tracery

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";         // crockets, wimperg crockets, pinnacle crockets

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";             // sparse highlights

export const END_ROD = "end_rod";                                   // pinnacle and gable tips, lightning rods

export const POLISHED_ANDESITE = "polished_andesite";               // plinth course y 0..2, steps

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";     // plinth top course, sidewalk edge

export const SMOOTH_STONE = "smooth_stone";                         // sidewalk

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";       // main roof slate (80 %), residence slate

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";           // slate at eaves

export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // slate patches (20 %)

export const COPPER_SLAB = "waxed_oxidized_cut_copper_slab";        // ridge crest, copper coping

export const COPPER_STAIRS = "waxed_oxidized_cut_copper_stairs";    // copper roof edges, fleche roof

export const COPPER_BLOCK = "waxed_oxidized_cut_copper";            // small caps, finials

export const COPPER_GRATE = "waxed_oxidized_copper_grate";          // fleche lantern sides

export const PANE_PURPLE = "purple_stained_glass_pane";             // lancet glass

export const PANE_BLUE = "blue_stained_glass_pane";                 // lancet glass (dominant)

export const PANE_RED = "red_stained_glass_pane";                   // lancet glass

export const PANE_YELLOW = "yellow_stained_glass_pane";             // lancet glass (accents)

export const GLASS_PURPLE = "purple_stained_glass";                 // rose window sector (full block)

export const GLASS_BLUE = "blue_stained_glass";                     // rose window sector (full block)

export const GLASS_RED = "red_stained_glass";                       // rose window sector (full block)

export const GLASS_YELLOW = "yellow_stained_glass";                 // rose window sector (full block)

export const GLASS_PANE = "glass_pane";                             // residence windows

export const OCHRE_FROGLIGHT = "ochre_froglight";                   // light one cell behind every pane and glass

export const DOOR_COPPER = "waxed_exposed_copper_door";             // cathedral portals

export const DOOR_DARK_OAK = "dark_oak_door";                       // residence doors

export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall"; // lamp post shaft

export const LANTERN = "lantern";                                   // lamps, hanging lights, roof lights

export const BELL = "bell";                                         // belfry bells

export const GRASS = "grass_block";                                 // ground surface

export const MOSS = "moss_block";                                   // ground patches

export const OAK_LOG = "oak_log";                                   // tree trunks

export const OAK_LEAVES = "oak_leaves";                             // tree crowns (persistent)

export const DEEPSLATE_BRICKS = "deepslate_bricks";                 // residence chimney band

// ---- site (plan.md SITE; grid = the whole site) -------------------------------------------------------------------
export const SITE_SIZE = [150, 96, 42];                 // grid size: x 0..149 (plots 0-2), y 0..95 (limit 96), z 0..41

export const PLOT_X = [0, 109, 132];                    // site x of each plot's local x 0 (plot 0 cathedral, 1 Archbishop, 2 Rectory); z origin is 0 for all

export const PLOT_TOP = [96, 30, 34];                   // plan limit y per plot

export const AXIS_Z = 20;                               // church long axis: everything mirrors across z = 20

export const FRONT_X = 4;                               // west front plane (Fifth Avenue, faces -x); portals and rose window sit here

export const PLINTH_TOP = 2;                            // top of the polished andesite plinth / church floor block (floor walk y 3)

export const WALK_Y = 3;                                // interior walk level of the church floor

export const TOWER_NORTH = { x0: 0, x1: 10, z0: 3, z1: 13 };     // north tower footprint (11 x 11)

export const TOWER_SOUTH = { x0: 0, x1: 10, z0: 27, z1: 37 };    // south tower footprint (11 x 11)

export const TOWER_TOP = 43;                            // tower walls end here; parapet y 44..45

export const SPIRE_BASE_Y = 44;                         // octagonal openwork spires start here ...

export const SPIRE_TOP_Y = 93;                          // ... and the cross tip is here

export const CENTRE_FRONT = { x0: 4, x1: 10, z0: 14, z1: 26, top: 33 };  // centre west front between the towers

export const GREAT_GABLE = { x0: 4, x1: 6, z0: 14, z1: 26, y0: 34, apex: 41 };  // great west gable, apex at z = 20

export const NAVE = { x0: 11, x1: 45, z0: 14, z1: 26, wallTop: 33 };    // high vessel; clerestory walls at z 14 and z 26

export const NAVE_AISLE_N = { x0: 11, x1: 45, z0: 4, z1: 13, top: 20 }; // north aisle, outer wall z 4

export const NAVE_AISLE_S = { x0: 11, x1: 45, z0: 27, z1: 36, top: 20 }; // south aisle, outer wall z 36

export const CROSSING = { x0: 46, x1: 58, z0: 14, z1: 26, top: 33 };    // 13 x 13 crossing under the fleche

export const FLECHE = { x0: 51, x1: 53, z0: 19, z1: 21, y0: 41, top: 58 };  // fleche: open lantern y 42..47, spire to y 56, rod y 57..58

export const TRANSEPT_N = { x0: 46, x1: 58, z0: 0, z1: 13, top: 33 };   // north transept high vessel; end facade z 0

export const TRANSEPT_S = { x0: 46, x1: 58, z0: 27, z1: 40, top: 33 };  // south transept high vessel; end facade z 40

export const CHOIR = { x0: 59, x1: 79, z0: 14, z1: 26, top: 33 };       // choir high vessel

export const APSE = { x0: 80, x1: 84, z0: 14, z1: 26, top: 33 };        // three-sided apse, tapering to z 17..23 at x 84

export const LADY_CHAPEL = { x0: 85, x1: 99, z0: 16, z1: 24, top: 21 };  // Lady Chapel walls

export const LADY_APSE = { x0: 100, x1: 104, z0: 16, z1: 24, top: 21 };  // five-sided Lady Chapel end

export const RIDGE_Y = 41;                              // nave, transept and choir ridge (copper cap at y 42)

export const EAVE_Y = 34;                               // first roof course over the clerestory

export const ROSE_CENTRE = [4, 26, 20];                 // rose window centre (x, y, z); diameter 9

export const PORTAL_MAIN = { z0: 18, z1: 22, y0: 3, y1: 12 };           // main west portal opening (x 4..6)

export const RESIDENCE_1 = { x0: 0, x1: 18, z0: 0, z1: 14, top: 30 };   // Archbishop's residence, LOCAL to plot 1

export const RESIDENCE_2 = { x0: 0, x1: 17, z0: 0, z1: 14, top: 34 };   // Rectory, LOCAL to plot 2

/** Site [x, z] of a plot-local (x, z): site(1, 0, 9) is the Archbishop's garden corner on the site grid. */
export const site = (plot, x, z) => ...

// ---- seeded random ------------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving a repeatable float in [0, 1) (mulberry32), for hashed variation. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers from plan.md's VOCABULARY, batch h1: marble_wall, pointed_head, louvre_opening, pierced_parapet, lucarne,
// tracery_window, lean_to, lamp_post, house_window. Every position is an argument. Faces are compass names for the way a
// wall looks out (west = -x, east = +x, north = -z, south = +z). `at` is the wall plane: x for west/east walls, z for
// north/south walls. Each helper writes only into air: a cell that is not air is refused and counted, never overwritten.
// Each returns { placed: [[x, y, z], ...], refused: n }.

/**
 * A solid marble mass over the inclusive box [x0, y0, z0, x1, y1, z1]: calcite, polished diorite and diorite, hashed by
 * position (55/30/15 above y 3, diorite heavier below it). `faces` is accepted for the plan's signature; the plan does not
 * say what it changes, so it is not used.
 */
export function marble_wall(g, [x0, y0, z0, x1, y1, z1], faces)

/**
 * The pointed head over a w-wide opening: upside-down polished diorite stairs on each side, meeting at a keystone when w is
 * odd. cx is the centre cell along the wall (the left centre cell when w is even); y is the springing row, the top row of the
 * opening's jambs; the head is written above it, in air only.
 */
export function pointed_head(g, cx, y, face, w, at)

/**
 * A 2-wide louvre opening: top-half polished diorite slabs across the two cells at every other course from y0 to y1, air
 * between, and a pointed head over y1. cx is the left cell of the pair.
 */
export function louvre_opening(g, cx, y0, y1, face, at)

/**
 * A pierced parapet along the straight line [x0, z0, x1, z1] (same z, or same x) at row y: diorite wall posts on every other
 * cell with air between, and a polished diorite slab coping on row y + 1 over the whole line.
 */
export function pierced_parapet(g, [x0, z0, x1, z1], y)

/**
 * A 3-wide gabled dormer on an octagon face at plane `at`, its front one block proud of the face: polished diorite jambs,
 * a blue lancet pane in the centre, a gable of quartz stairs rising to a diorite centre and a quartz cap. cx is the centre
 * cell along the face and y the bottom row. The dormer is 5 rows tall above y.
 */
export function lucarne(g, cx, y, face, at)

/**
 * A 9-wide tracery window in the one-cell-thick wall box [x0, y0, z0, x1, y1, z1] (the plane is the box's thin side): stained
 * glass panes with diorite wall mullions every 2 cells, and a pointed head over the top W + 1 rows, where W = (width - 1) / 2.
 * The width must be odd, and the box must be at least W + 2 rows tall.
 */
export function tracery_window(g, [x0, y0, z0, x1, y1, z1], face)

/**
 * A lean-to (shed) roof over the footprint [x0, z0, x1, z1]: it rises from `low` at the far edge to `high` at the wall on the
 * `toward` side. Deepslate tile stairs where the surface steps up toward the wall, bottom slabs on the flat runs. Only the
 * roof surface is written; the wall it leans on belongs to the caller.
 */
export function lean_to(g, [x0, z0, x1, z1], low, high, toward)

/** A lamp post: three polished blackstone wall posts at x, y..y+2, z, and a standing lantern on top at y+3. */
export function lamp_post(g, x, y, z)

/**
 * A 2 x 2 house window in the wall plane. (x, y, z) is the cell at its low run end and its lower row; the plane is x or z
 * according to `face`. Glass panes at rows y and y+1, a sill slab proud of the wall at y-1, and either a pointed head at
 * y+2 (pointed) or a proud lintel slab at y+2. About half get an ochre froglight just inside the glass, chosen by position.
 */
export function house_window(g, x, y, z, pointed, face)
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md VOCABULARY: plinth, lancet, tower_buttress, spire_ring, spire_cross, gable_roof_x,
// flyer, slab_ramp, quoin. Every helper takes its footprint `box` = [[x0,y0,z0],[x1,y1,z1]] (inclusive, any order)
// and returns the number of blocks it placed. It writes only inside `box` and only into air (quoin: `over` lets it
// replace solid cells). Positions and facings are arguments; nothing is fixed to a spot.
//
// Walls: `face` is the way the outside faces ("west" = the street at -x). `p` = the outer-face plane (x for
// east/west, z for north/south), `c` = the centre along the wall, `d` = depth inward (0 = the outer face).
// Stairs `facing` = the side of the full-height back, as in the toolkit.

/** Solid polished_andesite over the box: the plinth course. The ground under it belongs to an earlier part. */
export function plinth(g, box)

/**
 * A pointed lancet of width w (odd) centred at u = 0 on the wall, from y0 to y1. Outer face (d 0): a pointed head of
 * upside-down polished_diorite stairs meeting at a keystone. Depth 1: a sill, then stained-glass panes (blue 50%,
 * red/purple 35%, yellow 15%) with diorite_wall mullions every 2 columns. Depth 2: ochre_froglight behind each pane.
 * The opening must be air (the shell leaves it).
 */
export function lancet(g, box, face, p, c, y0, y1, w = 3)

/**
 * A corner buttress at the outside corner cell (corner.x, corner.z); (sx, sz) = the outward signs (±1). It sits proud
 * of the corner: a 2x2 of calcite/diorite from y0 to 13, then 1x1 to y1 (set back at y14 and y30). Polished_diorite
 * stairs (upside down) weather each set-back ledge. `pinnacle` > 0 adds a diorite_wall shaft and an end_rod above y1.
 */
export function tower_buttress(g, box, corner, y0, y1, { pinnacle = 0 } = {})

/**
 * An octagonal ring of width (odd: 9, 7, 5, 3 or 1) centred at (cx, cz) on row y: diorite_wall and calcite alternating
 * around the edge with the corners cut. `lace`: only diorite_wall posts beside the cut corners, air between them.
 * `phase` flips the alternation so adjacent rings differ.
 */
export function spire_ring(g, box, cx, cz, width, y, { lace = false, phase = 0 } = {})

/**
 * The cross on top of a spire: a diorite_wall shaft of 5 from y, arms at y+3 on z±1, an end_rod at y+5.
 */
export function spire_cross(g, box, x, y, z)

/**
 * A 45-degree gable roof whose ridge runs along x over the box's z range: deepslate_tile_stairs (cobbled_deepslate in
 * 3x3 patches, about 20%) rising to the ridge, with a waxed_oxidized_cut_copper_slab cap. Surface only: the attic or
 * walls under it are the caller's. eaveY and ridgeY must differ by the half-width (45 degrees).
 */
export function gable_roof_x(g, box, eaveY, ridgeY)

/**
 * A flying-buttress rib, 1 wide in the plane x = pierX, from the pier top (z0, y0) to the clerestory (z1, y1). It rises
 * as a quarter-sine. Upside-down polished_diorite stairs form the curve, with a polished_diorite_slab coping on top.
 * `side` ("north" | "south" | "east" | "west") is the stairs' back, the side of the aisle roof the rib spans.
 */
export function flyer(g, box, pierX, z0, y0, z1, y1, side)

/**
 * A ramp from the street: a bottom polished_andesite_slab at the start cell (x, z), then `run` full polished_andesite
 * blocks, all at level y, `width` cells across. `dir` is the way the ramp climbs. Never stairs.
 */
export function slab_ramp(g, box, { x, z, y, dir, width, run = 3 })

/**
 * Quoins on a building corner (corner.x, corner.z), outward signs (sx, sz): each course is the corner stone plus two
 * long stones on one face and one short stone on the other, the long face alternating by course. polished_diorite
 * throughout. Air only unless `over` (quoins dress a wall that is already built).
 */
export function quoin(g, box, { x, z, sx, sz, y0, y1 }, { over = false } = {})
```

### vocab/h3.mjs

```js
// Vocabulary helpers from plan.md's VOCABULARY: string_course, portal_arch, pinnacle, crocket, rose_window,
// gable_roof_z, fleche, roof_light, tree. Each takes the grid first, then the position and facing the plan gives, then
// an optional opts object, and returns how many blocks it wrote.
// Every write stays inside the footprint the helper was given and goes only into air (opts.overwrite: true replaces
// blocks instead), so a helper never writes ground, floor or an earlier part's cells. Facings follow the toolkit: a
// stair's facing points at its full-height back, so a stair that drops toward the west has facing "east", and a string
// course on a west face has facing "east" (its backs against the wall).

// ---- string_course ----------------------------------------------------------------------------------------------------
/** Upside-down polished_diorite stairs over the box at height y, 1 proud of the face; the lips point out to `face`. */
export function string_course(g, x0, z0, x1, z1, y, face, opts = {})

/**
 * Layered portal. c = [x, y, z] is the centre of the opening's bottom row on the outer face; `face` is the way it
 * faces out. `orders` pointed arches sit one cell deeper each, the outer ones wider; the opening is `w` wide and `h`
 * tall; copper door pairs stand one cell behind the innermost order with a polished_diorite trumeau at the centre.
 */
export function portal_arch(g, c, face, orders = 2, w = 5, h = 8, opts = {})

// ---- crocket and pinnacle ---------------------------------------------------------------------------------------------
/** One smooth_quartz crocket at (x, y, z), projecting out to `face`, its back against the shaft. */
export function crocket(g, x, y, z, face, opts = {})

/** Pinnacle: diorite_wall shaft from y up h cells, crockets on all four sides every second course, end_rod tip at y + h. */
export function pinnacle(g, x, y, z, h, opts = {})

// ---- rose_window ------------------------------------------------------------------------------------------------------
/**
 * Rose of radius r (diameter 2r+1) in the plane through c, facing `face`: a polished_diorite ring, eight diorite_wall
 * spokes and a hub, and stained glass blocks between the spokes in colour sectors, with an ochre_froglight behind each.
 */
export function rose_window(g, c, face, r = 4, opts = {})

// ---- gable_roof_z -----------------------------------------------------------------------------------------------------
/**
 * Gable roof over the plan box [x0, z0, x1, z1], ridge along z: 45-degree deepslate tile stairs rising from eaveY at
 * both x edges to the ridge, capped at ridgeY; 1 in 3x3 patch in cobbled deepslate; a copper slab ridge cap.
 */
export function gable_roof_z(g, [x0, z0, x1, z1], eaveY, ridgeY, opts = {})

// ---- fleche -----------------------------------------------------------------------------------------------------------
/**
 * Fleche on the 3x3 centred at [cx, y, cz] (y = the lantern floor, 42 in plan.md): an open copper grate lantern five
 * high with a hanging lantern, a copper stair roof on its top ring (y + 6), a 1-wide copper spire to y + 14, end rods.
 */
export function fleche(g, [cx, y, cz], opts = {})

/**
 * Lanterns standing on a deck: deck top at a[1] (the corners a and b give the deck's plan), lanterns at a[1] + 1 on a
 * lattice at most 6 apart, so block light stays 8 or more on every cell of the deck.
 */
export function roof_light(g, a, b, opts = {})

// ---- tree -------------------------------------------------------------------------------------------------------------
/** Oak tree standing on the ground cell [x, y, z]: 5 logs, then a round persistent crown of radius 2 (a small cap on top). */
export function tree(g, x, y, z, opts = {})
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
