// P1 west cabinet: a rear sleeping cabinet, 2 x 2 cells of air (x 16..17, z 15..16), y 3..6.
// The door from the salle is at (17, 3..4, 14); the partition door east to the east cabinet at (18, 3..4, 15), so
// the first cells in from both doors, (17, 15) and (17, 16), stay clear as the lane to the bed.
// The bed takes the west column: foot (16, 3, 15), head (16, 3, 16) against the back wall z 17, facing south.
// Light: one lantern hung from the cottage's roof underside above the head, clear of the lane (y 6 is the only
// cell it takes; hanging_lantern writes its chain up to the first solid block within reach, nothing if none).
import { bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hanging_lantern } from "../vocab.mjs";

export function build(g) {
  bed(g, [16, 3, 15], "south", "pink");
  hanging_lantern(g, 16, 6, 16, { reach: 4 });
}
