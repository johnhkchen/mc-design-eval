// Part: room: wing walkway. A one-cell-wide gallery (x49, z63..74) over the living room, entered from the lobby at z62,
// with doors into B6 (x50 z66) and B7 (x50 z72). Every cell from z63 to z72 is a lane, so nothing stands in it.
// Light: hanging lanterns on iron_chain at z64, z69 and z74 (chain y15..16, lantern y14), above the lane's headroom; the
// reading lectern stands at the south end (x49 y11 z74).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  for (const z of [64, 69, 74]) {
    g.set(49, 16, z, ...B.chain("y"));
    g.set(49, 15, z, ...B.chain("y"));
    g.set(49, 14, z, ...B.lantern(true));
  }
  g.set(49, 11, 74, "lectern", { facing: "east", has_book: "false", powered: "false" });
}
