# REQUIRED ELEMENTS (butcher's shop house) — coordinates are plan.md's; part = parts/*.mjs

| # | element | construction, block by block | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Redstone shop (ground floor) | sockets A1 deep + A2 shallow left whole; counters/hoppers by runParts; open front y6..8; fascia closes y9..12; back walls z19/z15; aisle partitions `bricks` x14 / x18 z19 | x10..18 y5..12 z5..21 | shell, shopfront | `aislePartition` |
| 2 | Butcher's display | sockets.json `display` A1 pink_terracotta, A2 pink_terracotta,brown_mushroom_block,red_terracotta; `wood` dark_oak all; `fitout.counter` stays | sockets.json | shopfront | `setDisplay` |
| 3 | Shop name board | 9x4 `red_nether_bricks` fascia, "BUTCHER" `plaque` white banner letters, material null | x10..18 y9..12 z5 (letters z4) | shopfront | `fascia` |
| 4 | Striped awning | per column `red_wool`/`white_wool` at z4 y9, open `dark_oak_trapdoor` valance z3 y9; easy swap = tenant colour | x10..18 | shopfront | `awning` |
| 5 | Hanging shop sign | `dark_oak_fence` arm x20 z3..4 y11 off pilaster, `dark_oak_hanging_sign` "BUTCHER" y10 | x20 z3 | shopfront | `hangingSign` |
| 6 | Pilasters + cornice | `stripped_dark_oak_log` axis y x9/x19 z4 y5..11, `dark_oak_planks` y12, upside-down `dark_oak_stairs` z3; `smooth_quartz_stairs` upside-down cornice y13 x4..19 z4 | front | shopfront | `pilaster`, `cornice` |
| 7 | Home entrance (lobby bay) | double `dark_oak_door` x6..7 facing north, fanlight pane y8, hood slab on 2 upside-down stairs, 2 hanging lanterns | x5..8 z4..5 | glazing, shopfront | `doorPair`, `hood` |
| 8 | Brick walls, plinth, quoins, string courses | `bricks`; plinth `polished_deepslate` y5..6; `smooth_quartz` quoins paired, string y18, eaves y23 | all walls | shell | `brickWall`, `quoinPair` |
| 9 | Windows, recessed, sashes | `glass_pane` connected, glass 1 in, `smooth_quartz` lintel + `smooth_quartz_slab` top sill; plan OPENINGS table | all | glazing | `sashWindow` |
| 10 | Shutters (2nd floor) | open `dark_oak_trapdoor` beside each window at z4 | x5/8,10/13,15/18 y19..21 | glazing | `shutterPair` |
| 11 | Roof, dormers, trusses | roof tool, main preset shop + wing preset cottage, dark slate mix, dark_oak verge, trusses stripped_dark_oak_log | plan ROOFS | roof | roof.json |
| 12 | Chimney E + signal smoke | bricks 2x2 stack from y5, `deepslate_bricks` band y29, `brick_slab` top cap y31, `hay_block` y30, lit signal `campfire` y31 at 21,14; flue air | x20..21 z13..14 | hearth | `chimneyStack` |
| 13 | Chimney S (wing) | same, band y24, cap y26, hay y25 + campfire y26 at 8,32 | x7..8 z31..32 | hearth | `chimneyStack` |
| 14 | Hearths | first-floor firebox x18 z13..14 y14..15 (stone floor, lit campfire, upside-down stair lintel, flue into breast); wing range x7..8 z29 y6..7 (lit furnace + smoker, flue to stack S) | | hearth | `hearth` |
| 15 | Stairs between floors | flight 1 `spruce_stairs`... see Vocabulary `stairFlight`; wells, `dark_oak_fence` rails | plan RESERVED | stairs | `stairFlight` |
| 16 | Loft ladder + hatch | `ladder` x16 z21 y19..22 facing north (away from wall), `dark_oak_trapdoor` open at 16,23,20 | | stairs | `ladderHatch` |
| 17 | Back return (L-wing) | brick walls, own cottage roof, kitchen, door x11 z27 | x4..11 z22..30 | shell, roof | |
| 18 | Vegetable garden: 4 beds | `farmland` with water source, crops carrots/potatoes/beetroots/wheat, `spruce_slab` edges | plan SITE | grounds | `gardenBed` |
| 19 | Paths | `dirt_path` a, b, c, `coarse_dirt` edges, passage dirt_path/gravel | | grounds | `pathRun` |
| 20 | Fence + gate | `spruce_fence` perimeter, double `spruce_fence_gate` x22..23 z22 y6 | | grounds | `fenceRun`, `gateDouble` |
| 21 | Lamp post | `spruce_fence` x25 z21 y6..8, `lantern` y9 | | grounds | `lampPost` |
| 22 | Fruit tree | `oak_log` trunk x23 z35 y6..10, persistent `oak_leaves` crown | | grounds | `fruitTree` |
| 23 | Garden furniture | 2 `composter` + `barrel`s x12..14 z23..24; `water_cauldron` level 3 at 12,6,29; `spruce_stairs` bench 12,6,25 facing east | | grounds | `compostStore`, `waterButt`, `bench` |
| 24 | Lighting | lanterns hanging in aisle from y13 floor; each room lit ≥8 | | lighting (hearth part) | `hangLantern` |
| 25 | Street surfaces | road/kerb/pavement, west strip with fence | | shell | |
