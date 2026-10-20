# Ferry Building kit — architect's plan (FORM)

Scale 1.4 blocks/m. Minecraft 1.21.1 blocks only (use `chain`, never `iron_chain`; no pale oak, no 1.21.4+).
All three modules share ONE cross-section along z (land front north, bay south), so they line up when placed.
Coordinates are absolute (module plots side by side along x). y 0 = ground course; people stand at y 1.

## SITE

| item | value |
|---|---|
| ground | `smooth_stone` at y 0 over every plot cell (x 0..101, z 0..79); nothing below y 0 |
| street | the Embarcadero runs along x at the north (z < 0, off-plot); land front faces north (-z) |
| pavement | z 0..2 in front of the wings stays open ground (the wings' front face is at z 3, so their pilasters and cornice project to z 2 and never leave the plot) |
| bay side | south face at z 78, its cornice and sills project to z 79 |
| plot 0 | x 0..47, z 0..79, max y 104 — clock tower + entrance pavilion |
| plot 1 | x 48..63, z 0..79, max y 38 — wing section (tiles every 16 along x) |
| plot 2 | x 64..101, z 0..79, max y 42 — east end pavilion |

### The shared cross-section (every plot, unless a mass below overrides it)

| band | z | what |
|---|---|---|
| land-front bar (headhouse) | 3..14 | 2 storeys, roof deck y 26, cornice y 26..27, parapet/balustrade y 28..29 |
| — arcade piers / front wall | 3..4 | piers 2 deep; front face z 3 |
| — arcade walk (open loggia) | 5..8 | 4 deep, floor y 1, vaulted ceiling under the upper floor |
| — inner arcade wall | 9 | shop fronts / doors into the nave bar |
| — ground-floor shops | 10..13 | 4 deep rooms |
| — back wall (to nave) | 14 | solid to y 26, open arches at y 1..9 into the nave |
| nave (marketplace) | 15..63 | one tall hall, floor y 1, roof from y 27 at the walls to a glazed monitor ridge at y 38 |
| bay-side bar | 64..78 | 2 storeys, grey; inner wall z 64, outer face z 78, roof deck y 26, cornice y 26..27 (to z 79), parapet y 28 |

### Masses — plot 0 (x 0..47)

| mass | x | y | z |
|---|---|---|---|
| west wing stub (cross-section) | 0..8 | 0..29 | 3..78 |
| east wing stub (cross-section) | 38..47 | 0..29 | 3..78 |
| entrance pavilion (proud of the wings by 2) | 9..37 | 0..32 | 1..14 (face z 1, pilasters/cornice z 0) |
| tower shaft (rises out of the pavilion; its masonry runs down to y 1 inside) | 16..30 (15 wide) | 1..71 | 1..15 (north face flush with the pavilion face, z 1) |
| shaft cornice (projects 1) | 15..31 | 70..71 | 0..16 |
| belfry stage 1 (steps in 1) | 17..29 | 72..81 | 2..14 |
| belfry stage 2 (steps in 2 more) | 19..27 | 82..89 | 4..12 |
| lantern | 21..25 | 90..95 | 6..10 |
| dome | 21..25 at its base, stepping in | 96..99 | 6..10 |
| finial + flagpole | 23 | 100..103 | 8 |
| nave (behind pavilion, as plot 1) | 0..47 | 0..38 | 15..63 |
| bay-side central gabled hall (taller than the bay bar) | 13..33 | 0..38 | 58..78 (its gable on the south face z 78) |
| bay-side bar left / right of the hall | 0..12 and 34..47 | 0..28 | 64..78 |

Centre line of plot 0 is x 23 (pavilion, tower, gable, dial all symmetric about x 23).

### Masses — plot 1 (x 48..63)

| mass | x | y | z |
|---|---|---|---|
| land-front bar | 48..63 | 0..29 | 3..14 |
| nave | 48..63 | 0..38 | 15..63 |
| bay-side bar | 48..63 | 0..28 | 64..78 (cornice to z 79) |

Tiling: x 48 and x 63 are each HALF a pier (1 wide); two plots end to end make a 2-wide pier. Nothing on
x 48 or x 63 may differ from its mirror, so the seam is invisible. No end walls at x 48 / x 63 (open section).

### Masses — plot 2 (x 64..101)

| mass | x | y | z |
|---|---|---|---|
| wing continuation (cross-section) | 64..80 | 0..29 | 3..78 |
| corner block (taller, proud by 1) | 81..100 | 0..34 | 2..14 (north face z 2, east face x 100; cornice to z 1 and x 101) |
| nave, closed by an east gable wall | 64..100 | 0..38 | 15..63 (east wall x 100) |
| bay-side hall (grey), ridge along x | 64..100 | 0..33 | 64..78 |
| two cross-gables on the bay face | 67..79 and 85..97 | 0..33 | 64..78 (gables on z 78) |
| east gable of the bay hall | 100 | 0..33 | 64..78 |

West side x 64: open section (meets the wing), no end wall.

### No stairs to the street
Floor y 1 sits one course above the ground at y 0: every door and arcade opening is entered over a single
`smooth_stone_slab` (bottom) at y 1 in the cell in front of it — no stair, no full step.

## ROOFS

| roof | form | where | height | notes |
|---|---|---|---|---|
| land-front bar | flat deck behind parapet | x full, z 3..14 | deck y 26 (`smooth_stone`), cornice y 26..27, balustrade y 28..29 | hand-built (part of the shell) |
| pavilion | flat deck behind balustrade | x 9..37, z 1..14 | deck y 30, cornice y 29..30, balustrade y 31..32 | hand-built |
| corner block (plot 2) | flat deck behind parapet | x 81..100, z 2..14 | deck y 32, cornice y 31..32, parapet y 33..34 | hand-built |
| NAVE | long low gable, ridge along x, with a glazed monitor along the whole ridge | z 15..63 | eaves y 27 at z 15 and z 63; rises 1 per 2 cells (z 15-16 y 27, z 17-18 y 28 … z 33 y 36); mirror on the south (z 45 y 36 … z 62-63 y 27) | HAND-BUILT by the roof part: `deepslate_tile_stairs` facing the slope, `deepslate_tile_slab` on the half courses; no `$MCD roof` preset gives a 22° slope plus monitor |
| — skylight monitor | glazed clerestory + flat glass roof | z 34..44 (11 wide, centred z 39), whole length of every plot | glass side walls at z 34 and z 44, y 36..37; glass roof y 38 z 35..43 with `polished_deepslate` ribs every 4 x (x ≡ 0 mod 4) and on z 34/z 44 at y 38 | continuous across the seam; x 48 and x 63 ribs are identical |
| bay-side bar | flat deck behind parapet | z 64..78 | deck y 26, cornice y 26..27, parapet y 28 | hand-built |
| plot 0 bay hall | gable, ridge along z at x 23, gable end facing south | x 13..33, z 58..78 | eaves y 27, ridge y 37 (45°, 1:1), ridge cap y 38 | `$MCD roof` style gable (preset `civic` materials, no pediment), `material` deepslate tiles, overhang 1 on the south gable only (z 79), verge `smooth_quartz_stairs`; the north end dies into the nave roof (keep x 16..30 z 15 for the tower) |
| plot 2 bay hall | gable ridge along x at z 71, east gable at x 100 | x 64..100, z 64..78 | eaves y 27, ridge y 33 | hand-built or `$MCD roof` gable, deepslate tiles, overhang 1 to x 101 / z 79 |
| plot 2 cross-gables | two gables facing south | x 67..79 and x 85..97 | eaves y 27, ridge y 33 (ridge along z at x 73 / x 91) | meet the hall roof in valleys; overhang 1 to z 79 |
| plot 2 nave east end | the nave profile (slope + monitor) closed by the gable wall x 100 | x 100 | to y 38 | wall built up to the roof line by the shell, coped with `polished_andesite_stairs` |
| tower stages | cornices y 71, 81, 89, 95; dome y 96..99 | — | — | see FACADES; dome hand-built: 5x5 ring of `smooth_quartz_stairs` y 96, 3x3 `smooth_quartz` y 97, `smooth_quartz_slab` y 98, `quartz_pillar` finial y 99 |

Trusses: the nave roof gets `stripped_spruce_log` trusses (the roof part runs `$MCD trusses` sizing over the
48-wide span; Pratt/Fink expected), every 8 x on x ≡ 4 mod 8 so the rhythm tiles; ties at y 26.

## FACADES

### Land front (north), wings — plots 0, 1, 2 (face z 3; projections at z 2)

| course | y | material | depth |
|---|---|---|---|
| plinth | 1 | `polished_andesite` on every pier | flush |
| arcade piers | 1..10 | `calcite`, pier faces carry a `smooth_quartz` pilaster strip | pilaster 1 proud (z 2), 2 wide on full piers, 1 on half piers |
| arcade arches | openings y 1..10 | voussoir ring `smooth_quartz_stairs` (upside down) round each arch, keystone `quartz_bricks` at the crown y 11 | flush |
| string course | 12 | `smooth_quartz_slab` (top) | z 2 |
| upper wall | 13..25 | `calcite` | flush |
| upper windows | see OPENINGS | sill `smooth_quartz_slab` at y 14, arch head `smooth_quartz_stairs` | sill z 2 |
| cornice | 26..27 | y 26 `smooth_quartz`, y 27 upside-down `quartz_stairs` | z 2 |
| parapet | 28..29 | `calcite` with `diorite_wall` balusters between `quartz_pillar` posts over each pier, `smooth_quartz_slab` rail at y 29 | flush |

Rhythm (8-block bays): pier, 6-wide round arch, pier. Pier columns: x 0 (half), 7..8, 39..40, 47 (half);
48 (half), 55..56, 63 (half); 64 (half), 71..72, 79..80. One arched window above each arch.

### Entrance pavilion (plot 0, face z 1, projections z 0)

| element | position | material |
|---|---|---|
| paired pilasters | x 9..10, 18..19, 27..28, 36..37, full height y 1..28, at z 0 | `quartz_pillar` (axis y), bases `polished_andesite` y 1, caps `quartz_bricks` y 28 |
| wall | x 9..37, y 1..28 | `smooth_quartz` |
| three tall arches | x 11..17, 20..26, 29..35 (7 wide), open y 1..17, round head y 18..20 (crown 3 wide y 20) | voussoirs `smooth_quartz_stairs` upside down, keystone `quartz_bricks` y 21 |
| arch infill | set back to z 3: doors y 1..3 (see OPENINGS), transom `polished_deepslate` y 4, glazed `gray_stained_glass_pane` y 5..20 with `polished_deepslate` mullions at the arch centre x | recessed 2 |
| string course | y 22, x 9..37 | `smooth_quartz_slab` top, z 0 |
| frieze / name band | y 23..27, x 11..35 | `calcite` (reserved for the sign writer: "FERRY BUILDING" in block letters; 5 rows) |
| cornice | y 29..30, x 8..38 at z 0 | y 29 `smooth_quartz`, y 30 upside-down `quartz_stairs` |
| balustrade | y 31..32, x 9..37 | `quartz_pillar` posts every 4 x, `diorite_wall` balusters, `smooth_quartz_slab` rail y 32 |
| returns | x 9 and x 37, z 1..2 | `smooth_quartz` with pilasters |

### Clock tower (plot 0) — white, read first

| stage | y | form | material |
|---|---|---|---|
| base | 33..38 | plain shaft, a `smooth_quartz_slab` string course at y 38 projecting 1 | `smooth_quartz` |
| shaft | 39..69 | 15x15, rusticated 2-wide corners x 16..17, 29..30 / z 1..2, 14..15: alternating long (2) and short (1) quoins, every other course | body `smooth_quartz`, quoins `quartz_bricks` |
| shaft windows | 3 narrow slits per face (1 wide, y 44..50) at x 20, 23, 26 (N/S) and z 6, 9, 12 (E/W) | `gray_stained_glass_pane` | recessed 1 |
| string course under clock | 56 | `quartz_stairs` (upside down), 1 proud | |
| clock faces | centre y 63, radius 4 (11 wide: y 58..68), N face at x 23 z 0 (out 1), S at x 23 z 16, W at x 15 z 8, E at x 31 z 8 | `clock()`: dial `white_concrete`, bezel + hour marks `black_concrete`, hands `black_concrete`, time 10:10; `glowstone` behind each dial (the cell inside the wall) | 1 proud, the bezel fills between the quoins |
| shaft cornice | 70..71 | projects 1 (x 15..31, z 0..16); y 70 `smooth_quartz`, y 71 `smooth_quartz_slab` top deck edge with `quartz_stairs` | |
| belfry 1 | 72..81 | 13x13; balustrade of `diorite_wall` at y 72 in the openings; 3 open arches per face, each 3 wide (N/S x 18..20, 22..24, 26..28; E/W z 3..5, 7..9, 11..13), open y 73..78, arch head y 79 (`smooth_quartz_stairs` upside down at the 2 outer cells); columns `quartz_pillar` between them (x 17, 21, 25, 29 / z 2, 6, 10, 14) | `smooth_quartz` piers, `quartz_pillar` |
| bell | belfry 1 centre x 23, z 8: `bell` attachment ceiling at y 77 hung from a `polished_deepslate` beam y 78..80 | — |
| cornice 1 | 80..81 | projects 1 (x 16..30, z 1..15) | `smooth_quartz` + `quartz_stairs` |
| belfry 2 | 82..89 | 9x9; 2 arches per face 3 wide (N/S x 20..22, 24..26; E/W z 5..7, 9..11), open y 83..86, heads y 87; columns `quartz_pillar` at x 19, 23, 27 / z 4, 8, 12 | |
| cornice 2 | 88..89 | projects 1 (x 18..28, z 3..13) | |
| lantern | 90..95 | 5x5 open: `quartz_pillar` corner posts, openings 3 wide y 91..93, lintel `smooth_quartz` y 94, cornice `quartz_stairs` y 95 projecting 1 (x 20..26, z 5..11) | |
| dome | 96..99 | see ROOFS | `smooth_quartz` |
| flagpole | 100..103 at x 23, z 8 | `end_rod` y 100, `iron_bars` y 101..103; flag `white_wool`/`red_wool`/`blue_wool` 2x2 at x 24..25 y 102..103 z 8 | |

### Nave interior
Open hall z 15..63, floor y 1 `polished_andesite`; a gallery (top-floor walkway) along both sides at y 12
(deck `smooth_stone` at y 12, stand y 13) z 15..18 and z 60..63, railed with `stone_brick_wall`.
Iron-and-timber read: trusses visible, monitor glass overhead.

### Bay side (south) — grey, plots 0, 1, 2 (face z 78, projections z 79)

| course | y | material |
|---|---|---|
| plinth | 1..2 | `polished_andesite` with `stone_bricks` |
| wall | 3..25 | `polished_andesite` |
| tall arched windows | one per 8-bay, see OPENINGS; frame `smooth_stone`, sill `smooth_stone_slab` y 3 at z 79 | |
| pilasters | on the pier columns (same x as the land front), y 1..25, `stone_bricks`, 1 proud (z 79) | |
| cornice | 26..27, `smooth_stone` + upside-down `stone_brick_stairs`, z 79 | |
| parapet | 28, `andesite_wall` | |

Plot 0 central hall gable (x 13..33, face z 78): pilasters `stone_bricks` at x 13..14 and x 32..33 to y 27;
gable triangle y 28..37 `polished_andesite`, raking verge `smooth_quartz_stairs` (overhang to z 79);
great lunette window x 17..29, see OPENINGS; a `quartz_bricks` keystone at its crown.

Plot 2 cross-gables (faces z 78): each gable 13 wide, triangle y 28..33 `polished_andesite`,
lunette window in each; same east gable on x 100 for the bay hall (z 64..78) and the nave end (z 15..63).

### East face (plot 2, x 100; projections x 101)
- corner block return z 2..14: the land-front arcade turns the corner (same courses and materials, `calcite` +
  `smooth_quartz`), corner quoins `quartz_bricks` on x 100 / z 2 full height to y 34.
- nave end z 15..63: grey (`polished_andesite`), pilasters `stone_bricks` at z 15..16, 38..40, 62..63, cornice
  y 26..27, gable wall above following the nave roof profile, one great lunette (OPENINGS).
- bay hall end z 64..78: grey gable with lunette.

## MATERIALS (all checked present in 1.21.1)

| role | block |
|---|---|
| ground | `smooth_stone` |
| land-front walls (wings, corner block) | `calcite` |
| pavilion + tower body | `smooth_quartz` |
| trim: pilasters, cornices, string courses | `smooth_quartz`, `smooth_quartz_slab`, `smooth_quartz_stairs`, `quartz_stairs` |
| columns | `quartz_pillar` |
| quoins, keystones | `quartz_bricks` |
| balusters | `diorite_wall` (rail `smooth_quartz_slab`) |
| plinth / base | `polished_andesite` |
| bay-side walls (grey halls) | `polished_andesite` |
| bay-side trim | `stone_bricks`, `smooth_stone`, `smooth_stone_slab`, `stone_brick_stairs`, parapet `andesite_wall` |
| roofs | `deepslate_tiles`, `deepslate_tile_stairs`, `deepslate_tile_slab`; ribs/ridge `polished_deepslate` |
| skylight | `glass` |
| windows | `gray_stained_glass_pane` (reads dark at a distance, like the photo) |
| doors | `dark_oak_door` |
| clock dial / bezel+hands | `white_concrete` / `black_concrete`; `glowstone` behind |
| light | `lantern` (hung on `chain`), `glowstone`, `sea_lantern` in the monitor ribs if needed |
| nave floor | `polished_andesite` |
| interior trusses | `stripped_spruce_log` |
| flag | `iron_bars` pole, `end_rod`, `white_wool`/`red_wool`/`blue_wool` |

Contrast: white/cream front and tower against the dark deepslate roof and grey bay halls — the brief's glance.

## OPENINGS

All openings are left as AIR by the shell; doors/panes are added later.

### Land front arcade (every 8-bay; plots 0, 1, 2), plane z 3..4
| bay arch openings (x) | 1..6, 41..46 (plot 0); 49..54, 57..62 (plot 1); 65..70, 73..78 (plot 2) |
|---|---|
| shape | full 6 wide y 1..7; y 8..9 the inner 4 (x+1..x+4); y 10 the middle 2 — open to the walk |
| walk-to-shop doors (z 9) | 2 wide, y 1..3, centred on each arch (e.g. x 51..52, 59..60) |
| shop windows (z 9) | `gray_stained_glass_pane` y 2..5 in the arch's remaining 2 cells each side |
| back wall arches (z 14, into the nave) | 4 wide y 1..7 + middle 2 at y 8, centred on each bay (x 50..53, 58..61 …) |

### Upper windows, land front (z 3..4), one per bay
| x | same centre as the arch below: 4 wide (e.g. x 50..53, 58..61), y 15..20, middle 2 at y 21 |

### Entrance pavilion (z 1 .. recessed infill at z 3)
| arches | x 11..17, 20..26, 29..35; open full 7 wide y 1..17; round head y 18 inner 5, y 19 inner 3, y 20 centre 1 |
|---|---|
| doors (z 3) | two `dark_oak_door` pairs per arch: x 12..13 + 15..16, 21..22 + 24..25, 30..31 + 33..34; y 1..2; `polished_deepslate` posts at x 14, 23, 32 |
| approach | `smooth_stone_slab` bottom at y 1 in z 0..2 in front of each arch (a single half step) |

### Tower
clock dials (above); shaft slits y 44..50 (above); belfry openings (above).

### Corner block (plot 2)
| north arches (z 2) | x 83..88 and x 93..98, same arch profile as the wing; walk z 4..8 behind |
| east arches (x 100) | z 5..10, same profile, opening onto the walk |
| upper windows | x 84..87, 94..97 (north) and z 6..9 (east), y 15..20 + middle 2 y 21; plus attic oculi 2x2 at x 85..86, 95..96, y 29..30 |

### Bay side (z 78), one per bay, all plots outside the gabled halls
| tall arched windows | 4 wide centred on each bay (x 2..5, 42..45; 50..53, 58..61; 66..69, 74..77 …), y 4..20, middle 2 at y 21 |
| ground doors | 2 wide y 1..3 at x 51..52 (plot 1 only on one bay) — a service door; elsewhere none |

### Great lunettes
| plot 0 bay gable | x 17..29 (13 wide), y 4..22 full width, then round head: y 23 x 18..28, y 24 x 19..27, y 25 x 20..26, y 26 x 21..25 |
|---|---|
| plot 2 cross-gables | x 69..77 and x 87..95 (9 wide), y 6..24, head y 25 inner 7, y 26 inner 5, y 27 inner 3 |
| plot 2 nave east end (x 100) | z 33..45, y 8..26 + head y 27 inner 11, y 28 inner 9, y 29 inner 5 |
| plot 2 bay hall east end (x 100) | z 68..74, y 6..20 + head y 21 inner 5, y 22 inner 3 |
Glazing: `gray_stained_glass_pane` with `polished_deepslate` radial mullion at the centre column and a transom at the spring line.

## RESERVED (shell leaves empty)

| cells | for |
|---|---|
| pilaster strips at z 2 (wings), z 0 (pavilion), z 79 (bay), x 101 (plot 2) | pilaster/cornice part |
| pavilion frieze x 11..35, y 23..27, z 1 (wall stays calcite, letters set in) | sign writer: "FERRY BUILDING" |
| clock dial cells: the 11x11 disc on each face (N z 0, S z 16, W x 15, E x 31) and the cell behind each | clockmaker (`clock()`), glowstone behind |
| belfry 1 bell column x 23, z 8, y 76..80 | bell + beam |
| flagpole x 23, z 8, y 100..103 and flag x 24..25, y 102..103 | flag |
| nave roof volume z 15..63 above y 27 | roof part (by hand) |
| tower keep x 16..30, z 15, y 27..38 | roofs stop against the tower |
| nave floor stall rows: x ≡ 2..5 mod 8, z 22..24 and z 54..56 (counters) | market stalls (top `spruce_slab` counters on `barrel`s), a 4-wide aisle at z 37..41 kept clear |
| gallery decks z 15..18 and 60..63 at y 12 | gallery part |

## FLOORS

| mass | levels (stand on) | interior volume |
|---|---|---|
| arcade walk | y 1 | z 5..8, y 1..11 (ceiling y 12) |
| land-bar shops | y 1 | z 10..13, y 1..11 |
| land-bar upper offices | y 13 (deck y 12) | z 5..13, y 13..25 (roof deck y 26) |
| pavilion entrance hall | y 1 | x 11..35, z 3..14, y 1..21 (double height), upper landing y 22 deck for the tower stair |
| tower interior | y 33 room on the pavilion deck, then ladder up the shaft (13x13 inside, x 17..29 z 2..14) | clock room y 57..69 (glowstone behind dials), belfry y 72 |
| nave | y 1; galleries y 13 | z 15..63, y 1..~36 |
| bay bar | y 1 and y 13 (deck y 12) | z 65..77, y 1..25 |
| plot 0 bay hall | y 1 (full height, gallery y 13 at z 58..61) | x 14..32, z 58..77, y 1..36 |
| plot 2 corner block | y 1 and y 13; attic y 27 (deck y 26) | x 82..99, z 4..13, up to y 31 |
| plot 2 bay hall | y 1 (open to the gables) | x 65..99, z 65..77, y 1..32 |

Lighting: hanging `lantern` on `chain` in every arcade bay (under each arch crown, y 10), down the nave centre
line every 8 x (from the trusses), and along the galleries; glowstone behind dials; lanterns in each belfry stage.

---
# DESIGNER SECTIONS

## PALETTE
All ids verified with `$MCD blocks --check` (all known except `chain`, which is the 1.21.1 name and absent from the toolkit's newer table: use `chain` anyway; if a helper refuses it, hang the lantern directly under a block).

| role | blocks (+ variants) |
|---|---|
| ground | smooth_stone |
| front wall | calcite |
| white stone | smooth_quartz, smooth_quartz_slab, smooth_quartz_stairs, quartz_stairs, quartz_slab, quartz_pillar, quartz_bricks |
| balusters | diorite_wall |
| grey | polished_andesite (+_stairs, _slab), stone_bricks (+stone_brick_stairs, stone_brick_wall), smooth_stone_slab, andesite_wall |
| roofs | deepslate_tiles, deepslate_tile_stairs, deepslate_tile_slab, polished_deepslate (+_stairs, _slab) |
| glass | glass, gray_stained_glass_pane |
| doors | dark_oak_door (lower+upper), dark_oak_trapdoor |
| clock | white_concrete, black_concrete, glowstone |
| light | lantern, chain, sea_lantern |
| trusses | stripped_spruce_log |
| flag | end_rod, iron_bars, white_wool, red_wool, blue_wool |
| stalls | spruce_slab (top), barrel |
| bell | bell (attachment ceiling) |
| ladder | ladder (tower shaft) |

## VOCABULARY
- `arcadeBay(g, x0, opts)`: 8-wide bay at piers x0..x0+7: calcite wall z3..4 y1..25, arch opening x0+1..x0+6 (6 wide y1..7, 4 wide y8..9, 2 wide y10) as air, ring smooth_quartz_stairs upside-down following the profile, keystone quartz_bricks y11, pilaster smooth_quartz z2 on piers.
- `voussoirArch(g, {x0, width, y0, z, rise})`: air opening with upside-down stairs ring (facing inward) and keystone quartz_bricks.
- `archWindow(g, {x0, y0, z, w, h, face})`: opening w x h plus round head, gray_stained_glass_pane with connection states, smooth_quartz_slab sill (top), stair head.
- `shopDoor(g, x, z)`: dark_oak_door both halves (same facing/hinge, facing north), gray panes beside.
- `doorPair(g, x0, z)`: two dark_oak_door pairs with polished_deepslate post between, transom y4.
- `pilasterPair(g, x, z)`: 2 wide quartz_pillar axis y, polished_andesite base, quartz_bricks cap.
- `cornice(g, {x0,x1,y,z,face})`: smooth_quartz course under upside-down quartz_stairs course.
- `balustrade(g, {x0,x1,y,z})`: diorite_wall row, quartz_pillar post every 4, smooth_quartz_slab (top) rail.
- `quoinCorner(g, x,z,y0,y1)`: alternating 2-long and 1-long quartz_bricks every other course.
- `slit(g, x,y0,y1,face)`: 1-wide gray pane recessed 1.
- `belfryStage(g, {box, arches, colsAt, head})`: open arches, quartz_pillar columns, diorite_wall sill y72, cornice.
- `bell(g, 23,77,8)`: bell attachment ceiling under a polished_deepslate beam.
- `clockFace(g, {center, face, radius:4, time:"10:10"})`: library clock(); glowstone behind.
- `dome(g)`: ring of smooth_quartz_stairs y96, 3x3 smooth_quartz y97, slab y98, quartz_pillar y99.
- `flag(g)`: end_rod y100, iron_bars y101..103, 2x2 wool white/red/blue at x24..25 y102..103.
- `naveRoofProfile(g, x0, x1)`: deepslate_tile_stairs facing slope + deepslate_tile_slab on half courses, z15..33 mirrored 45..63.
- `skylight(g, x0, x1)`: glass walls z34/44 y36..37, glass roof y38, polished_deepslate ribs x≡0 mod 4.
- `truss(g, x)`: stripped_spruce_log Pratt/Fink via `$MCD trusses`.
- `lunette(g, {cx, y0, w, z|x})`: opening plus round head, panes, polished_deepslate mullion at centre and transom.
- `hangLamp(g, x,y,z)`: chain column under a block, lantern hanging=true.
- `stall(g, x, z)`: 3 barrels with spruce_slab top on top.

## ROOMS
Rooms stay modest: each is an inner air volume inside the shell.
See `rooms` in the answer. Stairs: tower is by ladder at x 18, y33..69 (ladder facing east against wall x17, 2x ladder cutouts in decks); upper offices are reached from the pavilion landing at y22 by a flight `flight()` at x 12..13 up to y13? (not required; offices are unfurnished shells).

## PARTS
1. P1 `parts/shell.mjs` Masonry shell: ground, all three plots' walls, floors, decks, every opening as air, gallery decks.
2. P2 `parts/tower.mjs` Tower: shaft, belfries, lantern, dome (stone + clockmaker).
3. P3 `parts/roofs.mjs` Roofer: nave roof, monitor, trusses, bay halls, gables, cornices, parapets.
4. P4 `parts/fittings.mjs` Glazier: windows, doors, lunettes, pavilion infill.
5. P5 `parts/clock-lights.mjs` Clockmaker + lamplighter: four faces, bell, flag, lanterns, glowstone.
6. P6 `parts/signs-stalls.mjs` Sign writer + storeman: name band, stalls, final checks.

## Notes
- Nothing may leave its plot; check x/z bounds before each write. Plot 1 x48 and x63 mirror each other.
- Build order matters: P1 then P3 then P2 (tower keep x16..30 z15).
- Run `$MCD check` and `$MCD fit` after each part.
- P1 shell done (parts/shell.mjs): nave/walk/shop floors are polished_andesite at y0; plot 0 gable triangle (y28..37) and plot 2 cross-gable triangles/east gable walls are in the shell; pavilion arches open z1..3 (infill z3 left air for glazier); walls at plinth not polished_andesite on land front.
- Stairs part: ladder x18 z8 y33..69 facing east (needs the tower to build wall x17 behind it, decks at y33 and y57 with a hole at x18 z8, and a way from the y22 landing up to y33). Rooms at y1 all walk ok; upper offices/gallery decks have no stair (not rooms).
- v3 (owner comment, bay side): parts/bayside.mjs runs after runParts in build.mjs and rebuilds z 73..79 and the x 100 lunettes: fan lights, gallery + shopfronts z 73, MARKETPLACE band, plot 2 terrace (awnings, tents, cafe umbrellas). Plot 1 still mirrors about x 55.5.
