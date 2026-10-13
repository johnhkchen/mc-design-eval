// P4 Hearths: the four brick chimneys from their own footings (deepslate band, stepped brick cap, hay block and a lit
// signal campfire at the top) and the lit stoves that stand against them inside each house (plan.md FACADES, RESERVED).
// Writes only into air; the chimney and stove helpers do the stack and the smoker.
import { chimney, stove } from "../vocab.mjs";

export function build(g) {
  // chimney(g, x, z, height, band, capY): the 2x2 stack at x..x+1, z..z+1 from y 1; cap at capY, signal fire at capY+1.
  chimney(g, 9, 12, 10, 9, 11);    // plot 0 shotgun (east side): cap y 11, fire y 12
  chimney(g, 17, 12, 12, 11, 13);  // plot 1 duplex (central party wall): cap y 13, fire y 14
  chimney(g, 25, 12, 12, 11, 13);  // plot 2 hall-and-parlour (west gable): cap y 13, fire y 14
  chimney(g, 37, 12, 10, 9, 11);   // plot 3 shotgun, mirrored (west side): cap y 11, fire y 12

  // stove(g, x, y, z, facing): a lit smoker on the floor (y 3) of the room the chimney serves, facing into the room.
  stove(g, 7, 3, 12, "west");      // plot 0 front room, chimney behind the east wall
  stove(g, 16, 3, 12, "west");     // plot 1 west flat, chimney in the party wall
  stove(g, 19, 3, 12, "east");     // plot 1 east flat, chimney in the party wall
  stove(g, 40, 3, 12, "east");     // plot 3 front room, chimney behind the west wall
  // plot 2 hall: a lit furnace (palette hearth role), facing into the hall
  g.set(27, 3, 13, "furnace", { facing: "east", lit: "true" });
}
