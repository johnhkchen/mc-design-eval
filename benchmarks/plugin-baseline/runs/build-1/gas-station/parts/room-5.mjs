// Part "room: Stock room" (parts/room-5.mjs): back-of-house storage inside [25,1,30,31,7,32].
// Clear lanes: the row z=31 end to end, plus each doorway's first cell ((25,30) shop, (28,30) hall,
// (29,32) delivery, (31,31) side door). Storage stands against the walls; a receiving desk in the NE corner is the focal piece.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  B: "barrel", // stock barrels
  C: "chest", // crates
  D: "oak_planks", // receiving desk
  M: "cauldron", // mop bucket
  L: ["lantern", { hanging: "false" }], // standing lanterns on the barrels, chests and desk
};

export function build(g) {
  layers(g, [25, 1, 30], LEGEND, [
    // y=1: floor furniture; rows z30, z31 (lane), z32; columns x25..31
    [
      ".BB.CDD",
      ".......",
      "CCB..M.",
    ],
    // y=2: lanterns standing on the tops
    [
      "..L...L",
      ".......",
      ".L.....",
    ],
  ]);
}
