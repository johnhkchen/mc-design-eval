// P2 back bedroom: upper back bedroom, box [28,8,14, 33,11,15]. Entered through the door (29,8..9,13) from the front
// bedroom. The stair flight's hole (x33, z11..14, floor y7) and its rail (x32, z11..14, y8) are the stair joiner's:
// the lane keeps to z14 x28..31 and z15, and (32,15) and (33,15) are a bed.
// Layout: bed 1 on the west wall (foot 28,14, head 28,15 on the back wall); bed 2 on the east wall (foot 32,15,
// head 33,15 on the east wall); a barrel dresser on the back wall at x29..30 (lantern standing on one, a flower pot
// on the other); a hanging lantern over the lane. Lane: door (29,14) -> (30,14) -> (31,14) -> (31,15) by bed 2.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // Bed 1: foot (28,8,14), head toward south against the back wall (28,8,16).
  bed(g, [28, 8, 14], "south", "yellow");
  // Bed 2: foot (32,8,15), head toward east against the east wall (34,8,15).
  bed(g, [32, 8, 15], "east", "yellow");

  // Dresser: two barrels against the back wall at floor level, z15 x29..30.
  layers(g, [29, 8, 15], { B: ["barrel", { facing: "up" }] }, ["BB"]);
  // On the barrels: a standing lantern and a flower pot (both need a top face: the barrel tops at y9).
  layers(g, [29, 9, 15], { L: ["lantern", { hanging: "false" }], P: "flower_pot" }, ["LP"]);

  // Hanging lantern over the lane, from the ceiling above.
  hanging_lantern(g, 31, 10, 14);
}
