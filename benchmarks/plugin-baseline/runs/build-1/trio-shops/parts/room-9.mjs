// Part: room: H3 lobby and stair hall (the ironmonger's stair hall: iron and dark wood).
// Inner air x 2..4, z 8..23, clear y 2..7 (world). The stair joiner's flight 1 (x 2..3, z 12..17) and flight 2 (x 4,
// z 15..19) are already built and locked. Lane kept clear: x 3 at z 8 (front door's first cell), x 4 from z 8 to 23
// (flight 2's foot and the keeper's door at x 5 z 22), x 3 at z 23 (rear door's first cell).
// Furniture sits on the west column x 2, against the wall, so the lane stays one cell wide and clear.
// Layers are drawn at world y (floor y 2 for the stock, y 7 for the hanging lanterns under the landing).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// x 1..5 across, z 7..24 down; '.' leaves the cell alone
function rowsFrom(sparse) {
  return Array.from({ length: 18 }, (_, i) => sparse[7 + i] ?? ".....");
}

const STOCK = {
  B: "barrel",
  A: ["anvil", { facing: "west" }],
  C: ["chest", { facing: "east" }],
  L: ["lantern", { hanging: "false" }],
};

const LIGHTS = {
  L: ["lantern", { hanging: "true" }],
};

export function build(g) {
  // ground layer: the focal anvil by the front door, barrels of stock to the front, a chest and barrels under the landing
  // z 9 and z 20 hold the lobby's standing lamps (lighting part, locked): the anvil moves to z 10 and the barrel at z 20 to z 22
  layers(g, [1, 2, 7], STOCK, rowsFrom({
    8: ".B...",
    10: ".A...",
    11: ".L...",
    19: ".C...",
    21: ".B...",
    22: ".B...",
  }));
  // hanging lanterns from the flat floor (y 8) over the front zone and under the landing
  layers(g, [1, 7, 7], LIGHTS, rowsFrom({
    9: "..L..",
    14: "...L.",
    18: ".L.L.",
    20: "..L..",
  }));
}
