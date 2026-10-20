# The Clock Tower Building, 1 Main Street, DUMBO: architect's plan (form)

Plot 0: x 0..32, z 0..43, y 0..69. Frame: north (−z) = East River / Water St; west (x 0) = Main St; south (z 43) = Plymouth St; east (x 32) = Washington St. Built square here; placement rotates it.
Height cap: nothing above y 61 (the lantern's lightning rod). Nothing outside the `#` footprint.

## SITE

Ground: g = the y of the top ground block in a cell (people stand at g+1). g = 0 on the Main St strip (x 0..4, z 1..29); g = 1 everywhere else. Every mass builds its footing down to g; nothing floats.
The front that matters is the NORTH (river) face, z 1, then the tower's four faces above the roof, then the west (Main St) face, x 1.
The plot's ragged edges (z 0, z 43, x 0, x 31..32) are outside the walls. Build only paving there, and only on `#` cells.

| mass | x | y | z | notes |
|---|---|---|---|---|
| Main loft block | 1..23 | 0..38 | 1..42 | except x 23 at z 8..10, where the east wall steps in to x 22 (a light-court notch) |
| Main roof deck | 2..22 | 36 (slab), 37 (slab layer) | 2..41 | inside the parapet |
| Main parapet | wall line | 37..38 | perimeter | not on x 1..13 / z 17..29, where the tower wall continues |
| Clock tower shaft | 1..13 | 0..49 | 17..29 | 13 x 13. Below y 36 it is part of the block; it stands free above y 36. Its west face is flush with the Main St facade (x 1) |
| Tower recessed panels | 3..11 (N, S faces); 19..27 (W, E faces) | 6..48 | set back 1 | the corner piers (2 wide) stand at the wall line; the 9-wide middle panel is one block in, so the tower reads as a slim 9-wide shaft framed by pilasters |
| Tower cornice | 1..14 | 49..50 | 16..30 | overhangs 1 on N (z 16), E (x 14) and S (z 30). Flush on W (x 1), because x 0 is mostly off-plot |
| Pyramid cap | 1..13 → 4..10 | 51..56 | 17..29 → 20..26 | steps in 1 for every 2 courses |
| Top deck | 4..10 | 57 | 20..26 | flat, slab-surfaced |
| Glass lantern (observation box) | 5..9 | 58..60 | 21..25 | glass y 58..59, flat roof y 60, lightning rod at (7, 61, 23) |
| Roof bulkhead A (stair/elevator) | 11..15 | 37..39 | 30..35 | flat roof y 39 |
| Roof bulkhead B (mechanical penthouse) | 17..21 | 37..40 | 35..41 | flat roof y 40, louvred sides |
| East wing (2-storey loading wing) | 24..30 | 0..8 | 11..33 | roof slab y 7, parapet y 8 |
| East wing, south part | 24..28 | 0..8 | 34..42 | same heights |
| Main St entrance vestibule | 1..3 | 1..5 | 22..24 | cut into the tower base (see OPENINGS) |
| Washington St entrance canopy | 31 | 5 | 20..23 | a flat slab canopy on 2 chain hangers |
| Sidewalk paving | z 0 (`#` cells), x 0 (`#` cells), x 24..25 at z 0..7, x 31..32 at z 11..33, x 29..30 at z 34..42, z 43 (`#` cells) | g | — | smooth stone paving, flush with the ground |
| Street trees (London plane) | (31,14) (31,21) (31,28) (30,37) (30,41) | trunk g+1..g+5, crown up to y 12 | — | the crown stays inside x ≤ 32 and off the wing walls |
| Lamp posts | (0,16) (0,27) (24,0) (32,17) (32,25) (31,33) | g+1..g+4 | — | 3 fence posts and a lantern on top |

## ROOFS

| roof | form | height | how built |
|---|---|---|---|
| Main block | flat, behind a parapet (`$MCD roof` preset `modern` / style `flat-parapet`: an office/loft block) | deck slab y 36; a full layer of `smooth_stone_slab` (bottom) at y 37 (no mob spawns); parapet y 37..38, coping slab at y 38 | the roof tool; `keep` = the tower box x 1..13 z 17..29 y 36..61 and both bulkheads |
| Clock tower | PYRAMID (style `pyramid`), steep and metal, cut flat at the top for the glass lantern | eave y 51 at x 1..13 z 17..29; rings y 51..52, 53..54 and 55..56 step in 1 each; flat deck y 57 at x 4..10 z 20..26 | built by hand as 3 stair rings (`deepslate_tile_stairs` facing out, with a `deepslate_tiles` course under each), because the tool's pyramid comes to a point and this one has to be truncated |
| Glass lantern | flat slab roof | y 60, `polished_deepslate_slab`, with an overhang of 1 (x 4..10 z 20..26) | by hand |
| Bulkheads A and B | flat, slab coping | y 39 and y 40 | by hand, in the wall block |
| East wing | flat behind a parapet (style `flat-parapet`) | roof slab y 7, bottom-slab layer y 8 inside, parapet y 8 | the roof tool |

Meeting rule: the main roof deck runs up to the tower walls; the tower walls rise unbroken from y 0 (west face) and from y 36 (N, E, S faces). The wing roof butts against the main block's east wall at x 23/22, and that wall carries on up as a facade above y 8.

## FACADES

Grid rule for every face: big windows 3 wide between flat piers 1 wide, with a spandrel 1 tall between storeys. The piers, the spandrels and the corner piers sit at the wall line. The glass sits 1 block in (the recess makes the dark frame line). No sills stick out; the grid is the ornament.

Storey rows on the main block: windows at y 2..4 (ground floor, arched head at y 5), then y 7..8, 10..11, 13..14, 16..17, 19..20, 22..23, 25..26, 28..29, 31..32. The attic is a row of 1-high windows at y 34, with a frieze at y 35.
Spandrels: y 6 (string course), 9, 12, 15, 18, 21, 24, 27, 30, 33.
Cornice: y 35 frieze band, y 36 a course of upside-down `smooth_quartz_stairs` facing out at the wall line, y 37..38 parapet with a slab cap.

| face | wall line | window columns (3 wide unless noted) | piers |
|---|---|---|---|
| NORTH (river), hero | z 1, x 1..23 | x 3..5, 7..9, 11..13, 15..17, 19..21 (5 bays, the middle bay is centred on x 12) | corner piers x 1..2 and x 22..23; piers x 6, 10, 14, 18 |
| WEST (Main St), north part | x 1, z 1..16 | z 4..6, 8..10, 12..14 | corner pier z 1..3; piers z 7, 11; z 15..16 joins the tower pier, making a 4-wide strip z 15..18 |
| WEST, tower part | x 1, z 17..29 | z 19..21 (3), z 23 (1, narrow), z 25..27 (3) | tower corner piers z 17..18 and z 28..29 run unbroken from y 0 to the cornice; piers z 22, z 24 |
| WEST, south part | x 1, z 30..42 | z 31..33, 35..37, 39..41 | z 30 (joins the tower pier), z 34, z 38; corner z 42 |
| EAST (Washington St), above the wing (y 9..38) | x 23, z 1..7 and 11..42; x 22 at z 8..10 | z 2..4, 14..16, 18..20, 22..24, 26..28, 30..32, 34..36, 38..40 | corner z 1 and z 5..7; z 8..10 blank (notch); z 11..13, 17, 21, 25, 29, 33, 37; z 41..42 |
| SOUTH (Plymouth St) | z 42, x 1..23 | same columns as the north face | same piers |
| TOWER, all 4 faces above y 36 | W x 1, E x 13 (z 17..29); N z 17, S z 29 (x 1..13) | arched windows in the recessed panel at y 37..40: 3 wide at panel cells 1..3 and 7..9 (N/S: x 3..5 and 9..11; W/E: z 19..21 and 25..27), 1 wide at the panel centre (x 7 / z 23). The arch head at y 40 is upside-down stairs at the two outer cells with glass in the middle | corner piers 2 wide at the wall line from the roof to y 48 |
| TOWER clock stage | same | y 41 string course: `smooth_quartz_slab` (top) right across the recessed panel. The clock sits at y 42..48 | — |
| EAST WING | x 30 (z 11..33), x 28 (z 34..42), z 42 (x 24..28), z 11 (x 24..30) | ground windows y 2..3 and upper y 5..6, 3 wide on the same 4-bay rhythm (z 13..15, 17..19, 25..27, 29..31; z 35..37, 39..41) | piers between, a cornice band at y 7 |

The ground floor (y 0..5) is a little richer than the floors above. Plinth y 0..1 in `polished_andesite` (pale grey granite), stepped down to g. The ground-floor piers are `quartz_pillar` (fluted look). The window heads at y 5 are arches of upside-down `smooth_quartz_stairs`. String course y 6 in `quartz_bricks`.

Clock faces: `clock()`, radius 2 (7 across), time 10:10, out 0, one on each tower face.

| face | centre | span |
|---|---|---|
| W | (1, 45, 23) | z 20..26, y 42..48 |
| E | (13, 45, 23) | z 20..26, y 42..48 |
| N | (7, 45, 17) | x 4..10, y 42..48 |
| S | (7, 45, 29) | x 4..10, y 42..48 |

The dial is flush with the corner piers and stands 1 proud of the recessed panel.
- Dial: `white_stained_glass`, with a layer of `glowstone` one cell behind it (inside the tower) so it glows at dusk.
- Bezel ring: `oxidized_copper`, the verdigris surround in the photo, with hour marks at 12, 3, 6 and 9.
- Hands: `black_concrete`.
- Every cell of the panel outside the dial is wall.

Tower frieze y 49 (`smooth_quartz`). Cornice y 50: upside-down `smooth_quartz_stairs` overhanging 1 on N, E and S, set flat at x 1 on the west.

## MATERIALS (all ids are present in 1.21.1)

| role | block id |
|---|---|
| body: piers, spandrels, tower shaft (~60%) | `smooth_quartz` (warm off-white concrete) |
| secondary body / recessed tower panels / attic frieze | `calcite` (a slightly cooler white, so the panel reads set back) |
| trim: cornices, arch heads, string courses | `smooth_quartz_stairs`, `smooth_quartz_slab`, `quartz_bricks` |
| ground-floor piers | `quartz_pillar` |
| plinth / base | `polished_andesite` |
| windows, lower lights | `glass_pane` |
| windows, transoms (the upper row of 2-high windows and the attic) | `light_gray_stained_glass_pane` (gives a multi-pane steel-sash read) |
| clock dial / backlight / bezel / hands | `white_stained_glass` / `glowstone` / `oxidized_copper` / `black_concrete` |
| tower pyramid | `deepslate_tile_stairs` over `deepslate_tiles` (grey metal roof) |
| lantern frame and roof | `polished_deepslate`, `polished_deepslate_slab`; glass `glass_pane`; finial `lightning_rod` |
| roof decks | `smooth_stone` (slab y 36), `smooth_stone_slab` (bottom) on top |
| bulkheads | `calcite`, louvres `iron_trapdoor` (open) |
| doors | `dark_oak_door`; storefront glass `glass_pane` |
| canopy | `polished_deepslate_slab` on `chain` (1.21.1 id; the toolkit knows it as `iron_chain`, so write `chain`) |
| sidewalk / curb | `smooth_stone` / `polished_andesite` |
| interior floor plates (they show through glass) | `smooth_stone` |
| warm loft lights | `shroomlight` set in the ceiling 1 inside a window |

## OPENINGS

Every window column in the FACADES table is an opening, 3 wide (or 1 wide), recessed 1 block, at every storey row listed there. The wall-building part leaves them as air, and the glazier fills them.

| opening | where | size |
|---|---|---|
| MAIN ENTRANCE (Main St) | in the tower base, x 1, z 22..24, y 2..5 (opening), arched head y 5 | 3 wide, recessed vestibule x 1..3. A bottom `smooth_stone_slab` ramp at x 1 (y 1, stand 1.5) from the sidewalk (stand y 1), a landing at x 2..3 (floor block y 1, stand y 2). Doors at x 4: a `dark_oak_door` pair at z 22..23, glass sidelight z 24, transom glass y 4..5. Lanterns hang either side under the arch at (1, 5, 21) and (1, 5, 25) |
| WASHINGTON ST ENTRANCE | east wing x 30, z 21..22, y 2..4 | a double `dark_oak_door` (level: floor y 1 = sidewalk stand y 2). Glass transom y 4, canopy above at y 5 |
| Wing loading door | x 30, z 29..31, y 2..4 | 3 wide, glazed `glass_pane` (former loading bay) |
| Ground-floor storefront windows | every window column on the W, N and S faces, y 2..4 | 3 wide, arched heads |
| Tower arched windows | see the FACADES table, y 37..40 | 3 and 1 wide |
| Bulkhead roof doors | A: z 30, x 13, y 37..38; B: z 35, x 19, y 37..38 | 1 wide `dark_oak_door` |

## RESERVED (the shell leaves these empty)

- The clock disc cells on all 4 tower faces: W x 1 / E x 13, z 20..26, y 42..48; N z 17 / S z 29, x 4..10, y 42..48. Also the backlight layer 1 inside each one (x 2, x 12, z 18, z 28 over the same spans).
- The pyramid's stair rings y 51..56 and the lantern box x 5..9 z 21..25 y 58..61 (the roofer's part).
- The entrance vestibule x 1..3 z 22..24 y 1..5 and the door cells at x 4. The canopy at x 31 z 20..23 y 5.
- The street-tree cells and the lamp-post cells listed in SITE.
- The window recess column (1 cell in from the wall line) at every opening, for the glazier.

## FLOORS (y = the floor block; you stand 1 above it)

| mass | floors (floor block y) | clear height | interior volume |
|---|---|---|---|
| Main block | ground y 1; then y 6, 9, 12, 15, 18, 21, 24, 27, 30, 33; roof slab y 36 | ground 4, the rest 2 | x 2..22, z 2..41 (x 2..21 at z 8..10) |
| Tower above the roof | y 36 (the roof); clock room floor y 41; deck y 57 | 4 and 7 | x 2..12, z 18..28. The clock room x 3..11 z 19..27 y 42..48 holds the glowstone backlight and the clock works |
| Glass lantern | y 57 | 2 | x 6..8, z 22..24 |
| East wing | y 1, y 4; roof y 7 | 2 each | x 24..29, z 12..32; x 24..27, z 34..41 |

Storey count: ground + 10 lofts + attic + 3 tower stages, which reads as about 15 storeys.
Lighting: at least 25% of the windows lit warm (shroomlight in the ceiling behind), spread irregularly, more on the north face.
The roof decks are bottom slabs (no spawning there), and lanterns on posts stand every 8 cells along the parapet's inner side.
The clock dials glow from their backlight. There are lanterns under the tower cornice at the four corners (y 49, hanging) and lamps at both entrances.


# DESIGNER'S SECTIONS

## PALETTE
Body smooth_quartz (+_stairs, _slab); secondary calcite; trim quartz_bricks, quartz_pillar (axis y); plinth polished_andesite (+_stairs,_slab); glass: glass_pane, light_gray_stained_glass_pane; clock: white_stained_glass, glowstone, oxidized_copper, black_concrete; roof: deepslate_tiles, deepslate_tile_stairs, deepslate_tile_slab, polished_deepslate, polished_deepslate_slab, lightning_rod; decks smooth_stone, smooth_stone_slab; louvres iron_trapdoor (open); dark_oak_door; chain (axis y); lantern; shroomlight; oak_fence; oak_log, oak_leaves (persistent true); polished_andesite_slab curb. All ids verified with $MCD blocks --check (chain is the 1.21.1 id).

## VOCABULARY
- pier(g,x,z,y0,y1,mat): column of smooth_quartz at the wall line.
- spandrel(g,box): smooth_quartz band between window rows (y 6 uses quartz_bricks).
- loftWindow(g,face,at,w,y0,h): opening 3 wide set 1 in; glass_pane on the lowest row(s), light_gray_stained_glass_pane top row; panes connected.
- groundBay(g,face,at): quartz_pillar piers, plinth polished_andesite y0..1, glass y2..4, upside-down smooth_quartz_stairs head y5.
- cornice(g,box): y36 upside-down smooth_quartz_stairs facing out, y37..38 parapet, smooth_quartz_slab cap.
- towerFace(g,face): 2-wide smooth_quartz corner piers, 9-wide calcite panel 1 in y6..48, arched windows y37..40 (upside-down stairs at outer cells), y41 top slab course.
- clockFace(g,centre,face): call clock() radius 2, time 10:10, dial white_stained_glass, bezel oxidized_copper, hands black_concrete; glowstone behind.
- capRing(g,box,y): ring of deepslate_tile_stairs facing out over a deepslate_tiles course; 3 rings y51..56.
- lantern box(g): posts polished_deepslate, panes, slab roof, lightning_rod.
- bulkhead(g,box,h): calcite box, slab coping, iron_trapdoor open louvres, door.
- door(g,pos,facing): dark_oak_door both halves, sidelight glass, transom.
- canopy(g): polished_deepslate_slab at (31,5,20..23) hung on chain at ends.
- warmWindow(g,pos): shroomlight one cell inside, in ceiling of a window.
- lampPost(g,x,z): 3 oak_fence + lantern. planeTree(g,x,z): oak_log 5 high, oak_leaves crown to y12 irregular.

## ROOMS
Exterior-only build; only what shows through glass. Floor plates smooth_stone, warm shroomlight.
1. Clock room: x3..11 y42..48 z19..27, glowstone backlight behind each dial, clock works (iron bars, a few gears of dark blocks); reached by none (sealed).
2. Glass lantern: x6..8 y58..59 z22..24; empty, lit by a lantern; observation.
3. Main St vestibule: x1..3 y2..4 z22..24; smooth_stone floor y1, lanterns, a plain lobby; doors at x4 z22..23.
4. Lobby (ground): x5..9 y2..4 z20..26; visible through glass; warm lights.

## PARTS
P1 Masonry shell, P2 Facades & windows, P3 Tower & clock, P4 Roofs, cap & lantern, P5 Doors, lighting, canopy, P6 Wing & site (see summary). Entrance (0,2,23) outside main door; street (0,1,23)... ground there g=0 so stand y1.

## Notes
Keep within footprint and y<=61. Leave reserved cells to their trades. Build in order P1..P6.
