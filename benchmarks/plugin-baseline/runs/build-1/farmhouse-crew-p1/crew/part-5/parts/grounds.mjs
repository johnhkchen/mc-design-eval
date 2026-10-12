// PART 6: GROUNDS (front yard path + picket fence + planting, the orchard behind the house, woodpile, hedges, last lamps and life).
// Ticks elements.md: E26 (front path + fence), E27 (orchard / fruit trees free-standing), E28 (flowers + hedge), E29 (woodpile), E30 (lamps to the gate).
// Import from ../vocab.mjs: fenceRun, lamp, tree, B, LEAF, BLOSSOM, GARDEN, HOUSE.
// RESERVED: the roof zone x=-2..18, z=8..22 at y>=8 belongs to `mcd roof` (it wipes everything above the eave there): NO trees or leaves at y>=8
// inside that zone. Also write only into air / ground: parts 1-5 own their cells.
//
// BUILD:
//  1. FRONT PATH: x=7..9 (3 wide) gravel at y=0 from z=0 to z=10, centre line x=8 "bricks"; at the stoop the path meets the step at (8,1,10).
//  2. PICKET FENCE along the street at z=1, y=1: fenceRun(g,0,1,6,1,1,"oak") and fenceRun(g,10,1,39,1,1,"oak") (gap x=7..9 for the path), and the gate
//     g.set(8,1,1,"oak_fence_gate",{facing:"north",open:"false",in_wall:"false"}). The run passes in front of the garden too: it reads as one street fence.
//  3. FRONT BEDS: flowers beside the path inside the fence, y=1 on grass: rose_bush (lower at y=1, upper at y=2, state half) at (5,1,3),(11,1,3),
//     (5,1,6),(11,1,6); lilac (same two-block form) at (4,1,5),(12,1,5); a few peony, cornflower, poppy, allium singles at y=1 around x=3..6 and x=10..13,
//     z=2..9, never on the path. Low hedge of oak_leaves at z=8 for x=1..5 and x=11..14, 1 high (y=1), a second row y=2 for x=1..3.
//  4. FRONT LAMPS: lamp(g,6,1,4,3) and lamp(g,10,1,4,3). Lamp at the yard gate path: lamp(g,19,1,12,3) and lamp(g,19,1,18,3) (outside the garden wall x=20).
//  5. ORCHARD behind the house (x=1..18, z=22..34): free-standing apple trees with tree(g,[x,1,z],"oak",0.9,seed) at (4,1,26), (10,1,26), (16,1,26),
//     (7,1,31), (13,1,31); a blossom shrub tree(g,[2,1,32],"azalea",1). A dirt_path footpath at y=0 along z=21 from x=2 to x=19 (g.set(x,0,21,"dirt_path")).
//  6. WOODPILE against the back wall of the house, z=20: B.log("oak","x") stacked at y=1 (x=3..7), y=2 (x=3..6), y=3 (x=3..5).
//  7. Beyond the roof zone: two hedgerow rows of leaves y=1 along the west edge x=0, z=22..34, and a few tall (y up to 6) trees at the back (z=33..35, x=2..18).
// Check: the street view (render's first tile) should read: fence, path to the door, flowers, the roof and chimney behind, the walled garden to the right.
import { fenceRun, lamp, tree, B, LEAF, BLOSSOM, GARDEN, HOUSE } from "../vocab.mjs";

export function build(g) {
  // TODO(worker): implement the spec above.
}
