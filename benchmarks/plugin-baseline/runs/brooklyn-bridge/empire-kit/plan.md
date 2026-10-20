# Empire Stores + Jane's Carousel — architect's plan (FORM is fixed)

All coordinates are in the shared plot frame (x along Water Street, north = -z = river). y 0 = each plot's lowest ground; ground value h in the brief = h blocks of terrain inside our y-layers (ground 0: walk at y 0 on terrain below; ground 1: terrain block at y 0, walk at y 1). Everything stays inside the footprints and under the height caps (plot 0 ≤ y 24, plot 1 ≤ y 16). Blocks are 1.21.1 only; NO `chain`, NO `iron_chain` (use `end_rod` for poles and hang lanterns from solid blocks).

## SITE

| item | value |
|---|---|
| Plot 0 | Empire Stores, x 0..97, z 0..43, y 0..24 (real top ≈ y 14-15) |
| Plot 1 | Jane's Carousel, x 102..117, z 0..15, y 0..16 (real top y 7) |
| River front | NORTH faces (z 4 wall plane of Empire Stores, z 1 face of the glass box) — the hero faces |
| Water Street | south of Empire Stores (z 41 apron, walk y 1) |
| Promenade | north apron z 3 (walk y 0, ground 0); nothing at z 0..2 except x 0..5 (left as ground) |
| Proud zone | every Empire Stores ornament that stands proud uses the 1-cell apron INSIDE the footprint: z 3 (north), z 41 / z 29 (south), x 3 (west), x 94 (east), x 74 (wing step). Walls never go out to it except piers, shutters, corbels, quoins-free sills |

### Plot 0 masses (wall planes are the outer face; walls 2 thick on facades)

| mass | x | y | z | notes |
|---|---|---|---|---|
| Main bar (river block) | 4..93 | 0..11 | 4..28 | brick, roof deck block at y 11 |
| South wing (Water St block) | 4..73 | 0..11 | 29..40 | joined to main bar, one building; south face z 40, east face x 73 |
| Plinth course | whole footprint of both masses | 0 | — | stone_bricks, the GF floor is y 0 (walk y 1) |
| THE CUT (open-air passage, bay 4) | 46..51 | 1..sky | 3..41 | NO building here above y 0: open slot through the full depth, open to the sky |
| Cut paving | 46..51 | 0 | 4..41 | floor at y 0 (walk y 1); bottom slab y 0 at z 3 x 46..51 as the half step from promenade |
| Cut grand stair (to roof garden) | 49..51 | 1..11 | 30..40 | stone_brick_stairs facing north, 3 wide, one step per block: step at z 40 y 1, z 39 y 2 … z 30 y 11 (11 steps); solid stone_bricks under every step down to y 0 |
| Cut ground passage | 46..48 | 1..10 clear | 4..41 | stays open for walking river ↔ Water Street (beside the stair, and under the bridge) |
| Roof bridge / landing | 46..51 | 11 (block) | 27..29 | stone_bricks deck, walk y 12; joins stair top to both roof halves |
| Seven warehouse bays (party piers) | piers at x 4, 17, 30, 43, 54, 67, 80, 93 | 0..12 | — | bay interiors: B1 5..16, B2 18..29, B3 31..42, B4 44..53 (cut 46..51 inside it), B5 55..66, B6 68..79, B7 81..92 |
| Rooftop glass pavilion (the 2017 addition) | A: 56..91 / B: 56..71 | 12..14 | A: 6..26 / B: 27..38 | glass walls y 12..13, flat roof y 14; set back 2 from the north face, ≥1 from all others |
| Roof garden (west of cut) | 31..44 | 11 deck, plants to ≤ y 18 | 5..39 | lawn, planters, 3 trees |
| Roof terrace (east of cut) | 53..55 | 11 deck | 5..39 | planter boxes, benches, between cut and pavilion |
| Plain roof decks | B1-B2: 5..29 z 5..39; around pavilion: x 55..92 z 5..27 and x 55..72 z 29..39 minus pavilion | 11 | — | non-spawnable slab deck |

Garden trees (trunk oak_log y 12..15, crown flowering_azalea_leaves / azalea_leaves persistent, y 14..17, 5 wide): T1 centre (34, 12), T2 (40, 22), T3 (35, 33).

### Plot 1 masses

| mass | x | y | z | notes |
|---|---|---|---|---|
| Concrete plinth | 103..116 | 0 | 1..14 | light_gray_concrete, flush top, walk y 1 |
| Glass box walls | ring x 103 & 116, z 1 & 14 | 1..6 | 1..14 | glass, 1 thick; corner posts and mullions per FACADES |
| Flat roof | 103..116 | 7 | 1..14 | thin slab roof, black edge |
| Interior floor | 104..115 | 0 (plinth) | 2..13 | walk y 1 |
| Carousel (centre 109.5, 7.5) | circle diameter 10: 105..114 | 1..6 | 3..12 | ring platform, drum, horses, cone canopy |
| Entrance doors | north x 109..110, z 1, y 1..2; south x 109..110, z 14, y 1..2 | | | glass double doors (white-framed) |

Outside the box (x 102, z 0, z 15, x 117 strips): ground only, no build.

## ROOFS

| roof | form | height | how |
|---|---|---|---|
| Empire Stores | FLAT deck behind parapets (warehouse roof); not a pitched roof. Preset `flat-parapet` is NOT used; the shell part builds it by hand because each bay carries its own stepped parapet | deck block y 11 inside the parapets | B1-B2 and pavilion margins: y 10 solid ceiling + `smooth_stone_slab` (bottom) at y 11 → no mob spawn; garden/terrace: grass and moss at y 11 on y 10 dirt |
| Stepped corbelled gable-parapet, each bay, north face z 4 and south faces z 40 / z 28 | per 12-wide bay interior (s..s+11): parapet brick y 12 over the whole bay; y 13 over s+2..s+9; y 14 over s+4..s+7; `smooth_stone_slab` coping on every top (y 13 / y 14 / y 15); the outer step ends get one `brick_stairs` coping turned outward. Top = y 15 | build by hand (or `stepGable` brush with block bricks, coping smooth_stone_slab), flat steps 2 wide, rise 1 |
| Bay 4 (cut bay) stubs x 44..45, 52..53; Bay 6 (split by the wing corner) on the south | plain parapet y 12, coping y 13 | |
| West end x 4, east end x 93, wing east face x 73, cut faces x 45 / x 52 | plain parapet y 12, coping y 13; gaps at x 45 and x 52, z 27..29, y 12..13 where the bridge lands | |
| Corbel table | every exterior face at y 11, upside-down `brick_stairs` in the proud zone (z 3 / z 41 / z 29 / x 3 / x 94 / x 74), back against the wall, between piers | |
| Rooftop pavilion | flat, `polished_blackstone_slab` (bottom) over all of A and B at y 14, edge reads black | hand-built, no overhang |
| Carousel pavilion | flat, thin: y 7 `polished_blackstone_slab` (bottom) ring 1 wide (the black edge), `smooth_stone_slab` (bottom) inside; no overhang | hand-built |
| Carousel canopy (inside the box) | low cone: y 5 disc radius ≤ 5 (diameter 10), y 6 disc radius ≤ 3; 12 alternating red/white wedges (red_concrete / white_concrete); gold_block centre at y 6 | hand-built; nothing above y 6 under the roof |

## FACADES

### Empire Stores (north river face = hero; south Water St face the same; ends simpler)

Vertical hierarchy (every exterior face):

| y | element | material | depth |
|---|---|---|---|
| 0 | plinth course | stone_bricks | flush |
| 1..3 | ground floor: big round-arched openings (shopfronts) | openings, brick piers | glazing recessed 1 (z 5 / z 39 / z 27, x 5, x 92, x 72) |
| 4 | arch heads: upside-down `brick_stairs` at the two outer cells, centre cell glazed fanlight; `smooth_stone` keystone at y 5 over centre | | flush |
| 5 | granite string course, full length of every face (stops at piers) | smooth_stone, with `smooth_stone_slab` top drip in the proud zone over the arches | flush + slab proud 1 |
| 6..7 | upper storey row 1: 1-wide windows, iron shutters open each side | glass_pane recessed 1, shutters in proud zone | -1 / +1 |
| 8 | sill/lintel blocks under row 2 & over row 1, only at window columns | smooth_stone | flush |
| 9..10 | upper storey row 2: same windows and shutters | | |
| 11 | corbel table | brick_stairs upside down | +1 |
| 12..15 | stepped parapet + coping | bricks / smooth_stone_slab | flush |

Bay rhythm (one bay, interior s..s+11; north and south faces):
- Windows (rows 1 and 2): columns s+1, s+4, s+7, s+10 (one every 3).
- Shutters: `dark_oak_trapdoor` open, 2 high (y 6..7 and y 9..10), in the proud zone at s, s+2, s+3, s+5, s+6, s+8, s+9, s+11, lying flat against the wall (face = the wall's outward direction). A near-continuous dark shutter band, as on the real facade.
- Ground floor: two 3-wide arches at s+2..s+4 and s+7..s+9 (y 1..3, head y 4); brick piers s..s+1, s+5..s+6, s+10..s+11.
- Party piers (x 17, 30, 43, 54, 67, 80): brick pilasters proud 1 (proud zone) y 0..12, capped with a smooth_stone_slab at y 13 (north/south faces only).
- Corners (x 4/93 × z 4/28/40, x 73 × z 40): stone quoins `polished_andesite` flush in the wall, pairs alternating 2 long / 1 short along each face, y 1..11.
- Bay 4: windows only at x 45 and x 52 (shutters only on the outer side, x 44 and x 53); GF of the stubs is plain brick, with a `lantern` each side of the cut mouth hanging under a brick bracket at y 4 (x 45 / x 52, proud zone).
- Bay 6 south: on z 40 (x 68..72) windows at x 69, 72; GF arch x 70..72; on z 28 (x 74..79) windows x 75, 78; GF arch x 75..77.

Ends and cut faces (along z; same courses y 0..13): windows at z 6, 9, 12 … 39 on x 4 and on the cut faces x 45 / x 52 (z 4..40); at z 7, 10 … 25 on x 93; at z 31, 34, 37 on x 73. Shutters each side in the proud zone (x 3, x 94, x 74; inside the cut at x 46 and x 51). GF of the ends: 1-wide arched openings (y 1..3) under every window column; cut faces GF: 3-wide arches at z 7..9, 16..18, 25..27, 34..36 (shopfronts opening onto the passage).

### Rooftop pavilion (Empire Stores)
Black steel and glass: `black_concrete` posts every 3 (aligned to the window columns below: x 58, 61, 64 … and at every corner) y 12..13; `glass_pane` between; roof edge reads black; warm interior light visible (shroomlight under the roof slab, every 6).

### Jane's Carousel box
- Plinth y 0 light_gray_concrete, flush.
- Walls y 1..6: clear `glass` blocks, with thin white mullions: `white_concrete` posts y 1..6 at the 4 corners, at x 106, 108, 111, 113 on the north and south faces (x 108 / 111 are the door jambs), and at z 4, 7, 8, 11 on the east and west faces; a `white_concrete` head rail ring at y 6. Everything else clear glass.
- Roof y 7 thin black-edged slab (see ROOFS).
- Inside, visible through the glass:
  - Platform: circle diameter 10 (x 105..114, z 3..12) at y 1, `spruce_slab` (bottom) on the plinth; outer rim cells `smooth_sandstone_slab` (bottom), cream.
  - Central drum: x 108..111, z 6..9 (corners cut → round), y 1..4: alternating `red_concrete` / `smooth_quartz` panels with `gold_block` at y 4 cornice; mirror cells = `glass` set into the drum at y 2..3 on each face centre.
  - Horses: 12 on a ring of radius 4 (two concentric files), each a 1-wide figure y 2..3 (white_wool / smooth_quartz / brown & gold accents, saddle a coloured carpet-free block) on an `end_rod` pole y 2..4 → the pole meets the canopy.
  - Lights: a ring of `shroomlight` set into the canopy underside at y 5, radius 4, every other cell; `lantern` hanging under y 5 at radius 5 (rim), 12 of them.
  - Canopy rim valance at y 4, radius 5: alternating `red_concrete` / `white_concrete` ring (scalloped edge), lanterns hang inside it.

## MATERIALS (colour scheme is fixed)

| role | block id | reads as |
|---|---|---|
| Brick body (≈85 %) | bricks | deep red-brown brick |
| Brick weathering (≈1 in 10, more near ground/corners) | terracotta, mud_bricks (ground course only, rare) | browner patches |
| Arch heads, corbels, outer coping steps | brick_stairs | same brick, relief |
| Plinth, cut paving, stair, bridge | stone_bricks, stone_brick_stairs | grey granite base |
| String course, sills, lintels, keystones, coping | smooth_stone, smooth_stone_slab | pale granite bands |
| Quoins | polished_andesite | light stone corners |
| Iron shutters | dark_oak_trapdoor (open) | near-black iron |
| Window glass (brick) | glass_pane (recessed) | dark glazing, warm-lit where lit |
| Shopfront glazing | glass_pane, dark_oak_planks frames/doors | |
| Rooftop pavilion | black_concrete posts, glass_pane, polished_blackstone_slab roof | black steel & glass |
| Roof decks | smooth_stone_slab | pale tar/gravel |
| Garden | grass_block, moss_block, coarse_dirt (patches), oak_log, azalea_leaves, flowering_azalea_leaves (persistent), planters stripped_dark_oak_log | green roof |
| Warm light | lantern, shroomlight | golden glow |
| Carousel box | light_gray_concrete plinth, glass walls, white_concrete mullions, polished_blackstone_slab edge, smooth_stone_slab roof | clear glowing cube, black edge |
| Carousel | red_concrete, white_concrete, gold_block, smooth_quartz, smooth_sandstone, yellow_concrete, white_wool, red_glazed_terracotta (drum panels), end_rod (poles), spruce_slab platform | red/gold/cream fairground |

All checked with `$MCD blocks --check` (all known). `chain` is avoided (toolkit flags it; it is not needed).

## OPENINGS

Empire Stores (bay s = 5, 18, 31, 55, 68, 81; bay 4 special):

| opening | x | y | z (wall cells left open) | size |
|---|---|---|---|---|
| North GF arches | s+2..s+4 and s+7..s+9 | 1..3 (+ centre y 4 fanlight) | 4 open, glazing at 5 | 3 w × 3 h + fanlight |
| North GF doors | in the s+7..s+9 arch of every bay: door cells x s+8, y 1..2, z 5 (glass_pane either side); bottom slab x s+7..s+9 at z 3 y 0 as the half step | | | 1 w × 2 h |
| North windows | s+1, s+4, s+7, s+10 | 6..7 and 9..10 | 4 open, pane at 5 | 1 × 2 |
| South GF arches / doors (z 40 for bays 1-5 and x 68..72; z 28 for x 74..92) | same x pattern | 1..3 (+y 4) | 40 open, glazing 39 (z 28 open, glazing 27); doors at s+8, level with Water Street (walk y 1, no step) | 3 × 3 |
| South windows | same columns | 6..7, 9..10 | 40 / 28 open, pane 39 / 27 | 1 × 2 |
| West end x 4 | windows z 6, 9 … 39 at y 6..7, 9..10; GF z same at y 1..3 | | x 4 open, pane x 5 | 1 × 2 / 1 × 3 |
| East end x 93 | windows z 7 … 25 (step 3); GF same columns y 1..3 | | x 93 open, pane x 92 | |
| Wing east x 73 | windows z 31, 34, 37 | | x 73 open, pane x 72 | |
| Cut faces x 45 / x 52 | windows z 6 … 39 at y 6..7, 9..10; GF arches z 7..9, 16..18, 25..27, 34..36 at y 1..3 (+ y 4 fanlight centre) | | x 45 open, pane x 44; x 52 open, pane x 53 | |
| Cut mouths | x 46..51, z 3..41 entirely open | 1..sky | | 6 wide |
| Parapet gaps to the bridge | x 45 and x 52 at z 27..29 | 12..13 | | 3 wide |
| Pavilion doors | west side facing the terrace: x 56, z 12..13 and z 20..21, y 12..13 (glass doors) | | | 2 × 2 |

Carousel box: main doors north x 109..110, z 1, y 1..2 (glass doors in white frames, threshold = plinth top at y 0); the half step in front is `smooth_stone_slab` (bottom) at at x 108, 110 and 111 on z 0, y 0 (x 109 at z 0 is outside the footprint and stays ground). Secondary door south x 109..110, z 14, y 1..2 onto the lawn (z 15 there is outside the footprint: no step, exit only).

## RESERVED (shell leaves these as air / for later parts)

| cells | for |
|---|---|
| Proud zone everywhere (z 3, z 41, z 29 x 74..93, x 3, x 94, x 74 z 29..40, inside the cut x 46 and x 51 beside windows): y 1..11 except piers | shutters, sill drips, corbels, lanterns (placed by facade parts) |
| Glazing layer behind every opening (one cell in) | glazier: panes, doors, shopfront frames |
| Cut x 46..51, z 3..41, y 1..up | paving y 0 and the grand stair x 49..51 z 30..40 and the bridge z 27..29 y 11 only; lamps along the passage (lantern on stone_brick wall posts at x 46, z 8, 16, 24, 32) |
| Garden x 31..44 / terrace x 53..55, z 5..39, y 12..18 | planters (2-high stripped_dark_oak_log boxes along the parapets), trees T1-T3, benches, lamp posts every 6 |
| Pavilion interior x 57..90, z 7..25 (+ x 57..70 z 27..37), y 12..13 | lights and tables visible through the glass |
| Carousel x 105..114, z 3..12, y 1..6 | the carousel (part 2); walkway ring x 104..115 z 2..13 between it and the glass stays clear |

## FLOORS

| mass | floor levels (block y; walk = +1) | interior volume |
|---|---|---|
| Empire Stores GF (shops) | 0 | x 5..92 z 5..27 + x 5..72 z 29..39, y 1..4, minus the cut x 46..51 |
| Storeys 2-5 (notional, exterior only) | 5, 8 (windows rows at y 6..7 and 9..10 represent the upper lofts) | above GF to y 10 |
| Roof deck / garden | 11 | open air y 12..18 |
| Rooftop pavilion | 11 | x 57..90 z 7..25 + x 57..70 z 27..37, y 12..13, roof y 14 |
| Carousel pavilion | 0 (plinth) | x 104..115 z 2..13, y 1..6, roof y 7 |

Lighting for dusk: warm lanterns hanging in about a third of the GF arches (all shops lit) and shroomlight behind panes in ~1 in 3 upper windows (random bays, never a full row); a `lantern` standing on every party-pier cap (x 17, 30, 43, 54, 67, 80, on the y 13 slab, north and south) and floodlit piers (shroomlight hidden in the corbel line is NOT used); garden lit to ≥ 8 on every grass cell; all roof decks are bottom slabs; the carousel glows from its shroomlight ring and lanterns.

## PALETTE (designer; architect's ids kept)
Stairs/slabs/variants: brick_stairs, brick_slab, stone_brick_stairs, stone_brick_wall, smooth_stone_slab, polished_blackstone_slab, smooth_sandstone_slab, spruce_slab, dark_oak_trapdoor (open), dark_oak_door, glass, glass_pane, black_concrete, light_gray_concrete, white_concrete, red_concrete, yellow_concrete, gold_block, smooth_quartz, red_glazed_terracotta, white_wool, brown_wool, end_rod, lantern, shroomlight, stripped_dark_oak_log, oak_log, moss_block, grass_block, coarse_dirt, azalea_leaves, flowering_azalea_leaves (persistent true), oak_fence. All verified with mcd blocks --check.

## VOCABULARY
- brickWall(g,x0,z0,x1,z1,y0,y1): bricks, ~1/10 terracotta (mud_bricks y1 only), y0 stone_bricks.
- arch3(g,x,y,z,face): 3x3 air at y1..3; y4 brick_stairs half top facing inward at outer cells, centre glass_pane; smooth_stone y5 keystone.
- stringCourse(g,run,y5): smooth_stone; proud smooth_stone_slab (top) at the apron.
- win(g,x,y,z,face): 1x2 air, glass_pane one cell in, smooth_stone sill y-1 / lintel above.
- ironShutter(g,[x,y,z],face): shutter() dark_oak_trapdoor open height 2.
- quoin(g,corner,face): polished_andesite alternating 2 long/1 short, y1..11.
- pilaster(g,x,face): bricks proud 1, y0..12, smooth_stone_slab y13.
- bayGable(g,s,z,face): y12 bricks s..s+11, y13 s+2..s+9, y14 s+4..s+7, smooth_stone_slab coping on tops, brick_stairs outward at step ends.
- corbel(g,x0,x1,z,face): upside-down brick_stairs at y11 in proud zone.
- shopfront(g,x,z,face): dark_oak_planks frame, glass_pane, door dark_oak_door at s+8, lantern inside.
- cutStair / lampPost(g,x,y,z): stone_brick_wall post + lantern on top.
- planter(g,box): stripped_dark_oak_log 2 high, moss/azalea inside. gardenTree(g,x,z): oak_log y12..15 + leaves y14..17. bench: oak stairs pair.
- pavilion(g,box): black_concrete posts every 3, glass_pane, polished_blackstone_slab roof y14, shroomlight under.
- glassBox(g): per plan FACADES; mullions white_concrete; roof ring polished_blackstone_slab, inside smooth_stone_slab.
- carouselRing / drum / canopy / horse(g,angle): per plan; horse = white_wool body y2, quartz head y3 on end_rod pole y2..4 (colours alternate red/yellow/white/brown).

## ROOMS
No interior rooms (exterior only; GF shops and carousel visible through glass, lit by lanterns/shroomlights). Rooms list is empty.

## PARTS
1. Masonry shell (parts/shell.mjs): walls, plinth, arches, openings, quoins, pilasters, cut structure.
2. Roofline (parts/roofline.mjs): corbels, bay gables, decks, rooftop pavilion.
3. Facade fittings (parts/fittings.mjs): glazing, shutters, shopfronts, lamps.
4. Roof garden and cut (parts/garden.mjs): lawn, planters, trees, stair, bridge, lamps.
5. Carousel box (parts/carbox.mjs): plinth, glass, mullions, roof, doors, step.
6. Carousel (parts/carousel.mjs): platform, drum, canopy, horses, lights.

Notes: Stay in footprint; no chain; lamps on every walkable surface; build 1.21.1 only.
