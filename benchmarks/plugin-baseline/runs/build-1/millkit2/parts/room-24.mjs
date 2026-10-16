// Part: room: Smokehouse smoke room (plan.md ROOMS: S5 smoke room, box 62,1,13 .. 64,4,15).
// Only what the shell and chimney parts leave open: one hanging lantern from a beam cross-piece at x63 z13 (y 3..4).
// The smoker (x63 z15), the barrel hams and their iron chains (x62 and x64, z13..15) and the tie beams are built by
// Shell B and Chimneys, so they are not written again here. The x63 column stays clear from the door (x63 z12) to the
// smoker. Inner air only; the shell, chimney and roof belong to other parts.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Origin: the room's lowest written layer (x 62, y 3, z 13). Rows run along +x, successive rows along +z (z 13, 14, 15).
const ORIGIN = [62, 3, 13];

const LEGEND = {
  L: ["lantern", { hanging: "true" }],
  X: ["stripped_spruce_log", { axis: "x" }],
};

// Two layers, y 3 and y 4, each three rows (z 13..15) of three cells (x 62..64). Only the centre column is new.
const LAYERS = [
  // y 3: the lantern hangs from the cross-piece at x63 z13; the chains beside it belong to Shell B.
  [".L.", "...", "..."],
  // y 4: cross-piece along x at x63 z13 for the lantern; the tie beams at x62 and x64 belong to Shell B.
  [".X.", "...", "..."],
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, LAYERS);
}
