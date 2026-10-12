# REQUIRED ELEMENTS: suburban McMansion (two storeys + attic, cul-de-sac lot)

Grid x 0..43 (street frontage, x east), z 0..31 (front = NORTH z0, street at z<0), y 0..14. Ground y0; FLOOR 1 block layer y1 (a player stands at y2); storey 1 air y2..4; FLOOR 2 block layer y5 (player y6); storey 2 air y6..8; top plate / ceiling y9; roofs y10..14.
Parts: P1 shell, P2 roofs, P3 front, P4 grounds, P5 rear, P6 stair (see plan.md). Vocab names are the helpers in plan.md VOCABULARY. Every id was checked with `mcd blocks --check`; replaced unknowns: `quartz_wall` -> `diorite_wall`/`stone_brick_wall`, `cut_sandstone_stairs` -> `sandstone_stairs`, `washer` -> none (laundry = `cauldron` + `barrel`).
Rule for every row: nothing is a coloured full block standing in for an object. Windows are glass panes in framed openings, doors are doors, plants are plant blocks, lamps are lanterns.

## A. Roofs and massing
| id | element | REAL construction (block by block) | coordinates | part | vocab |
|---|---|---|---|---|---|
| E01 | Tall front gable over the entry | 45-degree gable, ridge along z, `dark-slate` palette stairs, white `smooth_quartz` gable wall (tympanum) with `smooth_quartz` verge and a 2-cell round-ish attic window (`glass_pane` x2 at (22..23,11,z4) inside an `iron_bars` frame); ridge top at y14 = highest roof on the site | rect x18..27, z4..14, y10..14 | P2 | `roofPiece` R2 |
| E02 | Hipped wings | L-plan hip (centre block + east wing) at half pitch, plain eave, slab ridge; garage wing = cross-gable, ridge along x, half pitch; ridges y13 | R1 rects x12..33,z8..23 + x33..43,z12..27; R3 x0..12,z6..19 | P2 | `roofPiece` R1, R3 |
| E03 | Turret-ish bay | 5x5 chamfered polygonal bay: walls `stone_bricks` hash y1..4, `smooth_quartz` belt y5, siding y6..8, cornice y9; 3 cells of tall arched glass on its front face; conical roof (`cone`, maxHeight 4, y10..13) with a `lightning_rod` finial at y14 | outer x29..33, z4..8 (cells (29,4),(33,4) omitted = chamfers); inner air x30..32, z5..7 | P1 walls, P2 cone, P3 glass | `turret`, `archWin`, `roofPiece` R5 |
| E04 | Dormers | at least 4 small gable dormers (3 wide, 2 high): 2 on the garage's front slope, 2 on the rear slope of the centre block; each = `smooth_quartz` frame, 2x1 `glass_pane`, own tiny gable in the roof palette | garage front slope x1..11, z6..9; centre rear slope x13..32, z19..23 | P2 | `roofPiece` options |
| E05 | Dark asphalt shingle roof | `dark-slate` palette (`deepslate_tiles`, `cobbled_deepslate`, `blackstone`, `polished_blackstone` mix; darker eave, distinct ridge), contrast against beige walls >= 0.3 | all roofs | P2 | `ROOF_PALETTE` |

## B. Entry, facade, trim
| id | element | REAL construction | coordinates | part | vocab |
|---|---|---|---|---|---|
| E06 | Two-storey portico with columns | 4 columns, each: y2 `quartz_block` base, y3..7 `quartz_pillar` axis y, y8 `chiseled_quartz_block` capital; entablature y9 = `smooth_quartz` beam row x19..26 at z5 plus `smooth_quartz` ceiling x19..26, z5..7; porch floor `smooth_stone` y1 x19..26, z5..7 with `smooth_quartz` border; the gable (E01) sits on it; 2 `quartz_pillar` pilasters on the wall at x20 and x25 (z8, y2..8) | columns (19,5),(21,5),(24,5),(26,5); y2..9 | P3 (pilasters P1) | `column`, `portico` |
| E07 | Entry door | double `dark_oak_door` (hinge left + hinge right, open=true so the player can walk in), facing north, `smooth_quartz` jambs x21 and x24 (y2..4), glass transom `glass_pane` y4 | x22..23, y2..4, z8 | P3 | `entryDoor` |
| E08 | Fanlight window over the door | y5 x21..24 `glass_pane`; y6 x22..23 `glass_pane` with `smooth_quartz_stairs` half=top facing outward at (21,6) and (24,6) (arch shoulders); above it a tall arched window x21..24 y7..8 (4 wide, arch corners at y8), white sill row | x21..24, y5..8, z8 | P3 | `fanlight`, `archWin` |
| E09 ✓ | Stone veneer on the lower front | every NORTH-facing wall plane y1..4 = `stone_bricks` 55 / `andesite` 25 / `cobblestone` 20 per-cell hash (garage piers, centre block, turret, east wing front, chimney) | z=6 garage, z=8 centre, z=4/chamfer turret, z=12 east wing | P1 | `wallCell` |
| E10 ✓ | Beige siding elsewhere | upper front y6..8 and all side/rear walls y2..8: rows alternate `smooth_sandstone` (y even) / `sandstone` (y odd) so it reads as lap siding | all exterior walls | P1 | `wallCell` |
| E11 ✓ | White trim | belt course y5 and cornice y9 on every exterior wall = `smooth_quartz`; sill rows under every window; jambs at the entry; columns; verges | all exterior walls | P1 | `wallCell`, `window` |
| E12 ✓ | Quoins | corner column `smooth_quartz` y2..4 and y6..8; the neighbouring cell alternates (even y along the front face, odd y along the side face) so each corner reads as long-short stones | corners (0,6),(12,6),(0,19),(12,23),(33,12),(43,12),(33,27),(43,27) | P1 | `quoin` |
| E13 | Three-car garage wing | 13 wide x 14 deep, piers x0,4,8,12 at z6 (stone veneer), 3 openings 3 wide x 3 high; service door on the west wall; mudroom door on the east wall | x0..12, z6..19 | P1 | `wallCell` |
| E14 | Carriage-style garage doors | per opening: leaf plane at z7: y2..3 `birch_planks`, y4 three `glass_pane` (window strip); two `dark_oak_trapdoor` (open=true, facing north) as strap hinges at each side edge of the leaf on z6 plane y2 and y3; a `dark_oak_fence` + hanging `lantern` carriage lamp on each pier x4, x8 at z5 and on the end piers | openings x1..3, x5..7, x9..11 (y2..4, z6) | P3 | `carriageDoor`, `wallLamp` |
| E15 | Tall arched windows | glass panes in the wall plane, 3 wide x 2 or 3 high, arch corners = `smooth_quartz_stairs` half=top facing outward at the two top corners, white sill; the entry window is 4 wide | all windows listed in plan OPENINGS | P3 north, P5 other faces | `archWin`, `window` |
| E16 | Black shutters | each window gets a pair: `dark_oak_trapdoor` open=true half=bottom stacked over the window height, standing in the air cell beside the window (outside the wall plane), hugging the wall; dark oak is the darkest trapdoor in the game (no black trapdoor exists) | beside N1,N2,N6 and the side windows flagged `S` | P3 / P5 | `shutterPair` |
| E17 ✓ | Big chimney | 3x3 `stone_bricks`/`andesite` stack against the east-wing front wall from y1 to y13; y13 collar ring of `stone_brick_slab` (bottom) x36..40, z9..13; y14 four `stone_brick_wall` corner pots with a `campfire` (smoking) in the centre; its base holds the fireplace firebox | x37..39, y1..14, z10..12 | P1 (the roof tool KEEPS it) | `chimneyStack` |
| E18 | Wall lanterns at entry and garage | `dark_oak_fence` stub on the wall + `lantern` hanging=true under it; two flanking the door at (21,4,7) and (24,4,7); one per garage pier | see plan | P3 | `wallLamp` |
| E19 | House-number plaque | `oak_wall_sign` facing north at (25,4,7) reading "1428" / "OAK CT" | (25,4,7) | P3 | `plaque` |
| E20 | Door planters | each side of the porch step: `stone_brick_wall` pedestal y1 + `potted_azalea_bush` y2 | pedestals (19,1,4) and (26,1,4), pots y2 | P3 | `planter` |

## C. Site and landscape
| id | element | REAL construction | coordinates | part | vocab |
|---|---|---|---|---|---|
| E21 | Cul-de-sac street edge | street z0 `gray_concrete` 70 / `black_concrete` 30 hash; sidewalk z1 `polished_andesite`; kerb: `stone_brick_slab` bottom at y1 along z1 x13..43 (not across the driveway apron) | z0..1 | P4 | `street` |
| E22 | Wide driveway | `light_gray_concrete` 75 / `stone` 15 / `andesite` 10 hash with a `smooth_stone` joint row every 4th z; apron flares to 13 wide at z1..2 | x0..12, z1..5 (y0) | P4 | `driveway` |
| E23 | Front walk and steps | walk `polished_andesite` x22..23, z1..3 with `stone_bricks` border x21 and x24; step row `stone_brick_stairs` facing south y1 x20..25, z4 | see plan | P4 | `frontWalk` |
| E24 | Manicured lawn | `grass_block` y0 everywhere not paved or planted; `short_grass` tufts (one cell in 10 by hash, none on edges of paths) | whole lot | P4 | `lawn` |
| E25 | Foundation shrubs | each shrub = `azalea_leaves` (persistent=true) at y1..2, every 3rd one `flowering_azalea_leaves` at y2, mulch `coarse_dirt` y0 under the bed, small flowers (`allium`, `pink_tulip`, `azure_bluet`) in front | beds F1..F5 in plan | P4 | `shrub`, `bed` |
| E26 | Young tree | `birch_log` trunk y1..5, `birch_leaves` (persistent=true) crown: y4..5 5x5 without corners, y6 3x3, y7 plus; two `oak_fence` stakes, `coarse_dirt` mulch ring | trunk (38,y1..5,5) | P4 | `youngTree` |
| E27 | Lamp posts | `stone_brick_wall` y1..3 + `lantern` y4 (hanging=false) | (20,2),(25,2),(13,2) | P4 | `lampPost` |
| E28 | Back deck | decking y1 `spruce_planks` / `oak_planks` boards alternating by z; edge rail `dark_oak_fence` y2 with `dark_oak_fence` corner posts to y3 capped by `dark_oak_slab`; 3-wide steps `spruce_stairs` facing north to the lawn; patio table (`dark_oak_fence` + `oak_pressure_plate` top) with 4 `spruce_stairs` chairs, grill (`blast_furnace` + `barrel`), `potted_fern` on the posts | x14..32, z24..30 | P5 | `deck`, `patioSet` |
| E29 | Back doors | French doors from the kitchen onto the deck: 2 `birch_door` y2..3 hinge left/right open=true, glass transom y4 | (25..26, 2..4, 23) | P5 | `frenchDoor` |

## D. Interior (shell + stair by parts; furniture by each room's designer)
| id | element | REAL construction | coordinates | part |
|---|---|---|---|---|
| E30 | Double-height foyer | void in floor 2 left AIR, ceiling y9 | x20..25, y2..8, z9..13 | P1 (void), P6 |
| E31 | Sweeping staircase | 3-wide `dark_oak_stairs` flight facing south (rising toward +z) at (z10,y2),(z11,y3),(z12,y4),(z13,y5), x20..22; bullnose first tread `smooth_quartz_slab` bottom y2 at z9, x20..24; `iron_bars` banister following the open side; gallery rail on the void edge | x20..24, z9..14 | P6 |
| E32 | Chandelier | `iron_chain` y7..8 at (23,11), `iron_bars` plus at y6, five `lantern` hanging=true at y5 | (22..24, 5..8, 10..12) | P6 |
| E33 | Open-plan kitchen with island | designer: counters/cabinets (`dark_oak_slab`, `barrel`, `smoker`, `blast_furnace`, `cauldron` sink), island 3x1 in the middle, stools `spruce_stairs`/`dark_oak_trapdoor`, wide cased opening to the family room | Kitchen box | room designer |
| E34 | Family room, fireplace, big TV | firebox 3x2 recessed into the chimney (cells (37..39,2..3,12) left air by P1) with a lit `campfire` and `stone_bricks` hearth; mantel `dark_oak_slab`; big TV = 4x2 panel of `black_concrete` framed with `polished_blackstone_slab` on a wall above a `dark_oak_slab` console; sectional sofa (`spruce_stairs` seats + `gray_carpet`) | Family box | room designer |
| E35 | Formal dining room | long table (`dark_oak_slab` top on `dark_oak_fence` legs), 6 chairs (`dark_oak_stairs`), sideboard, hanging `lantern`s, window-seat in the bay | Dining + bay boxes | room designer |
| E36 | Home office | desk, `bookshelf` wall, `lectern`, chair, French doors to the foyer | Office box | room designer |
| E37 | Mudroom | cubbies (`oak_trapdoor`, `barrel`, `chest`), bench, laundry (`cauldron`, `barrel`), door to garage | Mudroom box | room designer |
| E38 | Primary suite | king bed (2 `white_bed` side by side) with headboard, closet room (hanging rods = `iron_bars`, shelves), bath (tub from `quartz_slab` + `water` cauldron, `cauldron` sink) | 3 boxes | room designers |
| E39 | Three more bedrooms | each a bed, desk or dresser, rug; bedroom 3 has the turret bay | boxes | room designers |
| E40 | Bonus room over the garage | game/media room: sofa, TV wall, open play floor, mini-bar | box | room designer |
| E41 | Garage interior | three car bays marked `gray_concrete` lines on `smooth_stone`, workbench (`crafting_table`, `barrel`), shelving, side door | Garage box | room designer |
