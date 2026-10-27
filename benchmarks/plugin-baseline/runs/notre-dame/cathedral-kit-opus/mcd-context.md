# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
- [ ] P1 Masonry shell
- [ ] P2 Lead roofs
- [ ] P3 West front and towers
- [ ] P4 Flanks, transept faces and chevet relief
- [ ] P5 Spire and apostles
- [ ] P6 Glass, light and ground

## NOTES for workers

- Stay on `#` cells of the FOOTPRINT and under y 139; the rooster `lightning_rod` at (94, 137, 38) is the highest block of the build. x 0..4 is OUT at z 5..9 and z 65..69: the tower front corners start at x 5 there.
- North = mirror: write the south side and call the same helper with `side: "N"` (z' = 76 - z, stair facings north↔south). The hero is SOUTH and EAST: if time runs short, finish south + chevet before north.
- Recess by exclusion: never carve a niche by burying a block behind a fill; just don't place the front cell.
- Sky under every flyer: no lean-to, pinnacle or lantern may go into a flyer zone (x p, z 51..64 / 12..25, y 33..46, and the 6 radial lines). The lean-to roofs (P2) must stop at the flyer's cell column only where the flyer actually is (below y 33 the roof is continuous).
- Cells: `chain` does not exist in the toolkit registry (it calls it `iron_chain`, which is NOT a 1.21.1 id): use neither. Hang lanterns from a block (`hanging: true` under a slab or cornice).
- Footings to the ground: GROUND gives the rock top per 5x5 cell (west 3, centre 2, east 1, sacristy 0-1); plinth from there up to y 2, never a float. Run `$MCD check build.nbt` after each part.
- The spire box x 90..98 z 34..42 y 48..137 belongs to P5: P2's roofs stop round it, valleys closed with `deepslate_tiles` against the drum.
- Pane states: use the toolkit's pane/glazing helper so panes connect (no thin posts). Doors: both halves, facing out.
```

### elements.md

```markdown
# Notre-Dame de Paris: REQUIRED ELEMENTS (checklist)

Coordinates are plan.md's (plot 0; axis along x, west low x, chevet high x, south = high z = the river/camera).
North mirrors south: z(north) = 76 - z(south). "Part" = the generator module; "vocab" = plan.md VOCABULARY helper.
Exterior only: the inside is a lit void that glows through the glass.

## Massing (P1 shell, parts/shell.mjs)
- [ ] **Two west towers, flat tops at y 95, parapet 96..97** (M1 x 2..22 z 10..30; M2 z 46..66). Hollow smooth_sandstone walls 2 thick, clasping corner buttresses +1 to y 93, stepped corner at z 10..11 / 65..66 starting x 5. Vocab `ashlarWall`, `plinthCourse`, `setoffPier`.
- [ ] **Facade centre** M3 x 2..22 z 31..45 y 3..57, west portal base M5 x 2..8 (7 thick), nave west gable M4 (stone gable, peak y 63 at z 38). Vocab `ashlarWall`, `stoneGable`.
- [ ] **Nave + choir clerestory** M6/M11 x 23..152 z 27..49 y 3..47, walls 2 thick (z 27..28 / 48..49). Vocab `ashlarWall` tiled by `flankBay`.
- [ ] **Tribunes** M7/M12 z 17..26 / 50..59 y 3..31 and **outer aisles + chapels** M8/M13 z 10..16 / 60..66 y 3..20. Vocab `flankBay`.
- [ ] **Transept** M9 x 85..103 z 9..67 y 3..47 with stone gable ends to y 57; front buttresses M10 x 85..87 / 101..103 at z 68..69 / 7..8. Vocab `stoneGable`, `setoffPier`.
- [ ] **Apse** half-decagon M14 (vertices (152,49) (158,47) (162,41) (162,35) (158,29) (152,27)); **ambulatory rings** M15 (r 11..19, y ≤31) and M16 (r 19..26, y ≤20) about C = (152, 38). Vocab `polarWall`, `polygonWall`.
- [ ] **Five radiating chapels** M17 at angles 0, ±36, ±72 (Lady chapel face x 181 z 35..41; (174,22)/(174,54); (160,12)/(160,64)), y 3..20. Vocab `radialChapel`.
- [ ] **Sacristy** M18-M20 (gallery x 122..142 z 70..79; west wing x 115..134 z 80..99; main hall x 135..149 z 80..107, buttresses to z 110), y 1..16 / 26. Vocab `ashlarWall`, `setoffPier`.
- [ ] **South-east stair turret** M21 x 105..108 z 67..72 y 2..50 octagonal, cone 51..54. Vocab `octagonRing`.
- [ ] **Plinth** every footing down to the local ground: stone_bricks + ~1/10 cracked_stone_bricks to y 2, smooth_stone top course, +1 proud. Vocab `plinthCourse`.
- [ ] **Every OPENING left as air** (portals, chapel/tribune/clerestory windows, roses, belfry lancets, apse/chapel windows, sacristy windows) and every RESERVED cell untouched.

## Relief (the point: P1 piers; P4 the rest)
- [ ] **Outer piers (culées)** nave p = 32..80 step 8, choir p = 112..144 step 8, x p..p+1, z 65..69 (S) / 7..11 (N), y 3..38, set-offs: face z 69 to y 20, z 68 to y 30, z 67 to y 38, each set-off capped by `smooth_sandstone_stairs` weathering facing out. P1, vocab `setoffPier`.
- [ ] **Six chevet piers** at -90, -54, -18, +18, +54, +90° (plan.md coordinates), same set-offs radially. P1, vocab `setoffPier` (radial variant `radialPier`).
- [ ] **Pier pinnacles** above every pier, x p..p+1 z 66..67 (S) / 9..10 (N), y 39..47: 2x2 smooth_sandstone shaft 39..42 with four `smooth_sandstone_stairs` gablets at 42, 1x1 `sandstone_wall` spirelet 43..46, `end_stone_brick_wall` finial 47. P4, vocab `pinnacle`.
- [ ] **Flying buttresses (nave+choir, both sides)**: one block thick at x p, z 64→51 (S) / 12→25 (N); top course y per plan.md table (36 at z 64 → 45 at z 51), `smooth_sandstone_stairs` coping (facing toward the clerestory, climbing), `smooth_sandstone` body, upside-down stair underside; 2 deep at both ends, 1 deep mid-span; air below (≥4 sky above the lean-to roofs). P4, vocab `flyer`.
- [ ] **Six chevet flyers**: radial, r 27 (y 36) → r 11 (y 45), Bresenham cells along the angle, same section. P4, vocab `flyerRadial`.
- [ ] **Clerestory wall buttresses** x p..p+1 at z 50 (S) / 26 (N), y 37..47, 1 proud; apse vertex buttresses at the 6 polygon corners. P4, vocab `wallButtress`.
- [ ] **Gargoyles** one per clerestory buttress at y 47: `chiseled_sandstone` at z 51 + `sandstone_stairs` snout at z 52 (facing back toward the wall, i.e. upside-down stair pointing out). Mirror north z 25/24. P4, vocab `gargoyle`.
- [ ] **String course y 19 + balustrade y 20** along the outer aisle walls and the ambulatory ring; **corbel table y 46, cornice y 47, pierced parapet y 48** along the clerestory and the apse. P4, vocab `stringCourse`, `corbelTable`, `balustrade`.
- [ ] **Window reveals**: every window 1 recessed with `cut_sandstone` jambs, pointed head of upside-down `smooth_sandstone_stairs`, `smooth_sandstone_slab` sill. P1 (shape left as air with jambs), vocab `lancet`.

## Roofs (P2, parts/roofs.mjs)
- [ ] **Nave+choir lead roof** R1 one gable x 23..152, eave 48, ridge 59 at z 38, `iron_bars` crest y 60, stops round the spire box x 90..98 z 34..42. `$MCD roof` gable + lead mix; vocab `leadCourse`, `ridgeCrest`.
- [ ] **Transept roof** R2 ridge along z, ridge 57 at x 94, valleys into R1. `$MCD roof` gable.
- [ ] **Apse roof** R3 five hipped facets rising to y 59 at (152,38); ridge cross `end_stone_brick_wall` + `end_rod` at x 152 y 60..62. Vocab `apseRoof`.
- [ ] **Tribune lean-tos** R4 (32→37) and **aisle lean-tos** R5 (21→25), straight along the flanks and polar round the apse. Vocab `leanTo`, `leanToPolar`.
- [ ] **Chapel roofs** R6 small radial gables 20→24. Vocab `radialChapel` (roof half).
- [ ] **Tower decks** R7 flat `polished_deepslate` at y 95. Vocab `leadDeck`.
- [ ] **Sacristy roofs** R8 gables with overhang 1 and `smooth_sandstone_stairs` verge.

## West front (P3, parts/westfront.mjs)
- [ ] **Three deep portals** (Virgin z 17..25, Last Judgement z 34..42 with trumeau z 38, St Anne z 51..59), archivolts stepping in 1 per 2 courses, `chiseled_sandstone` tympana, `dark_oak_door` pairs at x 6. Vocab `portal`.
- [ ] **Gallery of Kings** y 23..28, 28 niche statues at x 2, even z 12..64. Vocab `kingNiche`.
- [ ] **West rose** centre (x 2, y 39, z 38) r 6, in square frame z 31..45. Vocab `roseWindow`.
- [ ] **Blind lancets** each tower y 32..45. Vocab `lancet`.
- [ ] **Grand Gallery** open colonnade y 48..56 x 2..3 z 10..66, cornices 47 and 57. Vocab `colonnade`.
- [ ] **Chimera gallery** balustrade y 57..58 + chimeras at the tower corners. Vocab `balustrade`, `gargoyle`.
- [ ] **Belfry lancets** 2 per face 3 x 25 (y 62..86), louvred. Vocab `belfryLancet`.
- [ ] **Openwork parapet + corner pinnacles** y 96..97 (none higher). Vocab `balustrade`.
- [ ] **Four facade buttresses** to x 0 (+2), y 3..57. Vocab `setoffPier`.

## Transept faces (P4)
- [ ] **South rose** (hero) and north rose: disc r 6 about (94, 40), plane z 66 / 10, square frame x 87..101, pierced spandrels. Vocab `roseWindow`.
- [ ] **Transept portals** (Saint-Étienne S, Cloître N) x 91..97 with wimperg to y 26. Vocab `portal`, `wimperg`.
- [ ] **Triforium lancets** odd x 88..100, y 28..31. Vocab `lancet`.
- [ ] **Transept gables** crocketed rakes, small rose 3x3 y 51..53, finial y 57..58. Vocab `stoneGable`, `roseWindow` (r 1).
- [ ] **Transept buttress pinnacles** y 55..60. Vocab `pinnacle`.

## Chevet details (P4)
- [ ] **Chapel windows under gablets**: each chapel window 3 x 12 (y 5..16) with a wimperg rising to y 25 in front, `chiseled_sandstone` apex, corner pinnacles y 21..26. Vocab `wimperg`, `pinnacle` (small).

## Spire (P5, parts/spire.mjs)
- [ ] **Spire drum** M22 x 90..98 z 34..42 y 50..70, octagon (corners cut 2), tall lancets on each face. Vocab `octagonRing`.
- [ ] **Needle** M23 centred (94, 38): 7 wide y 71..85, 5 wide 86..105, 3 wide 106..124, 1 wide 125..133; ribs `deepslate_tile_wall` on the arrises; crockets every 3 courses. Vocab `octagonRing`, `crocket`.
- [ ] **Cross arms** y 131, mast `end_rod` 134..136, **rooster tip `lightning_rod` at (94, 137, 38)** = the highest block. Vocab `spireTip`.
- [ ] **Apostles** 4 groups of 3 on the roof slopes y 51..56. Vocab `apostle`.

## Glass, light, ground (P6, parts/finish.mjs)
- [ ] **Stained glass** every lancet (`blue` 60 / `purple` 20 / `red` 20 % panes), rose fields full blocks. Vocab `glazeLancet`, `roseWindow` (glass).
- [ ] **Glow behind glass**: `shroomlight` 2 cells behind every window and rose. Vocab `glowBehind`.
- [ ] **Floodlights** `ochre_froglight` flush in the ground course 1 out from every south/chevet pier foot; every 6 on west and north. Vocab `floodlight`.
- [ ] **Lanterns** standing on every pier set-off at y 20 (south + chevet), hanging under tower corbels, on parapets so every walkable deck/gallery/gutter is ≥ 8. Vocab `pierLantern`.
- [ ] **Paving strip** `smooth_stone` 1 wide along the walls. Vocab `paveStrip`.
- [ ] **Belfry louvres** `spruce_trapdoor` (open) over `black_stained_glass_pane`. Vocab `belfryLancet` (fill).
- [ ] **Doors** `dark_oak_door` pairs in every portal (west 3, transept 2, Porte Rouge, sacristy).
```

### rooms.json

```json
{"entrance":[5,3,38],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "wall body": ["smooth_sandstone", "smooth_sandstone_stairs", "smooth_sandstone_slab"],
    "dressed trim": ["cut_sandstone", "cut_sandstone_slab"],
    "carved detail": ["chiseled_sandstone"],
    "weathered accent": ["sandstone", "sandstone_stairs", "sandstone_slab"],
    "tracery": ["sandstone_wall"],
    "light stone": ["end_stone_bricks", "end_stone_brick_stairs", "end_stone_brick_slab", "end_stone_brick_wall"],
    "plinth": ["stone_bricks", "cracked_stone_bricks", "smooth_stone", "stone_brick_stairs", "smooth_stone_slab"],
    "lead roofs": ["deepslate_tiles", "polished_deepslate", "deepslate_tile_stairs", "polished_deepslate_stairs", "deepslate_tile_slab", "polished_deepslate_slab", "iron_bars"],
    "spire": ["deepslate_tile_wall", "polished_deepslate_wall", "stripped_dark_oak_log"],
    "apostles": ["oxidized_copper", "oxidized_cut_copper_stairs", "oxidized_cut_copper_slab"],
    "lancet glass": ["blue_stained_glass_pane", "purple_stained_glass_pane", "red_stained_glass_pane"],
    "rose glass": ["blue_stained_glass", "red_stained_glass", "magenta_stained_glass", "yellow_stained_glass"],
    "belfry": ["black_stained_glass_pane"],
    "dusk light": ["shroomlight", "ochre_froglight"]
  },
  "objects": ["dark_oak_door", "spruce_trapdoor", "lantern", "lightning_rod", "end_rod"]
}
```

### make.sh

```sh
#!/usr/bin/env bash
# Makes build.nbt from scratch: build.mjs writes a temp file, moved into place only when the build succeeds.
set -euo pipefail
cd "$(dirname "$0")"
tmp=".build.$$.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
echo "wrote build.nbt"
```

### build.mjs

```js
// Notre-Dame de Paris (plan.md): lays the ground under the plot, runs the six parts in plan.md's order, saves.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file, then moves it to build.nbt)
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, groundAt } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");
process.chdir(fileURLToPath(new URL(".", import.meta.url)));   // palette.json / roof.json / parts-report.json live here

// The parts in build order; a module not written yet is skipped (never a failure), so make.sh works in any copy.
const PARTS = [
  ["P1 Masonry shell", "./parts/shell.mjs"],
  ["P2 Lead roofs", "./parts/roofs.mjs"],
  ["P3 West front and towers", "./parts/westfront.mjs"],
  ["P4 Flanks, transept faces and chevet relief", "./parts/relief.mjs"],
  ["P5 Spire and apostles", "./parts/spire.mjs"],
  ["P6 Glass, light and ground", "./parts/finish.mjs"],
];

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

// The ground (brief GROUND map): the value is the walking level, so solid earth fills y 0..ground-1 (grass on top);
// at the west (3) the plinth tops out flush, at the chevet (1) it shows 1-2 courses.
for (let x = 0; x < SITE_SIZE[0]; x++) for (let z = 0; z < SITE_SIZE[2]; z++) {
  const top = groundAt(x, z);
  for (let y = 0; y < top; y++) g.set(x, y, z, y === top - 1 ? "grass_block" : "dirt");
}

const list = [];
for (const [name, file] of PARTS) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${name}: ${file} not written yet, skipped`); continue; }
  const mod = await import(pathToFileURL(path).href);
  list.push([name, mod.build]);
}

runParts(g, list, { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json), plan.md site coordinates, the GROUND map, a seeded rng.

// ---- palette (bare ids, exactly palette.json's; the build library adds minecraft:) ----

// ---- palette (bare ids, exactly palette.json's; the build library adds minecraft:) ----
export const SMOOTH_SANDSTONE = "smooth_sandstone";                    // wall body (~60%)

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";      // wall body (~60%)

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";          // wall body (~60%)

export const CUT_SANDSTONE = "cut_sandstone";                          // dressed trim, jambs, string courses

export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";                // dressed trim, jambs, string courses

export const CHISELED_SANDSTONE = "chiseled_sandstone";                // carved detail: tympana, kings, gargoyles, apexes

export const SANDSTONE = "sandstone";                                  // weathered accent (~10%, low courses, pier faces)

export const SANDSTONE_STAIRS = "sandstone_stairs";                    // weathered accent (~10%, low courses, pier faces)

export const SANDSTONE_SLAB = "sandstone_slab";                        // weathered accent (~10%, low courses, pier faces)

export const SANDSTONE_WALL = "sandstone_wall";                        // tracery, colonnettes, balustrades, pinnacle shafts

export const END_STONE_BRICKS = "end_stone_bricks";                    // light-stone accent: rose spokes, finials

export const END_STONE_BRICK_STAIRS = "end_stone_brick_stairs";        // light-stone accent: rose spokes, finials

export const END_STONE_BRICK_SLAB = "end_stone_brick_slab";            // light-stone accent: rose spokes, finials

export const END_STONE_BRICK_WALL = "end_stone_brick_wall";            // light-stone accent: rose spokes, finials

export const STONE_BRICKS = "stone_bricks";                            // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)

export const CRACKED_STONE_BRICKS = "cracked_stone_bricks";            // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)

export const SMOOTH_STONE = "smooth_stone";                            // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)

export const STONE_BRICK_STAIRS = "stone_brick_stairs";                // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";                  // plinth (stone_bricks + 1/10 cracked, smooth_stone top course)

export const DEEPSLATE_TILES = "deepslate_tiles";                      // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)

export const POLISHED_DEEPSLATE = "polished_deepslate";                // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";          // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)

export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs";  // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";              // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)

export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";      // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)

export const IRON_BARS = "iron_bars";                                  // lead roofs (stairs 70% tile / 30% polished; slab ridge; iron_bars crest)

export const DEEPSLATE_TILE_WALL = "deepslate_tile_wall";              // spire ribs and inner frame

export const POLISHED_DEEPSLATE_WALL = "polished_deepslate_wall";      // spire ribs and inner frame

export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";          // spire ribs and inner frame

export const OXIDIZED_COPPER = "oxidized_copper";                      // apostles: copper body, slab head

export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs"; // apostles: copper body, slab head

export const OXIDIZED_CUT_COPPER_SLAB = "oxidized_cut_copper_slab";    // apostles: copper body, slab head

export const BLUE_STAINED_GLASS_PANE = "blue_stained_glass_pane";      // lancet glass (blue 60 / purple 20 / red 20)

export const PURPLE_STAINED_GLASS_PANE = "purple_stained_glass_pane";  // lancet glass (blue 60 / purple 20 / red 20)

export const RED_STAINED_GLASS_PANE = "red_stained_glass_pane";        // lancet glass (blue 60 / purple 20 / red 20)

export const BLUE_STAINED_GLASS = "blue_stained_glass";                // rose glass: blue field, red/magenta ring, yellow eye

export const RED_STAINED_GLASS = "red_stained_glass";                  // rose glass: blue field, red/magenta ring, yellow eye

export const MAGENTA_STAINED_GLASS = "magenta_stained_glass";          // rose glass: blue field, red/magenta ring, yellow eye

export const YELLOW_STAINED_GLASS = "yellow_stained_glass";            // rose glass: blue field, red/magenta ring, yellow eye

export const BLACK_STAINED_GLASS_PANE = "black_stained_glass_pane";    // belfry panes behind open spruce trapdoors

export const SHROOMLIGHT = "shroomlight";                              // dusk light: shroomlight behind glass, ochre_froglight floodlights

export const OCHRE_FROGLIGHT = "ochre_froglight";                      // dusk light: shroomlight behind glass, ochre_froglight floodlights

export const DARK_OAK_DOOR = "dark_oak_door";                          // doors (both halves)

export const SPRUCE_TRAPDOOR = "spruce_trapdoor";                      // belfry louvres (open)

export const LANTERN = "lantern";                                      // standing and hanging lanterns

export const LIGHTNING_ROD = "lightning_rod";                          // rooster tip at (94,137,38)

export const END_ROD = "end_rod";                                      // spire mast and cross arms

// ---- site (plan.md SITE) ----
export const SITE_SIZE = [189, 140, 111];                            // plot 0: x 0..188, y 0..139, z 0..110

export const FLOOR_Y = 3;                                            // interior floor and plinth top everywhere

export const AXIS_Z = 38;                                            // nave axis; north mirrors south about it

export const mirrorZ = (z) => ...

export const CELL = 5;                                               // footprint/GROUND cell size (col c = x 5c..5c+4)

export const WEST_FRONT_X = 2;                                       // west front plane (towers x 2..22)

export const CHEVET_CENTRE = [152, 38];                              // apse polar centre C (x, z); chevet at x >= 152

export const CROSSING_X = 94;                                        // transept axis / R2 ridge row

export const SPIRE_BOX = { from: [90, 48, 34], to: [98, 137, 42] };  // RESERVED for P5 (x, y, z inclusive)

export const SPIRE_TIP = [94, 137, 38];                              // lightning_rod: the build's highest block

export const EAVE_Y = 48;                                            // R1/R2 eave (behind the parapet)

export const RIDGE_R1_Y = 59;                                        // nave + choir ridge (row z 38)

export const RIDGE_R2_Y = 57;                                        // transept ridge (row x 94)

export const TOWER_TOP_Y = 95;                                       // tower roof decks; parapet 96..97

export const ENTRANCE = [5, 3, 38];                                  // player in the Last Judgement portal recess

// FOOTPRINT (brief, '#' = build here): row r = z 5r..5r+4, col c = x 5c..5c+4.
export const FOOTPRINT = [

/** inFootprint(x, z): true when the cell's 5x5 column is a '#' of the FOOTPRINT. */
export const inFootprint = (x, z) => ...

// GROUND (brief): rock top y per 5x5 cell ('.' = no reading: null).
export const GROUND = [

/** groundAt(x, z): the rock top y at a block column; a '.' cell takes its nearest read cell (0 if none). */
export function groundAt(x, z)

// ---- rng ----
/** rng(seed): a seeded generator (mulberry32) returning floats in [0, 1); the same seed gives the same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// plan.md VOCABULARY helpers 1, 5, 9, 13, 17, 21, 25, 29, 33, 37: plinthCourse, radialPier, stoneGable, apseRoof,
// stringCourse, flyerRadial, portal, belfryLancet, apostle, pierLantern. Every one takes the grid `g` first and its
// position (and face) as arguments; it writes only its own footprint and only into air unless { overwrite: true }.
// Each returns { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for a write onto a non-air cell,
// off the grid, or refused by a guard. Block ids are literals from plan.md's PALETTE.
// Polar helpers work about C = (152, 38) (cell centres); angle 0 points east (+x), +90 south (+z), -90 north.

/** The ground (first air y) at a block column; a '.' cell takes the highest of its nearest read cells (0 if none). */
export function groundAt(x, z)

/**
 * 1. Plinth over the outer box x0..x1, z0..z1 (the caller passes the box 1 proud of the wall above): from the local
 * ground (GROUND map; `ground` = a number or (x, z) => y overrides it) up to top-1, `stone_bricks` with 1 in 10
 * `cracked_stone_bricks` (cell hash), the course at top-1 `smooth_stone`. Only into air, so it never buries the ground
 * and, starting at the ground, never floats. Where the ground is already at `top` it writes nothing.
 */
export function plinthCourse(g, x0, z0, x1, z1, { top = 3, ground = groundAt, overwrite = false } = {})

/**
 * 5. A chevet pier on the radius at `angle` about `centre` (C): 2 wide tangentially (the centreline cell and the next
 * one clockwise-of-outward, so +-90 deg is x 152..153), radial r0..r1. Set-offs: the outer row r1 to y 20, r1-1 to y 30,
 * the rest to y 38; `smooth_sandstone`, `sandstone` on ~1/8 of its face cells; weatherings as setoffPier:
 * `smooth_sandstone_stairs` (bottom, facing back toward C) at yTop+1 on each stepped-back row, the topmost (the
 * pinnacle's, y 39) skipped unless capTop. South (angle >= 0) is drawn and the north one is its mirror z' = 2C.z - z.
 */
export function radialPier(g, { angle, r0 = 27, r1 = 33, y0 = 3, centre = C, steps = [20, 30, 38], capTop = false, overwrite = false })

/**
 * 9. A triangular masonry gable. axis "x": the gable spans x from..to in the wall plane z = at; axis "z": spans z
 * from..to in x = at; `thick` layers go inward from `at` (away from `face`, the way it looks out). `smooth_sandstone`
 * from eaveY up under the rake; the rake cells `smooth_sandstone_stairs` facing in (toward the peak); a `sandstone_wall`
 * crocket stub on every 2nd rake cell; at the peak column(s) masonry to peakY-1, finial `end_stone_brick_wall` at
 * peakY and `end_rod` (up) at peakY+1. Footprint: from..to x eaveY..peakY+1 x the thick layers.
 */
export function stoneGable(g, { axis, at, from, to, eaveY, peakY, face, thick = 1, overwrite = false })

/**
 * 13. R3, the apse roof: the cells x >= C.x within r of C. Ring r-1 < d <= r is the parapet line: an `iron_bars` crest at
 * the eave y (48). Inside it each cell rises to h = peak - floor(d) (>= eave): `deepslate_tiles` from the eave to h-1, a
 * `deepslate_tile_stairs` at h facing toward C; the hip lines (rays to the half-decagon's vertices `verts`) in
 * `polished_deepslate_stairs`; the centre cell a full `deepslate_tiles` at the peak, and over it the ridge cross
 * `end_stone_brick_wall` peak+1..peak+2 and `end_rod` (up) at peak+3 (= (152, 60..62, 38)).
 */
export function apseRoof(g, { centre = C, r = 11, peak = 59, eave = 48, cross = true,

/**
 * 17. One string course on the wall-face cells [x, z] (or [x, z, face] for a turning run such as the ambulatory), 1 proud
 * at y: upside-down `block` stairs facing the wall (a non-stairs `block` goes in as a full block).
 */
export function stringCourse(g, { cells, y, face, block = "smooth_sandstone_stairs", overwrite = false })

/**
 * 21. A chevet flying buttress on the radius at `angle` about C, one block thick: Bresenham cells from rFrom (26, just
 * inside the pier's inner face r 27) to rTo (12, against the apse wall r 11), the nave flyer's coping profile (y 36 at
 * the pier -> 45 at the apse) resampled over them. Each column: the coping (`smooth_sandstone_stairs` bottom facing
 * toward C where the next column is higher, else a bottom `smooth_sandstone_slab`), one `smooth_sandstone` body under
 * it (two at the 2 cells of each end), then an upside-down `smooth_sandstone_stairs` soffit facing outward. Air below.
 */
export function flyerRadial(g, { angle, rFrom = 26, rTo = 12, centre = C, tops = FLYER_TOPS, overwrite = false })

/**
 * 25. A pointed portal recessed into a wall. at = [x, y, z]: the door plane's bottom centre cell (y = the sill/floor);
 * face = the way it looks out; w x h = the clear door opening (an even w puts its extra column clockwise of `face`);
 * archTop = the keystone y over the door plane. Planes k = 0..rings-1 step out from the door plane (k = rings-1 is the
 * wall's outer face): each is 2*step wider and its keystone 1 higher than the one behind; in each plane the jambs
 * (`cut_sandstone`, both sides, up to the head) and the pointed head (upside-down `smooth_sandstone_stairs`, back
 * against the jamb side, `cut_sandstone` keystone, `smooth_sandstone` spandrels up to the keystone row); the ring
 * planes' openings stay air. Door plane: `dark_oak_door` pairs at y, y+1 (both halves, facing out, hinges on the outer
 * sides), `cut_sandstone` lintel at y+2, `chiseled_sandstone` tympanum above it up to the head (centre column
 * `end_stone_bricks`); trumeau (true = the centre, or its world x/z) `sandstone_wall` at y, y+1 under a
 * `chiseled_sandstone` statue head at y+2. { cellsOnly: true } writes nothing (the shell's "void only" pass: leave
 * `box` out of the wall). Returns `box`: every cell of the portal, and `opening`: its air cells.
 */
export function portal(g, { at, face, w, h, archTop, rings = 3, step = 1, trumeau, cellsOnly = false, overwrite = false })

/**
 * 29. A belfry lancet: box = [x0, y0, z0, x1, y1, z1], the opening (3 wide x 25 tall x 2 deep; the deep axis is face's).
 * Frame (P1): `cut_sandstone` jambs just outside the box both sides, through both layers; sill y0-1 (`smooth_sandstone_slab`
 * top in the front layer, `smooth_sandstone` behind); head as `lancet`: the top two rows narrow by 1 each side, upside-down
 * `smooth_sandstone_stairs` (back against the jamb) on the lower row, `cut_sandstone` on the top row. Fill (P3/P6):
 * `black_stained_glass_pane` in every open cell of the back layer, `spruce_trapdoor` (open, facing out) louvres every
 * 2nd course (from y0) in the front layer. only: "frame" | "fill" picks one half (default both).
 */
export function belfryLancet(g, { box, face, only, overwrite = false })

/**
 * 33. A copper apostle at (x, y, z): `oxidized_copper` body at y, `oxidized_cut_copper_slab` (bottom) head at y+1. It
 * stands on a full block: the cell under it becomes `deepslate_tiles` (into air, or replacing a roof stair there unless
 * { replaceBelow: false }; a guard may still refuse it). facing is accepted for the caller's bookkeeping (the blocks
 * have none).
 */
export function apostle(g, { x, y, z, facing, replaceBelow = true, overwrite = false })

/**
 * 37. A standing `lantern` (hanging: false) at (x, y, z): on a set-off's top face (y 21 on the y 20 set-off) or a
 * parapet post. Placed only into air with a block under it (never on air): otherwise refused.
 */
export function pierLantern(g, { x, y, z, overwrite = false })
```

### vocab/h2.mjs

```js
// Named helpers from plan.md's VOCABULARY, group h2: ashlar walls, the polar (apse) walls, one flank bay, the ridge
// crest, the clerestory corbel table, the wall buttress, the wimperg, an octagon course, lancet glazing, the paving strip.
//
// Every helper takes the grid first, then its position (and facing where it has one), and returns
// { box, placed, refused }: its footprint box (inclusive corners), how many cells it wrote, and any write it left out.
// Writes stay inside the footprint and go only into air (an earlier part owns every other cell). paveStrip is the one
// exception: the strip IS the ground's surface course, so it replaces that cell (natural ground only).
// Faces are "north"/"south"/"east"/"west" = the way the wall looks out. Stairs: facing = the back (high) side.

/** 2. Solid smooth_sandstone wall; below y 12 every ~10th cell sandstone; the corner columns as quoins (cut_sandstone
 *  every other course). face (optional) keeps the quoins to the corners on that face. openings: cells/boxes left air. */
export function ashlarWall(g, box, { face, openings = [] } = {})

/** 6. Every cell with distance from C in [r0, r1] and angle in [a0, a1], x >= C.x, from y0 to y1, in `block`
 *  (default smooth_sandstone); `open` cells/boxes are left air. */
export function polarWall(g, { r0, r1, a0 = -90, a1 = 90, y0, y1, block = "smooth_sandstone", open = [], c = C })

/** 10. One bay of the flank shell between pier p and p+8 (cells x p..p+7), side "S" or "N" (N = mirror z' = 76 - z):
 *  outer aisle wall z 65..66 y 3..18 with the chapel lancet x p+3..p+6 y 6..17 (glass plane z 65); tribune wall
 *  z 58..59 y 21..31 with two 1x3 lancets at x p+3 and p+6 y 26..28 (plane z 58); clerestory wall z 48..49 y 3..47 with a
 *  4x8 lancet x p+3..p+6 y 38..45 (plane z 48); tribune floor y 20 z 50..57. Interior otherwise air. */
export function flankBay(g, { p, side = "S" })

/** 14. iron_bars every other cell along a ridge line, on top of the ridge slab: x0..x1 at z (or z0..z1 at x). */
export function ridgeCrest(g, { x0, x1, z, y, z0, z1, x })

/** 18. Corbel table on the wall-face cells [x, z] (or [x, z, face] for a turning run such as the apse), 1 proud:
 *  at y upside-down smooth_sandstone_stairs facing the wall, every other cell a cut_sandstone corbel; at y+1 the
 *  cornice cut_sandstone_slab (top), 1 proud. */
export function corbelTable(g, { cells, y = 46, face })

/** 22. A 2-wide strip 1 proud on the clerestory wall: (x, z) is its first proud cell (z 50 S / z 26 N); it runs 2
 *  along the wall (x..x+1 for a north/south face, z..z+1 for east/west), smooth_sandstone y0..y1-1, cut_sandstone top. */
export function wallButtress(g, { x, z, y0 = 37, y1 = 47, face })

/** 26. A steep open gable in front of a window/portal, standing 1 proud of the wall: centre = [x, z] on the wall's
 *  outer face, w wide (odd), from yBase (the jamb tops) to the apex at yApex. Rakes of smooth_sandstone_stairs
 *  (bottom, facing in) step inward up to the apex, a sandstone_wall crocket stub on every 2nd rake step, apex
 *  chiseled_sandstone + end_stone_brick_wall; the triangle between the rakes stays open. */
export function wimperg(g, { centre, face, w: width, yBase, yApex })

/** 30. One course of an octagon w wide about (cx, cz) (a .5 centre for an even width), corners cut `cut`;
 *  hollow keeps the 1-thick (watertight) ring. block: an id or [id, state]. */
export function octagonRing(g, { cx = 94, cz = 38, y, w: width, cut = Math.round(width / 3), block = "smooth_sandstone", hollow = true })

/** 34. Fill an opening's glass plane with panes: cells [x, y, z], or [a, y] with plane { z: n } (a = x) or { x: n }
 *  (a = z). By hash 60% blue, 20% purple, 20% red; the top row of each column always purple. Each pane connects to
 *  the panes beside it and to full blocks / glass (no thin posts). */
export function glazeLancet(g, { cells, plane = {} })

/** 38. smooth_stone paving 1 wide along the walls: cells [x, z] (the surface found as the top of the ground, the
 *  first solid run from the bottom) or [x, y, z]. All full blocks, no slabs on the walk line. The strip replaces the
 *  ground's surface cell (natural ground only: never plinth, wall or a floodlight). */
export function paveStrip(g, { cells })
```

### vocab/h3.mjs

```js
// plan.md VOCABULARY helpers 3, 7, 11, 15, 19, 23, 27, 31, 35: lancet, polygonWall, leanTo, leadDeck, pinnacle,
// gargoyle, kingNiche, crocket, glowBehind. Every one takes the grid `g` first and its position (and face) in an
// options object; it writes only its own footprint and only into air unless { overwrite: true }. Each returns
// { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for a write onto a non-air cell, off the grid,
// or refused by a guard. Block ids are literals from plan.md's PALETTE.

/**
 * 3. Pointed lancet opening, left as AIR. (x, z) = the opening's first cell in the OUTER face plane (its lowest x on a
 * north/south wall, lowest z on an east/west one); the opening runs w cells along the wall from there, rows y0..y0+h-1
 * (head included). Jambs `cut_sandstone` both sides and a top `smooth_sandstone_slab` sill at y0-1, through the reveal
 * (d 0..depth-1) and the glass plane (d = depth, `depth` behind the outer face). Head: w >= 3 narrows the top two rows by
 * 1 each side under upside-down `smooth_sandstone_stairs`, their back against the jamb so the soffit slopes up to a point;
 * w = 2 one row; w = 1 one upside-down cap (back into the wall). Footprint: along -1..w, y y0-1..y0+h-1, d 0..depth.
 * With { overwrite: true } it cuts the opening through an existing wall (opening cells set to air). Returns `opening`:
 * the air cells per layer (the glass plane's are the glazier's cells).
 */
export function lancet(g, { x, z, y0, w, h, face, depth = 1, overwrite = false })

/**
 * 7. Straight-segment wall along `verts` ([[x, z], ...], an open polyline such as the apse half-decagon): each segment
 * rasterised (Bresenham) and thickened `thick` cells inward, toward `centre` (default C = (152, 38)), y0..y1, in `block`.
 * `skip(x, y, z)` returning true leaves that cell air (the caller's openings: recess by exclusion).
 */
export function polygonWall(g, { verts, y0, y1, thick = 2, centre = [152, 38], block = "smooth_sandstone", skip = () => ...

/**
 * 11. Shed roof over x0..x1, rising 1 per row from zLow (eave, y yLow) toward zHigh (y capped at yHigh):
 * `deepslate_tile_stairs` 70% / `polished_deepslate_stairs` 30% (hash) facing up-slope, a `deepslate_tiles` course
 * under each stair course; the eave row is the gutter, `smooth_sandstone_slab`. `keep` = boxes [x0, y0, z0, x1, y1, z1]
 * left untouched (the flyer zones x p, y 33..46: the roof runs on under them).
 */
export function leanTo(g, { x0, x1, zLow, zHigh, yLow, yHigh, keep = [], overwrite = false })

/** 15. Flat lead deck at y over box [x0, z0, x1, z1] (or a 6-number box, y ignored): `polished_deepslate`, a `deepslate_tiles` border course. */
export function leadDeck(g, box, y = 95, { overwrite = false } = {})

/**
 * 19. Pier pinnacle on the cells x..x+1, z..z+1 from y0 (size 2): `smooth_sandstone` shaft y0..y0+2, four
 * `smooth_sandstone_stairs` gablets (bottom, outer corners, backs toward the centre: a little pyramid) at y0+3,
 * `sandstone_wall` y0+4..y0+7 on (x, z), finial `end_stone_brick_wall` y0+8 (47 for y0 39).
 * size 1: one cell, `sandstone_wall` y0..y0+h-1 (h 5) and an `end_stone_brick_wall` tip on top.
 */
export function pinnacle(g, { x, z, y0 = 39, size = 2, h = 5, overwrite = false })

/**
 * 23. Gargoyle out of the wall buttress cell (x, y, z) toward `face`: `chiseled_sandstone` 1 out, the snout
 * `sandstone_stairs` upside-down 2 out, its back toward the wall. The buttress cell itself is not written.
 */
export function gargoyle(g, { x, z, y = 47, face, overwrite = false })

/**
 * 27. Gallery of Kings niche at z, front plane x (2), face west: the statue `chiseled_sandstone` y0..y0+2 and its head
 * `sandstone_wall` y0+3 one cell in (x 3: niche -1); the trefoil hood, upside-down `smooth_sandstone_stairs` facing
 * into the wall, at y0+4 in the front plane. The front cells beside the statue below the hood stay air.
 */
export function kingNiche(g, { z, y0 = 23, x = 2, face = "west", overwrite = false })

/**
 * 31. Crockets on the 8 arrises of an octagon w wide about (cx, cz) at course y (corners cut `cut`, as octagonRing):
 * one `deepslate_tile_stairs` (bottom) 1 out from each vertex cell along its nearest axis, back toward the spire.
 */
export function crocket(g, { cx, cz, y, w, cut = Math.max(1, Math.floor(w / 4)), overwrite = false })

/**
 * 35. Glow behind one window: `cells` = its glass-plane cells ([[x, y, z], ...] or a box [x0, y0, z0, x1, y1, z1]),
 * `inward` = the face pointing into the building. One `shroomlight` d cells in from the glass per 2 cells of window
 * width, at mid-height; where the cell under it is air a `smooth_sandstone` bracket goes under it (bracket: false skips).
 */
export function glowBehind(g, { cells, inward, d = 2, bracket = true, overwrite = false })
```

### vocab/h4.mjs

```js
// plan.md VOCABULARY helpers 4, 8, 12, 16, 20, 24, 28, 32, 36: setoffPier, radialChapel, leanToPolar, balustrade,
// flyer, roseWindow, colonnade, spireTip, floodlight. Every one takes the grid `g` first and its position (and face) in
// an options object; it writes only its own footprint and only into air unless { overwrite: true } (floodlight replaces
// the ground cell by definition). Each returns { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for
// a write onto a non-air cell, off the grid, or refused by a guard. Block ids are literals from plan.md's PALETTE.
// Polar helpers work about C = (152, 38); angle 0 points east (+x), +90 south (+z), -90 north.

/**
 * 4. A buttress pier `width` (2) wide, stepping back in set-offs. North/south face: the pier is x..x+1 and runs z0..z1
 * (wall end to the outer face); east/west face: pass { z, x0, x1 } and it is z..z+1 running x0..x1. setoffs [[face,
 * yTop], ...] = the outer face plane of each stage and its top, outermost first (south flank [[69,20],[68,30],[67,38]],
 * north [[7,20],[8,30],[9,38]]). `smooth_sandstone`, `sandstone` on ~1/8 of the cells; each set-off but the topmost (the
 * pinnacle stands there) gets a weathering at yTop+1 on its stepped-back row: `smooth_sandstone_stairs` (bottom, facing
 * back to the wall). The floodlight cell 1 out at the foot is not touched. Footprint: width x (z0..z1), y0..max yTop+1.
 */
export function setoffPier(g, { x, z, z0, z1, x0, x1, y0 = 3, setoffs, face, width = 2, capTop = false, overwrite = false })

/**
 * 8. A radiating chapel at `angle` about C: a box `width` (7) wide tangentially from rIn to rOut, walls 1 thick (its
 * inner end left open to the ambulatory), y0..19; its outer face pierced by one lancet 3 x 12 (y 5..16: air with
 * `cut_sandstone` jambs, a top `smooth_sandstone_slab` sill at y 4, the top row narrowed to 1 under upside-down stairs).
 * Roof R6 (y 20..24): a little gable of `deepslate_tile_stairs` rising to a ridge that points out radially, `deepslate_tiles`
 * under it, `deepslate_tile_slab` ridge at 24, the outer gable triangle in `smooth_sandstone`. Corner pinnacles (small) at
 * the two outer corners: `sandstone_wall` y 21..25, `end_stone_brick_wall` 26. { walls, roof, pinnacles } pick the halves
 * (P1 walls; P2 roof + pinnacles). Footprint: the cells within rIn-0.5..rOut+0.5 radially and |v| <= width/2, y y0..26.
 */
export function radialChapel(g, { angle, rIn = 26, rOut = 29, width = 7, y0 = 3, centre = C, walls = true, roof = true, pinnacles = roof, overwrite = false })

/**
 * 12. The lean-to round the apse: every cell x >= C.x (and angle a0..a1) whose distance from C (cell centre) is in
 * [r0, r1] gets a roof cell whose height falls from yHigh at r0 to yLow at r1: a stair facing C (nearest of the 4
 * facings), `deepslate_tile_stairs` 70% / `polished_deepslate_stairs` 30% by hash, a full `deepslate_tiles` course under
 * it; the outermost ring (r > r1 - 1) a `smooth_sandstone_slab` gutter at yLow. `keep(x, y, z)` returning true (the
 * radial flyer zones) leaves a cell untouched. Footprint: that ring, y yLow-1..yHigh.
 */
export function leanToPolar(g, { r0, r1, yLow, yHigh, a0 = -90, a1 = 90, centre = C, keep = () => ...

/**
 * 16. A pierced parapet: `sandstone_wall` along `cells` ([x, z] at y, or [x, y, z]), every `posts`-th one (from the first)
 * an `end_stone_brick_wall` post; neighbours joined by low arms. Footprint: exactly those cells.
 */
export function balustrade(g, { cells, y, posts = 4, overwrite = false })

/**
 * 20. A nave/choir flying buttress at x p, one block thick. side "S": z 64 -> 51 (plan.md's profile); "N": z' = 76 - z.
 * Each column: the coping at the profile's y (`smooth_sandstone_stairs` bottom facing the clerestory where the next
 * column is 1 higher, else a bottom `smooth_sandstone_slab`), one `smooth_sandstone` body under it (two at both ends: z
 * 64, 63, 52, 51), then an upside-down `smooth_sandstone_stairs` soffit facing outward. Air below. Footprint: x p, those
 * z, y from 2-4 below each top up to it.
 */
export function flyer(g, { p, side = "S", profile = FLYER_S, overwrite = false })

/**
 * 24. A rose window in a wall plane. center [x, y, z] (world); plane "x" = the disc lies in x = center[0] (west front),
 * "z" = in z = center[2] (transepts). d = distance from the centre cell: d <= 1 eye `yellow_stained_glass`; d <= r
 * field `blue_stained_glass`, ring r-1 < d <= r `red_stained_glass` (every 3rd `magenta_stained_glass`); 12 spokes (out from
 * the circle) and the circle d ~ 3 `end_stone_brick_wall` (r >= 3); outer ring r < d <= r+1 `chiseled_sandstone`; the square frame
 * (half side `frame`, default r+1; r 1 = the 3 x 3 gable rose) `cut_sandstone` on its border, `sandstone_wall` spandrels inside it. glass: false
 * leaves the disc (and its tracery) air: the shell's frame-only pass. Footprint: the square, one cell thick.
 */
export function roseWindow(g, { center, plane, r = 6, glass = true, frame = r <= 1 ? r : r + 1, overwrite = false })

/**
 * 28. The Grand Gallery: an open colonnade in the plane x along z0..z1. `sandstone_wall` colonnettes every `step` z
 * (from z0) y0..y1; between them at y1 an upside-down `smooth_sandstone_stairs` head (back into the facade) for the
 * little arches; cornices `cut_sandstone_slab` bottom at y0-1 and top at y1+1 the whole run. face = the way it looks
 * out (west). Footprint: x, z0..z1, y0-1..y1+1.
 */
export function colonnade(g, { x = 2, z0 = 10, z1 = 66, y0 = 48, y1 = 56, step = 2, face = "west", overwrite = false })

/**
 * 32. The spire tip at (x, z) (default (94, 38)): `polished_deepslate_wall` y0..y0+8 (125..133); at y0+6 (131) cross arms
 * `end_rod` at x-1 / x+1 (pointing along x) and z-1 / z+1 (along z); mast `end_rod` facing up y0+9..y0+11 (134..136);
 * the rooster `lightning_rod` facing up at y0+12 (137), nothing above. Footprint: x-1..x+1, z-1..z+1, y0..y0+12.
 */
export function spireTip(g, { x = 94, z = 38, y0 = 125, overwrite = false } = {})

/**
 * 36. A floodlight: `ochre_froglight` replacing the ground / paving block at (x, z), flush (its top face at the ground
 * level). y = that ground cell; without it, the topmost non-air cell of the column. Footprint: that one cell.
 */
export function floodlight(g, { x, z, y })
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
