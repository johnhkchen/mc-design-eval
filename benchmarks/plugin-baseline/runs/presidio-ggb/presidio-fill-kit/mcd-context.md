# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# Required elements (Presidio fill kit)

Part names: P1 shells, P2 roofs, P3 chimneys, P4 openings+trim, P5 battery, P6 lighting+grounds.
Vocab names are in plan.md VOCABULARY. Coordinates are from plan.md (architect's).

## Plot 0 Family house
- [ ] White clapboard walls: `white_concrete` x1..5 z1..5 y1..5, `quartz_pillar` corners, `smooth_quartz` y3 course. P1, `corner_boards`, `string_course`.
- [ ] Steep red roof (barn-red, quartz verge, overhang 1). P2, roof.json.
- [ ] Brick chimney x6..7 z2..4 to y8 with lit campfire at [6,1,3], hay under, flue, band, brick-slab cap. P3, `chimney()`.
- [ ] Front porch: spruce floor y0 x1..5 z6..7, birch_fence posts x1,x5 z7 y1..2, rails x2,x4, brick_slab roof y3 (bottom, over a full-block fence post row so it is supported). P1/P4, `porch_posts`.
- [ ] Door birch_door [3,1,5]; glass_pane windows per OPENINGS. P4, `window`, `door`.
## Plot 1 Duplex
- [ ] Stucco `smooth_sandstone`, terracotta y3 band. P1, `string_course`.
- [ ] Hipped red tile roof (granite family) top <= y8. P2.
- [ ] Two entrances x10, x15 z8, dark_oak_door, granite_stairs hoods y3 z9. P4, `door_hood`.
- [ ] Mission shaped parapet z9 x11..14 y6..8. P4, `mission_parapet`.
## Plot 2 Garage
- [ ] White walls, polished_andesite plinth y1, slate gable roof, 2-wide door x20..21 z4 y1..2 (birch_door pair), side door E z2. P1/P2/P4.
## Plot 3 Shed
- [ ] White shed 4x4, spruce_door x25 z3, deepslate-tile pyramid cap. P1/P2, `pyramid_cap`.
## Plot 4 Barracks
- [ ] Brick body x30..41 z1..9, polished_andesite plinth, quartz bands, quoins. P1, `quoins`.
- [ ] Slate side-gable roof with quartz verges. P2.
- [ ] 2-storey colonnaded gallery z10..12 (quartz_pillar columns z12, spruce floor y3, birch rail y4). P4, `colonnade`.
- [ ] Two end chimneys with fires at [29,1,7] and [42,1,7]. P3.
- [ ] Doors S/N double spruce, upper balcony door. P4.
## Plot 5 Hall
- [ ] Stucco nave x47..60 z1..16, aisles, arcade z17..18 with 3 arches. P1, `arch`.
- [ ] Red tile low gable, aisle lean-tos, arcade shed. P2.
- [ ] Arched door x53..54, rose window (orange pane), belfry x52..55 y8..10 with two bells (attachment ceiling) hung from a beam. P4, `belfry`, `arch`.
## Plot 6 Officers' house
- [ ] White wood, quartz corner boards and band, dark-slate hip roof, two gabled dormers x66..68, x71..73. P1/P2, `dormer`.
- [ ] Wide porch y0 spruce x66..73 z8..10, columns z10, deepslate-tile deck y3. P4, `porch_posts`.
- [ ] Green shutters (warped_trapdoor, open, flat on wall) x66,68,71,73 at y2,y4 z8 and z0. P4, `shutter` (check facing with $MCD states).
- [ ] Two chimneys: fires [65,1,4], [74,1,4]. P3.
## Plot 7 Battery
- [ ] Concrete emplacement x77..92 z8..21 y1..3, deck polished_andesite y3, weathered course mix. P5, `weathered_concrete`.
- [ ] Earth glacis north z0..7 stepping to y4 plus side mounds x76, x93. P5, `glacis`.
- [ ] Parapet z8..9 y1..4, crest y5 z8. P5.
- [ ] Two gun pits with iron_block rings and polished_blackstone pivots. P5, `gun_pit`.
- [ ] Magazine rooms with iron_door pairs x80..81 and x88..89 at z21, polished_andesite frames. P5, `magazine_door`.
- [ ] Deck stair x84..85 z21..23 (stairs, last step in deck layer). P5, `deck_stair`.
- [ ] Iron-bar rail z21 y4. Rust terracotta cells. P5.
## Whole kit
- [ ] Light so no mob spawns: lanterns inside every room (hanging from ceiling), outside lanterns by doors; battery deck, glacis and gun pits lit with lanterns standing on iron_bars/fence posts. P6, `lamp_post`, `wall_lantern`.
- [ ] Presidio feel: cypress/eucalyptus trees (spruce_log + dark leaves, persistent) just outside the 1-block apron are NOT allowed; use only inside plot air where free: small cypress at plot 6 x64 z9? No — keep within plots; one cone cypress in plot 2 x18,z5 not blocking. P6, `cypress`.
```

### rooms.json

```json
{"entrance":[3,1,6],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"ground":["smooth_stone","smooth_stone_slab"],"white_wall":["white_concrete"],"trim":["smooth_quartz","smooth_quartz_stairs","smooth_quartz_slab","quartz_pillar"],"stucco":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab"],"accent":["terracotta"],"brick":["bricks","brick_stairs","brick_slab","deepslate_bricks"],"plinth":["polished_andesite","polished_andesite_stairs","polished_andesite_slab"],"red_tile":["granite","polished_granite","granite_stairs","granite_slab"],"slate":["deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab"],"roof_barn_red":["mangrove_planks","dark_oak_stairs","dark_oak_slab"],"floor_wood":["spruce_planks","dark_oak_planks"],"rail":["birch_fence","iron_bars"],"shutter":["warped_trapdoor"],"glass":["glass_pane","orange_stained_glass_pane"],"door":["birch_door","dark_oak_door","spruce_door","iron_door"],"battery_concrete":["light_gray_concrete","andesite","cracked_stone_bricks"],"earth":["grass_block","coarse_dirt","dirt"],"ring":["iron_block","polished_blackstone"],"White walls, porch columns and trim":["white_concrete","birch_planks","smooth_quartz","smooth_quartz_stairs","smooth_quartz_slab","birch_fence"],"Cream stucco and stepped arches":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab"],"Barracks walls, chimneys and red gabled roofs":["bricks","brick_stairs","brick_slab","brick_wall"],"Duplex hipped roof and battery rust accents":["polished_granite","polished_granite_stairs","polished_granite_slab"],"Grey roofs, eaves, ridges and dormers":["cobbled_deepslate","cobbled_deepslate_stairs","cobbled_deepslate_slab"],"Windows and shutters":["glass_pane","green_terracotta","spruce_trapdoor"],"Entrances and garage door":["birch_door","spruce_door","birch_trapdoor","iron_door","stone_button"],"Ground course and apron":["smooth_stone","smooth_stone_slab"],"Battery concrete, parapets and stairs":["light_gray_concrete","andesite","andesite_stairs","andesite_slab","cracked_stone_bricks","stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall","iron_bars"],"Lighting":["lantern"],"Embankment and contained shrubs":["dirt","grass_block","oak_leaves"]},"objects":["campfire","hay_block","bell","lantern","birch_door","spruce_door","iron_door","stone_button","birch_trapdoor","spruce_trapdoor","glass_pane","birch_fence","iron_bars","brick_wall","stone_brick_wall","green_terracotta","polished_granite","oak_leaves","grass_block","dirt"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file that replaces build.nbt only once the build has finished.
set -e
cd "$(dirname "$0")"
tmp=".build.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Presidio fill kit: the ground, then the six parts in order under the roof. Usage: node build.mjs <out.nbt>
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, PLOTS, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the parts, in build order; each is { name, module } as plan.md's PARTS
const PARTS = [
  { name: "Masonry shells", module: "parts/shells.mjs" },
  { name: "Roofs", module: "parts/roofs.mjs" },
  { name: "Chimneys", module: "parts/chimneys.mjs" },
  { name: "Openings and trim", module: "parts/fittings.mjs" },
  { name: "Coastal battery", module: "parts/battery.mjs" },
  { name: "Lighting and grounds", module: "parts/grounds.mjs" },
];

// a part whose module is missing or broken is skipped with a warning, so make.sh still writes a build
async function partBuild({ name, module }) {
  try {
    const mod = await import(pathToFileURL(resolve(here, module)).href);
    if (typeof mod.build === "function") return mod.build;
    console.warn(`${name}: ${module} exports no build(); skipped`);
  } catch (e) {
    console.warn(`${name}: ${module} not loaded (${String(e.message).split("\n")[0]}); skipped`);
  }
  return () => {};
}

// the ground course: smooth stone over each plot box, nothing else at y0 (this is laid before runParts, so parts may use it)
function ground() {
  const g = new Grid(SITE.size, { dataVersion: DATA_VERSIONS["1.21.1"] });
  for (const p of PLOTS) g.fill([p.x0, GROUND_Y, p.z0], [p.x1, GROUND_Y, p.z1], `minecraft:${SMOOTH_STONE}`);
  return g;
}

const list = [];
for (const part of PARTS) list.push([part.name, await partBuild(part)]);

const options = { palette: resolve(here, "palette.json"), report: resolve(here, "parts-report.json") };
let g = ground();
try {
  runParts(g, list, { ...options, roof: resolve(here, "roof.json") });
} catch (e) {
  // the roof is laid over the shell's walls: until the shells part builds them (stubs build none) it cannot be laid
  if (!/detectEave: no walls found/.test(e.message)) throw e;
  console.warn("roof.json not laid: no walls yet from the shells part; building without the roof");
  g = ground();
  runParts(g, list, options);
}

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Presidio kit: palette block ids (all in palette.json), site coordinates from plan.md, rng.

// ---- site (plan.md SITE, storey grid) ----------------------------------------------------------------------------

// ---- site (plan.md SITE, storey grid) ----------------------------------------------------------------------------
/** Grid size: x 0..93 (eight plots in a row), y 0..11 (belfry cap is the highest block, y10), z 0..23. */
export const SITE = { size: [94, 12, 24] };

/** Ground course y: smooth stone over each plot box; street level, every door threshold at y1. */
export const GROUND_Y = 0;

/** Floor course y of every house (flush string course). */
export const FLOOR_Y = 3;

/** Upper storey air is y4..5; roofs start at y6 (ROOF_Y). */
export const UPPER_Y = 4;

export const ROOF_Y = 6;

/** Plot boxes, inclusive x0..x1 and z0..z1 (the ground course lies over each whole box); cap = height limit y. */
export const PLOTS = [

// ---- palette: block ids, the same names as palette.json (plan.md PALETTE and MATERIALS) ----------------------------
export const SMOOTH_STONE = "smooth_stone"; // ground course

export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // battery banquette

export const WHITE_CONCRETE = "white_concrete"; // white wood walls: plots 0, 2, 3, 6; dormer walls

export const SMOOTH_QUARTZ = "smooth_quartz"; // white trim, corner boards, string courses, verges

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // trim variant

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // trim variant, sills

export const QUARTZ_PILLAR = "quartz_pillar"; // corner boards, porch and colonnade columns (axis y)

export const SMOOTH_SANDSTONE = "smooth_sandstone"; // cream stucco: plots 1, 5; belfry

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs"; // stucco stairs; arch heads; Mission coping

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab"; // stucco slab; parapet coping; belfry cap

export const TERRACOTTA = "terracotta"; // stucco accent band, door surrounds, battery rust

export const BRICKS = "bricks"; // brick body (plot 4), chimneys

export const BRICK_STAIRS = "brick_stairs"; // brick variant

export const BRICK_SLAB = "brick_slab"; // chimney cap

export const DEEPSLATE_BRICKS = "deepslate_bricks"; // chimney band one course below the top

export const POLISHED_ANDESITE = "polished_andesite"; // grey plinth; battery deck; magazine frames

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // plinth/deck variant

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // plinth/deck variant

export const GRANITE = "granite"; // red tile roofs (plots 1, 5)

export const POLISHED_GRANITE = "polished_granite"; // red tile; hall nave floor

export const GRANITE_STAIRS = "granite_stairs"; // clay-tile hand roofs; door hoods; aisle lean-tos

export const GRANITE_SLAB = "granite_slab"; // clay-tile hand roof, arcade

export const DEEPSLATE_TILES = "deepslate_tiles"; // shed and grey roofs; dormer tops

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // shed roof ring; porch step

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // shed roof top; dormer top; gallery roof

export const SPRUCE_PLANKS = "spruce_planks"; // porch and gallery floors (plots 0, 4)

export const DARK_OAK_PLANKS = "dark_oak_planks"; // house floors (plot 6)

export const MANGROVE_PLANKS = "mangrove_planks"; // barn-red roof field (plot 0)

export const DARK_OAK_STAIRS = "dark_oak_stairs"; // barn-red roof courses, eave and ridge (plot 0)

export const DARK_OAK_SLAB = "dark_oak_slab"; // barn-red roof soffit and top slabs (plot 0)

export const BIRCH_FENCE = "birch_fence"; // porch and gallery rails, post fences

export const IRON_BARS = "iron_bars"; // battery deck rail; lamp posts

export const WARPED_TRAPDOOR = "warped_trapdoor"; // dark green shutters

export const GLASS_PANE = "glass_pane"; // every window

export const ORANGE_STAINED_GLASS_PANE = "orange_stained_glass_pane"; // hall rose window

export const BIRCH_DOOR = "birch_door"; // plot 0 and plot 2 doors

export const DARK_OAK_DOOR = "dark_oak_door"; // plot 1 and plot 5 and plot 6 doors

export const SPRUCE_DOOR = "spruce_door"; // plot 3 and plot 4 doors

export const IRON_DOOR = "iron_door"; // magazine doors

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete"; // battery body courses y2..3

export const ANDESITE = "andesite"; // battery weathered foot course

export const CRACKED_STONE_BRICKS = "cracked_stone_bricks"; // battery weathered foot, 1 in 8

export const GRASS_BLOCK = "grass_block"; // battery glacis and side mound tops

export const COARSE_DIRT = "coarse_dirt"; // glacis speckle, 1 in 6

export const DIRT = "dirt"; // earth fill under the glacis and mounds

export const IRON_BLOCK = "iron_block"; // gun pit mounting rings

export const POLISHED_BLACKSTONE = "polished_blackstone"; // gun pit pivots

export const CAMPFIRE = "campfire"; // lit chimney fire (hay_block under it)

export const HAY_BLOCK = "hay_block"; // under each chimney campfire

export const BELL = "bell"; // belfry, two bells

export const LANTERN = "lantern"; // room, door and lamp-post lights

// ---- randomness ---------------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving floats in [0, 1) (mulberry32): the same seed always gives the same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Presidio fill kit, helpers group H1 (plan.md VOCABULARY 1, 4, 7, 10, 13, 16, 19, 22):
// corner_boards, door, shutter, quoins, belfry, weathered_concrete, magazine_door, cypress.
//
// Every helper takes its position as arguments. It writes only inside its own footprint, and only into air, unless
// opts.replace names the blocks it may overwrite (the wall it dresses); writing the block already there is a no-op.
// Nothing is written at y0 or below the start of its footprint. Each helper returns { placed, refused }: refused lists
// the cells it wanted but could not write, so the caller can report them.

/** Quartz corner boards on a wall: quartz_pillar (axis y) at [x, z] from y0 to y1. */
export function corner_boards(g, [x, z], y0, y1, opts = {})

/**
 * A door, both halves (lower at y, upper at y+1). [x, y, z] is the lower cell in the wall; face is the way the door
 * looks out (south = +z, facing out), type "birch" | "dark_oak" | "spruce" | "iron" (or with "_door"). double: a second
 * leaf beside it along the wall (+x for north/south, +z for east/west), hinges mirrored. All-or-nothing: if any cell
 * of the door is not air (or in opts.replace), nothing is written and every cell is refused.
 */
export function door(g, [x, y, z], face, type, { double = false, replace = [] } = {})

/** A window shutter: one open trapdoor lying flat on the wall, in the cell outside it. face = the way the wall looks. */
export function shutter(g, [x, y, z], face, wood = "warped", opts = {})

/**
 * Quoins on a corner column: [x, z] is the corner cell, ys the courses to dress (bottom to top). Alternates by course:
 * even positions in ys are smooth_quartz (the short stones), odd positions bricks. The plan's barracks corners are
 * quoins(g, [30, 9], [2, 3, 4, 5], { replace: ["bricks"] }): quartz at y2 and y4, bricks at y3 and y5.
 */
export function quoins(g, [x, z], ys, opts = {})

/**
 * Plot 5's espadaña belfry (plan.md VOCABULARY 13). [x, y, z] is its bottom-left cell (x52, y8, z16 in the plan); the
 * footprint is 4 wide, 3 high, 1 deep. Course y: a sill of smooth_sandstone across (the parapet course). Course y+1:
 * piers at the two ends, air between them where the bells hang. Course y+2: the cap, smooth_sandstone_slab bottom
 * across all four cells (the beam over the bells). Two bells (attachment ceiling, facing `face`) hang under the beam
 * at x+1 and x+2, y+1. Opening: opts.replace may include the parapet's smooth_sandstone so the sill and piers can
 * be written over it; the bell cells must be air.
 */
export function belfry(g, [x, y, z], { face = "south", replace = [] } = {})

/**
 * Battery concrete (plan.md VOCABULARY 16), over the box [x0, y0, z0, x1, y1, z1]. The box's bottom course is the foot:
 * andesite with about 1 in 8 cracked_stone_bricks; the courses above are light_gray_concrete with about 1 in 6
 * smooth_stone. The pick is a hash of the position, so the same box always gives the same mix.
 */
export function weathered_concrete(g, [x0, y0, z0, x1, y1, z1], opts = {})

/**
 * Plot 7 magazine door (plan.md VOCABULARY 19). [x, y, z] is the left door cell in the rear wall (x80 or x88 at y1,
 * z21). Writes a double iron_door facing south (hinges left and right), a polished_andesite frame (jambs at x-1 and
 * x+2, lintel at y+2 over all four cells) and a terracotta rust cell on each jamb at y+1. Its footprint is the frame
 * box; the frame and door cut through the battery's concrete, so the default replace list is the battery's concrete.
 */
export function magazine_door(g, [x, y, z], { replace = CONCRETE } = {})

/**
 * A cypress: spruce_log trunk, a three-course cone of dark_oak_leaves (3x3 ring around the trunk) and a single leaf on
 * top. [x, y, z] is the trunk's bottom cell, y >= 1 (never the ground course); h is the total height, at least 4.
 * Footprint: 3 x h x 3 around the trunk. Leaves are persistent, so they never decay.
 */
export function cypress(g, [x, y, z], h, opts = {})
```

### vocab/h2.mjs

```js
// plan.md VOCABULARY (2): string_course, door_hood, mission_parapet, colonnade, dormer, glacis, deck_stair.
// Every helper takes its own position (and facing) and writes only inside its footprint: into air, or over solid
// blocks only where it says so (string_course { replace: true }). It never writes into ground (y0) or any cell an
// earlier part owns, and never fills an opening. Each returns { placed, refused: [[x,y,z], ...] } for the caller to report.

/** A flush course round the outside of a body: the ring of cells [x0,z0]..[x1,z1] at height y. Default writes only
 *  into air (a proud course); { replace: true } lays it over the walls already there, leaving openings open. */
export function string_course(g, [x0, z0, x1, z1], y, block, { replace = false } = {})

/** A granite hood over a door: one stair cell at [x, y, z] (y = 3 for the door at y1..2), its back against the wall.
 *  face: the way the facade looks (south for a south front); the stair faces into the wall, so the lip faces the street. */
export function door_hood(g, [x, y, z], face)

/** The Mission curved parapet on a 4-wide bay: [x, y, z] is the bay's west cell at the base (y6), z the front wall.
 *  Base row full, middle two up one, stairs at each end curving in, slab coping on the middle two. */
export function mission_parapet(g, [x, y, z])

/** A row of pillars at z with a birch_fence rail between each pair, the rail at floorY + 1 (the gallery's walking
 *  height). xs: pillar x's; pillars run y0..y1 (quartz_pillar, axis y). */
export function colonnade(g, { xs, z, y0, y1, floorY })

/** A gabled dormer x0..x1 (3 wide) over two rows z0..z0+1: white walls at y, a glass pane in the front centre, and a
 *  roof at y+1 with its ridge along z (stairs down each side, a top slab on the ridge). roof: block-family prefix. */
export function dormer(g, x0, x1, z0, y, { roof = "deepslate_tile" } = {})

/** An earth glacis over [x0,z0]..[x1,z1], rising one step per two rows from z0 (y0 is the ground course, untouched).
 *  Rows z0..z0+1 top at y0+1, then +1 every two rows. Dirt below, grass top, about 1 in 6 tops coarse_dirt. */
export function glacis(g, [x0, z0, x1, z1], y0 = 0)

/** A 2-wide deck stair climbing `facing` (3 steps). [x, y, z] = the bottom step's first cell; the width runs to the
 *  right of facing. Solid concrete under each step above the bottom one, and cheeks either side of the first two rows
 *  (two high). The last step sits in the deck layer (y + 2). */
export function deck_stair(g, [x, y, z], facing = "north", { stair = "polished_andesite", concrete = "light_gray_concrete" } = {})
```

### vocab/h3.mjs

```js
// Presidio fill kit, vocabulary helpers (plan.md VOCABULARY, items 3, 6, 8, 9, 12, 15, 18, 21): window, porch_posts,
// pyramid_cap, arch, chimney_for, gun_pit, lamp_post. Each takes its position (and facing) as arguments and writes only
// inside the footprint it is given. Writes go only into air, so an earlier part's cells are refused and reported,
// never overwritten, except where a helper says so: chimney_for ({ over }) and gun_pit (its own pit cut).
// Every helper returns { placed, refused: [[x, y, z, block]] }.

/**
 * A window: one glass pane in the opening at [x, y, z] on the wall's `face` (north, south, east, west). Its side
 * connections are set from what stands beside it now (a solid or a pane connects). thick: 2 gives a quartz sill in the
 * cell under the pane, where that cell is air (a 1-thick wall gets none).
 */
export function window(g, [x, y, z], face, { thick = 1 } = {})

/**
 * Porch columns: xs at z, from y0 to y1 (birch_fence or quartz_pillar). deck (optional): a floor box at deck.y
 * ({ x0, x1, z0, z1, y, block = "spruce_planks" }), air cells only.
 */
export function porch_posts(g, { xs, z, y0, y1, block = "birch_fence", deck })

/**
 * A pyramid cap on the box x0..x1 by z0..z1 (at least 3 x 3): a ring of deepslate_tile_stairs at y, each facing in
 * (the west/east edges face in along x, the north/south edges along z), deepslate_tiles inside the ring at y, and a
 * bottom deepslate_tile_slab on the inner cells at y + 1.
 */
export function pyramid_cap(g, { x0, z0, x1, z1, y })

/**
 * An arch in a north or south wall: upside-down stairs of `material` (its _stairs form) across the opening x0..x1 at
 * head row y, facing the given face (outward, per plan.md); full `material` blocks as the jambs at x0-1 and x1+1 on
 * the same row. z is the wall's row. Air only.
 */
export function arch(g, [x0, x1, y, z], face, material)

/**
 * The chimney for one plot's table entry ("0", "4w", "4e", "6w", "6e"), built by the library's chimney(). Its cells are
 * computed first and each is written only where it is air, so an earlier part's ground or wall is refused and reported
 * (the hay under the fire sits in the ground course, so it is refused). over: true overwrites what is there.
 * Footprint: the fire cell's 3 x 3 column from y0 to the top.
 */
export function chimney_for(g, plot, { over = false } = {})

/**
 * A gun pit at x0..x0+5 by z0..z0+5 (plan.md, Battery detail): the circle cut from the deck (air at y3; the corner
 * cells keep the deck), and inside it at y2 a 4 x 4 ring without its corners: the 2 x 2 centre is polished_blackstone
 * (the pivot), the rest iron_block. The pit owns its box and overwrites only that: it is the cut.
 */
export function gun_pit(g, x0, z0)

/**
 * A lamp on a post at [x, y, z]: a fence post with a standing lantern on its top (at y + 1). Only fence posts: a
 * standing lantern will not stay on iron_bars.
 */
export function lamp_post(g, [x, y, z], { post = "birch_fence" } = {})
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
