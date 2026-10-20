# Seattle Center modern neighbours: KOMO Plaza East, KOMO Plaza West, Hyatt House, Aperture on Fifth

## SITE

- Four plots in a row along x, each on a flat 1-block ground of `smooth_stone` at y 0 (already laid). North = low z, east = high x. The street fronts are NORTH (z 0 side) and, for the two KOMO buildings, also EAST (5th Ave side).
- Ground floors are flush with the ground: the walking surface is y 1 (floor block y 0) everywhere, so every door is at y 1 with no step. No stairs or ramps to the street are needed.
- Every mass keeps to its footprint map (one map char = 4 x 4 blocks; col c, row r -> x = plot x0 + 4c, z = 4r). Cells marked "." stay open ground: paving (`smooth_stone`, already there), planters, trees, lamp posts only.
- Scale 1.4 blocks per metre. Storeys are 5 blocks (3.6 m), the ground storey 7.

### Plot 0: KOMO PLAZA EAST (x 0..104, z 0..124, max y 47)

| mass | x | y | z | notes |
|---|---|---|---|---|
| North office block (main body) | 4..103 | 0..38 | 4..47 | 6 storeys + parapet; corner x 4..7, z 4..7 stays open ground |
| Round glass drum (NW corner) | circle centre (13, 20), radius 11: x 2..24 | 0..41 | z 9..31 | full green curtain wall; merges into the block's west end |
| Drum crown canopy | ring radius 13 round (13, 20): x 0..26 | 42 | z 7..33 | one-block white ring overhanging the drum by 2; rail on it at y 43 |
| Drum penthouse | circle radius 7 round (13, 20) | 42..44 | | set back, green glass, flat white slab lid at y 44 |
| North bow (curved green-glass bay) | 48..75 | 0..38 | 0..4 | circular segment: chord on z 4, bulging to z 0 at x 60..63 (sagitta 4) |
| South wing | 56..103 | 0..33 | 48..115 | 5 storeys + parapet (roof slab y 32), the dish roof |
| West podium (step) | 44..55 | 0..13 | 48..59 | 2 storeys, roof slab y 12, parapet y 13 |
| South tail | 72..103 | 0..18 | 116..123 | 3 storeys, roof slab y 17, parapet y 18 |
| Plaza | x 0..55, z 60..124 and x 56..71, z 116..124 | 0 | | open ground: paving, planters, trees, a curved bench row |

### Plot 1: KOMO PLAZA WEST (x 105..151, z 0..61, max y 45)

| mass | x | y | z | notes |
|---|---|---|---|---|
| Office body | 109..144 | 0..38 | 12..51 | 6 storeys + parapet |
| North bow (half drum) | half circle centre (127, 14), radius 13: x 114..140 | 0..41 | z 1..14 | green curtain wall, the sister of East's drum |
| Bow crown canopy | half ring radius 14 round (127, 14): x 113..141 | 42 | z 0..14 | white ring, rail at y 43 |
| South podium | 105..151 | 0..13 | 52..61 | 2 storeys, roof slab y 12, parapet y 13 |
| Forecourt | x 105..113, z 0..51 and x 141..151, z 0..51 | 0 | | open ground, paving and planting |

### Plot 2: HYATT HOUSE (x 152..200, z 0..92, max y 44)

A wedge: its west face steps back diagonally in 4-block bays from the north tip to the south block, as on the map.

| mass | x | y | z |
|---|---|---|---|
| Wedge, tip | 192..199 | 0..38 | 8..11 |
| Wedge | 188..199 | 0..38 | 12..15 |
| Wedge | 184..199 | 0..38 | 16..19 |
| Wedge | 180..199 | 0..38 | 20..23 |
| Wedge | 176..199 | 0..38 | 24..31 |
| Wedge | 172..199 | 0..38 | 32..35 |
| Wedge | 168..199 | 0..38 | 36..39 |
| Wedge | 164..199 | 0..38 | 40..47 |
| Wedge | 168..199 | 0..38 | 48..55 |
| Wedge | 176..199 | 0..38 | 56..63 |
| South block | 152..199 | 0..38 | 64..91 |
| West annex | 152..171 | 0..18 | 56..63 (3 storeys, roof slab y 17) |
| Rooftop plant enclosure (south block) | 168..187 | 38..44 | 70..85 |
| Entrance court (open) | 172..175 north of the south block | 0 | 56..63 + x 152..167, z 0..55 west of the wedge (planted) |

All roof slabs of the wedge and south block are at y 37, parapet y 38.

### Plot 3: APERTURE ON FIFTH (x 201..250, z 0..52, max y 40)

| mass | x | y | z | notes |
|---|---|---|---|---|
| Apartment block (north part) | 201..248 | 0..38 | 2..35 | z 0..1 is the sidewalk arcade under the balconies |
| Apartment block (south part) | 201..248 | 0..38 | 36..51 | x 249..250 open ground (planter strip) |
| North balconies | bays listed in FACADES | 7..36 | 0..1 | project from the z 2 wall over the sidewalk |
| Roof terrace pergola | 210..225 | 38..40 | 10..25 | open frame on the roof deck |
| Stair/lift overrun | 230..237 | 38..40 | 20..27 | solid box |

## ROOFS

| building | form | height | notes |
|---|---|---|---|
| All flat roofs (KOMO E north block y 37, south wing y 32, podium y 12, tail y 17; KOMO W body y 37, podium y 12; Hyatt y 37, annex y 17; Aperture y 37) | flat deck with parapet: `$MCD roof` preset `modern` (parapet, `smooth_stone` coping, slim cornice, iron-bar rail) on each rect | parapet 1 above the slab | no overhang; the cornice is the white slab edge |
| KOMO E drum + KOMO W bow crowns | built BY HAND (the roof tool can't do a ring canopy): a flat ring of `smooth_quartz_slab` (top) at y 42 overhanging the glass by 2, `iron_bars` rail on its outer edge at y 43, a `smooth_quartz` slab lid at y 41 over the drum, and on East the set-back penthouse (green glass y 42..43, lid y 44) | 42..44 | the "flying-saucer" crown of the photo |
| North bow of KOMO E | flat, lid flush with the body roof y 37, parapet y 38 in white | | |
| Hyatt plant enclosure | screen walls of `iron_bars` y 38..43 on a `light_gray_concrete` kerb, a flat `smooth_stone_slab` lid y 44 | | hides rooftop plant |

Roofs meet by abutting: lower roofs stop against the taller wall, the taller wall continues down to its own floor; parapets run the whole perimeter of every roof.

### Satellite dishes (the broadcasting signature)

Each dish: pedestal 3 x 3 of `polished_andesite` 2 high on the deck, an `iron_block` yoke on it, a round bowl of `white_concrete` with a `smooth_quartz` rim, tilted about 30 degrees, the dish face looking SOUTH and up (+z), a feed arm of `iron_bars` with an `end_rod` tip from the bowl centre. Dishes are built by a part, never by the shell.

| dish | building | centre (x, z) | deck y | bowl diameter | top y |
|---|---|---|---|---|---|
| D1 | KOMO E north block | 40, 26 | 38 | 9 | 47 |
| D2 | KOMO E north block | 60, 20 | 38 | 7 | 45 |
| D3 | KOMO E north block | 82, 16 | 38 | 9 | 47 |
| D4 | KOMO E north block | 94, 36 | 38 | 7 | 45 |
| D5 | KOMO E north block | 34, 40 | 38 | 5 | 43 |
| D6 | KOMO E south wing | 68, 62 | 33 | 9 | 42 |
| D7 | KOMO E south wing | 90, 72 | 33 | 7 | 40 |
| D8 | KOMO E south wing | 70, 88 | 33 | 7 | 40 |
| D9 | KOMO E south wing | 92, 102 | 33 | 9 | 42 |
| D10 | KOMO E south tail | 88, 120 | 18 | 5 | 23 |
| D11 | KOMO E west podium | 50, 54 | 13 | 5 | 18 |
| W1 | KOMO W body | 120, 36 | 38 | 7 | 45 |
| W2 | KOMO W body | 136, 44 | 38 | 5 | 43 |
| W3 | KOMO W podium | 146, 57 | 13 | 5 | 18 |

## FACADES

### KOMO Plaza East and West (same language)

| band | y | what |
|---|---|---|
| Ground storey (glazed) | 1..6 | storefront glazing set back 2 from the footprint line on north and east faces; `light_gray_concrete` columns 2 x 2 on the footprint line every 8 blocks carry the floors over a covered walk; a dark band `gray_concrete` at y 6 behind a `smooth_quartz_slab` canopy lip at y 7 |
| Office storeys | slabs at y 7, 12, 17, 22, 27, 32 | horizontal RIBBON WINDOWS: rows slab+1..slab+3 glass, rows slab+4 and slab (the next one) solid `white_concrete`, so a 2-high white band runs between every pair of window ribbons |
| Pier rhythm | | in each ribbon, a 1-wide `light_gray_concrete` mullion pier every 7 blocks (6 glass, 1 pier), starting 1 in from each corner; corners are solid white 2 wide |
| Projecting fins | | on the north block's north face, every 14 blocks, a vertical `light_gray_concrete` fin 1 proud (in the 2-cell walk zone above the ground storey, y 7..36) |
| Parapet | 38 (13/18/33 on lower parts) | `white_concrete` with `smooth_stone_slab` coping (roof tool) |
| Green-glass drum / bows | 1..41 | `cyan_stained_glass` the full height, a `white_concrete` ring (1 thick, flush) at every floor slab y (7, 12, ... 37) and at y 41: the white horizontal lines of the photo. Ground storey of the drum: `glass` clear shopfront with the restaurant door |
| Curved-wall tower read | | KOMO E north bow: same green glass with white rings, so the north front reads white block / green bow / white block / green drum |
| Sign | | "KOMO 4" banner-letter sign on the north block's west end, north face, x 28..38, y 30..34 (sign writer); a blue-and-red square emblem at x 40..43, y 30..33 |

### Hyatt House

| band | y | what |
|---|---|---|
| Glazed lobby | 1..6 | full-height `glass` between `light_gray_concrete` columns 1 wide every 4 blocks, on the footprint line; `smooth_quartz_slab` canopy at y 7 projecting 0 (flush band) |
| Guest storeys | slabs 7..32 | regular PUNCHED windows 2 wide x 3 tall (rows slab+1..slab+3) every 4 blocks, between 2-wide piers; piers alternate `smooth_sandstone` (beige) and `light_gray_concrete` per bay column, spandrels `white_concrete` |
| Stepped west face | | each 4-wide step is one bay: one window in its west face, its north return solid beige; this sawtooth is the hotel's character |
| Top | 37..38 | `white_concrete` band + coping; rooftop plant screen (see ROOFS) |
| Sign | | "HYATT HOUSE" banner letters on the north face of the wedge tip band x 192..199 at y 33..36 is too narrow: use the south block's north face over the court, x 156..171, y 13..16 |

### Aperture on Fifth

| band | y | what |
|---|---|---|
| Shops | 1..6 | shopfronts on the north wall line z 2: `glass` in 9-wide bays between `polished_deepslate` piers 1 wide (piers at x 201, 211, 221, 231, 241, 248); fascia `black_concrete` at y 6; the sidewalk z 0..1 covered by the first balconies |
| Apartment storeys | slabs 7..32 | facade of 5-wide bays alternating DARK (`gray_concrete` frame with `polished_deepslate` spandrel) and LIGHT (`white_concrete`); each bay has a window 3 wide x 3 tall at rows slab+1..slab+3, centred |
| Balconies (north) | at every storey slab y (7, 12, 17, 22, 27, 32) | in the LIGHT bays only: a 5-wide x 2-deep balcony at z 0..1, floor `smooth_stone` at the slab y, rail `glass_pane` at slab+1 on its north and side edges, the window behind it a door-height glazed opening; staggered: odd storeys bays starting x 202, 222, 242; even storeys x 212, 232 |
| Other faces | | same bays, punched windows, no projecting balconies; recessed loggias 1 deep on the east face (x 248) in the light bays |
| Top | 37..38 | dark parapet `gray_concrete` with `smooth_stone_slab` coping |

## MATERIALS

All 1.21.1 (checked with `$MCD blocks --check`: all known).

| role | block |
|---|---|
| KOMO body / spandrel bands | `white_concrete` |
| KOMO piers, columns, fins | `light_gray_concrete` |
| KOMO ribbon glass | `gray_stained_glass_pane` (dark band against white) |
| Curtain wall (drum, bows) | `cyan_stained_glass` (reads teal-green; NOT green_stained_glass, which reads lime) |
| Curtain wall rings, crown canopy | `white_concrete` rings, `smooth_quartz_slab` canopy, `smooth_quartz` lids |
| Rails | `iron_bars` |
| Dishes | `white_concrete` bowl, `smooth_quartz` rim, `polished_andesite` pedestal, `iron_block` yoke, `iron_bars` + `end_rod` feed |
| Ground storey glazing (all) | `glass` |
| Hyatt panels | `smooth_sandstone` (beige), `light_gray_concrete` (grey), `white_concrete` spandrels |
| Hyatt windows | `light_blue_stained_glass_pane` |
| Aperture dark panels | `gray_concrete`, `polished_deepslate` |
| Aperture light panels | `white_concrete` |
| Aperture windows / rails | `glass_pane` |
| Aperture fascia | `black_concrete` |
| Copings, roof deck | `smooth_stone_slab`, `smooth_stone` |
| Ground (existing) | `smooth_stone`; planters `polished_andesite` kerb with `moss_block`/`azalea_leaves` |
| Interior floors | `polished_diorite` (offices), `birch_planks` (hotel, apartments) |
| Lighting | `sea_lantern` set flush in ceilings; `lantern` outside |
| Doors | `iron_door` pairs (glass-and-metal entrance read) |

## OPENINGS

All doors at y 1..2 (flush, no steps). Window rows follow FACADES; the shell builds glass in place (it is part of the wall), and leaves only the door cells as air.

| building | door | cells (x, z) | faces |
|---|---|---|---|
| KOMO E | drum lobby (main) | x 12..13, z 9 | north |
| KOMO E | north bow lobby | x 61..62, z 0 | north |
| KOMO E | east entrance | x 103, z 30..31 | east |
| KOMO E | south wing east | x 103, z 80..81 | east |
| KOMO E | plaza door (south wing west face) | x 56, z 90..91 | west |
| KOMO W | bow lobby | x 126..127, z 1 | north |
| KOMO W | east door | x 144, z 30..31 | east |
| Hyatt | main lobby (on the court) | x 172..175, z 64 (2 pairs) | north; glass canopy `smooth_quartz_slab` over x 170..177, z 60..63 at y 6 |
| Hyatt | tip entrance | x 195..196, z 8 | north |
| Aperture | shop doors | x 205..206, 215..216, 225..226, 235..236, 244..245 at z 2 | north |
| Aperture | residents' lobby | x 201, z 20..21 | west |

Windows: KOMO ribbons 6 wide x 3 tall per bay at every upper storey on every face; Hyatt 2 x 3 every 4 blocks; Aperture 3 x 3 centred in each 5-wide bay. Ground storeys: glazed full height y 1..5 between columns.

## RESERVED

The shell leaves these as air:

- KOMO E/W ground-storey colonnade: columns 2 x 2 on the footprint line, y 1..6, every 8 blocks (KOMO E north face z 4..5 at x 12, 20, ..., 100; east face x 102..103 at z 8, 16, ..., 112; KOMO W east face x 143..144 at z 16, 24, ..., 48). The column part builds them; the glazing stands 2 behind (z 6 / x 101 / x 142).
- KOMO E north-face fins: x 18, 32, 46, 78, 92 at z 3, y 7..36.
- Every dish cell (3 x 3 pedestal under each dish centre on the decks listed, and the bowl's volume above it): roof deck stays clear within 6 blocks of each dish centre (no plant, no rail through it).
- Drum crown ring y 42..43 and penthouse y 42..44 (KOMO E); bow crown y 42..43 (KOMO W).
- Aperture balconies: z 0..1 at the bays listed, every storey slab y; the shell leaves them for the balcony part.
- Hyatt court canopy x 170..177, z 60..63, y 6.
- Signs: KOMO E x 28..43, y 30..34 on the north face (the wall is built, letters go onto it, z 3); Hyatt x 156..171, y 13..16 at z 63.

## FLOORS

Floor blocks at the y below; the walkable surface is one above. Interior volume = inside the outer walls (walls 1 thick).

| building | storeys (floor y) | roof slab | interior volume |
|---|---|---|---|
| KOMO E north block + drum + bow | 0 (lobby, 6 clear), 7, 12, 17, 22, 27, 32 (4 clear each) | 37 | x 5..102, z 5..46 + drum + bow; drum continues to floor 37 as a round meeting room (glass, 3 clear to lid 41) |
| KOMO E south wing | 0, 7, 12, 17, 22, 27 | 32 | x 57..102, z 49..114 (studios on 0..12: two-storey broadcast studio x 60..99, z 60..100, floors 0 only, ceiling 12) |
| KOMO E podium | 0, 7 | 12 | x 45..55, z 49..58 |
| KOMO E tail | 0, 7, 12 | 17 | x 73..102, z 117..122 |
| KOMO W body + bow | 0, 7, 12, 17, 22, 27, 32 | 37 (bow 41) | x 110..143, z 13..50 + bow |
| KOMO W podium | 0, 7 | 12 | x 106..150, z 53..60 |
| Hyatt wedge + south block | 0 (lobby/breakfast), 7..32 (guest rooms, double-loaded corridor along the wedge's long axis) | 37 | inside each stepped rect, walls 1 thick |
| Hyatt annex | 0, 7, 12 | 17 | x 153..170, z 57..62 |
| Aperture | 0 (shops x 202..247, z 3..14; lobby + bike room behind), 7..32 (apartments round a central corridor z 25..26) | 37 | x 202..247, z 3..50 |

Vertical circulation (for the second designer): a lift-and-stair core per building, at KOMO E x 60..67, z 30..37; KOMO W x 124..131, z 36..43; Hyatt x 184..191, z 72..79; Aperture x 230..237, z 20..27 (the roof overrun). Light every floor with flush `sea_lantern`s in the ceiling at 6-block spacing and every roof deck with lanterns on the parapet every 8, so nothing spawns.

## PALETTE

Architect's ids kept exactly (see MATERIALS). Shape variants and extras (all checked with `$MCD blocks --check`; `polished_andesite_wall` does NOT exist, use `polished_andesite` blocks):

| role | block | variants |
|---|---|---|
| Body | `white_concrete` | none (concrete has no shapes); coping `smooth_stone_slab` |
| Piers/columns/fins | `light_gray_concrete` | |
| Ribbon glass | `gray_stained_glass_pane` | |
| Curtain wall | `cyan_stained_glass` | pane `cyan_stained_glass_pane` for the bow's thin edges only |
| Canopy / lids | `smooth_quartz`, `smooth_quartz_slab`, `smooth_quartz_stairs` | slab `type: top` for crown rings |
| Dish | `white_concrete`, `smooth_quartz`, `polished_andesite`, `polished_andesite_slab`, `iron_block`, `iron_bars`, `end_rod` | rim as `smooth_quartz_stairs` where the bowl steps |
| Glazing | `glass`, `glass_pane` | |
| Hyatt | `smooth_sandstone`, `smooth_sandstone_slab`, `light_gray_concrete`, `white_concrete`, `light_blue_stained_glass_pane` | |
| Aperture | `gray_concrete`, `polished_deepslate`, `white_concrete`, `black_concrete`, `glass_pane`, `smooth_stone` | balcony floor `smooth_stone_slab` |
| Floors / ceilings | `polished_diorite`, `birch_planks`; lights `sea_lantern` | |
| Doors | `iron_door` (both halves) | |
| Plant screens, rails | `iron_bars`, `iron_chain` | |
| Grounds | `smooth_stone`, `polished_andesite` kerb, `moss_block`, `azalea_leaves` (persistent true), `oak_log`/`oak_leaves` (persistent true), `oak_fence`, `lantern` | |
| Sign colours | `blue_concrete`, `red_concrete`, white/black banners | |
| Lift | `soul_sand`, `bubble_column` (drag false), `glass` | |

## VOCABULARY

- `ribbonBand(g, {x0,x1,z0,z1 or x,z, slab})`: along a wall run, rows slab+1..slab+3 `gray_stained_glass_pane` (connected states), rows slab+4 and slab+5 `white_concrete`; slab row itself `white_concrete`.
- `pierRhythm(g, run, {every:7, block:'light_gray_concrete', inset:1})`: replace one glass column per 7 with the pier over the glass rows; 2-wide solid white corners.
- `curtainDrum(g, {cx,cz,r,y0,y1,rings:[7,12,...,37,41], half:false, from, to})`: ring of `cyan_stained_glass` at radius r (Bresenham circle, 1 thick), `white_concrete` on ring ys; ground storey `glass`; `half` limits an arc.
- `crownRing(g, {cx,cz,r,y:42,rail:43,lid:41, half:false})`: filled annulus of top `smooth_quartz_slab` from r-2 to r (overhanging), `iron_bars` on the outermost cells at y+1, `smooth_quartz` lid disc inside.
- `dish(g, {cx,cz,deckY,d})`: pedestal 3x3 `polished_andesite` 2 high; `iron_block` yoke 1 above; bowl of d diameter as a stack of discs rising toward +z (each disc 1 z-row further south and 1 up every ~2 rows to give 30deg), `white_concrete` with `smooth_quartz` rim on the south/upper edge; from the bowl centre a 3-4 long `iron_bars` arm toward +z/up ending in `end_rod`. Must stay inside top y of the table.
- `colonnade(g, {run, every:8, y0:1,y1:6})`: 2x2 `light_gray_concrete` columns, `gray_concrete` band y6, `smooth_quartz_slab` lip y7 (top).
- `finRow(g, {xs, z:3, y0:7, y1:36})`: vertical `light_gray_concrete` column per x.
- `komoSign(g)`: `plaque(g,"KOMO 4",{at,face:'north',material:null})` + 4x4 `blue_concrete`/`red_concrete` checker emblem.
- `punchedWindow(g, {x,z,face,slab})`: 2 wide x 3 tall `light_blue_stained_glass_pane` rows slab+1..3 with `smooth_sandstone_slab` sill below; piers alternate sandstone / light grey per bay.
- `sawtoothStep(g, rects)`: Hyatt west steps; each bay one window west, north return solid beige.
- `lobbyGlazing(g, {run, every:4})`: `glass` y1..5 between 1-wide `light_gray_concrete` columns, `smooth_quartz_slab` band y6.
- `canopy(g, {box, y})`: top `smooth_quartz_slab` plate.
- `plantScreen(g, box)`: kerb, `iron_bars` y38..43 (connected), lid.
- `apertureBay(g, {x,face,dark:bool,slab})`: 5-wide bay per FACADES; dark = `gray_concrete` frame + `polished_deepslate` spandrel; light = `white_concrete`; window 3x3 `glass_pane` centred.
- `balconyBay(g, {x0,slab})`: 5x2 `smooth_stone_slab` (top) floor at z0..1, `glass_pane` rail slab+1 on north and both side edges, door-height opening behind.
- `shopfront(g, {x0,x1})`: `glass` y1..5 between `polished_deepslate` piers, `black_concrete` fascia y6.
- `doorPair(g, {x,z,face})`: two `iron_door` pairs (both halves, same facing/hinge mirrored) facing out.
- `pergola(g, box)`: `oak_fence` posts at corners every 5, `oak_slab` (top) rafters y40.
- `planter(g, box)`: `polished_andesite` kerb, `moss_block` fill, `azalea_leaves` clumps.
- `tree(g, x,z)`: `oak_log` trunk 4-6 high, `oak_leaves` crown 5 wide (persistent).
- `lampPost(g, x,z)`: `oak_fence` 4 high + `lantern` on top.
- `benchRow(g, centre, r, arc)`: curved row of `smooth_quartz_stairs` benches.
- `ceilingLamp(g, floorBox, y)`: flush `sea_lantern` replacing a ceiling block every 6.

## ROOMS

Floor surface = floor y +1. Planned rooms (cores, stairs: KOMO E x60..67 z30..37; KOMO W x124..131 z36..43; Hyatt x184..191 z72..79; Aperture x230..237 z20..27; each a `quartz_stairs` flight + glass lift, doors at each floor into corridors). Floors `polished_diorite` (offices) / `birch_planks` (hotel, flats).

See the `rooms` return for boxes; entrances: KOMO E drum lobby door x12..13 z9; KOMO W bow door x126..127 z1; Hyatt lobby doors x172..175 z64 (reached through pilotis passage); Aperture shop doors z2.
Note for the court: the Hyatt court strip x172..175 z56..63 is enclosed by the wedge (z48..55) on the north, so the annex ground storey x164..171, z56..63 is an open pilotis passage (columns `light_gray_concrete` at corners, y1..6); walkers enter from the west court x164..167 z55.

## PARTS

1. KOMO shells (parts/komo-shell.mjs): walls, floors, ribbon windows, drums, bows, podiums, openings; ribbonBand, pierRhythm, curtainDrum. Ticks 1,2,3,5.
2. Hyatt + Aperture shells (parts/hotel-apartments.mjs): stepped wedge, annex, pilotis, Aperture; punchedWindow, sawtoothStep, apertureBay. Ticks 10,11,15.
3. Roofs and crowns (parts/roofs.mjs): `$MCD roof` modern presets on every flat rect, crownRing x2, penthouse, plantScreen, pergola, overrun. Ticks 4,5,13,18,19.
4. Satellite dishes (parts/dishes.mjs): 14 dishes from the table, dish(). Ticks 6.
5. Facade fittings (parts/fittings.mjs): colonnades, fins, canopies, lobby glazing, shopfronts, doors, balconies, signs. Ticks 7,8,9,12,14,16,17.
6. Grounds and lighting (parts/grounds.mjs): plazas, planters, trees, benches, lamp posts, sea_lantern ceilings, parapet lanterns. Ticks 21,22.

- [ ] P1 - [ ] P2 - [x] P3 - [ ] P4 - [ ] P5 - [ ] P6

## NOTES

- Stay in plot and under max y (E 47, W 45, Hyatt 44, Aperture 40). Dish tops are the tallest things.
- Build each building in site orientation, no turning. Leave door cells, colonnade cells, balcony cells and dish cells as the RESERVED section says.
- Every id is 1.21.1. No stairs at entrances (all doors flush at y1).
- Banner letters via plaque()/bannerWord, never by hand.
- P1 shell: masses+occupancy walls (own drum/bow cells, not curtainDrum); ground walls inset at x101 (E) / x142 (W) / z6 north, doors cut there.

- Stairs (parts/stairs.mjs): switchback stacks in each core (KOMO E 60,30; W 124,36; Hyatt 184,72; Aperture 230,20), KOMO E drum 8,14, E south wing 58,50, Hyatt annex 154,57. Hyatt/Aperture shells must leave the stair cells alone (they are locked air/stairs). KOMO E drum meeting room (y38..40) is blocked by roof-tool deck/coping blocks at y38 over the drum: needs the roof to leave the drum clear and a flight 32->37 at x8..15,z14..21. No rails round openings.
