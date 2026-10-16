// Part: room: Dogtrot breezeway (interior of box [5,3,9, 6,6,15]).
// Open hall, two cells wide. Clear lanes: x5 or x6 must stay open on every row from z9 to z15, and the cells at z12
// (in front of the pen doors at x4 and x7) and at the open ends z9 and z15 stay clear.
// Layout: bench (spruce stair, back to the west wall, facing east) at x5 z11; water barrel with a lantern on top at
// x6 z13; cauldron (water stand) at x6 z14. The lane zig-zags between the two columns: x6 at z10..12, x5 at z12..15.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Origin [5, 3, 9]: rows run along +z (z9..z15), each row two characters for x5 then x6.
const LEGEND = {
  S: B.stairs("spruce", "east", "bottom"),
  b: ["barrel", { facing: "up", open: "false" }],
  C: "cauldron",
  L: ["lantern", { hanging: "false" }],
};

// y3: floor-level furniture.
const FLOOR = [
  "..", // z9  open end
  "..", // z10
  "S.", // z11 bench against the west wall
  "..", // z12 pen doors (x4, x7): both cells clear
  ".b", // z13 barrel, east column
  ".C", // z14 cauldron, east column
  "..", // z15 open end
];

// y4: the lantern stands on the barrel's top face.
const ABOVE = [
  "..",
  "..",
  "..",
  "..",
  ".L",
  "..",
  "..",
];

export function build(g) {
  layers(g, [5, 3, 9], LEGEND, [FLOOR, ABOVE]);
}
