# REQUIRED ELEMENTS (Space Needle). Coordinates are plan.md's. P1..P6 = parts in PARTS.

| # | Element | Real construction | Coordinates | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Ground | `smooth_stone` slab of the plot, walk surface y1 | x0..63 z0..63 y0 | P1 | groundPlate |
| 2 | Six legs, hourglass | 2x2 `smooth_quartz` columns, centre per LEG TABLE formula each y; fill the jump cell; exposed ledge where a leg steps = `smooth_quartz_stairs` ascending toward the leg or bottom slab | y1..205 | P1 | legBox, legStep |
| 3 | Foot pads | 4x4 `smooth_quartz` under each leg | y1 | P1 | footPad |
| 4 | Pair ties | 1-high bottom `smooth_quartz_slab` between each pair's legs | y13,25,37,61,73,...193 | P1 | pairTie |
| 5 | Radial ties | bottom slab lines pair-inner-face to core face | y73,97,121,145,169,193 | P1 | radialTie |
| 6 | Core lattice | corner posts + south spine `white_concrete`, faces `iron_bars`, `white_concrete` band ring at each tie level; open shaft inside | x29..35 z29..35 y1..222 | P2 | coreLattice, coreBand |
| 7 | Glass elevator shafts | solid `glass` columns, two on north face | x29..30 and 34..35, z27..28, y2..222 | P2 | elevatorShaft |
| 8 | Gold elevator car | `gold_block` 2x2x3 inside the east shaft (placed AFTER the glass) | x34..35 z27..28 y150..152 | P2 | elevatorCar |
| 9 | Stair ladder in core | `ladder` facing north on spine z35, at x32 z34; trapdoor-free holes at floors | x32 z34 y2..221 | P2 | coreLadder |
| 10 | Pavilion | disc floor `smooth_quartz` r<=14 y1, `glass` wall ring r14 y2..7, 12 `white_concrete` mullions, band y7, roof disc r<=15 y8 with top-slab rim | y1..8 | P2 | ringWall, mullion |
| 11 | Pavilion door + accessible ramp | 3-wide opening z18; landing full `smooth_quartz` y1 (r14.5..18.5, θ345..15); bottom-slab ramp curving NW | see OPENINGS | P2 | pavilionRamp |
| 12 | SkyLine hexagon | soffit y41 + `sea_lantern`/5 cells, floor y42, `gray_stained_glass` wall apothem13 y43..47, 6 white posts, roof y48 with lanterns | y41..48 | P3 | hexCells, skyline |
| 13 | Saucer throat | `gray_concrete` cone shell r4->13 | y196..204 | P4 | coneShell |
| 14 | Saucer underside + 24 ribs | `light_gray_concrete` annuli; `smooth_quartz` rib line one block below soffit, r4..30 every 15° | y205..211 | P4 | coneShell, radialRib |
| 15 | Restaurant | floor y212 r<=30 with hidden lanterns; `gray_stained_glass` ring r24 y213..217, mullions at rib azimuths | y212..217 | P4 | glassRing |
| 16 | Observation deck | floor y218 r<=27, lantern ring r26; `black_stained_glass` ring r21 y219..222; `glass_pane` rail r27 y219..220 | y218..222 | P4 | glassRing |
| 17 | HALO | 90 radial `white_concrete` fins r28..30 y213..221, bottom-slab hoops at y212 and y222, `iron_bars` mid rail r30 y217 | y212..222 | P4 | haloFin, hoop |
| 18 | Stepped roof | discs r22/20/18/16 at y223..226, rim ring as inward-facing `smooth_quartz_stairs` | y223..226 | P5 | roofStep |
| 19 | Orange gold band | drum r<=12: y227 `smooth_quartz`, y228..229 `orange_terracotta` | y227..229 | P5 | drumBand |
| 20 | Dome | `dome(...radius 12 shallow smooth_quartz edge stairs)` | y230..235 | P5 | (dome brush) |
| 21 | Spire + beacon | `white_concrete` y236..239, `end_rod` up y240..257, `sea_lantern` y258 | x32 z32 | P5 | spire |
| 22 | Light, no spawn | hidden `sea_lantern`: core posts/12, floors, soffits, roofs, ramp | per plan | P6 | hiddenLamp |
| 23 | Doors / openings | core doorways x31..33 z29 at y2..4, 43..45, 213..215, 219..221; deck exits at θ0/120/240 (open air) | OPENINGS | P6 (cut by P2/P4) | doorway |
| 24 | Tables in restaurant | fence/wall post + top slab, a few only | room | rooms | table |
