# elements.md — REQUIRED ELEMENTS (x 0..43 street, z 0..31 front→back, y 0..14; front = NORTH, z0)

Ground (lawn) top = y0. Main floor blocks at y1 (walkable y2). Floor 2 blocks at y6 (walkable y7). Wall plate y10. Garage floor blocks at y0 (walkable y1).
Parts: P1 shell, P2 roofs, P3 facade, P4 garage+entry+bay, P5 site, P6 details. Vocab names are defined in plan.md.

| # | Element | Real construction (block by block) | Where | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Jumble of roof forms, dark asphalt shingle | deepslate_tiles / deepslate_tile_stairs / deepslate_tile_slab only. Tall front gable (ridge y14, 10 wide), garage hip (rise 3, deck y13), main hip with deck y13, turret cone, 3 dormers, bonus-room front gable | see plan SITE | P2 | roofHip, roofGable, roofCone, dormer |
| 2 | Tall front gable over entry | gable ridge along z, eave y10 at x26/x35, rows y11 x27/34, y12 x28/33, y13 x29/32, y14 x30/31; pediment infill white_concrete at z4 (y10 x27..34, y11 x28..33, y12 x29..32, y13 x30..31); smooth_quartz_stairs raking trim | x26..35, z4..9 | P2 | roofGable, pediment |
| 3 | Hipped wings | garage hip x0..18 z5..22 and main hip x18..43 z7..28: stair ring y11 (inset 0), y12 (inset 1), flat deck y13 deepslate_tiles from inset 2 | | P2 | roofHip |
| 4 | Turret-ish bay | 5x4 two-storey bay x37..41 z4..7, walls y1..9, 3 faces glass-pane windows, cone roof y10..14 deepslate_tile_stairs rings 5x4 → 3x2 → 1x1 + lightning_rod finial at y14 | x37..41 z4..7 | P4 | bay, roofCone |
| 5 | Dormers | 2 front gabled dormers on the main roof slope: x21..23 and x39..41, z7..10 (front wall at z7 inset into the slope), walls y11..12 birch_planks, window 1 wide glass_pane y11..12 at z7, gable roof deepslate_tile_stairs ridge along z, y13 apex; plus 1 rear dormer x29..31 z26..28 | main roof front/back | P6 | dormer |
| 6 | Double-height entry w/ two-storey portico | 4 quartz_pillar columns x26,29,32,35 at z4, y2..9, smooth_quartz_slab capital y9 / beam; portico floor stone_bricks y1 at z4..6, ceiling none (gable above); double door at x30,31 in wall z7 | x26..35 z4..7 | P4 | column, doorDouble |
| 7 | Fanlight over the door | y4: glass_pane x30,31 at z7 + y5 smooth_quartz_stairs half=top flanking (x29, x32) forming arch, y5 glass_pane x30,31 | x29..32 z7 y4..5 | P4 | fanlight |
| 8 | Stone veneer, lower front | stone_bricks y1..3 on all z5 (garage) and z7 (main, bay) faces + stone_brick_stairs sill course at y4; cobblestone plinth y0 | front walls | P3 | wallStone |
| 9 | [x] P1 (partial: no y6 shadow course) Beige siding | birch_planks everywhere else, with birch_slab bottom shadow line every storey at y6 | all walls | P1/P3 | wallSiding |
| 10 | White trim and quoins | smooth_quartz at all outer corners alternating with siding (quoins y1..10 every second block), window surrounds, cornice smooth_quartz_slab y10 | | P3 | quoin, windowFrame |
| 11 | Three-car garage with carriage doors facing street | wing x0..18 z5..22; three 4-wide doors at x2..5, x7..10, x12..15, y1..4; construction see carriageDoor in plan; lanterns on spruce_fence posts between | z5 face | P4 | carriageDoor, carriageLamp |
| 12 | Tall arched windows | 3 wide x 3 tall openings, glass_pane, upside-down smooth_quartz_stairs at top corners; front windows listed in plan OPENINGS | | P3 | archWindow |
| 13 | Black shutters | iron_trapdoor open=true on both sides of every front window, facing outward | | P3 | shutters |
| 14 | Big chimney | stone_bricks 3x3 shaft x40..42 z24..26 from y2 up through the roof to y14; stone_brick_stairs corbel ring at y13 (x39..43 z23..27 no: only x39 and z23/z27 sides), 2 stone_brick_wall pots at y14 (x40,z25) (x42,z25) | x40..42 z24..26 | P6 | chimney |
| 15 | Wide driveway | gray_concrete y0 x1..16 z0..4, flaring to x0..17 at z0..1; polished_andesite_slab joint lines (every 5th row skipped) | | P5 | driveway |
| 16 | Manicured lawn | grass_block y0 on every cell not driveway/path/house; kept bare (no tall grass) | all | P5 | lawn |
| 17 | Foundation shrubs | per shrub: oak_leaves at y1 + flowering_azalea_leaves at y2 above; at z6: x20,x22,x24,x37?no -> x20,x22,x24 (z6), x36,x42 (z6 on right of bay), x1,x9,x17 (z4? no) -> garage line at z4: x0,x6,x11,x17 skipped for driveway; use x19 z6 | z6 | P5 | shrub |
| 18 | Young tree | oak_log spine x8 z2, y1..4; oak_leaves fan: y4 and y5 5x5 minus corners, y6 3x3, y7 plus-shape; a stake: oak_fence at x9 z2 y1..2 | x8 z2 | P5 | youngTree |
| 19 | Back deck | spruce_planks floor y1 x30..42 z29..31, spruce_fence rail y2 on z31 and sides x30, x42, spruce_stairs steps x29 z30; patio furniture by P6 | | P5 | deck |
| 20 | Sliding glass door to deck | great room back wall z28, x37..39 y2..4 opening: glass_pane 3x3 with birch frame | | P3 | slider |
| 21 | Walkway + portico steps | polished_andesite y0 x30..31 z0..2 (2 wide), stone_brick_stairs facing north y1 x28..33 at z3 | | P5 | path, steps |
| 22 | [x] P1 Double-height foyer | void x27..34 z8..13 y2..9 (shell leaves air), ceiling y10 white; gallery floor y6 at z13 (x27..28) and z14..15 | | P1 | |
| 23 | [x] P1 Sweeping staircase | spruce_stairs facing north half=bottom, 2 wide x27..28, steps k=0..4 at z=8+k, y=2+k, landing y6 z13 | | P1 | stair |
| 24 | Chandelier | foyer centre x30..31 z10..11: iron_chain y8..9 (x30,z10) , lantern hanging=true y7? built by foyer designer; shell leaves ceiling y10 | | rooms | |
| 25 | Kitchen island, family room, fireplace, TV | rooms' designers; fireplace chase: shell leaves cobblestone/stone_bricks chimney breast x40..42 z23..25 y2..5 in great room (RESERVED to P6) | | rooms/P6 | |
| 26 | [x] P1 (shell only: floors, walls, openings) Rooms (office, dining, mudroom, primary suite, 3 bedrooms, bonus) | rooms' designers; shell builds floors, walls, openings only | | P1 | |
| 27 | Mailbox + lamp post | lamp post at x29 z0: spruce_fence y1..3 + lantern y4; mailbox x20? at x33 z0: spruce_fence y1, iron_trapdoor closed y2 | z0 | P5 | lamp |
