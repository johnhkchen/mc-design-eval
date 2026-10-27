# Notre-Dame de Paris: architect's plan (plot 0, 189 x 111, y 0..139)

Axis along x: WEST front at low x, CHEVET at high x. North = low z, south (the river, the camera) = high z.
Nave axis z = 38. Everything north of it mirrors the south: z(north) = 76 - z(south).
Scale 1.4 blocks/m. Interior floor y 3 throughout (ground is 3 at the west, 1-2 east: the plinth shows 1-2 courses at the chevet).
A pier's coordinate "p" means it occupies x p..p+1 (2 wide).

## SITE

- Lot: plot 0, x 0..188, z 0..110, up to y 139. Build only on `#` cells of the footprint (5 x 5 columns: col c = x 5c..5c+4, row r = z 5r..5r+4).
- Ground: rises west 3, centre 2, east and sacristy 0-1. Every mass's footing goes down to the local ground (solid `stone_bricks` plinth from the ground up to y 3); nothing floats, nothing is buried.
- The front named by the brief template (north) is not the face that matters here: the main entrance is the WEST front (x 0..2); the hero face is the CHEVET (x 152..188) and the SOUTH flank (z 59..69).
- The Square Jean-XXIII paths and their lanterns lie outside the footprint: not in this module (the place's dresser lights them).
- Out-of-footprint cells that shaped the plan: x 0..4 is out at z 5..9 and z 65..69 (tower front corners step back to x 5 there); z 70+ is out except the sacristy; south limit for anything along the nave/transept/choir is z 69, north limit z 7 (kept symmetric).

### Masses (block coordinates, inclusive)

| # | Mass | x | z | y | Notes |
|---|---|---|---|---|---|
| M1 | North west tower | 2..22 | 10..30 | 3..95 (+parapet 96..97) | front plane x 2 for z 12..30; corner z 10..11 starts at x 5 (stepped clasping corner) |
| M2 | South west tower | 2..22 | 46..66 | 3..95 (+parapet 96..97) | front plane x 2 for z 46..64; corner z 65..66 starts at x 5 |
| M3 | Facade centre (between towers) | 2..22 | 31..45 | 3..57 | rose stage + Grand Gallery; above y 57 open sky between the towers, the nave's west gable behind |
| M4 | Nave west gable | 6..22 | 27..49 | 48..63 | stone gable behind the gallery, peak y 63 at z 38, the nave roof stops against its east face |
| M5 | West portal porch base | 2..8 | 12..64 | 3..22 | 7-thick base wall, the three portals recessed into it (OPENINGS) |
| M6 | Nave clerestory (high nave) | 23..84 | 27..49 | 3..47 | walls 2 thick: z 27..28 and 48..49; cornice 47, parapet 48 |
| M7 | Nave tribunes (inner aisles) N / S | 23..84 | 17..26 / 50..59 | 3..31 | tribune walls z 17..18 / 58..59; lean-to roof (ROOFS) |
| M8 | Nave outer aisles + chapels N / S | 23..84 | 10..16 / 60..66 | 3..20 | outer walls z 10..11 / 65..66; parapet 19..20 |
| M9 | Transept (both arms + crossing) | 85..103 | 9..67 | 3..47 | gable faces: north wall z 9..10, south wall z 66..67; eave 47; gable peaks y 57 |
| M10 | Transept front buttresses | 85..87 and 101..103 | 7..8 / 68..69 | 3..54 | step back at y 20 and y 38; pinnacle 55..60 |
| M11 | Choir clerestory | 104..152 | 27..49 | 3..47 | as M6 |
| M12 | Choir tribunes N / S | 104..152 | 17..26 / 50..59 | 3..31 | as M7 |
| M13 | Choir outer aisles + chapels N / S | 104..152 | 10..16 / 60..66 | 3..20 | as M8 |
| M14 | Apse (clerestory) | 152..163 | 27..49 | 3..47 | half-decagon, outer face r 11 about C=(152,38); vertices (152,49) (158,47) (162,41) (162,35) (158,29) (152,27) |
| M15 | Ambulatory tribune ring | r 11..19 about C | x 152..171 | 3..31 | tribune wall at r 18..19 |
| M16 | Outer ambulatory ring | r 19..26 about C | x 152..178 | 3..20 | outer wall r 25..26 |
| M17 | Radiating chapels (5) | r 26..29 about C, 7 wide tangentially | centres at angle 0, +-36, +-72 | 3..20, gable to 25 | axis (Lady) chapel outer face x 181, z 35..41; +-36 deg centred (174,22)/(174,54); +-72 deg centred (160,12)/(160,64) |
| M18 | Sacristy, connecting gallery | 122..142 | 70..79 | 1..16 | low cloister walk to the south choir aisle |
| M19 | Sacristy, low west wing | 115..134 | 80..99 | 1..16 | |
| M20 | Sacristy, main hall | 135..149 | 80..107 | 1..26 | ridge along z; two buttresses x 136..138 and 145..147 to z 110 (y 1..14) |
| M21 | South-east stair turret | 105..108 | 67..72 | 2..50 | octagonal, between transept and choir, small cone 51..54 |
| M22 | SPIRE drum | 90..98 | 34..42 | 50..70 | octagon (corners cut 2), rises out of the crossing roof |
| M23 | SPIRE needle | centred x 94, z 38 | | 71..137 | octagon 7 wide y 71..85, 5 wide 86..105, 3 wide 106..124, 1 wide 125..133; cross arms y 131; mast 134..136; rooster tip y 137 exactly |

### Buttress piers and flying buttresses (the relief, the point of the build)

Nave piers p = 32, 40, 48, 56, 64, 72, 80. Choir piers p = 112, 120, 128, 136, 144. Bays between them: 6 clear (e.g. x 34..39).

| Element | South (hero) | North (mirror) | y | Notes |
|---|---|---|---|---|
| Outer pier (culee) | x p..p+1, z 65..69 | z 7..11 | 3..38 | 3 proud of the chapel wall; set-offs: face z 69 to y 20, z 68 to y 30, z 67 to y 38 (slab/stair weatherings at each) |
| Pier pinnacle | x p..p+1, z 66..67 | z 9..10 | 39..47 | 2x2 shaft y 39..42 with gablets, then 1x1 spirelet 43..46, finial 47 |
| Flying buttress | x p (1 thick), z 51..64 | z 12..25 | top: y 36 at the pier, rising 1 per ~1.5 to y 45 at the clerestory | open arch, at least 4 blocks of sky above the tribune roof everywhere under it; underside curved, body 1-2 blocks deep, thickest at the two ends |
| Clerestory wall buttress | x p..p+1, z 50 (south) / 26 (north) | | 37..47 | 1 proud; receives the flyer; a gargoyle at y 47 projecting 2 (z 51..52 / 24..25) |
| Chevet piers (6) | at angles -90, -54, -18, +18, +54, +90 about C | | 3..38, pinnacle 39..47 | radial, 2 wide: r 27..33 (+-18 deg: x 178..183, z 28..30 and 46..48; +-54 deg: x 168..171, z 11..16 and 60..65); +-90 deg: x 152..153, r 27..31 (z 7..11 and 65..69) |
| Chevet flyers (6) | radial lines from each chevet pier at r 27 (y 36) to the apse wall at r 11 (y 45) | | | 1 thick (Bresenham along the radius), same arch rule as the nave; these long thin flyers ARE the chevet |

## ROOFS

No preset fits a Gothic cathedral (`church` is a stave church). Use `$MCD roof` style `gable` with the `dark-slate` palette overridden to the lead mix below for the rectangular roofs; the apse, the lean-tos and the spire are BUILT BY HAND in their parts. Pitch 1:1 (the steepest the stair grammar gives cleanly; lead reads steep against 47-high walls).

| Roof | Form | Footprint | Eave y | Ridge | Overhang / meets |
|---|---|---|---|---|---|
| R1 Nave + choir (one continuous roof) | gable, ridge along x | x 23..152, z 27..49 | 48 (at z 27 / 49, behind the parapet) | y 59, single row z 38, x 23..152 | overhang 0 at the eaves (a cornice + pierced parapet stands in front, gutter between); west end dies into the gable M4; ridge crest of `iron_bars` y 60 |
| R2 Transept | gable, ridge along z | x 85..103, z 9..67 | 48 (at x 85 / 103) | y 57, row x 94, z 9..67 | meets R1 in valleys; north and south ends are stone gables (walls, M9) with the roof stopping 1 inside the coping; crossing cells x 90..98, z 34..42 left for the spire drum |
| R3 Apse | half-cone / five hipped facets, hand-built | r 0..11 about C, x 152..163 | 48 at r 11 | rises 1 per ring to y 59 at (152,38), joining R1's ridge end | crest ring of `iron_bars` at the eave parapet; ridge cross (`end_stone_brick_wall` + `end_rod`) at x 152, y 60..62 |
| R4 Tribune lean-tos | lean-to (shed) against the clerestory, hand-built | z 17..26 / 50..59 along nave + choir; r 12..19 round the apse | 32 at the tribune wall | 37 at the clerestory | stairs facing up-slope; flyers pass 4+ above |
| R5 Outer aisle / ambulatory lean-tos | lean-to, hand-built | z 10..16 / 60..66; r 19..26 round the apse | 21 behind the parapet | 25 against the tribune wall | |
| R6 Radiating chapels | small gables, ridge radial (pointing out), hand-built | each chapel r 26..29 | 20 | 24 | each window's gablet (wimperg) rises to 25 in front of it |
| R7 Tower tops | flat lead deck | x 3..21, z 11..29 / 47..65 | 95 | flat | openwork parapet y 96..97 all round; corner pinnacles 2x2 to y 97 (no higher: flat tops) |
| R8 Sacristy | gable, `$MCD roof` style gable, lead mix | main hall x 135..149, z 80..107 ridge along z; west wing x 115..134, z 80..99 ridge along x; gallery x 122..142, z 70..79 ridge along x | 17 / 12 / 11 | 26 / 16 / 15 | overhang 1, verge `smooth_sandstone_stairs` |
| R9 Spire | hand-built octagonal needle | M22/M23 | | tip y 137 | crockets of `deepslate_tile_stairs` up the 8 arrises every 3 courses; 4 groups of 3 apostle statues (`oxidized_copper` body, `oxidized_cut_copper_slab` head) standing on R1/R2 slopes stepping down from the drum, one group per roof arm, at y 50..56 |

## FACADES

Depth key: + proud, - recessed, relative to the wall plane. No flat run over 4 blocks on any river-facing face: the bay rhythm (pier 2 / jamb 1 / window 4 / jamb 1) guarantees it.

### South flank (hero) and north flank (mirror), nave + choir, per bay

| Level | y | Element | Depth | Material |
|---|---|---|---|---|
| Plinth | ground..3 | rusticated base | +1 (z 67 south) | `stone_bricks`, ~1 in 10 `cracked_stone_bricks` |
| Chapel storey | 4..18 | window 4 wide, pointed head; glass in the inner course of the 2-thick wall | -1 reveal (glass at z 65) | jambs `cut_sandstone`, head `smooth_sandstone_stairs` upside-down, glass panes |
| | 19 | string course | +1 | `smooth_sandstone_stairs` upside-down |
| | 20 | pierced balustrade over the wall top | flush | `sandstone_wall` |
| Pier | 3..38 | culee 3 proud, set-offs at 20 / 30 / 38 | +3 / +2 / +1 | `smooth_sandstone`, weatherings `smooth_sandstone_slab`, pinnacle `sandstone_wall` + `end_stone_brick_wall` finial |
| Tribune storey | 26..30 | two small lancets 1 wide, 3 tall per bay (or one rose-oculus 3x3) | -1 | `cut_sandstone` frame |
| Clerestory | 38..45 | window 4 wide x 8 tall, pointed, two lights with a central mullion (`sandstone_wall`) | -1 (glass at z 48) | |
| | 46 | corbel table | +1 | `smooth_sandstone_stairs` upside-down |
| | 47 | cornice; gargoyle at every pier | +1 / +2 | `chiseled_sandstone` gargoyle block + `sandstone_stairs` snout |
| | 48 | pierced parapet (gutter behind) | flush with the cornice | `sandstone_wall` |

### Chevet (hero)

| Element | Where | Depth | Material |
|---|---|---|---|
| Radiating chapels | M17, each: one window 3 wide y 5..16, pointed, under a steep gablet (wimperg) rising to y 25 with a crocket edge; small pinnacles at each chapel corner y 21..26 | chapel face +3 from the ambulatory wall, window -1 | `smooth_sandstone` walls, gablet `smooth_sandstone_stairs` + `chiseled_sandstone` apex |
| Ambulatory wall between chapels | r 25..26 | flush with chapels' flanks | balustrade `sandstone_wall` y 20 |
| Tribune ring | r 18..19, y 21..31 | lancets 1 wide x 3 per facet | |
| Apse clerestory | M14, each facet: one tall window 3 wide y 38..45; a vertex buttress +1 at each polygon corner y 37..47 receiving the flyer | -1 | |
| Apse cornice + parapet | y 47..48 round the half-decagon | +1 | `chiseled_sandstone` + `sandstone_wall` |
| Flyers + pinnacles | as in SITE | open | `smooth_sandstone_stairs` top, `smooth_sandstone` body |

### Transept faces (south hero, north mirror)

| Level | y | Element | Depth | Material |
|---|---|---|---|---|
| Portal (Portail Saint-Etienne S / du Cloitre N) | 3..20 | pointed portal x 91..97, 3 stepped archivolts, door x 93..95, tympanum above y 13..17, wimperg gable to y 26 | portal recessed -2 into wall z 66..67 (door in z 66); wimperg flush with buttress faces z 68 | `cut_sandstone` archivolts, `chiseled_sandstone` tympanum, `sandstone_stairs` gable |
| Triforium band | 27..32 | 7 glazed lancets 1 wide across x 88..100 | -1 | `sandstone_wall` mullions |
| ROSE | 33..47 | rose centred (94, 40, z 67), radius 6 (13 across), in a square frame x 87..101, spandrels pierced (`sandstone_wall`) | rose glass -1 (plane z 66), frame +0 | glass mix below; tracery spokes `end_stone_brick_wall` |
| Gable | 48..57 | stone gable, pierced small rose 3x3 at y 51..53, crocketed rakes, statue/finial at y 57..58 | +0 | `smooth_sandstone`, rakes `smooth_sandstone_stairs` |
| Buttresses (M10) | 3..60 | pinnacles 55..60 | +2 | |

### West front (seen behind; must still read)

| Level | y | Element | Depth | Material |
|---|---|---|---|---|
| Buttresses (4) | 3..57 | z 12..14, 29..31, 45..47, 62..64, projecting to x 0 | +2 | `smooth_sandstone` |
| Portals | 3..20 | Virgin (z 17..25), Last Judgement (z 34..42), St Anne (z 51..59) | -4 stepped (archivolts step in 1 per 2 courses) | `cut_sandstone`, `chiseled_sandstone` tympana |
| String course | 21..22 | | +1 | `smooth_sandstone_stairs` |
| Gallery of Kings | 23..28 | 28 niches, 1 wide every 2nd cell z 12..64, each a statue (`chiseled_sandstone` + `sandstone_wall` head) under a trefoil (`smooth_sandstone_stairs` upside-down) | niche -1 | |
| String course | 29 | | +1 | |
| Rose stage | 30..46 | WEST ROSE centred (x 2, y 39, z 38), radius 6, in a square frame z 31..45; on each tower two blind-arched lancets 3 wide (z 15..17 + 23..25; z 51..53 + 59..61), y 32..45 | rose -1, lancets -1 | |
| Grand Gallery | 47..57 | slab cornice 47; open colonnade y 48..56 of `sandstone_wall` colonnettes every 2nd cell across z 10..66 at x 2 (tower walls behind at x 4); top cornice 57 | open, 2 deep | |
| Chimera gallery | 57..58 | balustrade + gargoyle/chimera blocks at the tower corners | | |
| Towers | 58..95 | each face (W, N/S, E) two tall belfry lancets 3 wide, y 62..86, louvred; clasping corner buttresses +1 to y 93 | openings -2 | louvres `spruce_trapdoor` open, dark |
| Top | 95..97 | flat lead deck, openwork parapet | | `sandstone_wall` + `cut_sandstone_slab` coping |

## MATERIALS (`$MCD blocks --check` OK for all except `chain`, which is the correct 1.21.1 id but the toolkit's registry calls it `iron_chain`: so NO chain anywhere; use `iron_bars` / `end_rod`)

| Role | Block |
|---|---|
| Wall body (~60%) | `smooth_sandstone` |
| Dressed trim, jambs, string courses | `cut_sandstone`, `cut_sandstone_slab`, `smooth_sandstone_stairs`, `smooth_sandstone_slab` |
| Carved detail (tympana, gargoyles, kings, gablet apexes) | `chiseled_sandstone` |
| Weathered stone accent (~10%, lower courses and pier faces) | `sandstone`, `sandstone_stairs` |
| Tracery, colonnettes, balustrades, pinnacle shafts | `sandstone_wall` |
| Pale light-stone accent (rose tracery, finials, flyer copings optional) | `end_stone_bricks`, `end_stone_brick_wall` |
| Plinth / base | `stone_bricks`, `cracked_stone_bricks`, `smooth_stone` |
| Lead roofs (body) | `deepslate_tile_stairs` 70% + `polished_deepslate_stairs` 30%; full blocks `deepslate_tiles` / `polished_deepslate`; ridge `deepslate_tile_slab`; ridge crest `iron_bars` |
| Spire | `deepslate_tiles`, `polished_deepslate`, ribs `deepslate_tile_wall`, crockets `deepslate_tile_stairs`; apostles `oxidized_copper` + `oxidized_cut_copper_slab`; rooster tip y 137 `lightning_rod` (copper) on an `end_rod` mast |
| Stained glass (lancets) | `blue_stained_glass_pane` 60%, `purple_stained_glass_pane` 20%, `red_stained_glass_pane` 20% |
| Rose windows | full `blue_stained_glass` field, `red_stained_glass` / `magenta_stained_glass` ring, `end_stone_brick_wall` spokes |
| Belfry louvres | `spruce_trapdoor` (open) over `black_stained_glass_pane` |
| Doors | `dark_oak_door` |
| Dusk light | interior glow 2 behind every window and rose: `shroomlight`; floodlights: `ochre_froglight` set flush in the ground course at the foot of every pier on the south flank and the chevet (and every 6 along the west and north); `lantern` on every pier set-off at y 20 (standing) and hung under the tower corbels |
| Ground strip inside the footprint | `smooth_stone` paving 1 wide along the walls, else leave the ground as found |

## OPENINGS (shell leaves them as AIR; glazing parts fill them)

| Opening | Coordinates | Size |
|---|---|---|
| West portal, Last Judgement | x 2..6 (recess), door plane x 6, z 35..41, y 3..14; trumeau z 38 | 7 wide x 12 + pointed arch to y 20 |
| West portal, Virgin / St Anne | door plane x 6, z 19..23 / z 53..57, y 3..12 | 5 x 10, arch to y 18 |
| South transept portal | door plane z 66, x 93..95, y 3..11 | 3 x 9, arch to y 17 |
| North transept portal | door plane z 10, x 93..95, y 3..11 | 3 x 9 |
| Porte Rouge (north choir) | z 10, x 122..123, y 3..8 | 2 x 6 |
| Sacristy door | z 107, x 141..143, y 1..5 | 3 x 5 |
| Chapel windows (nave + choir, both sides) | every bay: x p+3..p+6, y 6..17, glass plane z 65 (S) / z 11 (N) | 4 x 12 pointed |
| First nave bay (x 23..31) | x 25..28, y 6..17 | same |
| Tribune lancets | every bay x p+3 and p+6, y 26..28, plane z 58 / 18 | 1 x 3 |
| Clerestory | every bay x p+3..p+6, y 38..45, plane z 48 / 28; the mullion (`sandstone_wall`) is added later at x p+4..p+5 from y 38 to 43, so two lights under one pointed head | 4 x 8 |
| Transept triforium | x 88..100 odd x, y 28..31, plane z 66 / 10 | 1 x 4 each |
| South / north rose | disc radius 6 about (94, 40), plane z 66 (S) / z 10 (N) | 13 across |
| West rose | disc radius 6 about (y 39, z 38), plane x 3 | 13 across |
| Tower belfry lancets | each face, 2 per face: W face z 14..16 + 24..26 (N tower), z 50..52 + 60..62 (S tower), y 62..86, plane x 4; N/S/E faces same offsets | 3 x 25 |
| Radiating chapel windows | centred on each chapel face, 3 wide, y 5..16 | 3 x 12 |
| Apse clerestory | centred on each of the 5 facets, 3 wide, y 38..45 | 3 x 8 |
| Ambulatory tribune | each facet 1 x 3 at y 26..28 | |
| Sacristy | south and east faces, 2 wide x 5, y 5..9, every 4 | |

## RESERVED (shell leaves empty; a later part builds there)

| Cells | For |
|---|---|
| Flyer zones: x p, z 51..64 (S) / 12..25 (N), y 33..46, for every nave and choir pier; the 6 chevet radial lines r 12..26, y 33..46 | flying buttresses (and the sky under them: nothing else may go here) |
| Pier pinnacles x p..p+1, y 39..47 above every pier | pinnacles |
| Gallery of Kings niches: x 2, z 12..64 even z, y 23..27 | statues |
| Grand Gallery x 2..3, z 10..66, y 48..56 | colonnade |
| Rose discs (3) and the portal recesses | tracery + glass, archivolts |
| Spire: x 90..98, z 34..42, y 48..137 (roofs R1/R2 stop round it) | spire drum + needle |
| Apostle stations: on R1 west/east slopes and R2 north/south slopes, 3 cells each, stepping 1 down per cell from the drum, y 50..56 | statues |
| Gargoyles: one cell at y 47, 2 out from every clerestory buttress | gargoyles |
| Floodlight cells: the ground course at each pier foot, 1 out from the pier face | `ochre_froglight` |
| Chapel gablets: y 18..25 in front of every chevet chapel window | wimpergs |

## FLOORS (exterior-only build; interior only as far as it glows through glass)

| Mass | Floor y | Interior volume |
|---|---|---|
| Nave + choir (vessel) | 3 | x 23..151, z 29..47, y 3..44 (vault apex 44) |
| Tribunes | 21 | z 19..26 / 50..57, y 21..30 |
| Outer aisles / chapels | 3 | z 12..16 / 60..64, y 3..19 |
| Transept | 3 | x 87..101, z 11..65, y 3..44 |
| Apse / ambulatory | 3 / 21 (tribune ring) | r 0..10 apse, r 12..25 ambulatory |
| Towers | 3, 30 (rose-stage chamber), 57 (gallery), 62 (belfry), 95 (roof deck) | x 4..20, z 12..28 / 48..64 |
| Sacristy | 2 | each block's inside, ceiling y 14 (main hall to 24) |
| Light | shroomlight 2 behind each window/rose so glass glows at dusk; every walkable roof/deck/gallery and the ground strip lit to 8+ (lanterns on set-offs and parapets) |

## PALETTE (the architect's MATERIALS by role, ids exact; all checked with `$MCD blocks --check`, valid in 1.21.1; NO `chain` anywhere)

| Role | Full | Stairs | Slab | Wall / other |
|---|---|---|---|---|
| Wall body (~60%) | `smooth_sandstone` | `smooth_sandstone_stairs` | `smooth_sandstone_slab` | |
| Dressed trim, jambs, string courses | `cut_sandstone` | `smooth_sandstone_stairs` | `cut_sandstone_slab` | |
| Carved detail (tympana, kings, gargoyles, apexes) | `chiseled_sandstone` | | | |
| Weathered accent (~10%, low courses, pier faces) | `sandstone` | `sandstone_stairs` | `sandstone_slab` | |
| Tracery, colonnettes, balustrades, pinnacle shafts | | | | `sandstone_wall` |
| Light-stone accent (rose spokes, finials) | `end_stone_bricks` | `end_stone_brick_stairs` | `end_stone_brick_slab` | `end_stone_brick_wall` |
| Plinth | `stone_bricks` (+1/10 `cracked_stone_bricks`), top course `smooth_stone` | `stone_brick_stairs` | `smooth_stone_slab` | |
| Lead roofs | `deepslate_tiles`, `polished_deepslate` | `deepslate_tile_stairs` 70% / `polished_deepslate_stairs` 30% | `deepslate_tile_slab` (ridge), `polished_deepslate_slab` | crest `iron_bars` |
| Spire | `deepslate_tiles`, `polished_deepslate` | `deepslate_tile_stairs` (crockets) | `deepslate_tile_slab` | ribs `deepslate_tile_wall`, `polished_deepslate_wall`; inner frame `stripped_dark_oak_log` |
| Apostles | `oxidized_copper` | `oxidized_cut_copper_stairs` | `oxidized_cut_copper_slab` (head) | |
| Rooster tip / mast | | | | `lightning_rod` (tip, y 137), `end_rod` (mast, cross arms) |
| Lancet glass | | | | `blue_stained_glass_pane` 60%, `purple_stained_glass_pane` 20%, `red_stained_glass_pane` 20% |
| Rose glass | `blue_stained_glass` field, `red_stained_glass` / `magenta_stained_glass` ring, `yellow_stained_glass` eye | | | spokes `end_stone_brick_wall` |
| Belfry | | | | `spruce_trapdoor` (open) over `black_stained_glass_pane` |
| Doors | | | | `dark_oak_door` (both halves), lintel `cut_sandstone` |
| Dusk light | `shroomlight` (behind glass), `ochre_froglight` (floodlights flush in the ground) | | | `lantern` (standing and hanging) |
| Ground strip | `smooth_stone` | | `smooth_stone_slab` | |

## VOCABULARY (helpers in vocab.mjs; every one takes the grid `g` first; faces are "north"/"south"/"east"/"west" = the way the wall looks out)

Conventions: `mirrorN(z) = 76 - z`. A helper writes only its own cells and never fills a RESERVED cell owned by another part. Stairs: `facing` = the high/back side; "upside-down" = `half: "top"`.

1. `plinthCourse(g, x0, z0, x1, z1, { top = 3 })`: from the local ground (GROUND map, per 5x5 cell) up to `top-1`: `stone_bricks` with 1 in 10 `cracked_stone_bricks` (hash of x,z,y, not random), the course at `top-1` `smooth_stone`; on the faces it stands 1 proud of the wall above (caller passes the outer box). Never floats, never buries.
2. `ashlarWall(g, box, { face })`: solid `smooth_sandstone`; below y 12 every 10th cell `sandstone` (deterministic hash); corners as quoins (`cut_sandstone` every other course). Openings are carved by NOT placing (recess by exclusion).
3. `lancet(g, { x, z, y0, w, h, face, depth = 1 })`: a pointed window opening left as AIR, `w` wide, `h` tall incl. head; jambs `cut_sandstone` both sides, sill `smooth_sandstone_slab` (top) under it, head: for w ≥ 3 the top two rows narrow by 1 each side under upside-down `smooth_sandstone_stairs` facing into the opening (a pointed arch); for w = 1 a single `smooth_sandstone_stairs` upside-down cap. The glass plane is `depth` behind the outer face. w = 4 clerestory: mullion `sandstone_wall` in the middle two cells from y0 to y0+h-3 (added by P4).
4. `setoffPier(g, { x, z0, z1, y0, setoffs: [[zFace, yTop], ...], face })`: a 2-wide (x x..x+1) buttress pier in `smooth_sandstone` with `sandstone` on ~1/8 of its face cells; at each set-off the cell row above the step gets `smooth_sandstone_stairs` (bottom, facing back to the wall) as a weathering. South flank: setoffs [[69,20],[68,30],[67,38]] from the wall at z 65..66; north = mirror. Ochre floodlight cell left free 1 out at the foot.
5. `radialPier(g, { angle, r0 = 27, r1 = 33, y0 = 3 })`: the chevet pier variant: 2 wide tangentially along the radius at `angle` about C = (152, 38), set-offs at r1 (to y 20), r1-1 (to y 30), r1-2 (to y 38); weatherings as `setoffPier`.
6. `polarWall(g, { r0, r1, a0 = -90, a1 = 90, y0, y1, block })`: every cell whose distance from C (cell centre) is in [r0, r1] and angle in [a0, a1] filled, x ≥ 152 only; leaves the opening cells listed by the caller as air.
7. `polygonWall(g, { verts, y0, y1, thick = 2 })`: straight-segment wall (Bresenham, thickened inward) along the apse half-decagon vertices.
8. `radialChapel(g, { angle, rIn = 26, rOut = 29, width = 7, y0 = 3 })`: a box chapel `smooth_sandstone`, 7 wide tangentially, walls 1 thick, its outer face with one `lancet` 3 x 12 (y 5..16); roof R6: a little gable of `deepslate_tile_stairs`, ridge pointing out radially, eave 20 → ridge 24, `deepslate_tile_slab` ridge; corner pinnacles (`pinnacle` small: 1x1 `sandstone_wall` y 21..25, `end_stone_brick_wall` 26).
9. `stoneGable(g, { axis, at, from, to, eaveY, peakY, face })`: triangular masonry gable, `smooth_sandstone`, raked edge capped by `smooth_sandstone_stairs` facing in (crockets: every 2nd rake cell a `sandstone_wall` stub on top), finial `end_stone_brick_wall` + `end_rod` at the peak.
10. `flankBay(g, { p, side })`: one bay of the flank shell between pier p and p+8 (side "S"/"N", mirror by z): outer aisle wall z 65..66 y 3..18 with the chapel `lancet` x p+3..p+6 y 6..17 (glass plane z 65); tribune wall z 58..59 y 21..31 with two 1x3 lancets at x p+3 and p+6 y 26..28; clerestory wall z 48..49 y 3..47 with a 4x8 lancet x p+3..p+6 y 38..45; inner floor slabs: tribune floor y 20 z 50..57 (`smooth_sandstone`). Interior otherwise air.
11. `leanTo(g, { x0, x1, zLow, zHigh, yLow, yHigh })`: shed roof, `deepslate_tile_stairs` (70%) / `polished_deepslate_stairs` (30%, hash) facing up-slope (toward the clerestory), rising 1 per cell row, a full `deepslate_tiles` course under each stair course so it is watertight; gutter edge `smooth_sandstone_slab`. Leaves the pier/flyer cells x p (flyer zone) untouched where they cross.
12. `leanToPolar(g, { r0, r1, yLow, yHigh })`: the same lean-to round the apse: each cell's height from its radius, stairs facing toward C (nearest of the 4 facings).
13. `apseRoof(g)`: R3: cells r ≤ 11 about C (x ≥ 152): height = 59 - floor(r) clamped ≥ 48, top cell a `deepslate_tile_stairs` facing toward C, `deepslate_tiles` under; the 5 hip lines along the vertex directions in `polished_deepslate_stairs`; `iron_bars` crest ring on the parapet y 48; cross at (152, 60..62, 38): `end_stone_brick_wall` 60..61, `end_rod` 62.
14. `ridgeCrest(g, { x0, x1, z, y })`: `iron_bars` every other cell along a ridge line (on top of the ridge slab).
15. `leadDeck(g, box, y = 95)`: flat `polished_deepslate` deck, `deepslate_tiles` border course.
16. `balustrade(g, { cells, y, posts = 4 })`: a run of `sandstone_wall` with `end_stone_brick_wall` posts every `posts`; the pierced parapet.
17. `stringCourse(g, { cells, y, face, block = "smooth_sandstone_stairs" })`: one course 1 proud, upside-down stairs facing the wall.
18. `corbelTable(g, { cells, y = 46, face })`: upside-down `smooth_sandstone_stairs` 1 proud facing the wall, every other cell a `cut_sandstone` corbel; then cornice y 47 `cut_sandstone_slab` (top) 1 proud.
19. `pinnacle(g, { x, z, y0 = 39, size = 2 })`: size 2: 2x2 `smooth_sandstone` shaft y0..y0+3, four `smooth_sandstone_stairs` gablets (bottom, facing in) on the shaft top ring at y0+3, then 1x1 `sandstone_wall` y0+4..y0+7, finial `end_stone_brick_wall` y0+8 (=47 for y0 39). size 1: `sandstone_wall` shaft + `end_stone_brick_wall` tip.
20. `flyer(g, { p, side })`: the nave/choir flyer at x p. South: z 64→51, top (coping) y by z: 64:36 63:37 62:37 61:38 60:39 59:39 58:40 57:41 56:42 55:42 54:43 53:44 52:44 51:45. At each z: coping `smooth_sandstone_stairs` (bottom, facing north = toward the clerestory) at the top y where the next z is 1 higher, else `smooth_sandstone_slab`/full block on level runs; one `smooth_sandstone` body under it; at z 64, 63, 52, 51 a second body cell; the lowest cell of every column an upside-down `smooth_sandstone_stairs` facing outward (south) for the curved soffit. Everything below that stays AIR (the sky under the arch). North = mirror z' = 76 - z, stairs facing south.
21. `flyerRadial(g, { angle })`: the same section along the radius at `angle` about C, from r 27 (top y 36) to r 11 (top y 45), cells by Bresenham from the pier's inner face to the apse vertex buttress; stairs facing toward C (nearest axis facing).
22. `wallButtress(g, { x, z, y0 = 37, y1 = 47, face })`: 2-wide strip 1 proud on the clerestory wall (z 50 S / z 26 N), `smooth_sandstone`, its top cell `cut_sandstone`; receives the flyer.
23. `gargoyle(g, { x, z, y = 47, face })`: `chiseled_sandstone` 1 out from the wall buttress, `sandstone_stairs` upside-down 2 out (the snout), facing back toward the wall.
24. `roseWindow(g, { center: [a, y, b], plane, r = 6, glass = true })`: in plane x = const (west) or z = const (transepts): disc r: `blue_stained_glass`; ring r-1..r `red_stained_glass` with every 3rd `magenta_stained_glass`; eye r ≤ 1 `yellow_stained_glass`; 12 spokes along the 12 directions (and the inner circle at r 3) `end_stone_brick_wall`; outer ring r+1 `chiseled_sandstone`; square `cut_sandstone` frame to the plan's frame box, spandrels `sandstone_wall`. `glass: false` (P1/P4 frame only) leaves the disc air. Small 3x3 rose on gables: r 1.
25. `portal(g, { at, face, w, h, archTop, rings = 3, trumeau })`: pointed opening; each archivolt ring 1 deeper, ring jambs `cut_sandstone`, ring heads upside-down `smooth_sandstone_stairs`; door plane at the back: `dark_oak_door` pairs (lower+upper, same facing out, hinges mirrored), lintel `cut_sandstone`, tympanum above it `chiseled_sandstone` (centre column `end_stone_bricks`), trumeau `sandstone_wall` + `chiseled_sandstone` statue head.
26. `wimperg(g, { centre, face, w, yBase, yApex })`: a steep open gable in front of a window/portal: rakes `smooth_sandstone_stairs` (bottom, facing in) stepping up 1 per cell, `sandstone_wall` crocket stub on each rake cell every 2nd, apex `chiseled_sandstone` + `end_stone_brick_wall`. Stands on the jamb tops, 1 proud of the wall.
27. `kingNiche(g, { z, y0 = 23 })`: at x 2: statue `chiseled_sandstone` y0..y0+2 at x 3 (niche -1), head `sandstone_wall` y0+3, hood (trefoil) upside-down `smooth_sandstone_stairs` y0+4 at x 2 facing east. x 2 left air beside the statue column below the hood.
28. `colonnade(g, { x = 2, z0 = 10, z1 = 66, y0 = 48, y1 = 56, step = 2 })`: `sandstone_wall` colonnettes every 2nd z, upside-down `smooth_sandstone_stairs` heads at y1 forming little arches, cornices `cut_sandstone_slab` at 47 (bottom) and 57 (top).
29. `belfryLancet(g, { box, face })`: a 3 x 25 opening 2 deep (P1 leaves air); P3/P6 set `black_stained_glass_pane` in the back plane and `spruce_trapdoor` (open, facing out) louvres every 2nd course in the front plane; head as `lancet`.
30. `octagonRing(g, { cx = 94, cz = 38, y, w, cut, block, hollow = true })`: one course of an octagon w wide, corners cut `cut` (≈ w/3); hollow keeps a 1-thick ring.
31. `crocket(g, { cx, cz, y, w })`: on the 8 arrises of an octagon of width w at course y: `deepslate_tile_stairs` (bottom, facing in) pointing out diagonally (use the nearest axis).
32. `spireTip(g)`: y 125..133 `polished_deepslate_wall` 1x1; y 131 cross arms `end_rod` (axis x) at x 93 and 95 and (axis z) at z 37 and 39; y 134..136 `end_rod` (facing up) mast; y 137 `lightning_rod` (facing up) at (94, 137, 38): exactly here, nothing above.
33. `apostle(g, { x, y, z, facing })`: `oxidized_copper` body at y, `oxidized_cut_copper_slab` (bottom) head at y+1; stands on the roof stair below it (replace that roof cell with `deepslate_tiles` so it stands on a full block).
34. `glazeLancet(g, { cells, plane })`: fills an opening's glass plane with panes: by hash 60% `blue_stained_glass_pane`, 20% `purple_…`, 20% `red_…`, the top row always `purple`; pane connection states set by the toolkit's pane helper.
35. `glowBehind(g, { cells, inward, d = 2 })`: one `shroomlight` 2 cells inside each window (one per 2 cells of window width, at mid-height), floating free in the void is OK only if it stands on an interior floor; otherwise set it into the inner face of the wall's opposite side or a `smooth_sandstone` bracket under it.
36. `floodlight(g, { x, z })`: `ochre_froglight` replacing the ground/paving block at the cell (flush, top face at the ground level), 1 out from a pier foot.
37. `pierLantern(g, { x, y, z })`: `lantern` (hanging: false) standing on a set-off's top face (y 21 at the y 20 set-off) or a parapet post.
38. `paveStrip(g, { cells })`: `smooth_stone` at ground level 1 wide along the walls inside the footprint, every 7th a `smooth_stone_slab`-free full block (no slabs on the walk line).

## ROOMS

None: exterior only (exterior.txt). The interior volumes in FLOORS are a void lit by `glowBehind` so the glass glows; no furniture, no designers. The main entrance is the Last Judgement portal (west front, door plane x 6, z 35..41, y 3..14): a player stands at [5, 3, 38] in the portal recess, coming level from the parvis at [0, 3, 38] (the recess floor is flush with the ground, no steps).

## PARTS (build order; each one trade's work where possible)

1. **P1 Masonry shell** (`parts/shell.mjs`, mason): every mass M1..M21 except the spire (M22/M23): plinths (`plinthCourse`), walls (`ashlarWall`, `flankBay` tiled over nave p 23..80 and choir p 104..144 both sides, plus the first nave bay x 23..31 window x 25..28), transept walls and stone gables (`stoneGable`, peaks 57; west gable M4 peak 63), apse (`polygonWall`), ambulatory rings (`polarWall`), five chapels' walls (`radialChapel` wall half), sacristy blocks, stair turret (`octagonRing` stacked y 2..50), towers hollow to y 95 with intermediate floors (30, 57, 62, 95) and the west portal base M5. ALL piers with set-offs (`setoffPier` both flanks, transept front buttresses M10, four west buttresses, `radialPier` x6, sacristy buttresses). Every OPENING as air with jambs/heads (`lancet`, `belfryLancet`, `portal` void only, `roseWindow` frame with `glass:false`), every RESERVED cell untouched. Ticks: Massing, piers, plinth, openings, reveals.
2. **P2 Lead roofs** (`parts/roofs.mjs`, roofer): R1 and R2 and R8 via `$MCD roof` style gable (roof.json; lead mix materials above; overhang 0 on R1/R2, 1 on R8; `keep` = the spire box x 90..98 z 34..42 y 48..137, every flyer zone, pinnacle cells and the apostle stations), then by hand: R3 `apseRoof`, R4 `leanTo` z 50..59 (S) / 17..26 (N) and `leanToPolar` r 12..19, R5 `leanTo` z 60..66 / 10..16 and `leanToPolar` r 19..26, R6 chapel gables (`radialChapel` roof half), R7 `leadDeck` both towers, the turret cone (y 51..54 `deepslate_tile_stairs`), `ridgeCrest` on R1 (y 60, x 23..89 and 99..152) and R2 (y 58). Ticks: all Roofs.
3. **P3 West front and towers** (`parts/westfront.mjs`, stone carver): the three `portal`s with doors, `kingNiche` x28 (even z 12..64), string courses y 21..22 and 29 (`stringCourse`), west `roseWindow` (glass true), tower blind lancets (`lancet` y 32..45), `colonnade` (Grand Gallery), chimera `balustrade` y 57..58 + `gargoyle` at the 8 tower corners, `belfryLancet` fills (louvres + black panes) on all 4 faces of both towers, tower parapets `balustrade` y 96..97 and 2x2 corner pinnacles to y 97 (flat: nothing higher), hanging lanterns under the y 57 cornice at each buttress. Ticks: West front.
4. **P4 Flanks, transept faces and chevet relief** (`parts/relief.mjs`, stonemason/buttress specialist; the hero work): `flyer` at every nave and choir pier both sides (24), `flyerRadial` x6, `wallButtress` + `gargoyle` at each, `pinnacle` on every pier (y 39..47) and on the transept buttresses (55..60), `stringCourse` y 19 + `balustrade` y 20 on the aisle walls and the ambulatory, `corbelTable` + cornice + parapet `balustrade` y 46..48 along the clerestory and round the apse, clerestory mullions (`sandstone_wall` x p+4..p+5 y 38..43), transept faces: `portal`s (S z 66, N z 10, doors) with `wimperg` to y 26, triforium lancets, south and north `roseWindow` (glass true) with the gable's small rose, chevet chapel `wimperg`s y 18..25 and their corner pinnacles. Ticks: Relief, Transept faces, Chevet details.
5. **P5 Spire and apostles** (`parts/spire.mjs`, leadworker/spire carpenter): drum `octagonRing` y 50..70 (w 9, cut 2) in `polished_deepslate` with `deepslate_tiles` bands every 5, a 1x3 lancet opening on each of the 8 faces y 58..66 (air + `glazeLancet` red/blue), `deepslate_tile_wall` ribs on the arrises, gablets on each face at y 67..70 (`deepslate_tile_stairs`); needle stages 7/5/3 (`octagonRing` hollow, `deepslate_tiles` + `polished_deepslate` alternating courses), `crocket` every 3 courses, `spireTip` (tip exactly (94,137,38)); 12 `apostle`s: A x 100 z 43,44,45 feet y 55,54,53 facing south; B x 88 same z/y facing south; C z 48 x 99,100,101 feet y 53,52,51 facing east; D z 28 x 89,88,87 feet y 53,52,51 facing west. Ticks: Spire.
6. **P6 Glass, light and ground** (`parts/finish.mjs`, glazier + lamplighter): `glazeLancet` in every window plane (chapels z 65/11, tribunes z 58/18, clerestory z 48/28, transept triforium, apse, chapel, sacristy windows, ambulatory tribune), `glowBehind` behind each window and rose, `floodlight` at every south and chevet pier foot (1 out) and every 6 along west and north, `pierLantern` on every south/chevet pier set-off at y 21 and every 4th parapet post at y 49 (gutter walk) and y 21 (aisle balustrade), lanterns on the tower decks' parapet posts (y 98 forbidden: put them standing ON the deck at y 96 inside the parapet), `paveStrip` round the walls. Then `$MCD light` / `$MCD check` until no walkable dark cell. Ticks: Glass, light, ground; doors already by P3/P4.

### Parts checklist
- [x] P1 Masonry shell
- [x] P2 Lead roofs
- [x] P3 West front and towers
- [x] P4 Flanks, transept faces and chevet relief
- [x] P5 Spire and apostles
- [x] P6 Glass, light and ground

## NOTES for workers

- Stay on `#` cells of the FOOTPRINT and under y 139; the rooster `lightning_rod` at (94, 137, 38) is the highest block of the build. x 0..4 is OUT at z 5..9 and z 65..69: the tower front corners start at x 5 there.
- North = mirror: write the south side and call the same helper with `side: "N"` (z' = 76 - z, stair facings north↔south). The hero is SOUTH and EAST: if time runs short, finish south + chevet before north.
- Recess by exclusion: never carve a niche by burying a block behind a fill; just don't place the front cell.
- Sky under every flyer: no lean-to, pinnacle or lantern may go into a flyer zone (x p, z 51..64 / 12..25, y 33..46, and the 6 radial lines). The lean-to roofs (P2) must stop at the flyer's cell column only where the flyer actually is (below y 33 the roof is continuous).
- Cells: `chain` does not exist in the toolkit registry (it calls it `iron_chain`, which is NOT a 1.21.1 id): use neither. Hang lanterns from a block (`hanging: true` under a slab or cornice).
- Footings to the ground: GROUND gives the rock top per 5x5 cell (west 3, centre 2, east 1, sacristy 0-1); plinth from there up to y 2, never a float. Run `$MCD check build.nbt` after each part.
- The spire box x 90..98 z 34..42 y 48..137 belongs to P5: P2's roofs stop round it, valleys closed with `deepslate_tiles` against the drum.
- Pane states: use the toolkit's pane/glazing helper so panes connect (no thin posts). Doors: both halves, facing out.
- P1 (shell): the nave's last bay x 80..84 is plain wall (no windows: pier 80 sits there); first nave bay window at x 27..30 (flankBay p 24), x 23 plain. Apse clerestory windows are left as air without jambs/heads. Transept portals: 2 rings (step 2) in the 2-thick wall. Sacristy walls from y 2 (plinth to y 1), windows y 6..10, door x 141..143 y 2..6. Turret octagon w 4 about (106.5, 70.5). Holes (openings/RESERVED) kept by a grid view in parts/shell.mjs, never as stored air.
