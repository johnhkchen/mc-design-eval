# Required elements: Sears Modern Homes row (checklist)

Coordinates are absolute (plan.md). lx = local x, abs x = 16i + lx. Part numbers refer to plan.md PARTS.
Vocabulary names are defined in plan.md VOCABULARY.

## Row-wide
- [ ] Street: gravel y0 z0..2, smooth_stone sidewalk y0 z3..4, every plot's 16-wide strip. Part 6. `lawn()`.
- [ ] Front lawn grass_block y0 z5..8 to the sidewalk, NO front fence. Part 6. `lawn()`.
- [ ] Hedge: persistent oak_leaves y1, back row z24 lx0..15, sides lx0 and lx15 z22..23, same on all plots. Part 6. `hedge()`.
- [ ] Accessible way in, every plot: smooth_stone walk y0 (z5..6), two cells of bottom smooth_stone_slab y1 (ramp), then a FULL-block deck/landing y1 at least 2x2, level to the door sill. No stairs, no full-block step. Part 6 (ramp/walk), Part 4 (decks). `accessRamp()`.
- [ ] Beds: 3-4 per house, whole (foot+head via bed()), head on a solid wall, 2 clear above. Rooms' designers. `bedSet()`.
- [ ] Per house: living room/parlour, kitchen with stove (smoker + furnace + cauldron/barrels), dining table, bedrooms. Rooms' designers. `kitchenStove()`, `diningSet()`.
- [ ] Lit hearth per chimney: lit campfire at floor, hay_block hidden below, walled 1x1 air flue to a mouth 1-2 courses over the roof. Part 6 `chimneyStack()`.
- [ ] No dark cell (light >= 8): hanging lanterns from blocks (no chains: `chain` id is not trusted by the toolkit; hang from beams/ceiling blocks or use standing lanterns on tables). Lamplighter in rooms; Part 6 porch lanterns. `porchLantern()`.
- [ ] Windows always in pairs/triples with sill (top slab) and lintel, flush in the 1-thick wall; shutters as open trapdoors flat on the wall. Part 5. `windowPair()`, `windowTriple()`, `shutterPair()`.
- [ ] Every plot stays inside x 16i..16i+15, z 0..24.

## Plot 0 Magnolia (Georgian, x 2..13, z 13..21)
- [ ] Symmetric 5-bay front, white_concrete clapboard y2..8, bricks plinth y1, quartz band y5, corner boards quartz_pillar x2 and x13 y2..8 (z13). Part 1; `clapboardWall()`.
- [ ] Full-height portico: deck smooth_quartz y1 x4..11 z9..12; four quartz_pillar columns x4,6,9,11 at z9 y2..8; entablature smooth_quartz y9 x4..11 z9..12; pediment: tympanum smooth_quartz y10..11, quartz_stairs rakes up to a peak x7..8 y12. Part 4; `portico()`.
- [ ] Balcony over the door: smooth_quartz floor y5 x6..9 z10..12, iron_bars rail y6 along z10 x6..9 (and x6 / x9 sides z10..12). Part 4; `balcony()`.
- [ ] Double door x7..8 y2..3 z13 (dark_oak_door, mirrored hinges), sidelights x6,x9, fanlight glass y4 x7..8, French double door x7..8 y6..7. Part 5; `doorSet()`.
- [ ] Hip roof, 3 dormers on N face, dark slate, quartz dentil cornice. Part 3.
- [ ] Two brick chimneys W (2,1,17) E (13,1,17). Part 6.

## Plot 1 Alhambra (Mission, x 18..29, z 13..21)
- [ ] Stucco white_terracotta walls y2..8, mud_bricks plinth y1. Part 1.
- [ ] Shaped parapet on z13: y9 x18..29, y10 x19..28, y11 x20..27, y12 x21..26, y13 x22..25, y14 x23..24; brick_stairs/brick_slab coping; end piers x18,x29; vent glass x23..24 y11. Part 4; `shapedParapet()`.
- [ ] Arcaded porch: piers white_terracotta x19,22,25,28 z9 y2..4; arches x20..21,23..24,26..27 with upside-down brick_stairs at top corners y4; side arches z10..11 on x19 and x28; deck mud_bricks y1; flat deck y5; red-tile pent (brick_stairs facing south) z8 y5. Part 4; `arcadeBay()`.
- [ ] Red-tile low roof edges: front-gabled slab roof behind the parapet. Part 3.
- [ ] Brick chimney rear (27,1,21) north. Part 6.

## Plot 2 Vallonia (Craftsman bungalow, x 35..45, z 9..21)
- [ ] Side gable sweeping down over the full-width porch (roof starts y5 at z9). Part 3.
- [ ] Porch piers x35,38,42,45 z9: cobblestone y2..3, tapering spruce_fence post y4, stripped_spruce_log beam y5 axis x. Porch ceiling spruce_slab top y4. Part 4; `taperedPier()`.
- [ ] Exposed rafter tails (spruce_trapdoor / spruce_stairs underside along eave y5) and knee braces (upside-down spruce_stairs) under each verge y5..6. Part 3 + Part 4; `kneeBrace()`, `rafterTails()`.
- [ ] Front gabled dormer x38..42 z11..13 y9..13, triple window x39..41 y10..11, birch trim. Part 4/3; `dormerGable()`.
- [ ] Door x40, triples x36..38, 42..44. Part 5. Brick chimney W (35,1,17). Part 6.

## Plot 3 Puritan (Dutch Colonial, x 51..61)
- [ ] Gambrel roof ridge along x (steep lower 2 cells, shallow upper), slate; birch_planks gambrel end walls. Part 3 + Part 1 (end walls).
- [ ] Long front shed dormer x53..59 z13..14 y6..9, two pairs x54..55, 57..58 y6..7. Part 3/4; `dormerShed()`.
- [ ] Pedimented entry porch x55..57 z10..12, columns quartz_pillar x55,57 z10 y2..4, pediment quartz_stairs to peak x56 y7, tympanum smooth_quartz. Part 4; `pedimentPorch()`.
- [ ] Warped_trapdoor green shutters at x51,54,58,61 z12. Part 5. Brick chimney W (51,1,17). Part 6.

## Plot 4 Cornell (Foursquare, x 67..77)
- [ ] Cube y1..8 cyan_terracotta, bricks plinth, quartz band y5. Part 1.
- [ ] Low hip roof, 2-wide eaves, dark slate; hipped dormer x70..74 z14..16 y11..14, triple x71..73 y11..12. Part 3; `dormerHip()`.
- [ ] Full-width porch: square smooth_quartz columns x67,70,74,77 z9 y2..4 on bricks pier y1, frieze y5, hip porch roof y5. Part 4; `squarePorch()`.
- [ ] Door x72 + sidelights x71,73. Part 5. Brick chimney E (77,1,17). Part 6.

## Plot 5 Cape Cod (Stanford, x 83..93, z 14..21)
- [ ] Steep side gable, white calcite shingle y2..6, quartz eave. Parts 1,3.
- [ ] Two gabled dormers x85..87, 89..91 each with a 1x2 window x86 / x90 y8..9. Part 3; `dormerGable()`.
- [ ] Door x88 z14, door hood x87..89 z13 y5..6 gabled smooth_quartz stairs, landing x87..89 z12..13 y1 smooth_stone. Part 4; `doorHood()`.
- [ ] dark_oak_trapdoor shutters on every window (x83,86,90,93 at z13). Part 5.
- [ ] Central interior chimney at (88,1,18) open south, bricks, top 13. Part 6.

## Plot 6 Winona (cottage, x 100..108, z 13..22)
- [ ] Front gable roof (ridge along z, x104), spruce-shingle, birch verge; gable infill smooth_sandstone with triple window x103..105 y6..7. Part 3.
- [ ] Small gabled entry porch x102..106 z10..12: stripped_birch_log posts x102,106 z10 y2..4, ridge along z at x104 y7, oak_planks deck. Part 4; `gablePorch()`.
- [ ] spruce_trapdoor window boxes with flowers under the front pairs. Part 5; `windowBox()`.
- [ ] Brick chimney E (108,1,18) west. Part 6.

## Plot 7 Craftsman two-storey (x 114..125)
- [ ] Lower stripped_birch_log axis x lap siding y2..4, dark_oak_slab (top) skirt y5 at z12-ish flare, upper spruce_planks shingle y5..8 and gable. Part 1; `clapboardWall()`.
- [ ] Broad porch on stone piers x114,117,122,125 z9: cobblestone/mossy y2..3, spruce_fence post y4, stripped_dark_oak_log beam y5 axis x; shed roof z9..12 y5. Part 4; `taperedPier()`.
- [ ] Wide eaves 2, brackets: upside-down dark_oak_stairs under both rakes every 2 cells and under eaves y8. Part 3/4; `kneeBrace()`.
- [ ] Front gable pair x119..120 y10..11. Door x119; ground triple x115..117, pair x122..123. Part 5. Chimney E (125,1,17). Part 6.
