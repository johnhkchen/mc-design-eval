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
import { fenceRun, lamp, tree, B, LEAF } from "../vocab.mjs";

// the roof zone: no tree or leaf at y>=8 in here (mcd roof rebuilds it)
const inRoofZone = (x, y, z) => y >= 8 && x >= -2 && x <= 18 && z >= 8 && z <= 22;

export function build(g) {
  // 1. front path: gravel, brick centre line, from the street to the stoop
  for (let z = 0; z <= 10; z++) for (let x = 7; x <= 9; x++) g.set(x, 0, z, x === 8 ? "bricks" : "gravel");

  // 2. picket fence along the street; the gate sits in the path gap (fence posts either side of it, see Notes)
  fenceRun(g, 0, 1, 6, 1, 1, "oak");
  fenceRun(g, 10, 1, 39, 1, 1, "oak");
  fenceRun(g, 7, 1, 9, 1, 1, "oak", { skip: [[8, 1]] });
  g.set(8, 1, 1, "oak_fence_gate", { facing: "north", open: "false", in_wall: "false" });

  // 3. front beds: double-tall roses and lilacs, singles of peony, cornflower, poppy, allium
  const tall = (block, x, z) => { g.set(x, 1, z, block, { half: "lower" }); g.set(x, 2, z, block, { half: "upper" }); };
  for (const [x, z] of [[5, 3], [11, 3], [5, 6], [11, 6]]) tall("rose_bush", x, z);
  for (const [x, z] of [[4, 5], [12, 5]]) tall("lilac", x, z);
  tall("peony", 3, 3);
  tall("peony", 13, 3);
  for (const [x, z] of [[4, 2], [12, 2], [6, 7], [10, 7]]) g.set(x, 1, z, "cornflower");
  for (const [x, z] of [[6, 2], [10, 2], [13, 7]]) g.set(x, 1, z, "poppy");
  for (const [x, z] of [[3, 4], [13, 4], [12, 7]]) g.set(x, 1, z, "allium");
  // low hedge of oak leaves along z=8, one high, a second row at the west end
  for (let x = 1; x <= 5; x++) g.set(x, 1, 8, LEAF);
  for (let x = 11; x <= 14; x++) g.set(x, 1, 8, LEAF);
  for (let x = 1; x <= 3; x++) g.set(x, 2, 8, LEAF);

  // 4. lamps: at the front fence, and either side of the yard gate path
  lamp(g, 6, 1, 4, 3);
  lamp(g, 10, 1, 4, 3);
  lamp(g, 19, 1, 12, 3);
  lamp(g, 19, 1, 18, 3);

  // 7 (first, so the trees below overwrite it where they meet): hedgerow along the west edge, beyond the roof zone
  for (let z = 22; z <= 34; z++) for (let x = 0; x <= 1; x++) g.set(x, 1, z, LEAF);

  // 5. footpath behind the house, then the orchard and the blossom shrub
  for (let x = 2; x <= 19; x++) g.set(x, 0, 21, "dirt_path");
  const forbid = (x, y, z) => inRoofZone(x, y, z);
  [[4, 26], [10, 26], [16, 26], [7, 31], [13, 31]].forEach(([x, z], i) => tree(g, [x, 1, z], "oak", 0.9, i + 1, { forbid }));
  tree(g, [2, 1, 32], "azalea", 1, 6, { forbid });

  // 7 (back): a few taller trees at the rear edge, beyond the house and the garden wall
  tree(g, [6, 1, 34], "oak", 0.6, 11);
  tree(g, [12, 1, 34], "oak", 0.6, 12);
  tree(g, [17, 1, 33], "oak", 0.6, 13);

  // 6. woodpile against the back wall (z=20), three courses
  for (let x = 3; x <= 7; x++) g.set(x, 1, 20, ...B.log("oak", "x"));
  for (let x = 3; x <= 6; x++) g.set(x, 2, 20, ...B.log("oak", "x"));
  for (let x = 3; x <= 5; x++) g.set(x, 3, 20, ...B.log("oak", "x"));
}
