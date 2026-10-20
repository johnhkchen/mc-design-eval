# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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

- [ ] P1 - [ ] P2 - [ ] P3 - [ ] P4 - [ ] P5 - [ ] P6

## NOTES

- Stay in plot and under max y (E 47, W 45, Hyatt 44, Aperture 40). Dish tops are the tallest things.
- Build each building in site orientation, no turning. Leave door cells, colonnade cells, balcony cells and dish cells as the RESERVED section says.
- Every id is 1.21.1. No stairs at entrances (all doors flush at y1).
- Banner letters via plaque()/bannerWord, never by hand.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (Seattle Center modern neighbours)

Coordinates are plot-local (plan.md). Parts: P1 KOMO shell, P2 Hyatt+Aperture shell, P3 roofs & crowns, P4 dishes, P5 facade fittings, P6 grounds & lighting.

| # | element | construction (block by block) | where | part | vocab |
|---|---|---|---|---|---|
| 1 | KOMO white office bodies | `white_concrete` walls 1 thick, floor slabs `polished_diorite` at y 0,7,12,17,22,27,32; roof slab y 37 (E north) / 32 (E south) / 37 (W) | E 4..103,0..38,4..47 etc. | P1 | ribbonBand |
| 2 | Horizontal ribbon windows | per storey slab s: rows s+1..s+3 `gray_stained_glass_pane`, rows s+4 and s+5 (next slab) solid `white_concrete`; `light_gray_concrete` mullion 1 wide every 7th column; corners 2 solid white | all upper faces | P1 | ribbonBand, pierRhythm |
| 3 | Curved green-glass drum (E) | circle c(13,20) r11, `cyan_stained_glass` y1..41, `white_concrete` ring (1 thick) at y 7,12,...,37 and 41; ground storey clear `glass` | E x2..24,z9..31 | P1 | curtainDrum |
| 4 | Drum crown "flying saucer" | ring r13 `smooth_quartz_slab` (top) y42, `iron_bars` rail y43 on outer edge, `smooth_quartz` lid y41, penthouse r7 `cyan_stained_glass` y42..43 with `smooth_quartz` slab lid y44 | E (13,20) | P3 | crownRing |
| 5 | North bow (E) and half-drum bow (W) | circular segment of `cyan_stained_glass` + white rings same y as drum; W bow r13 c(127,14) crown ring r14 y42, rail y43 | E 48..75,z0..4; W 114..140,z1..14 | P1 (glass) P3 (crown) | curtainDrum, crownRing |
| 6 | Satellite dishes (E 11, W 3) | per plan DISHES: 3x3 `polished_andesite` pedestal 2 high, `iron_block` yoke, bowl `white_concrete` (layered discs tilted ~30deg toward +z, upward), `smooth_quartz` rim, `iron_bars` feed arm, `end_rod` tip | plan.md table | P4 | dish |
| 7 | Glazed ground floor + colonnade | `glass` y1..5 set back 2; `light_gray_concrete` columns 2x2 every 8, y1..6; `gray_concrete` band y6; `smooth_quartz_slab` lip y7 | KOMO N/E faces | P5 | colonnade |
| 8 | Projecting fins | `light_gray_concrete` 1x1 at z3, y7..36 at x 18,32,46,78,92 | E north face | P5 | finRow |
| 9 | KOMO 4 sign + emblem | banner-letter plaque x28..38,y30..34 z3; 4x4 blue/red `blue_concrete`/`red_concrete` square x40..43 | E north | P5 | komoSign |
| 10 | Hyatt wedge, sawtooth west face | stepped rects per plan, walls `smooth_sandstone`/`light_gray_concrete` piers alternating, `white_concrete` spandrels | Hyatt | P2 | punchedWindow, sawtoothStep |
| 11 | Hyatt punched windows | 2x3 `light_blue_stained_glass_pane` every 4 blocks, rows s+1..s+3 | all guest storeys | P2 | punchedWindow |
| 12 | Hyatt glazed lobby + court canopy | `glass` y1..5 between `light_gray_concrete` columns every 4; `smooth_quartz_slab` canopy y6/7; pilotis passage x164..171 z56..63 | Hyatt | P2 P5 | lobbyGlazing, canopy |
| 13 | Hyatt plant screen | `light_gray_concrete` kerb y38, `iron_bars` y38..43, `smooth_stone_slab` lid y44 | 168..187,70..85 | P3 | plantScreen |
| 14 | HYATT HOUSE sign | banner letters x156..171,y13..16,z63 | Hyatt | P5 | plaque |
| 15 | Aperture panel facade | alternating DARK bay (`gray_concrete` + `polished_deepslate` spandrel) / LIGHT bay (`white_concrete`), 5 wide, window 3x3 `glass_pane` | Aperture | P2 | apertureBay |
| 16 | Aperture balconies | 5x2 `smooth_stone` slab-floor at z0..1, `glass_pane` rail slab+1 on north/side edges, per storey stagger | north face | P5 | balconyBay |
| 17 | Aperture shopfronts | `glass` bays between `polished_deepslate` piers, `black_concrete` fascia y6, `iron_door` shop doors | z2, y1..6 | P5 | shopfront, doorPair |
| 18 | Roof terrace pergola + overrun | pergola: `oak_fence` posts with `oak_slab` rafters frame y38..40 at 210..225,10..25; overrun `white_concrete` box 230..237,20..27 y38..40 | Aperture roof | P3 | pergola |
| 19 | Parapets and copings | `white_concrete` (Aperture `gray_concrete`) parapet 1 above slab, `smooth_stone_slab` coping, iron-bar rail | every roof | P3 | modern roof preset |
| 20 | Lift/stair cores | `ladder`-free stair `quartz_stairs` flights + `bubble_column` lift shaft in `glass` | plan cores | P1/P2 | (interior designers) |
| 21 | Planters, trees, lamp posts, curved bench row | `polished_andesite` kerb + `moss_block`/`azalea_leaves`; oak trees; `oak_fence` post + `lantern`; bench `smooth_quartz_stairs` | plazas, courts | P6 | planter, lampPost, benchRow |
| 22 | Lighting | flush `sea_lantern` in ceilings, 6 spacing; roof `lantern` on parapet every 8 | all | P6 | ceilingLamp |
```

### rooms.json

```json
{"entrance":[12,1,8],"street":null,"entrances":null,"rooms":[{"name":"KOMO E drum restaurant","box":[6,1,13,20,6,27]},{"name":"KOMO E atrium lobby","box":[26,1,8,58,6,45]},{"name":"KOMO E newsroom","box":[26,8,8,58,11,45]},{"name":"KOMO E east offices","box":[68,8,8,100,11,45]},{"name":"KOMO E drum meeting room","box":[6,38,13,20,40,27]},{"name":"KOMO E broadcast studio","box":[60,1,60,99,11,100]},{"name":"KOMO E south wing offices","box":[58,13,50,101,16,113]},{"name":"KOMO W bow lobby","box":[112,1,16,142,6,49]},{"name":"KOMO W office floor","box":[112,8,16,142,11,49]},{"name":"KOMO W podium studio","box":[107,1,54,149,6,59]},{"name":"Hyatt lobby and breakfast room","box":[154,1,66,182,6,90]},{"name":"Hyatt wedge breakfast hall","box":[190,1,14,198,6,60]},{"name":"Hyatt guest floor corridor","box":[154,8,66,198,11,90]},{"name":"Hyatt annex meeting rooms","box":[153,8,57,170,11,62]},{"name":"Hyatt rooftop plant room","box":[169,39,71,186,43,84]},{"name":"Aperture shops","box":[203,1,4,246,6,14]},{"name":"Aperture residents lobby","box":[203,1,16,228,6,27]},{"name":"Aperture bike room","box":[203,1,28,246,6,49]},{"name":"Aperture apartments north","box":[203,8,3,246,11,24]},{"name":"Aperture apartments south","box":[203,8,27,246,11,50]}]}
```

### palette.json

```json
{
  "roles": {
    "ground": ["smooth_stone", "smooth_stone_slab", "polished_andesite", "moss_block", "azalea_leaves", "oak_log", "oak_leaves", "oak_fence", "oak_slab", "lantern"],
    "body": ["white_concrete"],
    "piers": ["light_gray_concrete"],
    "ribbon-glass": ["gray_stained_glass_pane"],
    "curtain-wall": ["cyan_stained_glass", "cyan_stained_glass_pane"],
    "canopy": ["smooth_quartz", "smooth_quartz_slab", "smooth_quartz_stairs", "quartz_stairs"],
    "dish": ["white_concrete", "smooth_quartz", "polished_andesite", "polished_andesite_slab", "iron_block", "iron_bars", "end_rod"],
    "glazing": ["glass", "glass_pane"],
    "hyatt": ["smooth_sandstone", "smooth_sandstone_slab", "light_gray_concrete", "white_concrete", "light_blue_stained_glass_pane"],
    "aperture": ["gray_concrete", "polished_deepslate", "white_concrete", "black_concrete", "glass_pane", "smooth_stone", "smooth_stone_slab"],
    "floors": ["polished_diorite", "birch_planks"],
    "signs": ["blue_concrete", "red_concrete"],
    "lift": ["soul_sand", "bubble_column", "glass"],
    "rails": ["iron_bars", "iron_chain"],
    "doors": ["iron_door"]
  },
  "objects": [
    "sea_lantern",
    "lantern",
    "ladder",
    "bubble_column",
    "iron_door"
  ]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then replaces build.nbt.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp ./build.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Seattle Center kit: the site grid, the ground, then every part in the order the brief gives. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order. The stair joiner carves its stairwells through the floors and ceilings the shell laid.
const PARTS = [
  ["KOMO shells", "parts/komo-shell.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs", { carve: true }],
  ["Hyatt and Aperture shells", "parts/hotel-apartments.mjs"],
  ["Roofs and crowns", "parts/roofs.mjs"],
  ["Satellite dishes", "parts/dishes.mjs"],
  ["Facade fittings", "parts/fittings.mjs"],
  ["Grounds and lighting", "parts/grounds.mjs"],
  ["room: KOMO E drum restaurant", "parts/room-1.mjs"],
  ["room: KOMO E atrium lobby", "parts/room-2.mjs"],
  ["room: KOMO E newsroom", "parts/room-3.mjs"],
  ["room: KOMO E east offices", "parts/room-4.mjs"],
  ["room: KOMO E drum meeting room", "parts/room-5.mjs"],
  ["room: KOMO E broadcast studio", "parts/room-6.mjs"],
  ["room: KOMO E south wing offices", "parts/room-7.mjs"],
  ["room: KOMO W bow lobby", "parts/room-8.mjs"],
  ["room: KOMO W office floor", "parts/room-9.mjs"],
  ["room: KOMO W podium studio", "parts/room-10.mjs"],
  ["room: Hyatt lobby and breakfast room", "parts/room-11.mjs"],
  ["room: Hyatt wedge breakfast hall", "parts/room-12.mjs"],
  ["room: Hyatt guest floor corridor", "parts/room-13.mjs"],
  ["room: Hyatt annex meeting rooms", "parts/room-14.mjs"],
  ["room: Hyatt rooftop plant room", "parts/room-15.mjs"],
  ["room: Aperture shops", "parts/room-16.mjs"],
  ["room: Aperture residents lobby", "parts/room-17.mjs"],
  ["room: Aperture bike room", "parts/room-18.mjs"],
  ["room: Aperture apartments north", "parts/room-19.mjs"],
  ["room: Aperture apartments south", "parts/room-20.mjs"],
];

const newGrid = () => {
  const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  g.fill([0, 0, 0], [SITE[0] - 1, 0, SITE[2] - 1], SMOOTH_STONE);   // the ground course over the whole site
  return g;
};

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module, opts] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build, opts]);
}

// The roof needs walls to find its eave. While the shell is still a stub it builds none, so the roof waits: a probe
// builds the shell alone on a scratch grid and looks for anything above the ground.
const shellBuild = list.find(([name]) => name === PARTS[0][0])?.[1];
const probe = newGrid();
if (shellBuild) shellBuild(probe);
const shellHasWalls = [...probe].some((c) => c.pos[1] > 0 && !/air$/.test(c.block));
const roof = existsSync("roof.json") && shellHasWalls ? "roof.json" : undefined;
if (existsSync("roof.json") && !roof) console.log("roof: waiting, the shell builds no walls yet");

const g = newGrid();
runParts(g, list, { palette: "palette.json", roof });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Seattle Center kit: palette block ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// Ground and walking level

// Ground and walking level
export const SMOOTH_STONE = "smooth_stone";                              // ground course y 0, paving, flat deck

export const GROUND_Y = 0;                                               // ground course

export const WALK_Y = 1;                                                 // floor level people stand on (floor block y 0); every door is flush here

// KOMO bodies, piers and glass
export const WHITE_CONCRETE = "white_concrete";                          // KOMO body, spandrel bands, parapets, curtain rings

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";                // KOMO piers, columns, fins; Hyatt grey panels

export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";        // KOMO ribbon windows (dark band against white)

export const CYAN_STAINED_GLASS = "cyan_stained_glass";                  // curtain wall of the drums and bows (reads teal-green)

export const CYAN_STAINED_GLASS_PANE = "cyan_stained_glass_pane";        // bow thin edges only

export const GLASS = "glass";                                            // ground-storey glazing, lift shafts

export const GLASS_PANE = "glass_pane";                                  // Aperture windows and balcony rails

export const LIGHT_BLUE_STAINED_GLASS_PANE = "light_blue_stained_glass_pane"; // Hyatt punched windows

// Canopies, lids and copings
export const SMOOTH_QUARTZ = "smooth_quartz";                            // crown lids, dish rim, penthouse lid

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";                  // canopy lips, crown rings (top), lobby band

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";              // dish rim where the bowl steps, benches

export const QUARTZ_STAIRS = "quartz_stairs";                            // stair flights in the cores

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";                    // copings, lids, roof coping, balcony floors

// Dishes and rails
export const POLISHED_ANDESITE = "polished_andesite";                    // dish pedestal, planter kerb

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";          // dish pedestal top

export const IRON_BLOCK = "iron_block";                                  // dish yoke

export const IRON_BARS = "iron_bars";                                    // rails, dish feed arms, plant screens

export const IRON_CHAIN = "iron_chain";                                  // plant screens, rails

export const END_ROD = "end_rod";                                        // dish feed tips

export const IRON_DOOR = "iron_door";                                    // entrance door pairs (both halves)

// Hyatt and Aperture panels
export const SMOOTH_SANDSTONE = "smooth_sandstone";                      // Hyatt beige panels, return walls

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";            // Hyatt window sills

export const GRAY_CONCRETE = "gray_concrete";                            // Aperture dark bay frames, dark parapet, annex

export const POLISHED_DEEPSLATE = "polished_deepslate";                  // Aperture dark spandrels, shop piers

export const BLACK_CONCRETE = "black_concrete";                          // Aperture shop fascia

// Signs and emblem
export const BLUE_CONCRETE = "blue_concrete";                            // KOMO 4 emblem

export const RED_CONCRETE = "red_concrete";                              // KOMO 4 emblem

// Floors, lights, lift
export const POLISHED_DIORITE = "polished_diorite";                      // KOMO office floors

export const BIRCH_PLANKS = "birch_planks";                              // Hyatt and Aperture floors

export const SEA_LANTERN = "sea_lantern";                                // flush ceiling light

export const LANTERN = "lantern";                                        // parapet and lamp-post lights

export const SOUL_SAND = "soul_sand";                                    // lift base

export const BUBBLE_COLUMN = "bubble_column";                            // water elevator (drag false)

export const LADDER = "ladder";                                          // only where a stair can't fit

// Grounds
export const MOSS_BLOCK = "moss_block";                                  // planter fill

export const AZALEA_LEAVES = "azalea_leaves";                            // planter clumps (persistent)

export const OAK_LOG = "oak_log";                                        // tree trunks

export const OAK_LEAVES = "oak_leaves";                                  // tree crowns (persistent)

export const OAK_FENCE = "oak_fence";                                    // lamp posts, pergola posts

export const OAK_SLAB = "oak_slab";                                      // pergola rafters

// Site (plan.md): the full site is 251 x 48 x 125 blocks, x 0..250, y 0..47, z 0..124
export const SITE = [251, 48, 125];

// Plots, inclusive x0..x1 and z0..z1, with the highest block y1 (plan.md)
export const PLOTS = {
  plot0: { name: "KOMO PLAZA EAST", x0: 0, x1: 104, z0: 0, z1: 124, maxY: 47 },
  plot1: { name: "KOMO PLAZA WEST", x0: 105, x1: 151, z0: 0, z1: 61, maxY: 45 },
  plot2: { name: "HYATT HOUSE", x0: 152, x1: 200, z0: 0, z1: 92, maxY: 44 },
  plot3: { name: "APERTURE ON FIFTH", x0: 201, x1: 250, z0: 0, z1: 52, maxY: 40 },
};

// Storeys and roofs (plan.md FLOORS and ROOFS): floor block y of each storey, and the roof slab y of each mass
export const STOREY = 5;                                                 // blocks per storey (3.6 m at 1.4 blocks per metre)

export const GROUND_STOREY = 7;                                          // the ground storey is 7 blocks tall (floor y 0 to slab y 7)

export const KOMO_FLOORS = [0, 7, 12, 17, 22, 27, 32];                   // KOMO office storey slabs

export const KOMO_E_NORTH_ROOF_Y = 37;                                   // KOMO E north block roof slab (parapet 38)

export const KOMO_E_SOUTH_ROOF_Y = 32;                                   // KOMO E south wing roof slab (parapet 33)

export const KOMO_PODIUM_ROOF_Y = 12;                                    // KOMO E west podium and W podium roof slab (parapet 13)

export const KOMO_TAIL_ROOF_Y = 17;                                      // KOMO E south tail roof slab (parapet 18)

export const KOMO_W_ROOF_Y = 37;                                         // KOMO W body roof slab (parapet 38)

export const DRUM_CROWN_Y = 42;                                          // drum and bow crown ring (rail y 43)

export const DRUM_LID_Y = 41;                                            // drum lid under the crown

export const PENTHOUSE_LID_Y = 44;                                       // KOMO E penthouse lid

export const HYATT_ROOF_Y = 37;                                          // Hyatt wedge and south block roof slab (parapet 38)

export const HYATT_ANNEX_ROOF_Y = 17;                                    // Hyatt west annex roof slab

export const HYATT_PLANT_LID_Y = 44;                                     // Hyatt plant enclosure lid (screen y 38..43)

export const APERTURE_ROOF_Y = 37;                                       // Aperture roof slab (parapet 38)

export const APERTURE_OVERRUN_Y = 40;                                    // Aperture stair/lift overrun top and pergola rafters

// Vertical circulation cores (plan.md ROOMS): inclusive x0..x1, z0..z1
export const CORE_KOMO_E = { x0: 60, x1: 67, z0: 30, z1: 37 };

export const CORE_KOMO_W = { x0: 124, x1: 131, z0: 36, z1: 43 };

export const CORE_HYATT = { x0: 184, x1: 191, z0: 72, z1: 79 };

export const CORE_APERTURE = { x0: 230, x1: 237, z0: 20, z1: 27 };

// Entrances (plan.md OPENINGS): cells of each door, inclusive
export const DOORS = {
  komoEDrum: { x0: 12, x1: 13, z: 9 },                                   // KOMO E drum lobby (north)
  komoENorthBow: { x0: 61, x1: 62, z: 0 },                               // KOMO E north bow lobby (north)
  komoEEast: { x: 103, z0: 30, z1: 31 },                                 // KOMO E east entrance
  komoESouthEast: { x: 103, z0: 80, z1: 81 },                            // KOMO E south wing east
  komoEPlaza: { x: 56, z0: 90, z1: 91 },                                 // KOMO E plaza door (west)
  komoWBow: { x0: 126, x1: 127, z: 1 },                                  // KOMO W bow lobby (north)
  komoWEast: { x: 144, z0: 30, z1: 31 },                                 // KOMO W east door
  hyattMain: { x0: 172, x1: 175, z: 64 },                                // Hyatt main lobby, off the court (north)
  hyattTip: { x0: 195, x1: 196, z: 8 },                                  // Hyatt tip entrance (north)
  apertureResidents: { x: 201, z0: 20, z1: 21 },                         // Aperture residents' lobby (west)
};

// Seeded random numbers (mulberry32): rng(seed)() gives a float in [0, 1); the same seed gives the same build
export function rng(seed)
```

### vocab/h1.mjs

```js
// H1 helpers from plan.md VOCABULARY: ribbonBand, crownRing, finRow, sawtoothStep, plantScreen, shopfront, planter, benchRow.
//
// Every helper takes its position (and facing, where it has one) as arguments; nothing is fixed to a spot.
// Each helper writes only inside the footprint it is given, and only into AIR. A cell that already holds a block,
// or lies outside the grid, is left alone and listed in `refused` as [x, y, z, block]. Facade helpers paint onto a
// wall the shell has already laid: pass `over: true` (any block inside the footprint) or `over: [ids]` (only those).
// Pane and bar sides are read from the grid, plus this helper's own cells, when the helper finishes: lay the
// neighbours first. Leaves are persistent=true. Every helper returns { placed, kept, refused }.

/**
 * One wall run (a line of columns): white at the slab row, glass in the three rows above it, white for the next two
 * rows (the next slab row included). Piers and corners are not this helper's job.
 */
export function ribbonBand(g, a)

/**
 * Flying-saucer crown: an annulus of top quartz slabs from r-2 out to r at height y (the overhang), iron-bar rail on its
 * outer edge at `rail`, a quartz lid inside it at `lid`. half: keep only the north half (z <= cz).
 */
export function crownRing(g, { cx, cz, r, y = 42, rail = y + 1, lid = y - 1, half = false, over })

/** Vertical light-grey fins: one column per x in xs, from y0 to y1 (inclusive), in the plane z. */
export function finRow(g, { xs, z = 3, y0 = 7, y1 = 36, over })

/**
 * Hyatt's sawtooth west face. rects: the wedge bays in order from the north tip southward, each {x0,x1,y0,y1,z0,z1}.
 * Per bay: a 2-wide, 3-tall window in its west face at each guest storey, and its north return (the part of its north
 * edge that the bay to its north doesn't cover) in solid beige. Pass over: true, the wedge is already walled.
 */
export function sawtoothStep(g, rects, { over, slabs = SLABS } = {})

/**
 * Rooftop screen around a plant box [x0, y0, z0, x1, y1, z1] (inclusive): light-grey kerb ring at y0, iron-bar walls
 * from y0+1 to y1-1 on the ring, a flat slab lid over the whole box at y1. Needs y1 >= y0 + 2.
 */
export function plantScreen(g, [x0, y0, z0, x1, y1, z1], { over } = {})

/**
 * A shopfront on the wall plane z, x0..x1: glass in y1..5 between 1-wide polished_deepslate piers every `bay`+1
 * (the last pier on x1), black_concrete fascia at y6. open: [[xa, xb], ...] doorways, left alone at y1..2 (the doors
 * are doorPair's job).
 */
export function shopfront(g, { x0, x1, z, bay = 9, open = [], over })

/**
 * A planter bed on the box [x0, y0, z0, x1, y1, z1] (inclusive, y1 > y0): polished_andesite kerb ring from y0 to y1-1,
 * moss_block soil inside at y0, persistent azalea_leaves on alternate interior cells at y1.
 */
export function planter(g, [x0, y0, z0, x1, y1, z1], { over } = {})

/**
 * A curved bench row on a circle of radius r about centre [cx, cz], from angle a0 to a1 in degrees (0 = east, 90 = south).
 * Each bench is a smooth_quartz stair at height y with its full-height back to the outside, so the seat faces the centre.
 * Only the one bench cell per step is written: the lane above it stays clear.
 */
export function benchRow(g, [cx, cz], r, [a0, a1], { y = 1, over } = {})
```

### vocab/h2.mjs

```js
// H2 vocabulary (plan.md VOCABULARY): pierRhythm, dish, komoSign, lobbyGlazing, apertureBay, doorPair, tree, ceilingLamp.
// Each helper takes its own position as arguments and returns { placed, refused }. It writes only inside its footprint,
// and only into air, unless an option names the blocks it may replace (`over`). A refused write is listed, never thrown.

/**
 * Mullion piers in a ribbon of glass: over the glass rows slab+1..slab+3, a 1-wide pier every `every` columns
 * (6 glass, 1 pier), measured from the corner's edge; 2-wide solid corners. Replaces the ribbon's glass only.
 */
export function pierRhythm(g, run, { every = 7, block = "light_gray_concrete", inset = 1, corner = "white_concrete", over = ["gray_stained_glass_pane"] } = {})

/**
 * Satellite dish on a deck at deckY: a 3x3 polished_andesite pedestal 2 high, an iron_block yoke above it, a bowl of
 * stacked one-thick discs (white_concrete, smooth_quartz on the upper rim) rising toward +z, and an iron_bars feed arm
 * ending in an end_rod. d is the bowl diameter; nothing rises above deckY + d, and the deck itself is never written.
 */
export function dish(g, { cx, cz, deckY, d })

/**
 * The KOMO 4 sign on the north wall. `at` is plaque's origin on the wall line (z of the wall, the lettering's east end and
 * bottom row): 11 wide, 5 high, so at x 38 the letters fill plan.md's x 28..38, y 30..34, one cell in front of the wall.
 * The 4x4 blue and red checker sits at x at+2..at+5 on the same plane (plan.md's x 40..43, y 30..33).
 */
export function komoSign(g, { at, width = 11, height = 5 })

/**
 * Ground-storey glazing along a run: glass at y0..y1 between 1-wide light_gray_concrete columns every `every`
 * blocks, with a smooth_quartz_slab band at y=band across the run.
 */
export function lobbyGlazing(g, { run, every = 4, y0 = 1, y1 = 5, band = 6, over = [] })

/**
 * One 5-wide storey bay on a wall, starting at (x, z) and running along the face (north/south: +x; east/west: +z),
 * rows slab+1..slab+4. Window 3x3 glass_pane, centred. Dark: gray_concrete frame, polished_deepslate spandrel.
 * Light: white_concrete. The wall plane is the coordinate given by the face (z for north/south, x for east/west).
 */
export function apertureBay(g, { x, z, face, dark = false, slab, over = [] })

/**
 * A pair of iron_door doors side by side at (x, y, z) on the given face: both halves of each, facing out, the
 * first hinged left and the second right. y is the lower half's y (the walk level, 1 in plan.md).
 */
export function doorPair(g, { x, y, z, face, over = [] })

/**
 * An oak tree rooted at (x, y, z), y being the first cell above the paving (1 in plan.md): an oak_log trunk of 4-6
 * and a persistent oak_leaves crown 5 wide. The crown starts two blocks above the trunk base, so a 2-high lane stays clear.
 */
export function tree(g, x, z, { y = 1, height = 5 } = {})

/**
 * Flush sea_lanterns in a ceiling at height y, one every 6 blocks over the room box [x0, y0, z0, x1, y1, z1] (the rooms.json
 * form), offset 3 in from its edges. Replaces the ceiling block (`over`), otherwise air only.
 */
export function ceilingLamp(g, [x0, , z0, x1, , z1], y, { over = ["polished_diorite", "birch_planks"] } = {})
```

### vocab/h3.mjs

```js
// Seattle Center kit, helper set 3 (plan.md VOCABULARY): curtainDrum, colonnade, punchedWindow, canopy, balconyBay,
// pergola, lampPost. Each takes its position (and facing) as arguments and returns the number of blocks it wrote.
// Every write is guarded: only into air, never at the ground course (y 0), never on a skip(x, y, z) cell. Options
// `cut` (punchedWindow, balconyBay) let a window or doorway replace the wall cells of its own footprint. Refused writes
// go to g.refused when the grid is guarded, so the caller can report them.

/**
 * Curtain drum: a 1-thick cylinder of cyan glass, radius r about (cx, cz), y0..y1. White rings at the floor ys; below
 * the first ring the ground storey is clear glass. half: only the arc from..to (default 270..90, the north half).
 */
export function curtainDrum(g, { cx, cz, r, y1, y0 = 1, rings = [7, 12, 17, 22, 27, 32, 37, 41], half = false, from = 270, to = 90, skip } = {})

/**
 * Colonnade along a wall run: 2x2 light-grey columns every `every` blocks from the run's start, y0..y1; a grey band
 * at y1 between them, and a smooth_quartz_slab lip (top) at y1 + 1. The strip is 2 deep, into the building: `into`
 * defaults to south for an east-west run (the north face) and west for a north-south run (the east face).
 * run: {x0, x1, z0, z1}, or {x, z0, z1} / {x0, x1, z} for a straight line.
 */
export function colonnade(g, { run, every = 8, y0 = 1, y1 = 6, into, skip } = {})

/**
 * Punched window in a wall: 2 wide x 3 tall light-blue glass panes at rows slab+1..slab+3, with a smooth_sandstone
 * slab sill on row slab. face north/south: the wall runs along x at z, the window spans x..x+1; east/west: the wall
 * runs along z at x, the window spans z..z+1. cut: replace the wall cells of the window (use it for a built wall).
 */
export function punchedWindow(g, { x, z, face = "north", slab: s, cut = false, skip } = {})

/** Canopy: one flat smooth_quartz_slab (top) plate over box = [x0, z0, x1, z1] at height y. */
export function canopy(g, { box, y, skip } = {})

/**
 * Balcony bay: width x depth top smooth_stone slabs at the slab row (z0 is the outer, north edge), glass_pane rail at
 * slab+1 on the north edge and both side edges. cut: also glazes the door-height opening (glass, rows slab+1..slab+2,
 * the middle cells) in the wall at z0 + depth, which the shell has built.
 */
export function balconyBay(g, { x0, z0 = 0, slab: s, width = 5, depth = 2, cut = false, skip } = {})

/**
 * Pergola: an open frame in box = [x0, y0, z0, x1, y1, z1]. oak_fence posts on the perimeter every 5 blocks, y0..y1-1;
 * oak_slab (top) rafters at y1 along the edges and across at every post line.
 */
export function pergola(g, [x0, y0, z0, x1, y1, z1], { skip } = {})

/** Lamp post: oak_fence 4 high from floor row y (default 1, the walking surface), a standing lantern on top. */
export function lampPost(g, x, z, y = 1, { skip } = {})
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
