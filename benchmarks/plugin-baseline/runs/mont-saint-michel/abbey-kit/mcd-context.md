# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Abbey of Mont-Saint-Michel — architect's plan (plot 0, 130 x 121, y 0..153)

Frame: x east (0..129), z south (0..120), y up. Map cell (c, r) = x 3c..3c+2, z 3r..3r+2.
GROUND rule: a cell's ground value g = first air course; rock fills y < g. Every wall, pier, buttress and
platform is founded DOWN to g of every cell under it (cobblestone/stone footing, mossy near the rock); where g
is below a floor, the gap is built masonry (crypt, cellar, substructure), never air under a floor.
FOOTPRINT rule: every rectangle below is clipped to the FOOTPRINT's `#` cells; no block is ever placed in a `.`
cell. Height rule: nothing above y 151; the archangel's sword tip (56,151,64) is the build's single highest block.
Single church axis: z 64 (the crossing tower's centre on the surface model), west front x 15, apse x 97.
The real church bends ~15° (nave a little south); it is built straight on z 64 so the roofs read clean; the
south-west summit ranges (LOGIS-W) fill the surface model's southern nave mass.

## SITE

The lot is the summit and flanks of the rock. "Street" in this plot = the approach: the visitor climbs from the
south-east (camera side) to the Châtelet's south-facing entry (x 120..125, z 47), then up the Grand Degré west to
the church. The church's west terrace faces west; the Merveille's sheer wall faces NORTH over the bay.

| id | mass | x0..x1 | z0..z1 | y (ground → top) | notes |
|---|---|---|---|---|---|
| TER-W | west terrace (open platform) | 6..14 (z54..62), 9..14 (z63..68), 12..14 (z69..77) | 54..77 | g 37..43 → paving course y 43, walk 44; parapet y 44..45 | clip to footprint diagonal |
| NAVE | nave, central vessel | 15..47 | 58..70 | g 41..43 → wall top 62, ridge 73 | 4 bays, piers x 15,23,31,39,47 |
| NAVE-N/S | nave aisles | 15..47 | 52..57 / 71..76 | wall top 53, lean-to 54→57 | |
| WFRONT | west front | 14..15 (pilasters x 14) | 52..76 | 44 → gable 73, pediment | classical |
| CROSS | crossing + tower | 48..62 below y 74; tower shaft 49..61 | 57..71; shaft 58..70 | g 35..40 → parapet y 100 | |
| TR-N | north transept | 48..62 | 48..56 | g 34..40 → wall top 62, ridge 73 | gable faces north (z 48) |
| TR-S | south transept | 48..62 | 72..86 | g 32..38 → wall top 62, ridge 73 | gable faces south (z 86) |
| SPIRE | octagonal spire | centre (55,64) | | y 99 → needle top 142 | see ROOFS |
| ANGEL | St Michael | x 54..56 | z 63..65 | pedestal 143, figure 144..151 | top exactly y 151 |
| CHOIR | choir central vessel | 63..88 | 57..71 | g 27..35 → wall top 72, ridge 86 | Flamboyant, 4 bays, piers x 63,69,75,81,87 |
| APSE | apse (half-octagon) | 89..96 | 57..71 | wall top 72, roof apex 86 at (89,64) | faces: (89,57)-(94,59)-(96,62..66)-(94,69)-(89,71) |
| AMB | ambulatory/aisles | 63..92 + round apse to x 97 | 50..56 / 72..78 (round apse: radius +7 about (89,64)) | wall top 57, flat roof 58 | |
| CH-N | north chapels (2) | 77..81, 84..88 | 46..49 | wall top 57, caps 61 | |
| CH-S | south chapels (4) | 66..70, 73..77, 80..84, 87..91 | 79..81 | wall top 57, caps 61 | |
| CH-E | radiating chapels (3) | 97..100 | 55..59, 62..66, 69..73 | wall top 57, caps 61 | |
| CRYPT | choir substructure (Gros Piliers crypt) | under CHOIR/AMB/CH-* | same | g 22..35 → floor course 43 | solid granite, small round windows |
| MERV-W | Merveille west block: cellar / Knights' Hall / CLOISTER | 56..84 (x56..62 only z≥9) | 7..33 | g 6..39 → wall top 49, roof 50 | 3 storeys over the rock |
| MERV-E | Merveille east block: almonry / guests' hall / REFECTORY | 85..107 | 7..27 | g 4..27 → wall top 49, eaves 50, ridge 61 | gable to the east (x 107) |
| MERV-S | Merveille south ranges | 85..101 | 28..38 | g 23..33 → wall top 46, ridge 51 | lean-to against MERV-E |
| BUTT-N | Merveille north buttresses | x 63,64 / 69,70 / 75,76 / 81,82 / 87,88 / 93,94 / 99,100 / 105,106 | z 6 (x<81), z 4..6 (x≥81) | rock → y 50 | setbacks at y 22 and 38 |
| NE-T | NE corner turret (Merveille) | 108..110 | 18..23 | g 3..13 → 52, cap 57 | conical slate cap |
| NE-R | NE rampart to Châtelet | 108..116 (z24..29), 111..116 (z30..32), 114..116 (z33..38) | 24..38 | g 3..19 → walk y 32, crenels 33 | |
| N-CH | north choir range (Chartrier) | 63..86 (z34..41), 63..68 (z42..44) | 34..44 | g 30..35 → wall top 48, ridge 55 | between cloister and choir |
| N-TER | north terrace (open) | 24..55 | 24..47 | g 38..42 → paving at g, walk g+1 | parapet on z 24 edge |
| NW-R | Promenoir / Aquilon range | 24..55 | 12..23 | g 15..41 → wall top 47, ridge 54 | ridge along x |
| NW-W | north-west substructure range | 6..23 (z15..29), 9..23 (z30..32), 12..23 (z33..38) | 15..38 | g 9..38 → wall top 45, ridge 52 | ridge along z |
| NW-S | north-west stair range | 15..23 (z39..41), 12..23 (z42..44), 6..23 (z45..47), 3..23 (z48..51) | 39..51 | g 23..42 → wall top 44, ridge 50 | ridge along z, steps down north |
| NW-F | NW foot wall | 0..5 (z18..23), 3..5 (z24..26) | 18..26 | g 7..12 → y 14 | retaining wall, crenellated |
| BELLE | Belle Chaise (Salle des Gardes) | 102..116 | 51..62 | g 18..28 → wall top 37, ridge 45 | ridge along x |
| CHAT | Châtelet body | 117..128 | 39..47 | g 6..18 → wall top 31, machicolation 29..31, parapet 32..33, roof ridge 39 | entry in south wall |
| CHAT-T | Châtelet turrets (round fronts, south) | W 117..119, E 126..128 | 48..51 | g 8..16 → 33, crenels 34 | half-round fronts z 50..51 |
| E-R | Tour Perrine / east range | 117..128 | 54..74 (x≤122 for z69..74) | g 11..18 → wall top 37, ridge 44 | ridge along z, gable faces south |
| SE-R | south-east range | 101..116 | 63..77 (x≤113 z75..77) | g 13..24 → wall top 35, ridge 42 | ridge along x |
| DEGRE | Grand Degré (stair between high walls) | 63..104 | 82..86 (walls z 82, z 86; stair z 83..85) | foot walk y 21 at x 103 → 43 at x 81 | bridge arch at x 88..90, y 50..52 |
| LOGIS-W | west lodgings (Officialité / Bâtiments de l'Ouest) | 18..47 | 79..92 | g 41..44 → wall top 55, ridge 65 | court z 77..78 between it and the nave |
| SAUT-G | Saut-Gautier terrace | 51..56 | 87..95 | g 32..38 → walk y 41, parapet 42 | |
| LOGIS-A | Logis abbatial (upper, west) | 57..71 | 87..98 | g 26..35 → wall top 53, ridge 63 | ridge along x |
| LOGIS-B | Logis abbatial (upper, east) | 72..86 | 87..104 | g 17..30 → wall top 46, ridge 55 | ridge along x |
| LOGIS-C | Logis du Roi (lower, east) | 87..104 | 87..104 | g 8..27 → wall top 45, ridge 54 | ridge along z, big gable faces SOUTH (z 104) |
| BAILLI | Bailliverie (lower south-west) | 57..68 (z108..110), 48..68 (z111..116) | 108..116 | g 18..26 → wall top 46, ridge 54 | ridge along x |
| A-TUR | Logis abbatial south stair turret | 57..62 | 99..101 | g 30..33 → 56, pyramid cap 59 | links LOGIS-A to the rock below |
| S-CRT | lower south court & curtain | 66..98 (z105..107), 69..83 (z108..110) | 105..110 | g 4..24 → curtain walk y 20 | paved at rock |
| SW-P | south-west pavilion | 15..23 (z102..104), 9..26 (z105..110) | 102..110 | g 31..43 → wall top 48, ridge 55 | |
| SW-L | SW lower lean-to | 9..26 | 111..113 | g 13..20 → 22 | |
| SW-T | SW stair tower | 21..26 (z93..98), 21..23 (z99..101) | 93..101 | g 42..44 → 52, cap 56 | square, pyramid cap |

## ROOFS

All slate: palette `dark-slate` (deepslate tiles + cobbled/blackstone/cracked accents), stone-brick ridge,
eave course of polished_blackstone_brick-look via palette eave. Pitches are steep (rise ≥ run). Ridges and eaves:

| roof | form | ridge axis / line | eaves y | ridge y | overhang | how built |
|---|---|---|---|---|---|---|
| NAVE | gable, pitch 3:2 | x, z 64, x 15..47 | 63 (at z 57, 71) | 73 | 1 eave; west gable flush (verge stone coping) | `$MCD roof` style gable, material dark-slate; stops against the tower at x 48 |
| NAVE aisles | lean-to | x; high side against clerestory | 54 (z 51, 77) | 57 | 1 | by hand (stairs, bottom-slab top row) |
| TR-N / TR-S | gable 3:2 | z, x 55, z 48..56 / 72..86 | 63 (x 47, 63) | 73 | 1 | roof tool; gable walls are masonry (keep) |
| CROSS tower | no roof: balustraded platform y 99..100 around the spire | | | | | by hand |
| SPIRE | octagonal; lantern stage + needle | centre (55,64) | | 142 | | by hand: lantern octagon r4 (9 wide) y 99..108 with 8 open lancets and 8 crocketed gablets to y 110; needle octagon 7 wide y 109..118, 5 wide y 119..128, 3 wide y 129..137, 1x1 y 138..142; crockets (deepslate_tile_stairs facing out) on every edge every 3rd course; 4 corner pinnacles on the tower corners (49,58),(61,58),(49,70),(61,70) y 99..112 |
| ANGEL | figure | (55,64) | | 151 | | by hand: gold pedestal y 143; legs 144..145, torso 146..147, head 148 (gold_block at x55 z64); wings gold_block x 54, z 63 and z 65, y 146..149; raised arm (56,148,64) gold_block; sword lightning_rod (56,149..151,64); blackstone dragon under the feet at (55..56,144,65) slab |
| CHOIR | gable 2:1 (very steep) | x, z 64, x 63..88 | 73 (z 58, 70, inside the balustrade) | 86 | 0 (balustrade parapet y 73 on the wall tops) | roof tool for the straight part; apse half-cone/hip to apex (89,86,64) by hand |
| AMB | flat lead-grey terrace | | | 58 | | deepslate_tile_slab (bottom) deck, balustrade stone_brick_wall on outer edge y 59 |
| CH-* | pyramid / polygonal caps | each chapel centre | 58 | 61 | 0 | by hand, deepslate_tile_stairs |
| MERV-E | gable 1:1 | x, z 17, x 85..107 | 50 (z 6, 28) | 61 | 1 eave; east gable flush, stone coping verge | roof tool |
| MERV-W cloister | lean-to ring | high on outer walls (y 50), low over the arcades (y 46) | 46 | 50 | 1 into the garth | by hand (four lean-to slopes, hip-mitred at the corners) |
| MERV-S | lean-to | x, high side north (y 51) against MERV-E's south wall z 28 | 46 | 51 | 1 | by hand |
| N-CH | gable 1:1 | x, z 37.5 | 48 | 55 | 1 | roof tool |
| NW-R | gable 1:1 | x, z 17.5 | 47 | 54 | 1 | roof tool |
| NW-W / NW-S | gable 1:1 | z, x 14.5 / x 15 | 45 / 44 | 52 / 50 | 1 | roof tool, stepping |
| BELLE | gable 4:3 | x, z 56.5 | 38 | 45 | 1 | roof tool; gable at x 102 abuts SE-R |
| CHAT | gable 4:3 behind the parapet | x, z 41.5 | 33 | 39 | 0 (inside crenels) | by hand |
| E-R | gable | z, x 122.5 | 38 | 44 | 1 | roof tool |
| SE-R | gable | x, z 70 | 36 | 42 | 1 | roof tool |
| LOGIS-W | gable 1:1 + 3 dormers south | x, z 85.5 | 56 | 65 | 1 | roof tool, dormers x 24, 32, 40 |
| LOGIS-A | gable 1:1 + dormers south | x, z 92.5 | 54 | 63 | 1 | roof tool, dormers x 61, 67 |
| LOGIS-B | gable 1:1 + dormers south | x, z 95.5 | 47 | 55 | 1 | roof tool, dormers x 76, 82 |
| LOGIS-C | gable 1:1, gable SOUTH | z, x 95.5 | 46 | 54 | 1 | roof tool, dormers on east slope z 92, 98 |
| BAILLI | gable 1:1 | x, z 112 | 47 | 54 | 1 | roof tool |
| SW-P | gable | x, z 106 | 49 | 55 | 1 | roof tool |
| SW-T | pyramid | (23,96) | 53 | 56 | 1 | roof tool style pyramid |
| NE-T | cone | (109,20) | 52 | 57 | 0 | `tower-cap` preset, material dark-slate |

Roof meets: nave/transept ridges at y 73 die into the tower shaft (x 49..61, z 58..70); choir ridge 86 dies into
the tower's east face x 61. Valleys where transept roofs meet the nave/choir: by the roof tool's union of rects.
Chimneys pass through (cells kept): see RESERVED.

## FACADES

General courses (all granite ranges): plinth = cobblestone/mossy_cobblestone from the rock to g+2, then a
chamfer course of stone_brick_stairs (proud 0); body stone_bricks with andesite/tuff accents ≤1 in 10, cracked/mossy
≤1 in 10 in the lowest 6 courses; quoins chiseled_stone_bricks + polished_andesite paired at corners; every window a
stone_brick_slab sill (proud 1) and an arch head of upside-down stone_brick_stairs; string courses stone_brick_stairs
upside-down, proud 1, at each floor line listed in FLOORS; eave course polished_andesite.

NAVE (seen from the SE over the transept): 4 bays. Buttress piers 1 wide, proud 1, at x 15,23,31,39,47 on aisle walls
(z 51 / z 77) to y 53 with sloped tops. Aisle tier: one round-arched window per bay, x 18..20 (3 wide), y 47..51 glass,
y 52 arch head. Clerestory tier: round-arched x 18..20 (+8k), y 58..60 glass, y 61 arch head. Corbel table under the
eaves y 62 (stone_brick_stairs upside-down proud 1).
WEST FRONT (x 15, faces west over TER-W): plain classical. Central bay z 58..70: 4 pilasters (stone_bricks, proud 1 at
x 14) at z 58, 61, 67, 70, y 44..61; entablature y 62 (polished_andesite proud 1) and triangular pediment (stone_brick
stairs, raking cornice proud 1) following the gable y 63..73; door x 15, z 63..65, y 44..48 round-arched (y 48 head);
a round-arched window z 63..65, y 52..58 above. Aisle ends z 52..57 / 71..76 to y 53, balustrade y 54 (stone_brick_wall)
with a stone urn (stone_brick_wall + polished_andesite_slab) at z 52, 76.
CROSSING TOWER (all 4 faces alike above y 74): corner buttresses 2 wide proud 1, y 74..98; string courses y 83 and y 98
(stairs upside-down proud 1); belfry: two tall lancets per face, 2 wide, y 85..95, offset positions 51..52 and 58..59
(on z faces: z 60..61 and 67..68), louvred with dark_oak_trapdoor; parapet y 99..100 stone_brick_wall balustrade.
CHOIR (the hero face: south + east): Flamboyant. Bays x 64..68, 70..74, 76..80, 82..86 between piers x 63,69,75,81,87.
Clerestory window per bay, 3 wide (x 65..67, 71..73, 77..79, 83..85), y 62..71: gray_stained_glass_pane, centre
mullion stone_brick_wall, tracery head y 70..71 (stone_brick_wall ogee + stairs). Glazed triforium y 59..61 (same x,
panes behind stone_brick_wall colonnettes). Balustrade y 73 (stone_brick_wall) with pinnacles at each pier to y 76.
Apse faces each carry one window 3 wide (2 on the diagonals), same y. FLYING BUTTRESSES at x 69, 75, 81, 87 both sides
and on the 4 apse corners: culée (pier) 2 x 3 on the aisle's outer wall (north z 48..50, south between the south
chapels z 78..80) from the rock to y 70, pinnacle shaft stone_brick_wall y 71..78 with crockets (stone_brick_stairs
facing out at y 73, 75) and a tip (polished_andesite_slab) at y 79; flyer: upside-down stone_brick_stairs arc from
the culée at y 68 rising to the clerestory pier at y 71 (one flyer; a second lower one y 62..64 on the south side).
Chapels: one pointed window each, 1 wide, y 47..55 (CH-S: x 68, 75, 82, 89; CH-N: x 79, 86; CH-E: z 57, 64, 71); a
crocketed pinnacle at each chapel's outer corners to y 63. Crypt base (below 43): bare granite with cobble plinth,
small round-headed slits 1x2 every 6.
MERVEILLE north face (z 7; x 56..62 at z 9; the sheer wall): base rubble cobblestone/mossy to g+3; storey 1 (y g..23):
narrow lancets 1x4, y 14..17, every 6 (x 66, 72, 78, ... 102); string y 23; storey 2 (y 24..39): MERV-W paired lancets
2x6 y 29..34 at x 66..67, 72..73, 78..79; MERV-E single lancets 1x7 y 28..34 at x 90, 96, 102; string y 39; storey 3
(y 40..49): MERV-E refectory: tall narrow slits 1x7, y 41..47, every 2 between buttresses (x 86,90,92,96,98,102,104);
MERV-W: cloister outer wall, small lancets 1x3 y 43..45 at x 66, 72, 78. Eave course y 49 corbelled (stairs upside
down proud 1). Buttresses BUTT-N 2 wide, setbacks (stone_brick_stairs) at y 22 and y 38, sloped tops at y 50.
MERVEILLE east gable (x 107): three lancet tiers as on the north, a rose-less gable with 3 stepped lancets y 52..57.
CLOISTER (garth x 64..76, z 15..25): stylobate course polished_andesite y 40 on the ring x 62..78, z 13..27; double
colonnade: outer row on the ring x 62 / x 78 / z 13 / z 27 at even coordinates, inner row on x 63 / x 77 / z 14 / z 26 at
odd coordinates (staggered); columns quartz_pillar y 41..44; arch lintel y 45 stone_brick_slab (top) linking the two rows,
with upside-down stone_brick_stairs as little arches between; lean-to roof above (see ROOFS).
LOGIS (south faces, camera side): each storey a row of mullioned square windows 2 wide (cross of stone_brick_wall),
3-bay rhythm 6 apart; the lowest storeys pointed lancets 1 wide; corbelled eave; dormers (stone gablet, 1-wide window,
deepslate cap) at the x listed in ROOFS. LOGIS-C south gable z 104: stepped lancets + 2 mullioned windows per storey.
DEGRE: walls z 82 and z 86, stone_bricks, top at step level +8, coped with stone_brick_slab; arched bridge crossing at
x 88..90, y 50..52 (the "pont"); lanterns every 6 along the walls.
CHÂTELET (south face, the entry): two half-round turrets z 48..51 (W x 117..119, E x 126..128), stone_bricks with
cobble base; machicolation corbels (upside-down stone_brick_stairs proud 1) y 30..31 all round with crenellated parapet
y 32..33 (stone_brick_wall merlons every other); entry arch x 121..124, y g..g+5 (south wall z 47), dark, with a
pointed head of stairs; arrow slits 1x3 in each turret at y 20 and y 26.
BELLE CHAISE (south face z 62, east x 116): Gothic hall, 3 tall pointed windows 2 wide y 30..35 at x 105..106,
109..110, 113..114; crenellated parapet y 37..38 under the gable roof.

## MATERIALS

| role | block |
|---|---|
| wall body (granite) | stone_bricks |
| weathering (≤1 in 10, low) | cracked_stone_bricks, mossy_stone_bricks |
| variation accents | andesite, tuff, tuff_bricks (≤1 in 10) |
| plinth / rock footing | cobblestone, mossy_cobblestone, stone |
| quoins / trim / entablature | chiseled_stone_bricks, polished_andesite, polished_andesite_stairs |
| sills, string courses, arches | stone_brick_slab, stone_brick_stairs |
| tracery, balustrades, pinnacles | stone_brick_wall |
| roofs | deepslate_tiles, deepslate_tile_stairs, deepslate_tile_slab, cobbled_deepslate, cracked_deepslate_tiles; ridge stone_brick_slab |
| spire body | polished_deepslate, deepslate_tiles; ribs polished_blackstone_wall; crockets deepslate_tile_stairs; pinnacles polished_deepslate_wall |
| archangel | gold_block; sword lightning_rod; gold detail light_weighted_pressure_plate; dragon blackstone |
| glass | gray_stained_glass_pane (church, Merveille), light_gray_stained_glass_pane (logis) |
| louvres / doors | dark_oak_trapdoor, dark_oak_door |
| cloister columns | quartz_pillar on polished_andesite stylobate |
| garth / ground | grass_block (garth), stone + cobblestone + gravel paving on terraces and courts |
| light | lantern (standing and hanging from blocks), shroomlight hidden behind glass inside the choir and refectory |

All verified by `$MCD blocks --check`. No chains at all (1.21.1 names it `chain`, which the toolkit flags; `iron_chain` is 1.21.9+ and forbidden):
hang lanterns directly under a block.

## OPENINGS

Doors: west door (15, 44..48, 63..65) round-arched; south transept door from the Degré landing (62, 44..47, 83..84);
Châtelet entry (121..124, g..g+5, 47) leading to a dark stair rising north inside (y +1 per cell to z 40); Belle Chaise
door from the Châtelet (116, 27..30, 52..53); cloister gate from N-TER (56, 41..43, 29..30); terrace doors of the
logis onto SAUT-G (57, 41..43, 90..91).
Windows: as in FACADES, by these rules: nave x 18..20+8k (k 0..3) both aisle and clerestory tiers, both sides; choir
x 65..67, 71..73, 77..79, 83..85 both sides y 59..71; apse one per face; Merveille per storey list; logis mullioned
2-wide every 6 along x starting at x0+3 of each range, on each storey's window band (floor+1..floor+3).
The part that builds a wall leaves these cells AIR; glazing and tracery are added afterwards.

## RESERVED (left empty by the shell)

- Spire and archangel cells: the column x 50..60, z 59..69 from y 99 up (spire part only).
- Flyer arcs and pinnacle shafts: x 69,75,81,87 (+1) z 48..56 and z 72..80, y 62..80; apse diagonal flyers.
- Cloister: stylobate ring y 40 and the columns y 41..44 on x 62/63/77/78, z 13/14/26/27; garth grass x 64..76 z 15..25, y 40.
- Chimney stacks (2x2, fire at the bottom, flue up the middle, top 2 above the roof): LOGIS-W (24..25, 91..92) and
  (40..41, 91..92) to y 67; LOGIS-A (58..59, 97..98) and (69..70, 97..98) to y 65; LOGIS-B (79..80, 103..104) to y 57;
  LOGIS-C (88..89, 103..104) and (103..104, 95..96) to y 56; BAILLI (60..61, 115..116) to y 56. Roofs keep these cells.
- Grand Degré stair cells x 63..104, z 83..85 above the stair line (walk y 43 at x ≤ 81, y 43-(x-81) to y 21 at x 103).
- Lantern posts: TER-W parapet every 6 (z 54, 60, 66, 72), N-TER every 8, DEGRE walls every 6, SAUT-G corners.

## FLOORS (walk levels; the floor course is one below)

| mass | storeys (walk y) | interior volume (exterior-only: halls 4 deep behind windows) |
|---|---|---|
| NAVE / CROSS / TR-* / CHOIR | church floor 44 | nave 16..46 x 59..69, y 44..62; choir 64..88 x 58..70, y 44..72 |
| CRYPT | 31 (Gros Piliers), solid below | 64..96 x 51..77, y 31..42 |
| TER-W, N-TER | 44 / g+1 | open |
| MERV-W | cellar 8 (north strip z 8..14), Knights' Hall 24, cloister 41 | Knights' hall 58..82 x 9..31, y 24..38 |
| MERV-E | almonry 8, guests' hall 24, refectory 41 | refectory 86..106 x 8..26, y 41..49 |
| MERV-S, N-CH | 36, 44 | |
| NW-R / NW-W / NW-S | 24, 34, 43 (where above g) | |
| BELLE | Salle des Gardes 27, upper hall 32 | 103..115 x 52..61 |
| CHAT | stair from g 16 at z 47 to 24 at z 40 | dark vault 120..125 x 40..46 |
| E-R / SE-R | 20, 25, 30 | |
| LOGIS-W | 44, 49 | |
| LOGIS-A | 31, 36, 41, 46 | |
| LOGIS-B | 26, 31, 36, 41 | |
| LOGIS-C | 15, 20, 25, 30, 35, 40 (above g only) | |
| BAILLI | 26, 31, 36, 41 | |
| SW-P | 34, 39, 44 | |
Every walkable outdoor surface (terraces, Degré, courts, rampart walks, aisle flat roofs) is lit to ≥ 8 with
lanterns; roofs are stairs/bottom slabs only (no spawnable flats).

# DESIGNER'S SECTIONS

## PALETTE
- Wall: stone_bricks (+stairs, slab, wall); weather cracked_stone_bricks, mossy_stone_bricks; accents andesite, tuff, tuff_bricks; plinth cobblestone, mossy_cobblestone, stone; trim chiseled_stone_bricks, polished_andesite (+stairs, slab).
- Roof: deepslate_tiles, deepslate_tile_stairs, deepslate_tile_slab, deepslate_tile_wall, cobbled_deepslate, cracked_deepslate_tiles; ridge stone_brick_slab.
- Spire: polished_deepslate, deepslate_tiles, polished_blackstone_wall, polished_deepslate_wall; angel gold_block, lightning_rod, light_weighted_pressure_plate, blackstone, blackstone_slab.
- Glass gray_stained_glass_pane / light_gray_stained_glass_pane; dark_oak_trapdoor, dark_oak_door; quartz_pillar; grass_block; gravel; lantern; shroomlight; campfire, hay_block (chimney); chain (never iron_chain); interior: oak/spruce planks, barrel, bookshelf, candle, carpets, iron_bars.
- Unknown id: "grass" (use short_grass).

## VOCABULARY
- footing(x,z,y): cobblestone/mossy column from ground to wall base.
- granite_wall(box,face): stone_bricks, plinth course cobble, ≤1/10 cracked/mossy, string courses stone_brick_slab, quoins chiseled.
- round_window(x,y,z,face): 1x3 air opening, upside-down stone_brick_stairs head, slab sill, pane behind.
- lancet(x,y,z,face,h): 1xh opening, pointed head two upside-down stairs, gray pane.
- tracery_window(x,y,z,face): 3 wide, centre mullion stone_brick_wall, ogee head of walls+stairs.
- buttress(x,z,y0,y1): 2 wide, stair setbacks at y22 and y38, sloped top.
- parapet(line): stone_brick_wall with merlons every other; balustrade same.
- slate_stair_roof: roof tool dark-slate, steep 1:1 or 3:2.
- octagon_ring(r,y), crocket(x,y,z,face): deepslate_tile_stairs outward, pinnacle(x,y,z,h): polished_deepslate_wall + tip.
- archangel(): per ROOFS ANGEL.
- flyer(x,side): upside-down stone_brick_stairs arc.
- colonnade_bay, mullion_window (2 wide, wall cross), dormer, chimney_stack (chimney()), round_turret, machicolation (upside-down stairs proud 1), degre_flight (stone_brick_stairs facing up-slope, walls both sides), lamp (lantern on wall top or hanging).

## ROOMS (viewed through windows only; furnish lightly, lit ≥8)
See rooms in report. Floors stone_bricks or oak_planks.

## PARTS
1 P1 parts/shell.mjs massing, rock, all walls, buttresses, terraces; 2 P2 parts/roofs.mjs; 3 P3 parts/spire.mjs spire+angel (exactly y151); 4 P4 parts/choir.mjs; 5 P5 parts/fittings.mjs windows, doors, cloister, Châtelet; 6 P6 parts/grounds.mjs chimneys, lamps, paving.

## Notes
Never exceed y151, never outside footprint; leave RESERVED cells; lanterns only on solid blocks; roofs stairs/slabs (no spawnable flats).
```

### elements.md

```markdown
# REQUIRED ELEMENTS (Abbey of Mont-Saint-Michel). Coordinates from plan.md; all clipped to FOOTPRINT; all walls founded to ground.
Part numbers: P1 Rock & granite shell, P2 Slate roofs, P3 Spire & archangel, P4 Choir Flamboyant & flyers, P5 Windows/doors/cloister/Châtelet fittings, P6 Chimneys, lights & grounds.

| # | element | construction (block by block) | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Granite rock footing | cobblestone/mossy_cobblestone/stone from ground g up to g+3 under every wall; fill gaps to floor as solid masonry | all masses | P1 | footing |
| 2 | Nave + aisles | stone_bricks walls, 1/10 cracked/mossy, piers every 8, round arch windows (upside-down stairs head) in two tiers | x15..47 z52..76 | P1,P5 | granite_wall, round_window |
| 3 | West front + terrace | pilasters x14, pediment gable to y73 in stone_brick_stairs/slab, round door, paving stone_bricks y43, stone_brick_wall parapet y44..45 | x6..15 z52..77 | P1,P5 | granite_wall, parapet |
| 4 | Transepts, crossing tower | masonry gables, tower shaft 49..61 to y98, balustrade y99..100 | x48..62 | P1 | granite_wall, balustrade |
| 5 | Slate roofs | roof tool, deepslate_tiles palette, stone_brick_slab ridge; hand roofs via slate_stair_roof | per ROOFS | P2 | slate_stair_roof |
| 6 | Spire | octagon rings per ROOFS, polished_deepslate body, polished_blackstone_wall ribs, crockets, lantern stage with open lancets, 4 corner pinnacles | centre (55,64) y99..142 | P3 | octagon_ring, crocket, pinnacle |
| 7 | Golden St Michael | per ROOFS ANGEL: gold_block body/wings/arm, lightning_rod sword top exactly y151, blackstone dragon | (54..56,143..151,63..65) | P3 | archangel |
| 8 | Flamboyant choir | pier-and-bay walls, 3-wide gray glass lancets with ogee tracery (stone_brick_wall + stairs), balustrade y73, pinnacles | x63..97 z46..81 | P4 | tracery_window, pinnacle |
| 9 | Flying buttresses | culée stone_bricks, upside-down stone_brick_stairs arc y68→71, pinnacle shaft wall + crockets + andesite slab tip | x69,75,81,87 | P4 | flyer |
| 10 | Chapels ring | pyramid deepslate_tile_stairs caps y58..61, pointed windows | CH-N/S/E | P4 | chapel_cap |
| 11 | Merveille north wall | 3 storeys, buttresses 2 wide with stair setbacks at y22/38, lancets, strings, corbel eave | z4..7, x56..107 | P1,P5 | buttress, lancet |
| 12 | Cloister | polished_andesite stylobate y40, double staggered quartz_pillar colonnade y41..44, stone_brick_slab lintel, grass garth, lean-to slate | x62..78 z13..27 | P5,P2 | colonnade_bay |
| 13 | Logis abbatiaux | granite ranges, mullioned windows, dormers, tall chimneys | south | P1,P2,P5,P6 | mullion_window, dormer |
| 14 | Chimneys | 2x2 stone_bricks stacks, band deepslate bricks-look (chiseled), slab cap; flue air; chimney() | RESERVED list | P6 | chimney_stack |
| 15 | Grand Degré | stone_bricks stair stepping y43→21, walls z82,z86, bridge arch x88..90 | x63..104 z82..86 | P1,P6 | degre_flight |
| 16 | Châtelet + Belle Chaise | stone_bricks, half-round turrets, machicolation, crenels, dark arched entry x121..124 | x102..128 | P1,P5 | round_turret, machicolation |
| 17 | Lighting | lanterns on parapets/walls/stairs, hidden shroomlight, floodlit | per RESERVED | P6 | lamp |
```

### rooms.json

```json
{"entrance":[122,16,49],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "wall": ["stone_bricks", "stone_brick_stairs", "stone_brick_slab", "stone_brick_wall"],
    "weathering": ["cracked_stone_bricks", "mossy_stone_bricks"],
    "accent": ["andesite", "tuff", "tuff_bricks"],
    "plinth": ["cobblestone", "mossy_cobblestone", "stone"],
    "trim": ["chiseled_stone_bricks", "polished_andesite", "polished_andesite_stairs", "polished_andesite_slab"],
    "roof": ["deepslate_tiles", "deepslate_tile_stairs", "deepslate_tile_slab", "deepslate_tile_wall", "cobbled_deepslate", "cracked_deepslate_tiles"],
    "ridge": ["stone_brick_slab"],
    "spire": ["polished_deepslate", "polished_blackstone_wall", "polished_deepslate_wall"],
    "angel": ["gold_block", "lightning_rod", "light_weighted_pressure_plate", "blackstone", "blackstone_slab"],
    "glass": ["gray_stained_glass_pane", "light_gray_stained_glass_pane"],
    "louvre": ["dark_oak_trapdoor", "dark_oak_door"],
    "column": ["quartz_pillar"],
    "ground": ["grass_block", "gravel"],
    "light": ["lantern", "shroomlight"],
    "chimney": ["campfire", "hay_block"]
  },
  "objects": ["oak_planks", "spruce_planks", "barrel", "bookshelf", "candle", "iron_bars", "red_carpet"]
}
```

### make.sh

```sh
#!/usr/bin/env bash
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then moves into place.
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp ./build.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Builds the whole abbey (argv[2] = output .nbt): the grid, the rock, then the six parts in plan.md's order.
// Parts write plot-local coordinates (plan.md), so they go straight into the grid with no offset.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { GRID, STONE, groundTop, onFootprint } from "./vocab/base.mjs";

// plan.md's PARTS, in build order: [name, module]. Each module exports build(g) for its part's cells.
const PARTS = [
  ["Rock and granite shell", "parts/shell.mjs"],
  ["Slate roofs", "parts/roofs.mjs"],
  ["Spire and archangel", "parts/spire.mjs"],
  ["Flamboyant choir", "parts/choir.mjs"],
  ["Windows, doors, cloister", "parts/fittings.mjs"],
  ["Chimneys, lights, grounds", "parts/grounds.mjs"],
];

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// A part whose module isn't written yet (another copy is still working) is left empty, not an error.
async function loadPart(module) {
  const path = fileURLToPath(new URL(module, import.meta.url));
  if (!existsSync(path)) { console.warn(`${module}: not written yet, part left empty`); return () => {}; }
  const mod = await import(path);
  return typeof mod.build === "function" ? mod.build : () => {};
}

// The rock: each footprint cell is solid stone from y 0 up to its ground value g (rock fills y < g).
function layRock(g) {
  for (let z = 0; z < GRID[2]; z++) for (let x = 0; x < GRID[0]; x++) {
    if (!onFootprint(x, z)) continue;
    const top = groundTop(x, z) ?? 0;
    for (let y = 0; y < top; y++) g.set(x, y, z, STONE);
  }
}

const g = new Grid(GRID, { dataVersion: DATA_VERSIONS["1.21.1"] });
layRock(g);
const list = [];
for (const [name, module] of PARTS) list.push([name, await loadPart(module)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Site constants, the site maps and the palette for the Abbey of Mont-Saint-Michel (plan.md; plot 0).
// Coordinates are plot-local: x east 0..129, z south 0..120, y up 0..153. A map cell (c, r) covers x 3c..3c+2, z 3r..3r+2.

// ---- site ----

// ---- site ----
/** Grid size [x, y, z] for the whole plot: 130 x 154 x 121. */
export const GRID = [130, 154, 121];

/** Side of one footprint / ground map cell in blocks. */
export const MAP_CELL = 3;

/** The church axis: the crossing tower's centre line, z. */
export const CHURCH_Z = 64;

/** The west front's x (pilasters at x 14, door and classical front at x 15). */
export const WEST_FRONT_X = 15;

/** The apse's east end x (the round apse reaches x 97). */
export const APSE_X = 97;

/** The spire's centre column [x, z]; the spire body sits x 50..60, z 59..69 from y 99 up. */
export const SPIRE_CENTER = [55, 64];

/** Lowest y of the spire (the crossing tower's balustraded platform is y 99..100). */
export const SPIRE_BASE_Y = 99;

/** Top of the spire needle (y 142). */
export const SPIRE_TOP_Y = 142;

/** The archangel's sword tip [x, y, z]: the build's single highest block (y 151). */
export const ANGEL_TIP = [56, 151, 64];

/** Top y of the whole build (nothing above it). */
export const MAX_Y = 151;

/** The north face of the Merveille (z 7, the sheer wall over the bay). */
export const MERV_NORTH_Z = 7;

/** The east gable of the Merveille (x 107). */
export const MERV_EAST_X = 107;

/** True if the block column (x, z) is inside the footprint's `#` cells and inside the plot. */
export function onFootprint(x, z)

/** The ground value g of the block column (x, z) (rock fills y < g), or null where the map has no value ('.'). */
export function groundTop(x, z)

// ---- seeded random ----
/** A seeded random function: rng(seed)() returns a float in [0, 1), the same sequence for the same seed. */
export function rng(seed)

// ---- palette (palette.json ids only; one constant per id) ----
// Wall: STONE_BRICKS, STONE_BRICK_STAIRS, STONE_BRICK_SLAB, STONE_BRICK_WALL (granite body, string courses, tracery).
export const STONE_BRICKS = "stone_bricks";

export const STONE_BRICK_STAIRS = "stone_brick_stairs";

export const STONE_BRICK_SLAB = "stone_brick_slab";

export const STONE_BRICK_WALL = "stone_brick_wall";

// Weathering: CRACKED_STONE_BRICKS, MOSSY_STONE_BRICKS (low courses, at most 1 in 10).
export const CRACKED_STONE_BRICKS = "cracked_stone_bricks";

export const MOSSY_STONE_BRICKS = "mossy_stone_bricks";

// Accents: ANDESITE, TUFF, TUFF_BRICKS (at most 1 in 10).
export const ANDESITE = "andesite";

export const TUFF = "tuff";

export const TUFF_BRICKS = "tuff_bricks";

// Plinth and rock footing: COBBLESTONE, MOSSY_COBBLESTONE, STONE (the rock fill itself is STONE).
export const COBBLESTONE = "cobblestone";

export const MOSSY_COBBLESTONE = "mossy_cobblestone";

export const STONE = "stone";

// Trim (quoins, entablature): CHISELED_STONE_BRICKS, POLISHED_ANDESITE, POLISHED_ANDESITE_STAIRS, POLISHED_ANDESITE_SLAB.
export const CHISELED_STONE_BRICKS = "chiseled_stone_bricks";

export const POLISHED_ANDESITE = "polished_andesite";

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";

// Roofs: DEEPSLATE_TILES, DEEPSLATE_TILE_STAIRS, DEEPSLATE_TILE_SLAB, DEEPSLATE_TILE_WALL, COBBLED_DEEPSLATE, CRACKED_DEEPSLATE_TILES.
export const DEEPSLATE_TILES = "deepslate_tiles";

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";

export const DEEPSLATE_TILE_WALL = "deepslate_tile_wall";

export const COBBLED_DEEPSLATE = "cobbled_deepslate";

export const CRACKED_DEEPSLATE_TILES = "cracked_deepslate_tiles";

// Spire: POLISHED_DEEPSLATE, POLISHED_BLACKSTONE_WALL, POLISHED_DEEPSLATE_WALL (body, ribs, pinnacles).
export const POLISHED_DEEPSLATE = "polished_deepslate";

export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";

export const POLISHED_DEEPSLATE_WALL = "polished_deepslate_wall";

// Archangel: GOLD_BLOCK, LIGHTNING_ROD, LIGHT_WEIGHTED_PRESSURE_PLATE, BLACKSTONE, BLACKSTONE_SLAB.
export const GOLD_BLOCK = "gold_block";

export const LIGHTNING_ROD = "lightning_rod";

export const LIGHT_WEIGHTED_PRESSURE_PLATE = "light_weighted_pressure_plate";

export const BLACKSTONE = "blackstone";

export const BLACKSTONE_SLAB = "blackstone_slab";

// Glass: GRAY_STAINED_GLASS_PANE (church, Merveille), LIGHT_GRAY_STAINED_GLASS_PANE (logis).
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";

export const LIGHT_GRAY_STAINED_GLASS_PANE = "light_gray_stained_glass_pane";

// Louvres and doors: DARK_OAK_TRAPDOOR, DARK_OAK_DOOR.
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";

export const DARK_OAK_DOOR = "dark_oak_door";

// Cloister: QUARTZ_PILLAR (columns on the polished andesite stylobate).
export const QUARTZ_PILLAR = "quartz_pillar";

// Garth and paving: GRASS_BLOCK (garth), GRAVEL (terraces and courts).
export const GRASS_BLOCK = "grass_block";

export const GRAVEL = "gravel";

// Light: LANTERN, SHROOMLIGHT (hidden behind glass inside the choir and refectory).
export const LANTERN = "lantern";

export const SHROOMLIGHT = "shroomlight";

// Chimneys: CAMPFIRE (fire at the bottom), HAY_BLOCK (the flue's top).
export const CAMPFIRE = "campfire";

export const HAY_BLOCK = "hay_block";

// Interior (objects): OAK_PLANKS, SPRUCE_PLANKS, BARREL, BOOKSHELF, CANDLE, IRON_BARS, RED_CARPET.
export const OAK_PLANKS = "oak_planks";

export const SPRUCE_PLANKS = "spruce_planks";

export const BARREL = "barrel";

export const BOOKSHELF = "bookshelf";

export const CANDLE = "candle";

export const IRON_BARS = "iron_bars";

export const RED_CARPET = "red_carpet";
```

### vocab/h1.mjs

```js
// Vocabulary helpers from plan.md VOCABULARY (first batch): footing, lancet, parapet, crocket, flyer, dormer,
// machicolation, chapel_cap. Built on the build library (tools/src/build.mjs).
// Each takes the grid first, then its position (and facing) as arguments, and returns { box, placed, refused }.
// Writes stay inside the helper's own footprint (`box`, inclusive corners) and only go into air, unless opts.overwrite
// is set; anything refused is listed in `refused` (never thrown, except for arguments that cannot be built). Nothing is
// written below the footprint: ground, sand and floor under a helper belong to an earlier part.
// Facing follows the toolkit: a stair's facing is the side of its full-height back (B.stairs).

/** footing(x,z,y): a granite footing column under the wall base at y (that base cell is not written). It fills air
 *  down from the base to the first solid cell (the rock); the bottom course, by the rock, is mossy. */
export function footing(g, x, z, y, opts = {})

/** lancet(x,y,z,face,h): a 1 x h glazed opening in a wall whose outer face is `face`, bottom cell (x,y,z), h >= 3.
 *  The top two cells are the pointed head: two upside-down stone_brick stairs, the lower facing out and the upper
 *  facing in, so their slopes meet in a point. The cells below are gray glass pane, joined to the wall. */
export function lancet(g, x, y, z, face, h, opts = {})

/** parapet(from, to): a stone_brick_wall line at the height of from = [x, y, z], running straight to to = [x, y, z]
 *  (the two ends share one x or z). Crenellated: a merlon on every other cell, the gaps stay air. crenels: false makes
 *  a solid balustrade. Each wall's connections are written only toward its neighbouring merlons or wall cells. */
export function parapet(g, from, to, { crenels = true, overwrite = false } = {})

/** crocket(x,y,z,face): one deepslate_tile stair on an edge, facing out along `face`. */
export function crocket(g, x, y, z, face, opts = {})

/** flyer(x,y,z,side,run): one flying-buttress arc of upside-down stone_brick stairs, one column wide at x. It springs
 *  from the culee's inner face at z, at height y, and rises 3 to the pier at y+3 after `run` cells (run >= 2). side is
 *  the side the culee is on: "north" runs the arc toward +z, "south" toward -z. Each stair faces back to the culee. */
export function flyer(g, x, y, z, side, run = 6, opts = {})

/** dormer(x,y,z,face,depth): a small gabled dormer in a roof slope, its front on the plane of z looking out of `face`,
 *  centred on x (or on z for an east or west face). A 1-wide glazed window in the front (y, y+1), stone_brick cheeks
 *  and back, a stone gablet of upside-down stone_brick stairs over the front at y+2, and a flat deepslate_tile_slab cap
 *  at y+3. The footprint is 3 wide, 4 high and `depth` deep back from the front (default 2). */
export function dormer(g, x, y, z, face, depth = 2, opts = {})

/** machicolation(x,y,z,face,len): a run of `len` corbels (upside-down stone_brick stairs, proud 1 of the wall) in the
 *  air just outside a wall whose outer face is `face`. (x,y,z) is the first corbel's cell, outside the wall; the run
 *  goes along the wall. Each corbel's back is to the wall (facing into it). */
export function machicolation(g, x, y, z, face, len, opts = {})

/** chapel_cap(cx,y,cz,r,height): a stepped pyramid cap over a square chapel whose walls stand on the ring at distance
 *  r from the centre (cx,cz), starting at y. Course k (at y+k) is the deepslate_tile stair ring at distance r-k, each
 *  stair facing in toward the centre so the cap rises to a point; the solid tiles inside each ring hold it up. Once the
 *  ring is used up (distance 0) the centre cell continues as a solid finial column to `height` (default r). */
export function chapel_cap(g, cx, y, cz, r, height = r, opts = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md VOCABULARY (second batch): granite_wall, tracery_window, slate_stair_roof,
// pinnacle, colonnade_bay, chimney_stack, degre_flight. Built on the build library (tools/src/build.mjs).
// Each takes the grid first, then its position (and facing) as arguments, and returns { placed, refused }.
// Writes stay inside the helper's own footprint and only go into air, unless opts.overwrite is set; anything
// refused is listed in `refused` (never thrown). Nothing is written below the footprint: ground, sand and
// floor under a helper belong to an earlier part.

/**
 * A granite wall: stone_bricks over the box. Plinth course (bottom row) cobblestone, mossy about a third of it;
 * about 1 in 10 bricks cracked or mossy; on the `face` plane (north = the z0 side, south = z1, west = x0, east = x1)
 * a string course of stone_brick_slab every 5 rows and chiseled quoins at the two ends of that face.
 */
export function granite_wall(g, box, face = "north", opts = {})

/**
 * A 3-wide, 5-high lancet-style window on the `face` plane: (x, y, z) is the bottom cell of its first column.
 * Side lights are gray glass panes, the centre is a stone_brick_wall mullion, and the head (top row) is upside-down
 * stone_brick_stairs turning in to a wall centre, an ogee-like arch. The opening is cut by the shell part, so
 * this only writes into air.
 */
export function tracery_window(g, x, y, z, face = "north", opts = {})

/**
 * A steep slate roof of stairs over the box, ridge along `ridge` ("x" or "z"). The box's (x0, y0, z0) is the eave
 * corner at y0 and its y1 is the highest y allowed. `pitch` is [rise, run]: [1, 1] is 1:1, [3, 2] is 3:2 (stair
 * courses rise 3 for every 2 cells). Each slope cell is a deepslate_tile_stairs facing the ridge; the ridge row is
 * a stone_brick_slab; cobbled_deepslate fills under each stair so nothing floats. Gable ends are the walls' job.
 */
export function slate_stair_roof(g, box, ridge = "x", pitch = [1, 1], opts = {})

/** A pinnacle: polished_deepslate_wall shaft h cells tall from (x, y, z), capped by a deepslate_tile_wall tip. */
export function pinnacle(g, x, y, z, h = 3, opts = {})

/**
 * One colonnade bay: a polished_andesite stylobate at y over `span` cells, quartz_pillar columns at both ends rising
 * `height` cells from the stylobate, and a stone_brick_slab lintel over the columns. (x, y, z) is the first end cell;
 * axis "x" runs the bay east, "z" south. The open cells between the columns stay air (a double row is two bays).
 */
export function colonnade_bay(g, x, y, z, axis = "x", span = 4, height = 4, opts = {})

/**
 * A 2x2 chimney stack at (x..x+1, y.., z..z+1), h cells of masonry tall, capped by a stone_brick_slab ring. The fire
 * is a lit campfire in the flue foot at (x, y, z), so the smoke comes up from the bottom; the flue (x, z) stays air
 * to the top and the top is open to the sky. A chiseled band runs at mid height. The stack sits on the caller's
 * ground: nothing is written below y (the build library's chimney() would write a footing down to the ground).
 */
export function chimney_stack(g, x, y, z, h = 6, opts = {})

/**
 * A Grand Degré style flight: stairs from (x0, y0, z0) to the end column (x1, y1), one tread per column with
 * run and drop both 1 (|y1 - y0| must equal |x1 - x0|). Treads are stone_brick_stairs facing up-slope, `width`
 * wide along z, with stone_bricks walls on both sides (z0 - 1 and z0 + width) rising 8 above each tread and a
 * stone_brick_slab coping. Ground under the treads and walls is the caller's footing, not written here.
 */
export function degre_flight(g, [x0, y0, z0], [x1, y1], width = 3, opts = {})
```

### vocab/h3.mjs

```js
// Seven helpers from plan.md VOCABULARY: round_window, buttress, octagon_ring, archangel, mullion_window,
// round_turret, lamp. Each takes the grid g first, then its position (and face) as arguments.
// Every write goes through painter(): it lands only inside the helper's footprint box and only into air, unless
// opts.replace. A refused cell is listed in the result, never thrown. Block ids are plan.md PALETTE (1.21.1).

/** A 1 x 3 round-arched window in a wall facing f, at its bottom cell (x, y, z) in the wall plane. The opening stays air
 *  (the wall part leaves it open); glass set back one cell inside; slab sill proud below; upside-down stair head proud
 *  above. */
export function round_window(g, x, y, z, f, opts = {})

/** A 2-wide, 3-tall mullioned window in a wall facing f, at its bottom outer cell (x, y, z): opening stays air; a
 *  stone_brick_wall transom across the middle row; glass in the two outer rows set back inside; slab sill and stair
 *  head proud. */
export function mullion_window(g, x, y, z, f, opts = {})

/** Octagon ring of radius r about (cx, cz) at height y: the outline of a regular octagon (flat sides, corners cut).
 *  opts.block: the ring block (default polished_deepslate). */
export function octagon_ring(g, cx, cz, r, y, opts = {})

/** A buttress 2 wide: (x, z) is its cell touching the wall; it grows `opts.depth` (default 2) cells out along
 *  `opts.face` (default north). Stone_bricks column from y0 to y1; the outer cell is a stair course at the setbacks
 *  (y 22 and y 38) and at the top (sloped). */
export function buttress(g, x, z, y0, y1, opts = {})

/** St Michael per plan.md ROOFS ANGEL, centred on (cx, cz) with the pedestal at yPed (143): the figure runs to yPed+8
 *  (151); the sword tip is the build's highest block, so anything above 151 throws. Offsets are the plan's own. */
export function archangel(g, cx, cz, yPed = 143, opts = {})

/** Round turret shell of radius r about (cx, cz), from yFoot to yTop, 1.5 thick: cobblestone base (two courses),
 *  stone_bricks above, a merlon parapet at yTop + 1. opts.front = a direction name for a half-round front on that
 *  side (the Châtelet's south fronts); omitted = full ring. */
export function round_turret(g, cx, cz, r, yFoot, yTop, opts = {})

/** A lantern, standing on the block below it, or hanging from the block above (opts.hang). Refused with no support. */
export function lamp(g, x, y, z, opts = {})
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
