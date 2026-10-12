// ROOM gallery (interior designer): the narrow entrance hall, air box [16,2,10,22,4,10]. The box is ONE row of floor
// (z=10, x=16..22) between the shell's walls, so every way in (front door at (19,9), atrium doors at (19..20,11), kitchen
// opening at x=15, corridor opening at x=23) lands on that row. Nothing may stand on it in a way that closes the row:
// the cells the player walks through stay clear at y=2..3, and a slab (walkable step) carries no hung lantern above it
// so its head space at y=3..4 stays open.
//   floor y=2: orange_carpet runner (walkable), birch_slab bottom bench on x=17..18 (walkable step, no lantern above)
//   y=4: hung lanterns from the beams at x=16, 19, 22 (y=5); light at the feet is 10+ everywhere on the row.
// Item frames are entities, not blocks, so the north-wall art is left out (see the notes in plan.md).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [16, 2, 10];

// y=2 (floor level): runner carpets, and the birch bench on the two middle cells
const FLOOR = [
  "CBBCCCC",
];

// y=3 is head room only: nothing here
const HEAD = [
  ".......",
];

// y=4: hung lanterns, each under a beam at y=5
const HANG = [
  "L..L..L",
];

export function build(g) {
  layers(g, ORIGIN, {
    C: "orange_carpet",
    B: ["birch_slab", { type: "bottom", waterlogged: "false" }],
    L: ["lantern", { hanging: "true", waterlogged: "false" }],
  }, [FLOOR, HEAD, HANG]);
}
