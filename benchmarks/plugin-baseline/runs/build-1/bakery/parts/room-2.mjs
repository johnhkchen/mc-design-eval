// Room: Backstube (prep and proofing room). Interior designer's part: fills the box [7,2,17,15,5,21] only.
// Layout: the kneading trough (cauldrons, stair seats) is the focal piece at the centre, lit by the lantern above it.
// Aisles x=9 and x=13 and the z=21 row keep the archway (11..12,2..3,16), the stair foot (7..8,2,18) and the back
// door (8,2..3,22) walkable. Bread racks (slab tops with cakes) on the north wall, the flour store (barrels + hay) in
// the NE corner, a peel wall on the east wall, a work bench in the SE corner. Lanterns hang from the upper floor.
// Origin [7,2,17]: rows run along +x (x=7..15), successive rows along +z (z=17..21). '#' = shell (left alone).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  R: ["spruce_slab", { type: "top" }], // bread-rack shelf, and the peel head on the peel wall
  c: "cake", // bread on the racks
  B: ["barrel", { facing: "up" }], // flour barrels
  H: "hay_block", // flour sack on the barrel
  S: ["spruce_stairs", { facing: "north", half: "bottom" }], // trough seats on the north side (back north)
  T: ["spruce_stairs", { facing: "south", half: "bottom" }], // trough seats on the south side (back south)
  C: "cauldron", // kneading trough
  P: "spruce_fence", // peel-wall post
  G: ["grindstone", { face: "floor" }], // sharpening stone under the peel wall
  K: "crafting_table", // work bench
  F: "spruce_planks", // work bench top
  L: ["lantern", { hanging: true }], // hanging lights from the upper floor
};

export function build(g) {
  const origin = [7, 2, 17];
  const floor = [
    "##RR...BB", // z=17 (north row, by the archway wall)
    "##.SSS..P", // z=18 (stair foot at x=7..8)
    "...CCC..G", // z=19 (trough centre)
    "...TTT...", // z=20
    "R......KF", // z=21 (back door row; rack at the stair-side corner)
  ];
  const flourUp = [
    "..cc....H", // z=17 (y=3): bread on the racks, flour sack on the barrel
    "........R", // z=18 (y=3): peel head on the fence post
    ".........",
    ".........",
    "c........", // z=21 (y=3): bread on the SW rack
  ];
  const empty = [".........", ".........", ".........", ".........", "........."];
  const lights = [
    ".........",
    ".......L.", // z=18 (y=5): over the east aisle
    "....L....", // z=19 (y=5): centre, over the kneading trough
    ".L.......", // z=20 (y=5): over the back-door aisle
    ".........",
  ];
  return layers(g, origin, LEGEND, [floor, flourUp, empty, lights]);
}
