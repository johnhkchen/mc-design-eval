// Room: Bedroom bay (interior designer). Inner air box [3,10,5,6,12,6]; the bay opens south to the front bedroom along
// z=6..7 (x2..7 at z6 is air). Reading nook: a window seat under the bay window (stairs as seats, facing the back wall),
// a small chair facing the window, a flower pot by the west corner, and two standing lanterns for the night light.
// Floor is y9 (set by the bay/shell parts); everything here sits at stand y10 and stays clear of y11..12 for the walk.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { TIMBER, PLUM } from "../vocab.mjs";

const Y = 10;

export function build(g) {
  // window seat: spruce stairs with their full-height back to the bay window (north), x3..6 at z5
  for (const x of [3, 4, 5, 6]) g.set(x, Y, 5, ...B.stairs(TIMBER, "north", "bottom"));

  // small chair: plum stairs with the back to the south, looking north over the seat to the window
  g.set(4, Y, 6, ...B.stairs(PLUM, "south", "bottom"));

  // plant: an empty flower pot on the west corner of the floor
  g.set(2, Y, 6, ...B.block("flower_pot"));

  // light: two standing lanterns, either side of the walkway, so the seat and chair sit in the brightest light
  g.set(3, Y, 6, ...B.lantern(false));
  g.set(7, Y, 6, ...B.lantern(false));
}
