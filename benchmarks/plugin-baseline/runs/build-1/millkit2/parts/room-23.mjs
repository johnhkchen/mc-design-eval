// Part: room: Boarding landing hall (box 50,8,14 .. 57,11,15). The stair top x52 z15 opens onto it; the bunk-room
// doors sit on the z13 wall at x51 and x56, so their first cells (x51 z14, x56 z14) and the lane x51..53 stay clear.
// The stair flight has no rail (stairs.mjs), so z14 x54..57 stays a lane to the east bunk door.
// Furniture: a lamp post (spruce fence with a standing lantern) at the west end, a spruce bench against the west wall
// facing the stair, and a barrel for the landing's stores at the east end. The lanterns stand on the post only.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  F: "spruce_fence", // lamp post foot (coat post)
  L: ["lantern", { hanging: "false" }], // standing lantern
  S: ["spruce_stairs", { facing: "east", half: "bottom", shape: "straight" }], // bench, back to the west wall
  B: ["barrel", { facing: "up" }], // landing stores
};

// Origin [50, 8, 14]: x 50..57 along +x, z 14 (row 0) and z 15 (row 1).
export function build(g) {
  layers(
    g,
    [50, 8, 14],
    LEGEND,
    [
      ["F      B", "S       "], // y 8: post, barrel, bench
      ["L       ", "        "], // y 9: the lantern on the post
      ["        ", "        "], // y 10: clear
    ],
  );
}
