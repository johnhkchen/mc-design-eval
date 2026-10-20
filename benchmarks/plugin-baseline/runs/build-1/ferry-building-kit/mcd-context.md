# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# Ferry Building — REQUIRED ELEMENTS (coordinates from plan.md; parts P1..P6 per PARTS)

| # | element | construction (block by block) | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Ground | smooth_stone slab-less full block y0, every plot cell | x0..101 z0..79 | P1 | — |
| 2 | Land-front arcade (round arches on piers) | piers calcite y1..10 with smooth_quartz pilaster strip z2 (2 wide), polished_andesite plinth y1; arch = 6 wide y1..7, 4 wide y8..9, 2 wide y10 left as AIR; ring of smooth_quartz_stairs upside-down; keystone quartz_bricks y11 | pier cols x0,7-8,39-40,47,48,55-56,63,64,71-72,79-80; z3..4 | P1 shell, P3 trim | arcadeBay, voussoirArch |
| 3 | Arcade walk, vault, shops, nave arches | walk z5..8 floor polished_andesite, ceiling y12 smooth_stone; inner wall z9 doors dark_oak_door 2 wide y1..3 + gray panes; back wall z14 arches into nave | per bay | P1, P4 | shopDoor |
| 4 | Upper arched windows | 4 wide y15..20, 2 wide y21, gray_stained_glass_pane, sill smooth_quartz_slab y14, smooth_quartz_stairs head | per bay | P4 | archWindow |
| 5 | Cornice + parapet | y26 smooth_quartz, y27 upside-down quartz_stairs z2; y28..29 calcite, diorite_wall balusters, quartz_pillar posts over piers, smooth_quartz_slab rail | all fronts | P3 | cornice, balustrade |
| 6 | Entrance pavilion, 3 tall arches | per plan FACADES: paired quartz_pillar pilasters, arches x11..17/20..26/29..35 open y1..17 + round head to y20, keystone y21, infill set back at z3 | x9..37 z0..3 | P1, P3, P4 | voussoirArch, pilasterPair |
| 7 | Entrance doors | two dark_oak_door pairs per arch (both halves), polished_deepslate post between, transom y4, gray panes y5..20, bottom-slab approach y1 | z3, z0..2 | P4 | doorPair |
| 8 | Name band "FERRY BUILDING" | plaque() block letters on calcite frieze | x11..35 y23..27 z1 | P6 | plaque |
| 9 | Clock tower shaft | 15x15 smooth_quartz y33..69, quartz_bricks alternating quoins, slits, string course y56, cornice y70..71 | x16..30 z1..15 | P2 | quoinCorner, slit |
| 10 | Four clock faces | clock() r4 centre y63: white_concrete dial, black_concrete bezel/hands, 10:10; glowstone behind; N x23 z0, S x23 z16, W x15 z8, E x31 z8 | y58..68 | P5 | clockFace |
| 11 | Belfry stages 1 and 2 | open arches with quartz_pillar columns, diorite_wall sills, cornices; bell on polished_deepslate beam | y72..89 | P2 | belfryStage, bell |
| 12 | Lantern, dome, flagpole | lantern 5x5 posts; dome stairs ring y96, 3x3 y97, slab y98, quartz_pillar y99; end_rod + iron_bars pole, flag wool 2x2 | x21..25 y90..103 | P2 / P5 | dome, flag |
| 13 | Nave roof + skylight | deepslate_tile_stairs/slabs slope 1 per 2, eaves y27, glass monitor z34..44, ribs polished_deepslate every 4 x | z15..63 | P3 roof | naveRoofProfile, skylight |
| 14 | Nave trusses | stripped_spruce_log, every 8 x at x≡4 mod 8 | span z15..63 | P3 roof | truss |
| 15 | Bay-side wall, tall arched windows | polished_andesite wall, stone_bricks pilasters, tall windows y4..20 | z78..79 | P1, P4 | archWindow |
| 16 | Bay gable hall (plot 0) with great lunette | gable triangle y28..37, verge smooth_quartz_stairs, lunette x17..29 | x13..33 z58..79 | P3, P4 | lunette |
| 17 | Plot 2 cross-gables + east gables with lunettes | per OPENINGS | x64..101 | P3, P4 | lunette |
| 18 | Corner block, arcade turning the corner | per plan | x81..101 z2..14 | P1, P3 | arcadeBay |
| 19 | Market stalls | spruce_slab top on barrel, rows z22..24, z54..56 | nave | rooms | stall |
| 20 | Lighting | lantern on chain in arcade bays y10, nave every 8 x, glowstone behind dials, lanterns in belfries | various | P5 | hangLamp |
| 21 | Gallery decks | smooth_stone y12 z15..18 and 60..63, stone_brick_wall rail | nave | P1 | — |
```

### rooms.json

```json
{"entrance":[23,1,-1],"street":null,"entrances":null,"rooms":[{"name":"arcade walk (plot 1)","box":[48,1,5,63,11,8]},{"name":"entrance hall","box":[11,1,3,35,21,14]},{"name":"nave marketplace (plot 1)","box":[48,1,15,63,36,63]},{"name":"bay hall (plot 2)","box":[65,1,65,99,32,77]},{"name":"clock room","box":[17,57,2,29,69,14]}]}
```

### palette.json

```json
{
  "roles": {
    "ground": ["smooth_stone", "smooth_stone_slab"],
    "front-wall": ["calcite"],
    "white-stone": ["smooth_quartz", "smooth_quartz_slab", "smooth_quartz_stairs", "quartz_stairs", "quartz_slab", "quartz_pillar", "quartz_bricks"],
    "balusters": ["diorite_wall"],
    "grey": ["polished_andesite", "polished_andesite_stairs", "polished_andesite_slab", "stone_bricks", "stone_brick_stairs", "stone_brick_wall", "andesite_wall"],
    "roofs": ["deepslate_tiles", "deepslate_tile_stairs", "deepslate_tile_slab", "polished_deepslate", "polished_deepslate_stairs", "polished_deepslate_slab"],
    "trusses": ["stripped_spruce_log"]
  },
  "objects": [
    "glass", "gray_stained_glass_pane", "dark_oak_door", "dark_oak_trapdoor",
    "white_concrete", "black_concrete", "glowstone", "lantern", "chain", "sea_lantern",
    "end_rod", "iron_bars", "white_wool", "red_wool", "blue_wool",
    "spruce_slab", "barrel", "bell", "ladder"
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
// Ferry Building kit: the site grid, the ground, then every part in the order the brief gives. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order. The stair joiner carves its stairwells through the floors and ceilings the shell laid.
const PARTS = [
  ["masonry shell", "parts/shell.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs", { carve: true }],
  ["clock tower", "parts/tower.mjs"],
  ["roofs and cornices", "parts/roofs.mjs"],
  ["windows and doors", "parts/fittings.mjs"],
  ["clock faces and lights", "parts/clock-lights.mjs"],
  ["signs and stalls", "parts/signs-stalls.mjs"],
  ["room: arcade walk (plot 1)", "parts/room-1.mjs"],
  ["room: entrance hall", "parts/room-2.mjs"],
  ["room: nave marketplace (plot 1)", "parts/room-3.mjs"],
  ["room: bay hall (plot 2)", "parts/room-4.mjs"],
  ["room: clock room", "parts/room-5.mjs"],
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
// Shared constants for the Ferry Building kit: palette block ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// Ground and flat decks

// Ground and flat decks
export const SMOOTH_STONE = "smooth_stone";                              // ground course y 0 and flat decks

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";                    // grey bay-side sills, ground slab

// Front wall and white stone (land front, pavilion, tower)
export const CALCITE = "calcite";                                        // land-front walls, upper wall, frieze

export const SMOOTH_QUARTZ = "smooth_quartz";                            // pavilion and tower body, trim, string courses

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";                  // sills, string courses, balustrade rail

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";              // voussoir rings, verges, dome ring

export const QUARTZ_STAIRS = "quartz_stairs";                            // cornices (upside down), lantern cornice

export const QUARTZ_SLAB = "quartz_slab";                                // cap courses

export const QUARTZ_PILLAR = "quartz_pillar";                            // pilasters, columns, balustrade posts, finial

export const QUARTZ_BRICKS = "quartz_bricks";                            // quoins, keystones, pilaster caps

export const DIORITE_WALL = "diorite_wall";                              // balusters

// Grey bay side
export const POLISHED_ANDESITE = "polished_andesite";                    // plinth, bay walls, gables, nave floor

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";      // nave-end coping

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";          // grey slabs

export const STONE_BRICKS = "stone_bricks";                              // bay-side pilasters, plinth detail

export const STONE_BRICK_STAIRS = "stone_brick_stairs";                  // bay-side cornice course

export const STONE_BRICK_WALL = "stone_brick_wall";                      // nave gallery railings

export const ANDESITE_WALL = "andesite_wall";                            // bay-side parapet

// Roofs
export const DEEPSLATE_TILES = "deepslate_tiles";                        // roof covering

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";            // nave slope, hip stairs

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";                // half courses on the slope

export const POLISHED_DEEPSLATE = "polished_deepslate";                  // monitor ribs, ridge, beams

export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs";

export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";

export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";                // interior trusses

// Glass and doors
export const GLASS = "glass";                                            // skylight roof and walls

export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";        // windows (reads dark, like the photo)

export const DARK_OAK_DOOR = "dark_oak_door";                            // both halves

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";                    // shelves, hatches

// Clock, light, flag, bell, stalls, ladder
export const WHITE_CONCRETE = "white_concrete";                          // clock dials

export const BLACK_CONCRETE = "black_concrete";                          // bezels, hour marks, hands

export const GLOWSTONE = "glowstone";                                    // behind each dial

export const LANTERN = "lantern";                                        // hanging and standing lights

export const CHAIN = "chain";                                            // hangs lanterns (1.21.1 name; not iron_chain)

export const SEA_LANTERN = "sea_lantern";                                // monitor ribs if needed

export const END_ROD = "end_rod";                                        // flag finial

export const IRON_BARS = "iron_bars";                                    // flagpole

export const WHITE_WOOL = "white_wool";                                  // flag

export const RED_WOOL = "red_wool";                                      // flag

export const BLUE_WOOL = "blue_wool";                                    // flag

export const SPRUCE_SLAB = "spruce_slab";                                // stall counters

export const BARREL = "barrel";                                          // stall bases, room furniture

export const BELL = "bell";                                              // belfry bell

export const LADDER = "ladder";                                          // tower shaft ladder

// Site (plan.md): the full site is 102 x 105 x 80 blocks, x 0..101, y 0..104, z 0..79
export const SITE = [102, 105, 80];

export const GROUND_Y = 0;                                               // ground course

export const WALK_Y = 1;                                                 // floor level people stand on (y 1)

// Plots, inclusive x0..x1, z 0..79, with the highest block y1
export const PLOTS = {
  plot0: { x0: 0, x1: 47, z0: 0, z1: 79, maxY: 104 },                    // clock tower, entrance pavilion, bay hall
  plot1: { x0: 48, x1: 63, z0: 0, z1: 79, maxY: 38 },                    // wing section (tiles every 16 along x)
  plot2: { x0: 64, x1: 101, z0: 0, z1: 79, maxY: 42 },                   // east end pavilion, corner block, bay hall
};

export const CENTRE_X = 23;                                              // plot 0 axis: pavilion, tower, gable, dial

export const TOWER_X = [16, 30];                                         // tower shaft x (15 wide)

export const TOWER_Z = [1, 15];                                          // tower shaft z

export const NAVE_Z = [15, 63];                                          // nave z span (open hall)

export const BAY_Z = [64, 78];                                           // bay-side bar z span (grey)

export const ENTRANCE = [23, 1, -1];                                     // street cell in front of the entrance (rooms.json)

// Room inner air boxes [x0, y0, z0, x1, y1, z1] (rooms.json)
export const ROOM_BOXES = {
  arcadeWalk: [48, 1, 5, 63, 11, 8],                                     // arcade walk (plot 1)
  entranceHall: [11, 1, 3, 35, 21, 14],                                  // entrance hall
  navemarket: [48, 1, 15, 63, 36, 63],                                   // nave marketplace (plot 1)
  bayHall: [65, 1, 65, 99, 32, 77],                                      // bay hall (plot 2)
  clockRoom: [17, 57, 2, 29, 69, 14],                                    // clock room
};

// A seeded rng: rng(seed)() returns a float in [0, 1), the same sequence for the same seed
export function rng(seed)
```

### vocab/h1.mjs

```js
// Vocabulary, part 1 (h1): arcadeBay, shopDoor, cornice, slit, clockFace, naveRoofProfile, lunette.
// Positions and facings are arguments. Each helper writes only its own footprint and only into air: if any cell
// of its footprint is solid, nothing is written and that cell comes back in `refused`. Pass { over: true } to
// replace solid cells inside the footprint (cutting an opening through a built wall, recolouring a dial face).
// Stairs follow toolkit.md: facing = the side of the full-height back.

/** Arch-bay of an arcade: 8 wide at piers x0..x0+7, front wall at plane z (default 3, the land front). */
export function arcadeBay(g, x0, { z = 3, over = false } = {})

/** Shop door in an inner wall at (x, z): dark_oak_door both halves facing north, a gray pane either side. */
export function shopDoor(g, x, z, { over = false } = {})

/**
 * Cornice course: smooth_quartz at y with upside-down quartz_stairs above, lip toward `face`.
 * north/south: the course runs along x from x0 to x1 at line z. east/west: it runs along z from x0 to x1 (read as
 * z) at line x = z.
 */
export function cornice(g, { x0, x1, y, z, face }, { over = false } = {})

/**
 * Narrow window slit: column x (x for a north/south face, z for an east/west face) from y0 to y1, in the wall whose
 * outer face is plane `at` (z or x). The face cell is open air; a 1-wide gray pane sits recessed 1 block inside.
 */
export function slit(g, x, y0, y1, face, { at, over = false } = {})

/**
 * Clock dial centred at `center` on its wall plane (white dial, black hands and bezel, 10:10 by default), with a
 * 3x3 glowstone panel one block behind it. radius is clamped to 2..4 as the library clock() does.
 */
export function clockFace(g, { center, face, radius = 4, time = "10:10" }, { over = false } = {})

/**
 * Nave roof slope on x0..x1 (plan.md: eaves y27, monitor walls at y36). Along z 15..33 the slope rises 1 per 2
 * cells to the south; the mirror half z 45..63 rises north. Each 2-cell course is a stair (bottom half, back to the
 * rise) then a top slab on the same base, so the surface climbs a half block per cell.
 */
export function naveRoofProfile(g, x0, x1, { over = false } = {})

/**
 * Round-headed window of width w (odd) centred on cx, sill y0, h rows high, in the wall plane z (the opening runs
 * along x) or x (it runs along z). The last `head` rows are the round head, each row inset one more block (the
 * plan's great lunettes: w 13, h 23, head 4). Glass is gray panes, polished_deepslate mullion down the centre and
 * a transom across the spring line (the top body row). Defaults: h = w + 2, head = half-width.
 */
export function lunette(g, { cx, y0, w, h = w + 2, head = (w - 1) / 2, z, x }, { over = false } = {})
```

### vocab/h2.mjs

```js
// Ferry Building kit: seven helpers from plan.md VOCABULARY (voussoirArch, doorPair, balustrade, belfryStage, dome,
// skylight, hangLamp). Each takes its position as arguments and writes only its own footprint, only into air: a cell
// that is not air is refused and reported, never overwritten. Nothing is written below the helper's base row (the
// ground and floors belong to earlier parts). Every helper returns { placed: [[x,y,z]...], refused: [[x,y,z,block]...] }.

/**
 * Round-headed opening with an upside-down stair ring and a keystone. The opening's outline is the arch: the curve starts
 * at row y0 (full width) and steps in one cell a row until the last ring row; quartz_bricks keystone on the top row.
 * The opening inside the ring is air the shell leaves; nothing is cut. width = outline span in x (even), rise = curve rows.
 */
export function voussoirArch(g, { x0, width, y0, z, rise = Math.floor(width / 2) })

/**
 * Two dark oak doors (both halves each) with a polished deepslate post between them and a transom course above.
 * Doors at x0 and x0+2 (hinges outward), post at x0+1 for rows y..y+2, transom row y+3 across x0..x0+2. Doors face north
 * by default (the street side of the land front).
 */
export function doorPair(g, x0, z, { y = 1, facing = "north" } = {})

/**
 * A low balustrade along x from x0 to x1 at row y, in the plane z: diorite_wall balusters, quartz_pillar posts every 4
 * (and at x1), a smooth_quartz_slab rail on the balusters at row y+1. The rail is a bottom slab: a top slab would float
 * half a block above the balusters.
 */
export function balustrade(g, { x0, x1, y, z })

/**
 * One open belfry stage in the box [x0, y0, z0, x1, y1, z1]: quartz_pillar columns at the corners and at colsAt (absolute
 * x on the north/south faces, z on the east/west faces), a diorite_wall sill on row y0 across each opening, flat-headed
 * openings on the faces listed in arches (default all four) with `head` rows of smooth_quartz above them, solid
 * smooth_quartz on the faces that are not open, and a smooth_quartz cornice on row y1. The interior is not written.
 */
export function belfryStage(g, { box: [x0, y0, z0, x1, y1, z1], arches = ["north", "south", "east", "west"], colsAt = [], head = 2 })

/**
 * A stepped dome on a lantern: the 5x5 base at x0..x0+4, z0..z0+4 is a ring of smooth_quartz_stairs at row y (facing
 * inward, stepping in), with a smooth_quartz seat over the 3x3 inside it; then a 3x3 smooth_quartz at y+1, a double
 * smooth_quartz_slab (a full course, so the pillar sits flush) at y+2, and a quartz_pillar at the centre, y+3.
 */
export function dome(g, { x0, z0, y = 96 })

/**
 * A glass clerestory monitor on the nave roof: glass walls on z0 and z1 for rows y and y+1, a glass roof on row y+2
 * across z0..z1, with polished_deepslate ribs (roof cells at x divisible by 4). Defaults are the Ferry nave's monitor.
 */
export function skylight(g, x0, x1, { z0 = 34, z1 = 44, y = 36 } = {})

/**
 * A lantern hanging on a chain from a block above: the lantern at [x, y, z] (hanging=true) and chain cells up to the
 * first solid block. Refuses when there is no block within maxChain cells above (nothing to hang from), and when the
 * lantern would block the 2-high lane over the walking floor (it must sit at least 3 above floor).
 */
export function hangLamp(g, x, y, z, { floor = 1, maxChain = 8 } = {})
```

### vocab/h3.mjs

```js
// Seven Ferry Building helpers from plan.md's VOCABULARY: archWindow, pilasterPair, quoinCorner, bell, flag, truss, stall.
// Each takes its position (and facing, where it has one) as arguments and writes only inside the footprint it owns, and
// only into air: a cell outside the footprint, or one already built, is refused and reported in `refused`, never thrown.
// `overwrite: true` lifts the air rule (for masonry the caller means to replace). Block ids are plan.md's PALETTE, checked
// for 1.21.1 with `mcd blocks --version 1.21.1 --check`.

/** Two quartz_pillar columns at x and x+1 on the plane z: a polished_andesite base at y0, quartz_bricks cap at y1
 *  (the entrance pavilion's pilasters: y0 1, y1 28). */
export function pilasterPair(g, x, z, { y0 = 1, y1 = 28, overwrite = false } = {})

/** Quoins on the 2x2 corner at (x, z) to (x+1, z+1), courses y0..y1. Each course is the corner's L of quartz_bricks: the
 *  2-long stone and the 1-long stone of plan.md meet at the corner cell, and in a 2x2 corner both orders take the same
 *  three cells, so every course is the same set of blocks. */
export function quoinCorner(g, x, z, y0, y1, { overwrite = false } = {})

/** An arched window cut in the wall plane z, facing `face` (north or south: the way the sill and head project to the
 *  street). w by h glazed cells from (x0, y0), a crown row of w-2 panes at y0+h, smooth_quartz stair voussoirs at the crown's
 *  ends, and a smooth_quartz_slab sill (top half) at y0-1, one cell proud of the wall. */
export function archWindow(g, { x0, y0, z, w, h, face, overwrite = false } = {})

/** A ceiling bell at (x, y, z), hung from a polished_deepslate column at y+1..y+3 (the belfry's bell column: y 77 and
 *  78..80). facing: the way the bell faces. */
export function bell(g, x, y, z, { facing = "north", overwrite = false } = {})

/** The flagpole at x, z: end_rod at y, iron_bars to y+3, and a 2x2 of wool on the east at x+1..x+2 (top row y+3, bottom
 *  row y+2). wool: [top-left, top-right, bottom-left, bottom-right]. plan.md names the three wools but not their layout;
 *  the default is white and red over blue and white. */
export function flag(g, x, y, z, { wool = ["white_wool", "red_wool", "blue_wool", "white_wool"], overwrite = false } = {})

/** One nave truss in the plane x, drawn by the trusses tool (trussPlan, the same simulation as `mcd trusses`) under the
 *  finished roof. z0, z1: the walls it spans (the nave's inside is z0+1..z1-1; nave z14 and z64); y: the eave course
 *  (the first air row above the wall). Returns `dropped`, the truss blocks the planner put in other columns, and the report.
 *  Build the roof before calling it: the truss measures the roof it finds. */
export function truss(g, x, { y = 27, z0 = 14, z1 = 64, material = "stripped_spruce_log", overwrite = false } = {})

/** A market stall: three barrels in a row along x at (x..x+2, y, z) with a spruce_slab counter on top at y+1. The floor
 *  is the nave's stand course (y 1). room: the box the stall must fit inside (rooms.json); refused outside it. */
export function stall(g, x, z, { y = 1, room, overwrite = false } = {})
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
