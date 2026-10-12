// P6 doors and finish: every interior doorway (birch, closed), the dark oak mudroom→garage door with its garage step,
// the deck door pair, the mudroom yard door with its step, and the two back sconces. plan.md OPENINGS (Interior) and
// elements E27, E35, E37, E38. Only writes into air the shell left open; cased openings stay open.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { door, coachLight } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  interiorDoors(g);
  mudroomGarage(g);
  deckDoors(g);
  yardDoor(g);
  backSconces(g);
}

/** Birch doors (closed) in every interior doorway, ground y2 and upper y6. Facing is the door's plane: x-walls face
 *  east/west, z-walls face north/south. */
function interiorDoors(g) {
  // ground storey
  door(g, 12, 2, 15, "west", "left");   // office ↔ foyer (x12 wall)
  door(g, 23, 2, 18, "north", "left");  // dining ↔ kitchen (z18 wall); kitchen opening (15..18,18) stays cased
  door(g, 25, 2, 21, "west", "left");   // kitchen ↔ mudroom (x25 wall)
  // upper storey
  door(g, 8, 6, 15, "north", "left");   // bedroom 2 ↔ hall (z15 wall)
  door(g, 24, 6, 15, "north", "left");  // bedroom 3 ↔ hall (z15 wall)
  door(g, 9, 6, 18, "north", "left");   // primary bedroom ↔ hall (z18 wall)
  door(g, 25, 6, 18, "north", "left");  // bedroom 4 ↔ hall (z18 wall)
  door(g, 12, 6, 22, "west", "left");   // primary bedroom ↔ walk-in closet (x12 wall)
  door(g, 16, 6, 22, "east", "left");   // walk-in closet ↔ primary bathroom (x16 wall)
  door(g, 29, 6, 16, "east", "left");   // hall ↔ bonus room (x29 wall)
}

/** Dark oak door mudroom→garage at (29,2..3,22) with the stone brick step on the garage floor at (30,1,22), facing west:
 *  you walk west to climb from the garage up to the mudroom sill. */
function mudroomGarage(g) {
  door(g, 29, 2, 22, "east", "left", "dark_oak");
  put(g, 30, 1, 22, B.stairs("stone_brick", "west", "bottom"));
}

/** Deck door pair on the back wall z25 (hinge left at x16, right at x17), dark oak, facing south onto the deck. */
function deckDoors(g) {
  door(g, 16, 2, 25, "south", "left", "dark_oak");
  door(g, 17, 2, 25, "south", "right", "dark_oak");
}

/** Mudroom yard door (27,2..3,25), dark oak, facing south, with a stone brick step on the yard at (27,1,26) facing north. */
function yardDoor(g) {
  door(g, 27, 2, 25, "south", "left", "dark_oak");
  put(g, 27, 1, 26, B.stairs("stone_brick", "north", "bottom"));
}

/** Back sconces: a smooth quartz slab bracket at y4 with a hanging lantern at y3, either side of the deck door. */
function backSconces(g) {
  coachLight(g, 15, 26);
  coachLight(g, 18, 26);
}
