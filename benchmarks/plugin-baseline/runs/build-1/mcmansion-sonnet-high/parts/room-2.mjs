// room: Foyer hall: the passage under the gallery, box [20,2,14,25,4,15]. The 6-wide opening (x20..25 at z14..15) stays clear
// in the walkway x21..24; the bench and coat pegs sit at the west end (x20), a small table with a lamp and a fern at the east
// end (x25). Hanging lanterns at the two ends light the walkway (no floor cell is dark).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const fence = (north, south, east, west) => ["dark_oak_fence", { north: String(north), south: String(south), east: String(east), west: String(west), waterlogged: "false" }];

export function build(g) {
  // west end x20: a two-cell bench (spruce stair seats, back to the x19 wall), coat pegs above it, a hanging lantern
  for (const z of [14, 15]) put(g, 20, 2, z, B.stairs("spruce", "east", "bottom"));
  for (const z of [14, 15]) put(g, 20, 3, z, fence(false, false, false, true));
  put(g, 20, 4, 14, B.lantern(true));

  // east end x25: a 1x2 table (dark-oak fence legs, oak slab top), a standing lantern and a potted fern on it
  put(g, 25, 2, 14, fence(false, true, true, false));
  put(g, 25, 2, 15, fence(true, false, true, false));
  for (const z of [14, 15]) put(g, 25, 3, z, B.slab("oak", "top"));
  put(g, 25, 4, 14, B.lantern(false));
  put(g, 25, 4, 15, ["potted_fern", {}]);
}
