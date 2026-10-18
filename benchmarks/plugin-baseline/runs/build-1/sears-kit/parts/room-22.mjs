// Room "P3 hall" (interior designer's part): entry hall, box x55..57 z14..20, floor layer y1, feet y2..4.
// The stair flight at x55 z15..17 is the joiner's and is not touched. The centre column x56 stays clear at feet
// level from the front door (56,14) to the back wall, so the door's lane reads straight through the hall.
// Focal piece: the console (barrel + potted poppy) against the back wall, where the doorway looks.
// Intended furniture, none of it placed: coat rack by the door (57,14), hall runner carpet down x56, the console
// (barrel + potted poppy) at (56,20), two hanging lanterns at (56,4,15) and (56,4,18).
// Why none is placed: shell west fills the whole interior with air at y2..4 and the stair joiner cuts the flight,
// and runParts locks every cell an earlier part set (air included). Every feet-level cell of this hall is locked,
// so each write was refused. The fix belongs in the shell (leave the interior's furnishable cells unowned).
// Lamplighter: the two centre-line lanterns hang from the upper floor's block layer (y5), at feet-level height y4.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  g.set(56, 4, 15, ...B.lantern(true));
  g.set(56, 4, 18, ...B.lantern(true));
}
