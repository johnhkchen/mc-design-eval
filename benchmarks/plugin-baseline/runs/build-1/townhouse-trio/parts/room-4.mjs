// room: A attic (interior designer + lamplighter). Box [5,18,14,9,20,22]; ladder entry at (4,18..20,23).
// Palette has no bed, barrel, chest or carpet, so the cot is two spruce slabs, the table a fence with a slab top, and
// the chairs spruce stairs. The stair well (x9..10, z20..23) stays clear. Lanes: x=6 from z=22 to z=14.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [5, 18, 14]; // x0, y0, z0 of the first character (top-left of the grid)

const LEGEND = {
  f: "spruce_fence",
  p: "potted_poppy",
  s: ["spruce_slab", { type: "bottom", waterlogged: "false" }],
  c: ["spruce_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" }],
  h: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" }],
  l: ["lantern", { hanging: "false", waterlogged: "false" }],
};

// Floor layer y=18 (rows along +x from x=5, successive rows along +z from z=14).
const Y18 = [
  "....p", // z14: potted poppy by the dormer
  "....p", // z15
  "..cf.", // z16: chair (west), table fence
  "...h.", // z17: chair (south)
  "p....", // z18: flower pot on the cot's head side
  "s...l", // z19: cot slab, lantern standing on the floor in the SE corner
  "s....", // z20: cot slab
  ".....", // z21
  ".....", // z22
];

// y=19: table top slab, and a lantern standing on the cot slab.
const Y19 = [
  ".....",
  ".....",
  "...s.",
  ".....",
  ".....",
  ".....",
  "l....",
  ".....",
  ".....",
];

// y=20: the focal lantern standing on the table top.
const Y20 = [
  ".....",
  ".....",
  "...l.",
  ".....",
  ".....",
  ".....",
  ".....",
  ".....",
  ".....",
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [Y18, Y19, Y20]);
}
