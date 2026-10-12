// Room: Cellar stair. Interior designer's part. Inner air box [13,1,25,14,3,28]; the stair is a straight run of spruce
// stairs rising south (x13..14) from the cellar store opening at the west, up through the slab hole at y4 to the kitchen.
// Stairs need solid support under them, so the cells beneath the upper treads are stone fill (the stoop's approach).
// The top tread at z29 y4 is the kitchen floor cell outside this box, so it is left to the shell.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { TIMBER, STONE, LANTERN } from "../vocab.mjs";

export function build(g) {
  // stone fill under the rising treads (inside the box only)
  for (const x of [13, 14]) {
    g.set(x, 1, 27, STONE);
    g.set(x, 1, 28, STONE);
    g.set(x, 2, 28, STONE);
  }
  // the run: one tread per step, each at its own height, back to the south
  for (const x of [13, 14]) {
    g.set(x, 1, 26, ...B.stairs(TIMBER, "south", "bottom"));
    g.set(x, 2, 27, ...B.stairs(TIMBER, "south", "bottom"));
    g.set(x, 3, 28, ...B.stairs(TIMBER, "south", "bottom"));
  }
  // light: a lantern standing on the cellar floor at the foot of the stair, in the corner against the party wall
  g.set(14, 1, 25, LANTERN, { hanging: "false" });
}
