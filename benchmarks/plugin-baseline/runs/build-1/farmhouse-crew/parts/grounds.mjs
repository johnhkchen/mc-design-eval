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
  // 1. FRONT PATH: gravel with brick centre line
  for (let x = 7; x <= 9; x++) for (let z = 0; z <= 10; z++) {
    g.set(x, 0, z, "gravel");
    if (x === 8) g.set(x, 0, z, "bricks");  // centre line
  }

  // 2. PICKET FENCE along z=1 (front) with gate at x=8
  // Fence from x=0 to x=6, then gate gap x=7..9, then x=10 to x=39
  fenceRun(g, 0, 1, 6, 1, 1, "oak");      // west side
  fenceRun(g, 10, 1, 39, 1, 1, "oak");    // east side
  g.set(8, 1, 1, "oak_fence_gate", { facing: "north", open: "false", in_wall: "false" });

  // 3. FRONT BEDS: flowers beside the path
  // Rose bushes (lower at y=1, upper at y=2)
  const roseBush = (x, y, z) => { g.set(x, y, z, "rose_bush", { half: "lower" }); g.set(x, y + 1, z, "rose_bush", { half: "upper" }); };
  roseBush(5, 1, 3); roseBush(11, 1, 3);
  roseBush(5, 1, 6); roseBush(11, 1, 6);
  // Lilacs (same form)
  const lilac = (x, y, z) => { g.set(x, y, z, "lilac", { half: "lower" }); g.set(x, y + 1, z, "lilac", { half: "upper" }); };
  lilac(4, 1, 5); lilac(12, 1, 5);

  // Single flowers: peony, cornflower, poppy, allium (scattered)
  // West side, around x=3..6
  g.set(3, 1, 2, "peony"); g.set(3, 1, 7, "peony");
  g.set(4, 1, 2, "cornflower"); g.set(4, 1, 8, "cornflower");
  g.set(5, 1, 2, "poppy"); g.set(5, 1, 9, "poppy");
  g.set(6, 1, 3, "allium"); g.set(6, 1, 8, "allium");
  // East side, around x=10..13
  g.set(10, 1, 2, "peony"); g.set(10, 1, 7, "peony");
  g.set(11, 1, 2, "cornflower"); g.set(11, 1, 8, "cornflower");
  g.set(12, 1, 2, "poppy"); g.set(12, 1, 9, "poppy");
  g.set(13, 1, 3, "allium"); g.set(13, 1, 8, "allium");

  // Low hedge of oak_leaves at z=8 (1 high, plus second row for x=1..3)
  for (let x = 1; x <= 5; x++) g.set(x, 1, 8, "oak_leaves");
  for (let x = 11; x <= 14; x++) g.set(x, 1, 8, "oak_leaves");
  // Second row y=2 for x=1..3 and x=11..13
  for (let x = 1; x <= 3; x++) g.set(x, 2, 8, "oak_leaves");
  for (let x = 11; x <= 13; x++) g.set(x, 2, 8, "oak_leaves");

  // 4. FRONT LAMPS: lamp posts at specific locations
  lamp(g, 6, 1, 4, 3);    // left front
  lamp(g, 10, 1, 4, 3);   // right front
  lamp(g, 19, 1, 12, 2);  // yard path (left) - reduced height
  lamp(g, 19, 1, 18, 2);  // yard path (right) - reduced height

  // 5. ORCHARD behind the house (x=1..18, z=22..34)
  // Free-standing apple trees
  tree(g, [4, 1, 26], "oak", 0.9, 42);
  tree(g, [10, 1, 26], "oak", 0.9, 43);
  tree(g, [16, 1, 26], "oak", 0.9, 44);
  tree(g, [7, 1, 31], "oak", 0.9, 45);
  tree(g, [13, 1, 31], "oak", 0.9, 46);
  // Blossom shrub
  tree(g, [2, 1, 32], "azalea", 1.0, 47);

  // Dirt path footpath at y=0 along z=21
  for (let x = 2; x <= 19; x++) g.set(x, 0, 21, "dirt_path");

  // 6. WOODPILE (relocated to z=22 to avoid conflicts)
  // y=1: x=13..17
  for (let x = 13; x <= 17; x++) g.set(x, 1, 22, ...B.log("oak", "x"));
  // y=2: x=13..16
  for (let x = 13; x <= 16; x++) g.set(x, 2, 22, ...B.log("oak", "x"));
  // y=3: x=13..15
  for (let x = 13; x <= 15; x++) g.set(x, 3, 22, ...B.log("oak", "x"));

  // 7. HEDGEROW and tall trees beyond the roof zone
  // Hedgerow: two rows of oak_leaves at west edge x=0, z=22..34, y=1
  for (let z = 22; z <= 34; z++) g.set(0, 1, z, "oak_leaves");
  // A few tall trees at the back (z=33..35, x=2..18)
  tree(g, [5, 1, 33], "oak", 1.2, 48);
  tree(g, [12, 1, 33], "oak", 1.2, 49);
  tree(g, [8, 1, 34], "oak", 1.3, 50);
  tree(g, [14, 1, 34], "oak", 1.3, 51);
  tree(g, [3, 1, 35], "oak", 1.4, 52);
  tree(g, [10, 1, 35], "oak", 1.4, 53);
}
