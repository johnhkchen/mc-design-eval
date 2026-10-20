# Required elements: Main Post kit (coordinates are BUILD coordinates from plan.md)

Parts: P1 brick shells, P2 club shell, P3 roofs and dormers/chimneys, P4 porches/ramps/banners, P5 glazing/doors/signs/cannons/flag, P6 grounds and light.
Vocab names are defined in plan.md VOCABULARY.

| # | element | construction, block by block | coords | part | vocab |
|---|---|---|---|---|---|
| 1 | ground course | `smooth_stone` y 0 under each footprint, porches, arcades, courtyard; all else y 0 air | all modules | P1,P2 | groundCourse |
| 2 | museum brick block | `bricks` walls 1 thick y 1..9, `polished_andesite` water table y 1, bands `bricks` y 4, 7 | x0..23 z7..14 | P1 | brickBlock |
| 3 | raised basement, small windows | y1 water table row; small 1x1 panes at y 1 only where the architect's openings say (none extra: y1 stays andesite except doors) | front/back | P1,P5 | brickBlock |
| 4 | museum 10 sash windows per storey | `glass_pane` 1x2 at y2..3, 5..6, 8..9 on the architect's x list; `smooth_quartz_slab` top sill one proud | z14 | P5 | sashWindow |
| 5 | white eave cornice | upside-down `smooth_quartz_stairs` facing the wall, y9, z6 and z15 (barracks z5/z14) | full length | P1 | cornice |
| 6 | steep red hipped roof | roof tool `hip` pitch 45, `polished_granite` stairs/slab/block, y10..13, overhang 0 | museum x0..23 z7..14 | P3 | roof.json |
| 7 | 4 museum dormers | brick cheeks y10..11, glass_pane centre, `smooth_quartz_slab` lid y12 one proud | x3..5,8..10,13..15,18..20 | P3 | dormer |
| 8 | 2 brick chimneys | `bricks` 2x2 y10..13, `stone_bricks` band y12, `brick_slab` cap y13, cold stacks | x5..6, 17..18 z7..8 | P3 | stack |
| 9 | museum two-storey white porch | `diorite_wall` posts y1..3 and 5..6, `smooth_quartz` beam y4 front line, `smooth_quartz_slab` top deck y4 behind, rail `diorite_wall` y5, roof `smooth_quartz` y7 front + bottom slabs behind | x0..23 z15..17, posts x1,5,9,14,18,22 | P4 | porchBay |
| 10 | porch black rail, ramp, handrails | bottom `smooth_quartz_slab`/smooth_stone slabs y0 ramp x10..13 z18, `polished_blackstone_wall` rails x9,x14 y0..1 | z18 | P4 | ramp, handrail |
| 11 | two red museum banners | `bannerWord` "DISNEY" x2..7, "MUSEUM" x16..21, `red_wall_banner` white letters z18 y4 facing south; `red_wool` panels x2..4, 19..21 z17 y5..6 | z17/18 | P4 | bannerRun |
| 12 | museum glass pavilion (back) | `glass_pane` walls y1..6, `polished_blackstone` mullions and y4 band, `polished_blackstone_slab` roof y7 with edge course | x2..21 z1..6 | P1 | pavilion |
| 13 | museum entrance doors | paired `spruce_door` x11..12 y1..2 z14, transom `glass_pane` y3 | z14 | P5 | doubleDoor |
| 14 | lawn edge, shrubs | `azalea_leaves`/`oak_leaves` persistent y0..1 x0..8, 15..23 z18..19; `grass_block` not placed (y0 stays air) | z18..19 | P6 | shrub |
| 15 | barracks block, wings | same language, x24..49 z6..13 and wings x24..30, x43..49 z0..5; roofs main hip + wing hips | plot 1 | P1,P3 | brickBlock |
| 16 | barracks porch, ramp, doors | as 9, 10, 13; posts x25,30,34,39,43,48; ramp x35..38 z17, rails x34, 39 | z14..17 | P4,P5 | porchBay |
| 17 | barracks dormers, chimneys | as 7, 8 at x27..29,32..34,39..41,44..46; stacks x30..31, 42..43 z6..7 | | P3 | dormer, stack |
| 18 | Officers' Club stucco walls | `white_concrete`, front walls 2 thick z16..17 and z20..21 | plot 2 | P2 | stuccoWall |
| 19 | club red-tile roofs at several heights | range gable y7..9, cross gable y8..10, wings y5..7, arcade lean-tos; `polished_granite` stairs/slabs, white gable ends | | P3 | roof.json, leanTo |
| 20 | oculus (round window) | plus of `gray_stained_glass_pane` x62..64 y8, x63 y7,y9, `smooth_quartz_stairs` corners, z21 | (63,8,21) | P2 | oculus |
| 21 | deep-set windows with iron grilles | `iron_bars` outer cell, `gray_stained_glass_pane` inner cell | architect list | P5 | grilleWindow |
| 22 | arcade, white piers and arches | `white_concrete` piers y1..3 z20, upside-down `smooth_quartz_stairs` arches y3, beam y4 | x51..58, 68..75 | P2 | arcadeBay |
| 23 | arched entrance and door | `dark_oak_door` x63 z20 y1..2; arch stairs x62, 64 y3 | z20..21 | P2,P5 | archDoor |
| 24 | two bronze cannons | `polished_blackstone_wall` barrel z23..25 y0, breech `polished_blackstone` z23... muzzle south, open `dark_oak_trapdoor` wheels x58/60, 66/68 z24 | x59, x67 | P5 | cannon |
| 25 | courtyard | smooth_stone paving y0, back wall z1 with arched gate x62..64, centre planting (oak tree/azalea) x62..64 z4..6 | x58..68 z1..8 | P2,P6 | courtyardTree |
| 26 | Visitor Center | `bricks` y1..4 z1..6, andesite y1 table, hip roof y5..8 overhang 1, dormer x84..87, porch posts `diorite_wall` x81,84,87,90 | plot 3 | P1,P3,P4 | brickBlock |
| 27 | VC red sign panel | `red_concrete` band x81..90 y3..4 z8, "PRESIDIO" banner letters white on red z9 y4 x82..89, `signboard` "VISITOR CENTER" x84..87 y4 z7 | | P5 | plaque |
| 28 | flagpole and flag | `iron_bars` x93 z9 y0..8, `lightning_rod` y9; wool flag at (93,7..8,7..8) | | P5 | flagpole |
| 29 | lighting | `lantern` hanging under gallery deck y3 and porch roof y6 per bay; arcade lantern per bay y3; lanterns by doors; light >=8 in lit spots, no dark cell | | P6 | hangLantern |
| 30 | accessible approaches | bottom slabs y0 in the ramp cells listed in RESERVED | | P4,P5 | ramp |
