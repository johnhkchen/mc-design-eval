# REQUIRED ELEMENTS (Polarton hillside kit)
Parts: P1 shells 0-3, P2 shells 4-7, P3 roofs, P4 openings+porches+ways in, P5 chimneys+stairs+job sites, P6 grounds. Vocab names in plan.md VOCABULARY.

## Every plot (ring, lane)
- [ ] Lane z0..4 y0: gravel centre z1..3, coarse_dirt ruts z1,z3, edges z0,z4 | P6 | laneRow
- [ ] Plot ring: spruce_fence y1 on x=12i,12i+11 (z5..18) and z5,z18; 2-wide spruce_fence_gate (north, closed) x12i+5..6 z5; lantern posts (12i,5),(12i+11,5) fence y1..3 + standing lantern y4. Nothing else on the ring | P6 | ringFence
- [ ] Way in: gate z5 -> bottom slabs z6 (2+ wide) -> full-block landing y1 z7..8 -> door. Gin is level gravel | P4 | slabRamp
- [ ] Beds 3-4 per house: whole, head vs solid wall, 2 clear above | rooms designers | bedAt
## 0 Cotton gin
- [ ] Two storeys, plinth cobblestone y1, birch_planks y2..9, stripped_spruce_log corner/jamb posts + y6 floor beam + y9 plate | P1 | boardWall, framePosts
- [ ] Wagon bay: open door x4..7 y1..4 z9, lintel y5 x3..8, 4 spruce_trapdoor leaves folded open flat at x2..3, x8..9 | P4 | wagonDoor
- [ ] Hay door x5..6 y7..8 z9, leaves folded at x4,x7 | P4 | hayDoor
- [ ] Hoist beam stripped_spruce_log axis z (6,10,7..9), iron_chain (6,9,7) hanging, hay_block (6,8,7) | P4 | hoistBeam
- [ ] Gable louvre x5..6 y12 z9; roof monitor with louvres on ridge | P3/P4 | louvre
- [ ] Machine room x2..9 y1..5 z13..15 CLEAR; floor shaft hole (7,-2..0,14) framed stripped_spruce_wood x6..8 z13..15 y0; loft hole (7,6,14); wall port (10,2,14) framed | P1 | shaftFrame
- [ ] Loft ladder (2,1..6,15) facing east, hole (2,6,15); loft bales/hay | P5 | ladderRun
- [ ] Yard bales x1..3 / x8..10 z6..8 (hay_block), barrels | P6 | baleStack
## 1 Schoolhouse
- [ ] white_concrete clapboard walls, stone_bricks sill, trim stripped_spruce_log, cornice spruce_slab top y7 | P2 | boardWall
- [ ] Cloakroom porch x15..20 z9..12 enclosed, red mangrove_door pair x17..18 z9, transom glass y4, calcite pediment band y5; coat hooks (inside) | P2/P4 | doorPair
- [ ] Bell cupola x16..19 z13..16 y11..19: concrete base, pale_oak_fence posts, open louvres, bell (17,15,14) ceiling, slab ring y16, cone cap, lightning_rod y19 | P2/P3 | bellCupola
- [ ] Yard bench spruce_stairs facing south (13..14,1,7); flower bed x20..22 z6..8 | P6 | yardBench
- [ ] Cartographer table (21,2,16) | P5 | jobSite
## 2 Hill farmhouse
- [ ] Board-and-batten spruce_planks + stripped_spruce_log battens every 3rd col; cobblestone piers | P1 | boardWall, pierRow
- [ ] Deep porch z7..9: mangrove deck y1, 4 posts, beam y5, upside-down stair brackets, fence rail, shed roof | P4 | porchDeep
- [ ] Kitchen ell x26..32 z14..17; stove/hearth; composter-free (farmer's composter in kitchen yard optional) | P1/P5
- [ ] Exterior chimney east of ell, mouth (32,2,15) | P5 | chimney
- [ ] Loft flight x26..30 z13, 4 beds loft | P5 | flight
## 3 Blacksmith + wheelwright
- [ ] Open forge shed: posts y1..4, head beam y5 z9, dark_oak walls back/sides | P1 | boardWall
- [ ] Forge: forge mouth (40,1,15), chimney outside back wall; anvil (42,1,12); smithing table (43,1,14); water cauldron quench | P5 | chimney, jobSite
- [ ] Wheel in progress on stand x37..39 z6..8: spoke wheel from iron_bars/fence ring on fence stand, stock logs | P6 | wheelStand
- [ ] Cart under lean-to x45..46 z9..15: cart bed of oak_trapdoors + 2 wheels (spruce_trapdoors upright) + fence shafts | P6 | cart
- [ ] Coal (coal_block) + cordwood (stripped_oak_log axis x) store x42..46 z16..17 | P6 | woodRick
## 4 Church
- [ ] white_concrete walls, calcite pilasters + cornice, stone_bricks plinth | P2 | boardWall
- [ ] Steeple tower x51..54 z9..12 to y18, round window, belfry with open louvres, bell (52,17,10), calcite cornice y18 | P2/P3 | belfry
- [ ] Spire tower-cap slate y19..24, lightning_rod + spruce_fence cross y25..26 | P3 | spireCap
- [ ] Lancets x49/x56 z11,13,15 y3..6 w/ upside-down stair heads | P4 | lancet
- [ ] Double spruce_door x52..53, transom, calcite lintel | P4 | doorPair
- [ ] Graveyard x56..58 + strip x57..58, pale_oak_fence pickets, gate (55,1,7), headstones | P6 | headstone, picketYard
- [ ] Lectern (52,2,16), pews (stairs), altar | rooms/P5 | jobSite
## 5 Tobacco barn
- [ ] Vertical stripped_dark_oak_log boards, cobblestone sill, plate y10 | P1 | boardWall
- [ ] Vent slots: open spruce_trapdoor columns x63/x68 z10,12,14 y3..9 | P4 | ventSlot
- [ ] Tier poles stripped_spruce_log axis x y5,7,9 x64..67 z10,12,14, hanging tobacco (dried_kelp_block/ fern-free: brown leaves via oak_leaves persistent hung under poles via chains) | rooms | tobaccoTier
- [ ] Firebox (65,1,15) + flue stack | P5 | chimney
- [ ] Stripping shed lean-to x61..62 w/ bench, woodricks x69..70 | P4/P6
- [ ] Ladder (64,1..9,14) | P5
## 6 Corn crib + granary
- [ ] Crib on cobblestone piers, oak floor y2, bamboo_fence slat walls y3..7, hatch (74,3..4,9) | P2/P4 | slatCrib
- [ ] Granary raised 1, oak_planks, double oak_door x78..79, loft door x79..80 y7..8 | P2/P4
- [ ] Slab ramp x77..78 z6 + dock x77..80 z7..8 | P4 | slabRamp
- [ ] Sacks (hay_block + white_wool tops), scale (stone_pressure_plate on fence post, hopper-free), barrels | rooms | sackStack
- [ ] Composter (78,2,15) | P5 | jobSite
## 7 Owner's house
- [ ] Brick two-storey, calcite belt y6, plinth stone_bricks | P2 | boardWall
- [ ] Front bay x85..88 z8, 2 storeys, glazed | P2/P4 | bayWindow
- [ ] Wraparound porch columns calcite, pale_oak beam, spindle frieze, balustrade | P4 | porchWrap
- [ ] Rear balcony x85..88 z16..17 y6, posts, brackets, rail | P4 | balcony
- [ ] Hip roof verdigris copper | P3
- [ ] Chimney, mouth (91,2,15) | P5 | chimney
- [ ] Flight x86 z14->10; 4 beds upper | P5 | flight
## Villager job sites: cartography_table (21,2,16); smithing_table (43,1,14); lectern (52,2,16); composter (78,2,15)
## Light: every interior floor cell >= 8 (lanterns), exterior lantern posts; no mob spawn
