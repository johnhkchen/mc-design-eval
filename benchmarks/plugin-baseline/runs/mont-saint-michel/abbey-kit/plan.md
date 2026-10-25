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

- P1 shell built (parts/shell.mjs): masses hollow above floor course, openings left as holes (air); choir only crypt to y43 (P4 builds walls above); gable ends included for most ranges; tower shaft to y98, parapet y99..100.
