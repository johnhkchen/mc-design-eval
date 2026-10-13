// Part: room: wing balcony walk. The walk is a 1-wide strip x49..57 on z62 (y11..16 air), entered from the wing opening
// at z61 x52..53 and open at its west end onto the living room's balcony edge (the rail at x48 y11 belongs to the shell).
// Nothing stands on the floor, because every floor cell is the walk. Light: two hanging lanterns on iron_chain under the
// ceiling at x50 and x56 (chain y15..16, lantern y14), which light the nine walk cells to min 9 (scratch measure).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  for (const x of [50, 56]) {
    g.set(x, 16, 62, ...B.chain("y"));
    g.set(x, 15, 62, ...B.chain("y"));
    g.set(x, 14, 62, ...B.lantern(true));
  }
}
