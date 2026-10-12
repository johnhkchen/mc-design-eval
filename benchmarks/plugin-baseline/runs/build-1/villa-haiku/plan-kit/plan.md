# villa-haiku: design

## SITE

Footprint x0..35 (36), z0..47 (48), y0..9 (10 courses, ridges at y9). Street at z<0, front (north) at z=0.
Symmetric about x=17.5. Axis: fauces x16..19, atrium centre, tablinum, peristyle centre, triclinium.

Heights: y0 plinth (`polished_andesite`, the whole footprint). y1 floor layer (mosaic, grass in the court). Air y2..5 (4 tall, 2 for a player). Walls y2..5. Roofs y6..9.

Massing, north to south (z):

| z | zone | x extent |
|---|---|---|
| 0..8 | street block: fauces + 4 shops | x0..35 |
| 9..20 | atrium (open court in roof) with wings: cubicula W, kitchen + cubiculum E | atrium x10..25; wings x0..8, x27..35 |
| 21..26 | tablinum (x13..22) and storerooms W (x1..11) and E (x24..34) | |
| 27..41 | peristyle: colonnade ring x8..27, court x12..23 z30..37 | x8..27 |
| 42..47 | triclinium x12..23; storerooms SW x1..10, SE x25..34 | |

Ground: street paving `stone_bricks` at y0, z -4..-1, x12..23 (the approach). Outside the footprint, the ground is the site's own.

Roofs (`$MCD roof` style per band, palette RoofTile; see ROOFS). Roof type: none of the presets fit an inward-court villa, so these are `shed` bands that slope to the courts (the brief's form). The palette takes the red-tile colour and the temple preset's quartz cornice, which is the nearest preset by building type. Run `--dry-run` first and fix every warning; do not bypass a guard rail without `--why`.

ROOFS (union rectangles, low side = the court side):

| id | rect x0..x1, z0..z1 | low | high side (walled) |
|---|---|---|---|
| RA | [0,0,35,8] ∪ [9,8,26,11] | south | z=0 facade to y9 |
| RB | [9,18,26,21] | north | z=21 wall to y9 |
| RC | [9,12,14,17] | east | x=9 wall to y9 (z12..17) |
| RD | [21,12,26,17] | west | x=26 wall to y9 (z12..17) |
| RE | [0,9,8,20] | east | x=0 wall to y9 |
| RF | [27,9,35,20] | west | x=35 wall to y9 |
| RG | [0,22,12,25] | south | z=21 wall to y9 |
| RH | [13,22,22,25] | south | z=21 wall to y9 |
| RI | [23,22,35,25] | south | z=21 wall to y9 |
| RJ-N | [8,26,27,29] | south | z=26 wall to y8 |
| RJ-S | [8,38,27,41] | north | z=41 wall to y8 |
| RJ-W | [8,27,11,40] | east | x=8 wall to y8 |
| RJ-E | [24,27,27,40] | west | x=27 wall to y8 |
| RK-W | [0,28,7,39] | east | x=0 wall to y8 |
| RK-E | [28,28,35,39] | west | x=35 wall to y8 |
| RL-T | [11,42,24,46] | north | z=47 wall to y8 |
| RL-SW | [0,42,10,46] | north | z=47 wall and x=0 to y8 |
| RL-SE | [25,42,35,46] | north | z=47 wall and x=35 to y8 |

Compluvium: NO roof blocks at x15..20, z12..17 (y6..9). The four atrium bands RA (north), RB (south), RC (west), RD (east) stop at its edges.
Fauces pediment: part of RA's front, see VOCABULARY pediment.

Walls and heights: all walls y2..5 except where a roof's high side is walled (listed above; raise those cells to the stated y). Outer walls: x=0 and x=35 for z0..47; z=0 (facade); z=47 (south). Interior walls: 1 thick (listed in OPENINGS).

Walkway and court: walkway (peristyle ambulatory) = x9..10 (W), x25..26 (E), z27..28 (N), z39..40 (S), floor mosaic. Columns line the court: z29 and z38 rows, x11 and x24 columns. Court (inside the columns) = x12..23, z30..37, grass at y1.

## PALETTE

| role | block | shape variants |
|---|---|---|
| walls (cream plaster) | `smooth_quartz` | none |
| dado (red painted) | `red_terracotta` | none (y2..3 band) |
| columns | `quartz_pillar` (axis y) | capital `quartz_slab` (bottom) |
| plinth, statue plinth | `polished_andesite` | `polished_andesite_slab` |
| floor mosaic field | `white_terracotta` | none |
| floor mosaic border/medallion | `black_terracotta`, `red_terracotta` | none |
| court grass | `grass_block` | none |
| garden paths | `smooth_stone` | `smooth_stone_slab` |
| hedges | `azalea_leaves` (`persistent=true`) | none (1 high) |
| flowers | `rose_bush` (2 high), `cornflower`, `poppy` | none |
| fountain basin rim | `smooth_quartz_slab` | |
| fountain column | `quartz_block` | |
| water | `water` | |
| statue figure | `oxidized_copper` | `oxidized_cut_copper_slab` (cap) |
| doors | `dark_oak_door` (lower, upper) | |
| shutters | `dark_oak_trapdoor` (`open=true`) | |
| windows | `iron_bars` | |
| lamps | `lantern` (`hanging=false`) on `quartz_pillar` stub | |
| plant pots | `flower_pot` with `potted_fern`, `potted_azalea_bush` | |
| roof (tile field) | `bricks` 3 : `red_nether_bricks` 2 | stairs and slabs derived by the roof tool |
| roof eave | `bricks` | |
| roof ridge | `quartz_slab` | |
| roof verge | `quartz_block` | |
| couch frame | `dark_oak_stairs` | facing the table |
| couch cushion | `red_carpet` | |
| table | `dark_oak_slab` on `quartz_pillar` stub | |
| hearth | `campfire` (`lit=true`) on `stone_bricks` | |
| kitchen | `smoker`, `stone_bricks` | |
| storage | `barrel` | |
| beds | `red_bed` (designer checks first with `mcd blocks --check red_bed`) | |
| counters | `smooth_quartz` | |

Checked with `mcd blocks --check`: all ids above are real. `bricks_stairs`, `terracotta_stairs`, `chain`, `brick` are NOT valid (use `brick_stairs` via the roof tool, `iron_chain`, `bricks`).

## VOCABULARY

Named helpers. Every repeated element is one helper; each has an exact construction.

| name | parameters | construction |
|---|---|---|
| `plaster(run)` | a wall run | `smooth_quartz` at y2..5, `red_terracotta` at y2..3 (the dado) |
| `mosaicFloor(box)` | a floor box at y1 | `white_terracotta` field; `black_terracotta` border one cell in from each wall |
| `doorway(x, z, axis)` | the door cell pair | `dark_oak_door` lower at y2, upper at y3 (two leaves, hinge left); `quartz_block` jambs at y2..3 beside; `smooth_quartz` lintel at y4..5 |
| `doorwayFacing(x, z)` | the fauces door | as `doorway`, two leaves at x17 and x18, z=1, facing south |
| `opening(box)` | a box in a wall | `air` (carved) |
| `shutter(x, y0, y1, z, facing)` | a wall cell column | `dark_oak_trapdoor[open=true, facing=<toward the opening's near side>, half=bottom]` on the wall face cell |
| `window(x, z)` | a wall cell | `iron_bars` at y3 and y4 in that cell (1x2) |
| `shopOpening(x0, x1)` | a street opening | carve `air` at z=0, x0..x1, y2..4; `smooth_quartz` counter at z=1, y2, x0..x1; `shutter` on the cells x0−1 and x1+1 at y2..4 |
| `column(x, z)` | a colonnade column | `quartz_pillar[axis=y]` at y2..4; `quartz_slab[type=bottom]` at y5 |
| `lamp(x, z)` | a standing lamp | `quartz_pillar[axis=y]` at y2 (y1 for the street lamps, since the paving is y0); `lantern[hanging=false]` on top |
| `pot(x, z, kind)` | a potted plant | `potted_fern` or `potted_azalea_bush` at y2 on the floor |
| `hedge(run)` | a row of cells at y2 | `azalea_leaves[persistent=true]` |
| `bed(box)` | a planted bed | `grass_block` at y1 (the court floor); `rose_bush` at the corners; `cornflower` and `poppy` at y2 on the rest |
| `couch(run, facing)` | three cells | `dark_oak_stairs[facing=<toward the table>]` at y2 along the run; `red_carpet` at y2 in front |
| `statue(x, z)` | a figure | `polished_andesite` at y2; `oxidized_copper` at y3..4; `oxidized_cut_copper_slab` at y5 (cap, bottom) |
| `impluvium(box)` | the pool | rim `smooth_quartz_slab` at y1, ring of the 6x6; `water` 4x4 at y1 inside |
| `fountain(box)` | the court fountain | rim `smooth_quartz_slab` at y1 (6x6 ring); `water` 4x4 at y1; `quartz_block` column 2x2 at y2..3; `water` on top at y4 (17,4,33) |
| `roofBand(rect, low)` | a roof band | `$MCD roof` style `shed`, `low` = the side named in ROOFS, palette RoofTile, `eave` as the palette |
| `pediment(x0, x1, z)` | the fauces gable | `quartz_stairs` in a triangle at z=0: y6 x16..19, y7 x17..18 (stairs turned to the street) |
| `streetPaving(box)` | the approach | `stone_bricks` at y0, edge `smooth_stone_slab` at z=-1 |

## ROOMS

Each room gets its own interior designer, in parallel. Air boxes are inner (y2..5). The designer does NOT add walls, doors or windows. Furniture stays off the openings' cells and off the impluvium and fountain.

Purpose lines are the brief for the designer. The rooms list below is in the output too.

| room | box | ways in |
|---|---|---|
| fauces | [16,2,2,19,5,7] | door (17..18, 2..3, z=1) from the pocket; opening (16..19, 2..5, z=8) to the atrium |
| shop W1 | [1,2,1,7,5,7] | street opening x2..5 y2..4 at z=0 |
| shop W2 | [9,2,1,14,5,7] | street opening x10..13 y2..4 at z=0 |
| shop E2 | [21,2,1,26,5,7] | street opening x22..25 y2..4 at z=0 |
| shop E1 | [28,2,1,34,5,7] | street opening x30..33 y2..4 at z=0 |
| atrium | [10,2,9,25,5,20] | fauces opening (16..19, 2..5, z=8); doors (9,2..3,10) and (9,2..3,17); doors (26,2..3,10) and (26,2..3,17); tablinum opening (14..21, 2..4, z=21) |
| tablinum | [13,2,22,22,5,25] | opening (14..21, 2..4, z=21) from the atrium; back doorway (16..19, 2..4, z=26) |
| cubiculum W-N | [1,2,9,8,5,13] | door (9,2..3,10) from the atrium |
| cubiculum W-S | [1,2,15,8,5,20] | door (9,2..3,17) from the atrium |
| cubiculum W-P | [1,2,29,7,5,38] | door (8,2..3,33) from the peristyle walkway |
| cubiculum E-P | [28,2,29,34,5,38] | door (27,2..3,33) from the peristyle walkway |
| cubiculum E-S | [27,2,15,34,5,20] | door (26,2..3,17) from the atrium |
| culina (kitchen) | [27,2,9,34,5,13] | door (26,2..3,10) from the atrium |
| triclinium | [12,2,42,23,5,46] | doorway (16..19, 2..4, z=41) from the peristyle south walkway |
| storeroom W | [1,2,22,11,5,25] | door (10,2..3,26) to the peristyle north walkway |
| storeroom E | [24,2,22,34,5,25] | door (25,2..3,26) to the peristyle north walkway |
| storeroom SW | [1,2,42,10,5,46] | door (10,2..3,41) to the peristyle south walkway |
| storeroom SE | [25,2,42,34,5,46] | door (25,2..3,41) to the peristyle south walkway |

Room purposes (for the designers):
- **fauces**: the entrance passage. Narrow, symmetric, mosaic. One lamp pair by the door is on the street side, so inside keep the floor clear for the two-tile walk to the atrium. Potted fern at (16,2,7) and (19,2,7).
- **shops (4)**: shuttered trade rooms. Each has a counter (already built at z=1) and one shelved wall (`bookshelf` or `barrel`) and one pot. Keep the front two cells clear.
- **atrium**: the open heart. Mosaic floor with the impluvium (built already) in the centre. Designer adds only: 4 potted plants at (10,2,15), (25,2,15), (10,2,18), (25,2,18), and a low bench (dark_oak_stairs) along the north wall between x12 and x14 (z=10). Keep the impluvium area and both doorways free.
- **tablinum**: the study. A desk (`dark_oak_slab` on a `quartz_pillar` stub) at the back (z=24) against the peristyle doorway's wall, shelves (`bookshelf`) on the east and west walls, one lamp (`lamp` at (14,2,24)).
- **cubiculum W-N** (x1..8 z9..13): bedchamber. One `red_bed` on the west wall, a chest (`barrel`) at the foot, one pot. Mood: quiet.
- **cubiculum W-S** (x1..8 z15..20): bedchamber for two. Two beds, one on each side, `barrel` between.
- **cubiculum W-P** (x1..7 z29..38): bedchamber facing the peristyle; a window at (0,35..36). One bed, one lamp.
- **cubiculum E-P** (x28..34 z29..38): bedchamber facing the peristyle. Same plan mirrored; one bed and a clothes chest (`barrel`).
- **cubiculum E-S** (x27..34 z15..20): bedchamber. One bed and a `lectern` for a book.
- **culina** (kitchen, x27..34 z9..13): the hearth is in the north-west corner: `campfire[lit=true]` at (31,2,10) on `stone_bricks` at x31..32 z10..11; a `smoker` beside it at (32,2,9)... `stone_bricks` counter along the east wall; `barrel` stores; one pot.
- **triclinium** (x12..23 z42..46): the dining room. Couches on three sides: west (x13, z43..45), east (x22, z43..45), south (z45, x14..21). Each couch is a `couch(run, facing)`. A table in the middle: `dark_oak_slab` on a `quartz_pillar` stub at (17..18, 2, 43..44) (two cells). Keep the centre 2 cells clear beyond the table, and the doorway (16..19, z=42) free.
- **storerooms (4)**: plain floors (mosaic kept), `barrel` and `smooth_quartz` stacks along the walls, one `lamp` each. Storeroom W and E: stacks at the back wall (z=22 for W and E). Storeroom SW and SE: stacks on the outer walls.

## OPENINGS

All coordinates are cells. A "carve" is `air`. Walls are 1 thick.

Street wall z=0 (facade, y2..9 for x0..35):
- Pocket (fauces recess): carve (16..19, 2..5, 0).
- Shop openings (carved): (2..5, 2..4, 0), (10..13, 2..4, 0), (22..25, 2..4, 0), (30..33, 2..4, 0).
- Shutters (open trapdoors, wall cells): (1,2..4,0), (6,2..4,0), (9,2..4,0), (14,2..4,0), (21,2..4,0), (26,2..4,0), (29,2..4,0), (34,2..4,0).
- Pilaster cells at (15,2..5,0) and (20,2..5,0) stay solid.
- Pediment: quartz stairs (see VOCABULARY), at y6..7 above the pocket.

Fauces (z=1):
- Front wall at z=1 for x16 and x19 (y2..5) solid (jambs).
- Door cells (17..18, 2..3, 1): `dark_oak_door` pair. Lintel (17..18, 4..5, 1) solid.

Fauces to atrium (z=8):
- Carve (16..19, 2..5, 8). Lintel is y6+, solid (under RA).

Atrium walls:
- x=9 (z9..20): doors carve (9, 2..3, 10) and (9, 2..3, 17) with doors (`doorway`).
- x=26 (z9..20): doors (26, 2..3, 10) and (26, 2..3, 17).
- z=21 (x0..35): tablinum opening carve (14..21, 2..4, 21); y5 at x14..21 stays solid (lintel).
- Walls x=9 and x=26 raised to y9 at z12..17 (RC, RD high sides).

Tablinum:
- Walls x=12 and x=23 (z22..25) solid.
- z=26 (x0..35): back doorway carve (16..19, 2..4, 26). Doors (10, 2..3, 26) (storeroom W) and (25, 2..3, 26) (storeroom E).

Peristyle:
- x=8 (z27..40): door (8, 2..3, 33) (cubiculum W-P).
- x=27 (z27..40): door (27, 2..3, 33) (cubiculum E-P).
- z=41 (x8..27): triclinium doorway carve (16..19, 2..4, 41); doors (10, 2..3, 41) (store SW), (25, 2..3, 41) (store SE).

Outer windows (iron bars at y3..4):
- x=0: (0,3..4,11..12), (0,3..4,17..18), (0,3..4,35..36).
- x=35: (35,3..4,11..12), (35,3..4,17..18), (35,3..4,35..36).
- z=47 (triclinium): (14..15,3..4,47), (20..21,3..4,47).

Stairs between floors: none (single storey).

## PARTS

Five parts, in build order. Each a 12-minute job. Use `runParts` so a part can only add into air.

1. **shell** (module `parts/shell.mjs`). Plinth y0 across the footprint; floor layer y1 (mosaic everywhere inside, grass in the court, mosaic in the walkways). Every wall in OPENINGS (y2..5, plus the raised cells listed above). Doors, shutters, windows, carved openings. Dado and plaster on every wall. Scope: all of the above, using `plaster`, `mosaicFloor`, `doorway`, `shutter`, `window`, `shopOpening`. Ticks: E01, E02 (door, pocket, jambs, lintel), E03 (openings and shutters), E04 (walls), E17, E19, E22, E23, E25.

2. **roofs** (module `parts/roofs.mjs`). Every ROOFS band with `roofBand`, palette RoofTile, `--dry-run` first. The compluvium void stays open. Pediment at the fauces. Scope: rects and low sides from ROOFS; pediment; no other blocks above y5. Ticks: E06, E18, E02 (pediment), E27.

3. **peristyle** (module `parts/peristyle.mjs`). Columns (`column`) at the N row z=29 (x=11,14,21,24), S row z=38 (x=11,14,21,24), W column x=11 (z=32,35), E column x=24 (z=32,35). Court grass; hedges (`hedge`) on the court perimeter at z=30 (x12..16, x19..23), z=37 (same), x=12 and x=23 (z31..36); path legs (smooth_stone) at x17..18, z27..29 and z38..40; beds (`bed`) at x13..14 z31..36 and x21..22 z31..36 (the statues stand in them); `fountain` at x15..20 z31..36; `statue` at (13,33) and (22,33). Ticks: E08, E09, E10, E11, E12, E13.

4. **atrium** (module `parts/atrium.mjs`). `impluvium` at x15..20 z12..17 (rim at y1, water 4x4 at x16..19 z13..16). Atrium lamps (`lamp`) at (10,2,9), (25,2,9), (10,2,20), (25,2,20). Ticks: E04 (atrium floor), E05, E20 (atrium lamps), E21 (pots at the walkway ends (9,2,28), (26,2,28), (9,2,39), (26,2,39)).

5. **facade** (module `parts/facade.mjs`). Street paving (`streetPaving`) x12..23 z-4..-1 at y0. Street lamps (`lamp`, pillar at y1) at (13,1,-2) and (22,1,-2). Pocket lamps (`lamp`) at (16,2,0) and (19,2,0). Pots (`pot`) at (1,2,1) and (34,2,1), beside the counters of shops W1 and E1 (clear of the counters at x2..5 and x30..33). Ticks: E01 (street), E02 (lamps), E20 (street and pocket), E21 (pots), E26.

## CHECKLIST OF PARTS

- [ ] 1 shell: plinth, mosaic floors, every wall with openings, doors, shutters, windows (E01 E02 E03 E04 E17 E19 E22 E23 E25)
- [ ] 2 roofs: 18 shed bands, palette RoofTile, pediment, compluvium void (E06 E18 E02 E27)
- [ ] 3 peristyle: columns, court, beds, hedges, fountain, statues (E08 E09 E10 E11 E12 E13)
- [ ] 4 atrium: impluvium, atrium lamps (E04 E05 E20 E21)
- [ ] 5 facade: street paving, street and pocket lamps, pots (E01 E02 E20 E21 E26)
- [ ] Rooms (18 interior designers, parallel): fauces, 4 shops, atrium furniture, tablinum, 5 cubicula, culina, triclinium, 4 storerooms (E03 E07 E14 E15 E16 E21 E24)

## NOTES FOR WORKERS

- The front faces north (z=0). The entrance cell [17,1,-1] stands on the street paving at y0.
- Every block id is already checked; use the palette above. Do not invent ids.
- Doors: `dark_oak_door` lower and upper halves at the same x, z; hinge left (the wall-facing side as the door's facing).
- Shutters open (`open=true`); their `facing` points to the opening's side.
- The roof is shed bands with a void. Run `roof --dry-run`; fix every warning; a bypass needs `--why`.
- Interior designers must not block: the doorways, the impluvium, the fountain, the couch cells (triclinium), the counters at z=1.
- If a window or door cell is already air from the shell part, leave it. Do not carve over an earlier part's cells.
- Potted plants and lamps: `flower_pot` is the pot; the plant goes on top as its potted block.
