# Presidio fill kit — architect's plan (form)

Eight modules in a row along x. All coordinates are absolute, inclusive. Front = SOUTH (high z), as the brief says
(the brief overrides the template's "north"; the battery's seaward glacis faces north, low z). x runs along the street.

## SITE

Common rules
- Ground course y 0 = `smooth_stone`, laid only over each module's "ground" box below (footprint + ≤1 apron); everything
  else at y 0 is air. Interiors: y 0 inside the walls is the floor (floor finish listed under FLOORS replaces the stone
  there, flush).
- Ground floors stand on y 0, so every door threshold is at y 1, level with the street: no steps, no ramps anywhere
  except the battery's deck stair.
- Storey grid for all houses: ground storey air y 1–2, floor course y 3, upper storey air y 4–5, roof starts y 6.
- Never exceed the plot box or its height cap.

| plot | module | ground y0 box (x,z) | main body (x0..x1, y0..y1, z0..z1) | other masses |
|---|---|---|---|---|
| 0 | Family house | x0..7, z0..7 | x1..5, y1..5, z1..5 (5×5, 2 storeys) | porch x1..5, y0..3, z6..7; exterior chimney stack x6..7, y1..8, z2..4 |
| 1 | Duplex | x8..17, z0..9 | x9..16, y1..5, z1..8 (8×8, 2 storeys) | centre front bay x11..14, y1..8, z9 (1 proud, Mission parapet); door hoods x10 & x15 at y3, z9 |
| 2 | Garage | x18..23, z0..5 | x19..22, y1..3, z1..4 (4×4, 1 storey, walls y1..2, plate y3) | driveway apron x19..22 z5 (smooth stone) |
| 3 | Shed | x24..27, z0..3 (no apron) | x24..27, y1..2, z0..3 (4×4) | pyramid cap y3..4 |
| 4 | Barracks | x28..43, z0..13 | x30..41, y1..5, z1..9 (12×9, 2 storeys) | 2-storey colonnaded gallery x30..41, y0..6, z10..12; end chimneys x28..29 & x42..43, y1..9, z6..8; apron row z13 |
| 5 | Hall | x44..63, z0..19 | nave x47..60, y1..5, z1..16 (14×16, one tall storey) | aisles x45..46 & x61..62, y1..2, z3..14 (lean-tos); front arcade x49..58, y1..4, z17..18; front gable parapet + espadaña belfry x52..55, y6..10, z16 |
| 6 | Officers' house | x64..75, z0..11 | x66..73, y1..5, z1..7 (8×7, 2 storeys) | porch x66..73, y0..3, z8..10; end chimneys x64..65 & x74..75, y1..8, z3..5; dormers x66..68 & x71..73, y7..8, z5..6; apron z11 |
| 7 | Coastal battery | x76..93, z0..23 | emplacement x77..92, y1..3, z8..21 (deck top surface y3, walk at y4) | glacis (earth) x76..93, z0..7, y1..4; parapet x77..92, y1..5, z8..9; side mounds x76 & x93, z0..20; deck stair x84..85, y1..3, z21..23 |

Battery detail (plot 7)
- Glacis, seaward north: earth slope stepping up 1 per 2 rows: y1 top at z0..1, y2 at z2..3, y3 at z4..5, y4 at z6..7
  (dirt filled solid below, `grass_block` top, ~1 in 6 `coarse_dirt`). It meets the parapet face at z8.
- Parapet: z8..9 solid concrete y1..y4, crest course y5 at z8 only (z9 y5 air: the gunners' side). Banquette:
  bottom `smooth_stone_slab` at z10, y4, x78..83 and x86..91.
- Side mounds: x76 and x93, earth y1..y3 for z0..12, y1..y2 for z13..17, y1 for z18..20; grass top.
- Gun pits (2): circles of diameter 6 cut 1 deep into the deck: pit A x78..83 × z11..16, pit B x86..91 × z11..16,
  corners trimmed (each row: z11 & z16 → 2 centre cells ±1, i.e. 4 wide; z12..15 → full 6). Pit air at y3, pit
  floor = y2 top surface. Mounting ring per pit: see RESERVED.
- Traverse between pits x84..85 z10..20: deck walkway (central ammunition way).
- Magazines (rooms) under the rear strip: A x78..83, B x86..91, both y1..2, z18..20; walls x77, x84..85 (solid), x92,
  z17 (north), z21 (rear wall, the land-side facade).
- Deck stair: 2 wide x84..85, climbing north: stair z23 y1, z22 y2, z21 y3 (last step IN the deck layer); solid
  concrete under each step; side cheeks (x83, x86) y1..y2 at z22..23.

## ROOFS

| plot | form | spec for `$MCD roof` (y = first course) | ridge / top | notes |
|---|---|---|---|---|
| 0 | steep front-gable, 45° | preset `cottage`, material `barn-red`, footprint x1..5 z1..5, ridgeAxis z, front s, overhang 1 (covers x0..6, z0..6), y 6 | ridge x3, y8, z0..6 | eaves flare to y5 at x0 and x6. keep: chimney x6..7 z2..4 y1..8 (roof cut back from the stack). Gable triangles z1 and z5 are wall (keep x2..4 y6..7 at z1, z5). |
| 0 porch | shed | by hand: bottom `brick_slab` y3 over x1..5 z6..7 | y3 | sits under the upper windows |
| 1 | low hip (Mediterranean), pitch 0.5 | style `hip`, pitch 0.5, material `red-tile` (granite / polished granite / brick stairs), footprint x9..16 z1..8, overhang 1 (x8..17, z0..9), y 6, contrast false | top ≤ y8 (2×2 cap at x12..13 z4..5) | keep: front bay x11..14 z9 y6..8 (the parapet rises in front of the eave). Dry-run must report top ≤ 8; else pitch 0.4. |
| 1 bay | Mission curved parapet | by hand (wall part): z9, x11..14 y6, x12..13 y7, coping `smooth_sandstone_slab` y8 over x12..13, `smooth_sandstone_stairs` y7 at x11 (facing east) and x14 (facing west) | y8 | the shaped gable is the duplex's signature |
| 1 hoods | door hoods | by hand: `granite_stairs` facing north, y3, z9, x10 and x15 | y3 | |
| 2 | gable, ridge front-to-back | style `gable`, pitch 1, material `slate`, footprint x19..22 z1..4, ridgeAxis z, overhang 1 (x18..23, z0..5), y 3 | ridge x20..21 y5 | eave x18/x23 y3, x19/x22 y4, x20..21 y5 (top slabs). Gable z4 y4 x20..21 white wall. |
| 3 | pyramid | by hand: `deepslate_tile_stairs` ring y3 on x24..27 z0..3 (each facing in), `deepslate_tiles` y3 x25..26 z1..2, `deepslate_tile_slab` (bottom) y4 x25..26 z1..2 | y4 | no overhang (plot is full) |
| 4 | broad side gable, pitch ~0.6 | style `gable`, material `slate`, footprint x30..41 z1..9, ridgeAxis x, overhang 1 (x29..42, z0..10), y 6, pitch 0.6 | ridge z5, y9, x29..42 | keep: chimney stacks x28..29 & x42..43 z6..8 y1..9. Verge boards `smooth_quartz` (white trim). |
| 4 gallery | shed porch roof | by hand: bottom `deepslate_tile_slab` y6 over x30..41 z11..12, continuing the main eave at z10 | y6 | |
| 5 | low front-gable, pitch 0.5 | preset `temple` (red tile, low gable to the front), footprint x47..60 z1..16, ridgeAxis z, front s, overhang 1 sides + north (x46..61, z0..16), 0 at the south (the facade parapet closes it), y 6, pitch 0.5, NO pediment/tympanum (contrast false) | ridge x53..54 y9 | keep: facade z16 x47..60 y6..10 (parapet + belfry). |
| 5 aisles | lean-to | by hand: `granite_stairs` x44 y2 (facing east), x45 y3 (facing east), x46 y4 (facing east), z3..14; mirror x63 y2, x62 y3, x61 y4 (facing west) | y4 | top cells against the nave wall |
| 5 arcade | shed | by hand: `granite_slab` (bottom) y4 at z17 x49..58, `granite_stairs` facing north y4 at z18 x49..58 | y4 | |
| 5 belfry | espadaña cap | by hand: `smooth_sandstone_slab` y10 x52..55 z16 | y10 | |
| 6 | low hip with dormers, pitch 0.5 | style `hip`, pitch 0.5, material `dark-slate`, footprint x66..73 z1..7, overhang 1 (x65..74, z0..8), y 6 | ridge along x at z4, y8 | keep: chimneys x64..65 & x74..75 z3..5; dormers x66..68 & x71..73 z5..6 y7..8 |
| 6 dormers | 2 gabled dormers on the south slope | by hand: walls `white_concrete` x66..68 z5..6 y7 (x71..73 same); window at x67 / x72 z6 y7; roof y8: stairs x66 facing east, x68 facing west (x71 / x73 same), `deepslate_tile_slab` top at x67 / x72 y8 | y8 | |
| 6 porch | flat porch deck | by hand: bottom `deepslate_tile_slab` y3 over x66..73 z8..9, `deepslate_tile_stairs` facing north y3 at z10 | y3 | no balustrade |
| 7 | none (open gun deck) | — | parapet crest y5 | |

Chimneys (chimney builder; `chimney()` after the roof; bricks, band `deepslate_bricks` one course below the top, brick-slab cap)
| plot | wall cell (mouth) | into | fire cell | stack | top |
|---|---|---|---|---|---|
| 0 | [5,1,3] | east | [6,1,3] | x6..7 z2..4 | y8 |
| 4 west | [30,1,7] | west | [29,1,7] | x28..29 z6..8 | y9 |
| 4 east | [41,1,7] | east | [42,1,7] | x42..43 z6..8 | y9 |
| 6 west | [66,1,4] | west | [65,1,4] | x64..65 z3..5 | y8 |
| 6 east | [73,1,4] | east | [74,1,4] | x74..75 z3..5 | y8 |
The duplex, garage, shed, hall and battery have no chimney (variety; stucco Mission/Spanish types).

## FACADES

Plot 0 — Family house (white clapboard, steep red gable to the street)
- Base: none (wall straight off the smooth-stone ground). Corners x1/x5 at z1/z5: `quartz_pillar` (axis y) corner boards y1..5.
- Body `white_concrete`. Floor line y3: string course of `smooth_quartz` all round (flush).
- South face (z5): x2 window y2, x3 door y1..2, x4 window y2; upper windows x2, x4 at y4; gable window x3 y6; gable
  wall x2..4 y6, x3 y7.
- Porch: posts `birch_fence` at x1 and x5, z7, y1..2; `birch_fence` rail at z7 y1 on x2 and x4 (gap at x3 for the way in);
  porch floor y0 `spruce_planks` x1..5 z6..7.
- North (z1): windows x2, x4 at y2 and y4; gable window x3 y6. West (x1): windows z3 at y2 and y4. East (x5): hearth mouth z3 y1, window z2 y4.
- Chimney stack proud on the east, red brick against white: the house's accent.

Plot 1 — Duplex (cream stucco, Mission Revival)
- Body `smooth_sandstone`; no plinth (plain stucco to the ground). Floor line y3: `terracotta` band (flush) on all faces.
- South: main wall z8 at x9..10 and x15..16 only; x9 corner, x10 door W (y1..2), x15 door E (y1..2), x16 corner.
  Front bay x11..14: its front wall at z9 (1 proud), z8 behind it is interior (no wall); windows in the bay front at
  x11 and x14, y2 and y4; centre x12..13 plain stucco (party wall behind), shaped parapet above (see ROOFS).
  Upper windows x10 and x15 at y4 (over each door). Door hoods (granite stairs) at y3, z9.
- Lintels: the y3 terracotta band serves the ground windows; no sills (no course below y2).
- East/west (x16 / x9): windows z3 and z6 at y2 and y4. North (z1): windows x10, x12, x13, x15 at y2 and y4.
- Accents: dark_oak doors, terracotta band, red tile roof.

Plot 2 — Garage
- Body `white_concrete`, corners `smooth_quartz`, plinth y1 `polished_andesite` (grey base course, flush).
- South (z4): garage opening x20..21 y1..2 (double door). Gable x20..21 y4: `white_concrete` plain wall.
- West (x19): window z2 y2. East (x22): side door z2 y1..2. North (z1): window x21 y2.

Plot 3 — Shed
- Body `white_concrete`; door x25 z3 y1..2 (south); window x27 z1 y2 (east), x24 z1 y2 (west). Dark pyramid roof.

Plot 4 — Barracks (red-brown brick, white trim, two-storey colonnade)
- Plinth y1 `polished_andesite` (grey course) on all faces, door cells excepted. Body `bricks` y2..5.
- Floor band y3: `smooth_quartz` string course (flush) on all faces — white trim line.
- Cornice y5 top course: `smooth_quartz` on the long faces (z1 and z9), so the slate eave sits on a white line.
- Corners x30/x41: quoins `smooth_quartz` y2 & y4 (short) alternating with brick.
- South (z9), under the gallery: ground windows y2 at x31, x33, x38, x40; double door x35..36 y1..2; upper windows y4 at
  x31, x33, x38, x40; upper double door x35..36 y4..5 onto the gallery.
- Gallery z10..12: columns `quartz_pillar` (axis y) at z12, x30, x32, x34, x37, x39, x41, y1..5; gallery floor y3
  `spruce_planks` x30..41 z10..12 (ceiling of the lower porch); upper rail `birch_fence` z12 y4 between columns (continuous: x31, x33,
  x35, x36, x38, x40); lower rail none (open, accessible).
  Ground porch floor y0 `spruce_planks` x30..41 z10..12.
- North (z1): windows y2 and y4 at x31, x33, x35, x36, x38, x40; rear door x35..36 y1..2 replaces those two ground windows.
- Ends (x30 / x41): windows z3 at y2, y4; z5 at y2, y4 (chimney stack covers z6..8).

Plot 5 — Hall (Spanish Colonial Revival)
- Body `smooth_sandstone`, no plinth (plain stucco to the ground); door surrounds `terracotta`.
- South facade (z16): arched main door x53..54 y1..3 (door y1..2, arch `smooth_sandstone_stairs` upside-down at y3,
  facing outward); `terracotta` surround x52 & x55 y1..3 and x53..54 y4 (proud 0, colour only).
  Windows x48 and x59 at y2..3 (tall). Above the arcade roof: rose window x53..54 y6..7 (`orange_stained_glass_pane`).
  Gable parapet above the roof line follows it +1: y6 x47..60, y7 x48..59, y8 x50..57, y9 x52..55; coping
  `smooth_sandstone_slab` on the stepped top; belfry x52..55 y8..10 with opening x53..54 y9 (2 bells), cap y10.
- Arcade z17..18: piers x49, x52, x55, x58 (y1..3, `smooth_sandstone`); arches x50..51, x53..54, x56..57 open y1..2
  with upside-down `smooth_sandstone_stairs` at y3 (arch heads); ends x49 / x58 closed at z17..18.
- Nave sides (x47 / x60): clerestory windows y5 at z5, z8, z11 (above the aisle roof). Aisle walls (x45 / x62):
  windows y1..2 at z5, z8, z11 (plain 2-high).
  Nave wall x47 / x60 at ground: open arches into the aisles at z5..6, z8..9, z11..12, y1..2.
- North (z1): windows x50, x57 y2..3; back door x53..54 y1..2.

Plot 6 — Officers' house (Colonial Revival)
- Body `white_concrete`, corner boards `smooth_quartz` x66/x73 y1..5, floor band y3 `smooth_quartz`.
- South (z7): windows y2 at x67, x72; double door x69..70 y1..2; upper windows y4 at x67, x72 and a 2-wide window
  x69..70 y4. Shutters `warped_trapdoor` (dark green) open, flat in z8 beside x67 (x66, x68) and x72 (x71, x73) at y2 and y4.
- Porch: columns `quartz_pillar` y1..2 at z10, x66, x68, x71, x73; floor y0 `spruce_planks` x66..73 z8..10.
- North (z1): windows x67, x72 at y2, y4 with shutters in z0 (x66, x68, x71, x73); back door x70 y1..2.
- Sides (x66 / x73): windows z2 and z6 at y2 and y4, no shutters (chimney stacks z3..5).

Plot 7 — Battery
- Body mix by course: y1 `andesite` with ~1 in 8 `cracked_stone_bricks` (weathered foot), y2..y3 `light_gray_concrete`
  with ~1 in 6 `smooth_stone`; parapet crest y5 `smooth_stone`; deck top (y3 surface) `polished_andesite`.
- Rear wall (z21): two magazine doors (see OPENINGS) each in a recessed frame: `polished_andesite` jambs x79, x82 / x87,
  x90 y1..2, lintel `polished_andesite` y3 over x79..82 / x87..90. Rust streaks: single
  `terracotta` cells at y2 on x79, x82, x87, x90 and y1..2 under the deck edge at x78, x91 (the only rust).
- Deck rear edge (z21, y4): `iron_bars` rail on x77..83 and x86..92 (stair gap at x84..85).

## MATERIALS

| role | block |
|---|---|
| ground course | smooth_stone |
| white wood wall (0, 2, 3, 6) | white_concrete |
| white trim, corner boards, bands, cornice | smooth_quartz (columns quartz_pillar, axis y) |
| cream stucco (1, 5) | smooth_sandstone (stairs/slabs: smooth_sandstone_stairs / _slab) |
| stucco accent band, door surrounds | terracotta |
| brick body (4), chimneys | bricks; chimney band deepslate_bricks; cap brick_slab |
| grey plinth | polished_andesite |
| red roof, house 0 | palette barn-red (mangrove / brick / dark oak; quartz verge) |
| clay-tile roof (1, 5) | palette red-tile (granite, polished granite, brick); hand roofs granite_stairs / granite_slab |
| grey roofs | slate (2, 4); dark-slate (6); shed 3 deepslate_tile_stairs / deepslate_tiles / deepslate_tile_slab |
| porch floors | spruce_planks |
| rails | birch_fence; battery iron_bars |
| shutters | warped_trapdoor (dark green) |
| glass | glass_pane; hall rose window orange_stained_glass_pane |
| doors | 0 birch_door; 1 dark_oak_door; 2 birch_door (double); 3 spruce_door; 4 spruce_door; 5 dark_oak_door; 6 dark_oak_door; 7 iron_door |
| battery concrete | light_gray_concrete, smooth_stone, andesite, cracked_stone_bricks; deck polished_andesite |
| battery earth | grass_block, coarse_dirt, dirt (fill) |
| pit rings / pivot | iron_block / polished_blackstone |
| rust | terracotta |
| bells | bell (attachment ceiling) |
All checked with `$MCD blocks --check`: present and 1.21.1-safe. Do NOT use `chain`/`iron_chain` (renamed after 1.21.1;
hang lanterns directly under blocks or from iron_bars). No pale oak, no 1.21.4+ blocks.

## OPENINGS

(door = 1 wide unless given; all doors y1..2 unless noted; windows `glass_pane` 1×1 unless noted)
| plot | face | doors | windows |
|---|---|---|---|
| 0 | S z5 | x3 | x2 y2, x4 y2, x2 y4, x4 y4, x3 y6 (gable) |
| 0 | N z1 | — | x2 y2, x4 y2, x2 y4, x4 y4, x3 y6 |
| 0 | W x1 | — | z3 y2, z3 y4 |
| 0 | E x5 | hearth mouth z3 y1 (chimney) | z2 y4 |
| 1 | S | x10 z8, x15 z8 | bay z9: x11, x14 at y2 and y4; z8: x10 y4, x15 y4 |
| 1 | N z1 | — | x10, x11, x14, x15 at y2 and y4 |
| 1 | W x9 / E x16 | — | z3, z6 at y2 and y4 |
| 2 | S z4 | x20..21 (double) | — |
| 2 | E x22 / W x19 / N z1 | E z2 | W z2 y2; N x21 y2 |
| 3 | S z3 | x25 | E x27 z1 y2; W x24 z1 y2 |
| 4 | S z9 | x35..36 (double); upper x35..36 y4..5 (double) | x31, x33, x38, x40 at y2 and y4 |
| 4 | N z1 | x35..36 (double) | x31, x33, x38, x40 at y2 and y4; x35, x36 y4 |
| 4 | W x30 / E x41 | hearth mouths z7 y1 | z3, z5 at y2 and y4 |
| 5 | S z16 | x53..54 y1..2 (double; arch head y3) | x48, x59 y2..3; rose x53..54 y6..7; belfry opening x53..54 y9 |
| 5 | arcade z18 | arches x50..51, x53..54, x56..57 y1..2 (open) | — |
| 5 | N z1 | x53..54 (double) | x50, x57 y2..3 |
| 5 | aisles x45 / x62 | — | z5, z8, z11 y1..2 |
| 5 | nave x47 / x60 | inner arches z5..6, z8..9, z11..12 y1..2 (to aisles) | clerestory z5, z8, z11 y5 |
| 6 | S z7 | x69..70 (double) | x67, x72 at y2, y4; x69..70 y4 |
| 6 | N z1 | x70 | x67, x72 at y2, y4 |
| 6 | W x66 / E x73 | hearth mouths z4 y1 | z2, z6 at y2 and y4 |
| 6 | dormers z6 | — | x67 y7, x72 y7 |
| 7 | rear z21 | magazine A x80..81, B x88..89 (double iron_door) | — |

## RESERVED (shell leaves air / does not build here)

- Every opening above.
- Chimney cells (all stacks, fire cells, hearth mouths) — chimney part only.
- Plot 0 porch posts/rail cells x1..5 z7 y1..2; porch floor x1..5 z6..7 y0.
- Plot 1 bay parapet z9 x11..14 y6..8 and hood cells x10, x15 y3 z9.
- Plot 4 column cells x30, x32, x34, x37, x39, x41 at z12 y1..5; gallery floor x30..41 z10..12 y3; porch floor y0.
- Plot 5 arch-head stairs y3 at x50..51, x53..54, x56..57 z18 and x53..54 z16; belfry x52..55 z16 y8..10 and bell cells
  x53, x54 y9; rose window cells.
- Plot 6 column cells x66, x68, x71, x73 z10 y1..2; shutter cells (z8 and z0 at y2, y4); dormers x66..68, x71..73 z5..6 y7..8.
- Plot 7: pit air (y3 inside each circle); mounting rings set INTO the pit floor y2: per pit the 12 cells of the 4×4
  ring minus corners centred on the pit (A: x79..82 z12..15; B: x87..90 z12..15) = `iron_block`, the 2×2 centre
  (A x80..81 z13..14; B x88..89 z13..14) = `polished_blackstone` pivot; banquette slabs; deck stair x84..85 z21..23;
  iron-bar rail z21 y4.

## FLOORS

| plot | floor y (finish) | interior volume(s) |
|---|---|---|
| 0 | y0 `spruce_planks` x2..4 z2..4; y3 `spruce_planks` | ground x2..4 y1..2 z2..4; upper x2..4 y4..5 z2..4 (roof above); stair: ladder or 1-wide flight along x2 |
| 1 | y0 `spruce_planks`; y3 `spruce_planks` | two mirror units split by a 2-thick party wall x12..13 (z2..8, stucco, y1..5); unit W x10..11 z2..8, unit E x14..15 z2..8, ground y1..2, upper y4..5, each with its own door |
| 2 | y0 smooth_stone (garage floor) | x20..21 y1..2 z2..3 |
| 3 | y0 smooth_stone | x25..26 y1..2 z1..2 |
| 4 | y0 `spruce_planks`; y3 `spruce_planks` | ground x31..40 y1..2 z2..8 (day room / offices); upper x31..40 y4..5 z2..8 (squad room); stair in the centre bay x35..36 |
| 5 | y0 `polished_granite` (nave), aisles same | nave x48..59 y1..5 z2..15 (one tall hall, open to the roof truss); aisles x46 & x61 y1..2 z4..13; magazine none |
| 6 | y0 `dark_oak_planks`; y3 `dark_oak_planks` | ground x67..72 y1..2 z2..6 (hall centre x69..70, parlour W, dining E); upper x67..72 y4..5 z2..6; attic y6..7 lit by the dormers |
| 7 | magazines y0 `smooth_stone` | A x78..83 y1..2 z18..20; B x86..91 y1..2 z18..20; deck walk level y4 on y3 |

## PALETTE (designer)

Keep the architect's MATERIALS ids exactly. Shape variants:
| role | block | variants |
|---|---|---|
| white wall | white_concrete | — |
| trim | smooth_quartz | smooth_quartz_stairs, smooth_quartz_slab, quartz_pillar |
| stucco | smooth_sandstone | smooth_sandstone_stairs, smooth_sandstone_slab |
| accent | terracotta | — |
| brick | bricks | brick_stairs, brick_slab |
| plinth/deck | polished_andesite | polished_andesite_stairs, polished_andesite_slab |
| red tile | granite, polished_granite, bricks | granite_stairs, granite_slab |
| slate | deepslate_tiles | deepslate_tile_stairs, deepslate_tile_slab |
| floors | spruce_planks, dark_oak_planks, polished_granite | |
| rails | birch_fence, iron_bars | |
| shutters | warped_trapdoor | open |
| glass | glass_pane, orange_stained_glass_pane | |
| doors | birch_door, dark_oak_door, spruce_door, iron_door | |
| concrete | light_gray_concrete, smooth_stone, andesite, cracked_stone_bricks | smooth_stone_slab |
| earth | grass_block, coarse_dirt, dirt | |
| rings | iron_block, polished_blackstone | |
| functional | campfire (lit, with hay_block under), bell, lantern | |
Checked with $MCD blocks --check: all known. No chain/iron_chain; hang lanterns directly under a block.

## VOCABULARY (designer)
Helpers (g = grid; every helper writes only inside its stated box):
1. `corner_boards(g,[x,z],y0,y1)` quartz_pillar axis y.
2. `string_course(g,box,y,block)` flush course on all faces of the body.
3. `window(g,[x,y,z],face)` glass_pane at the opening, with set connections; sill smooth_quartz_slab only if the wall is 2 thick (else none).
4. `door(g,[x,y,z],face,type,{double})` both halves same facing/hinge; facing out (south = +z). Double doors mirror hinges.
5. `door_hood(g,[x,3,z],face)` granite_stairs facing the street, bottom half.
6. `porch_posts(g,{xs,z,y0,y1,block})` birch_fence or quartz_pillar columns; deck at the stated y.
7. `shutter(g,[x,y,z],face,"warped")` open warped_trapdoor flat on the wall (toolkit shutter helper).
8. `mission_parapet(g)` per ROOFS "1 bay": y6 x11..14, y7 x12..13, stairs smooth_sandstone_stairs x11 (facing east), x14 (facing west) at y7, slab coping y8 x12..13.
9. `pyramid_cap(g)` per ROOFS plot 3.
10. `quoins(g,corner,ys)` alternate quartz and bricks on the corner column.
11. `colonnade(g,{xs,z,y0,y1,floorY})` pillars + upper birch_fence rail between pillars.
12. `arch(g,[x0,x1,y,z],face,block)` upside-down stairs (half top) at head y facing outward; jambs full blocks.
13. `belfry(g)` plot 5: piers x52,x55 y8..10 smooth_sandstone, opening x53..54 y9, beam smooth_sandstone_slab y10 x53..54 at z16, two bells (attachment ceiling) hung under it at x53 and x54 y9, cap slab y10.
14. `dormer(g,x0,x1)` per ROOFS "6 dormers".
15. `chimney_for(g,plot)` = `chimney()` with the architect's table.
16. `weathered_concrete(g,box)` y1 andesite 1 in 8 cracked_stone_bricks; y2..3 light_gray_concrete 1 in 6 smooth_stone, hash by position (deterministic).
17. `glacis(g)` earth slope: dirt fill, grass_block top, 1 in 6 coarse_dirt, per Battery detail.
18. `gun_pit(g,x0,z0)` circle trimmed per Battery detail, ring iron_block, pivot polished_blackstone.
19. `magazine_door(g,xDoor)` double iron_door facing south in polished_andesite frame, rust terracotta cells.
20. `deck_stair(g)` 2-wide stairs facing north, solid concrete under each step, cheeks.
21. `lamp_post(g,[x,y,z])` fence/iron_bars post with a standing lantern on top; `ceiling_lantern(g,[x,y,z])` hanging lantern under a solid block.
22. `cypress(g,[x,z],h)` only where plot space allows.

## ROOMS (designer)
Ground rooms floor per FLOORS; doors out to street z+. Interior doorways are 1-wide, y1..2 (or y4..5 upstairs).
- House 0: ground "Parlour" x2..4 y1..2 z2..4, spruce, hearth east at [5,1,3], door [3,1,5]; upper "Bedroom" x2..4 y4..5 z2..4 reached by a ladder at x2 z2 (up the west wall... 1-wide flight is impossible in 3x3; use ladder on the north wall z1 facing south at x3, hole in floor [3,3,2]).
- Duplex: W unit ground x10..11 y1..2 z2..8 (door x10 z8), upper x10..11 y4..5 z2..8; E unit mirrored at x14..15. Stair: flight along z, x10 (E: x15), from z7 north to y3... flight(from [10,1,7] facing north, to y3 ) uses z7..z4.
- Garage x20..21 y1..2 z2..3 (door z4 x20..21).
- Shed x25..26 y1..2 z1..2 (door x25 z3).
- Barracks: ground "Day room" x31..40 y1..2 z2..8, hearths at x30/x41 z7; upper "Squad room" x31..40 y4..5 z2..8; stair flight in the centre bay x35..36 up north from [35,1,8]... leave stair to the joiner inside bay x37..38? Use x37..38 z6..8 (width 2) flight facing north to y3, hole in floor x37..38 z4..8 height; stairs end at z5.
- Hall nave x48..59 y1..5 z2..15 (open to truss), aisles x46 & x61 y1..2 z4..13, arches in nave walls.
- Officers' house: ground x67..72 y1..2 z2..6 (hall centre x69..70, parlour W, dining E), upper x67..72 y4..5 z2..6, attic y6..7 x68..71 z3..5 (ladder at x68 z3). Stair flight x67 from [67,1,3]... along z facing north, hmm centre hall: flight at x69 from z5 to z3.
- Battery magazines A x78..83 y1..2 z18..20, B x86..91 y1..2 z18..20, doors at z21 (x80..81, x88..89).
Mob-proofing: every room gets lanterns hung from the ceiling reaching light 8+.

## PARTS (6)
See the JSON answer. Notes for workers: work only inside your plot box; never place into reserved cells; call `chimney()` directly after the roof; no pale oak; verify with $MCD check and $MCD fit; hand roofs sit on full blocks.

## Notes (shells)
- parts/shells.mjs built plots 0-6 (plot 7 left to the battery part). Walls are rings; openings never written. Hall facade parapet y6..8 at z16 is built (belfry/rose/coping left to fittings). Garage gable z4 y4 floats until the roof lands under it. Stair holes left open: plot1 x10/x15 z5..7 y3, plot4 x37..38 z5..8 y3, plot6 x69 z3..5 y3, plot0 [3,3,2].
