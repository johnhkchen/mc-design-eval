// PART 4: GARDEN FEATURES (rose arches, espaliered fruit trees, glasshouse, cold frame, tool shed, sundial, urn, lamp posts).
// Ticks elements.md: E15 (rose/bean arches), E16 (espaliers), E17 (greenhouse), E18 (cold frame), E19 (tool shed), E14b (sundial + urn), E8b (garden lamps).
// Import from ../vocab.mjs: roseArch, espalier, greenhouse, coldFrame, toolShed, sundial, urn, lamp, door, OPENINGS, GREENHOUSE, SHED, COLDFRAME, pot, B.
//
// BUILD (everything is inside the garden wall, x=21..37, z=5..31; potager part 3 already owns paths, walls, beds, well):
//  1. ROSE ARCHES over the E-W path: roseArch(g,{x:24,zA:14,zB:16}) and roseArch(g,{x:34,zA:14,zB:16}). They put coarse_dirt under the rose bushes at y=0;
//     those writes are refused where part 3 laid gravel, which is fine (roses may sit on gravel).
//  2. ESPALIERS (fruit trees trained against the wall, spine cell NEXT to the wall):
//       west wall (wall:"west", x=21): z=8, 12, 19, 23   (leaf OAK_LEAVES for z=8,19; BLOSSOM flowering_azalea_leaves for z=12,23)
//       east wall (wall:"east", x=37): z=8, 12, 19, 23   (mirror leaf choice)
//       north wall (wall:"north", z=5): x=24, 34          (blossom)
//     espalier(g,{x,z,wall,leaf}). Its coarse_dirt at y=0 is refused where part 3 laid a path: fine.
//  3. GLASSHOUSE: greenhouse(g,GREENHOUSE) (x=22..27, z=27..31; door gap (25,1..2,27): door(g,{x:25,y:1,z:27,face:"north",mat:"oak"})).
//     Inside: a potting bench of B.slab("spruce","bottom") at (23..26,1,30) with pots on y=2 via pot(): potted_fern, potted_azalea_bush, potted_red_tulip,
//     potted_oxeye_daisy; composter g.set(23,1,28,"composter"); water cauldron waterCauldron-style g.set(26,1,28,"water_cauldron",{level:"3"}); lantern(g,24,2,30) on the bench.
//  4. COLD FRAME: coldFrame(g,COLDFRAME) (x=32..36, z=26..27).
//  5. TOOL SHED: toolShed(g,SHED) (x=32..36, z=28..31; door gap (32,1..2,29) facing west: door(g,{x:32,y:1,z:29,face:"west",mat:"spruce"})).
//     Inside: g.set(33,1,30,"crafting_table"), barrel(g,34,1,30), barrel(g,35,1,30), chest(g,36,1,30,"west"), grindstone g.set(33,1,28,"grindstone",{face:"floor",facing:"north"}),
//     hay_block (35,1,28), composter (36,1,28), lantern(g,34,1,28) standing on the floor. No window is needed.
//  6. SUNDIAL at (29,1,6) (north end of the main N-S path, on the brick line): sundial(g,{x:29,z:6}); URN at (29,1,25) is on the margin: urn(g,{x:29,z:25}).
//  7. LAMP POSTS (lamp(g,x,1,z,3)): (27,14), (27,16), (31,14), (31,16) (path edges by the well), (28,6), (30,6) (by the sundial), (28,24), (30,24).
//  8. Small touches: rows of flowers along the base of the north wall z=5: B.block("cornflower") / "poppy" / "allium" at y=1 on the margin (x=22,23,25,26,27,31,32,33,35,36).
// Check: render the back-left iso and a --view of the garden from the gate: arches, trained trees, glasshouse and shed must read.
import { roseArch, espalier, greenhouse, coldFrame, toolShed, sundial, urn, lamp, door, chest, barrel, lantern, OPENINGS, GREENHOUSE, SHED, COLDFRAME, pot, B, LEAF, BLOSSOM } from "../vocab.mjs";

export function build(g) {
  // TODO(worker): implement the spec above.
}
