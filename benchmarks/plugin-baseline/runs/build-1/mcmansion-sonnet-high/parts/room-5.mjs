// room: Dining bay (turret): the sunny window nook off the dining room (plan Dining bay (turret), box x30..32, y2..4, z5..7).
// Entered from the dining room through the z8 opening; the tall arched window is on the north wall (z4).
// Layout, north to south: a window seat along the arch (stair seats facing the glass, a slab between them), a small
// dark-oak table in the middle with red floor cushions either side, a potted fern by the door side, and one hanging
// lantern over the table as the brightest light in the nook. Every cell is written only if it is still air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one block per cell; the shell and earlier parts own everything else, so only air is written
const put = (g, x, y, z, [block, state, nbt]) => { if (g.isAir(x, y, z)) g.set(x, y, z, block, state, nbt); };

export function build(g) {
  // window seat under the arch: stairs with the back to the room (facing south) so each seat faces the glass
  put(g, 30, 2, 5, B.stairs("spruce", "south", "bottom"));
  put(g, 32, 2, 5, B.stairs("spruce", "south", "bottom"));
  put(g, 31, 2, 5, B.slab("spruce", "bottom"));
  // floor cushions in front of the seats (walkable carpet, so the path to the seats stays open)
  put(g, 30, 2, 6, B.block("red_carpet"));
  put(g, 32, 2, 6, B.block("red_carpet"));
  // small round table: a dark-oak fence post with a dark-oak slab top
  put(g, 31, 2, 6, B.fence("dark_oak"));
  put(g, 31, 3, 6, B.slab("dark_oak", "top"));
  // plant by the door side, off the walking line
  put(g, 30, 2, 7, B.block("potted_fern"));
  // hanging lantern over the table: the focal light of the nook
  put(g, 31, 4, 6, B.lantern(true));
}
