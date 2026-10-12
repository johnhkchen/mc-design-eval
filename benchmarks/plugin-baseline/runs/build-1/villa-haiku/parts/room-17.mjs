// villa-haiku: room 17, storeroom SW (plan ROOMS; inner air x1..10, z42..46, y2..5). Entered by the door at (10, 2..3, 41).
// Storage only: barrels stand along the two outer walls (west x1, south z46), a second tier on some of them; one
// standing lamp on the open floor is the focal piece. The mosaic floor stays as the shell laid it. The door's cells
// and the route from it (x9..10) stay clear.
import { BARREL, lamp } from "../vocab.mjs";

/** barrel: one barrel at (x, y, z), open top. */
function barrel(g, x, y, z) {
  g.set(x, y, z, BARREL, { facing: "up" });
  return g;
}

export function build(g) {
  // west wall: a barrel per cell z42..46, a second tier on z43 and z45
  for (let z = 42; z <= 46; z++) barrel(g, 1, 2, z);
  for (const z of [43, 45]) barrel(g, 1, 3, z);
  // south wall: barrels x2..8 at z46, a second tier on x3, x5, x7
  for (let x = 2; x <= 8; x++) barrel(g, x, 2, 46);
  for (const x of [3, 5, 7]) barrel(g, x, 3, 46);
  // the lamp: the focal piece, on the open floor at the room's centre line
  lamp(g, 5, 44);
  return g;
}
