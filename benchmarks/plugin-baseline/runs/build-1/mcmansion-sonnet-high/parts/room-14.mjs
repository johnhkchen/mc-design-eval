// room: Corridor W (plan ROOMS): short upstairs corridor to the bonus room. Box [13,6,16,18,8,17]; floor = the y5
// oak_planks laid by the shell. Ways in: the east opening (19,6..8,16..17) and the bonus door (12,6..7,16). The z17 lane
// stays clear from the east opening to the bonus door, so the 2-high walk never meets furniture.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, LIGHT_GRAY_WOOL, POTTED_FERN, RED_CARPET } from "../vocab.mjs";

export function build(g) {
  // runner: red carpet over both rows of the corridor (walkable), except where a piece stands on the floor
  const standing = new Set(["16,16", "18,16"]);              // table (16,6,16) and linen cupboard (18,6,16)
  for (let x = 13; x <= 18; x++)
    for (const z of [16, 17]) {
      if (standing.has(`${x},${z}`)) continue;
      g.set(x, 6, z, RED_CARPET, {});
    }

  // framed picture on the north wall (z15), hung in the z16 row: dark frame of trapdoors lying flat against the wall,
  // light wool panel inside. The trapdoor facing is the direction away from the wall (south here).
  for (const [x, y] of [[15, 7], [17, 7], [15, 8], [16, 8], [17, 8]])
    g.set(x, y, 16, ...B.trapdoor("dark_oak", "south", "bottom", true));
  g.set(16, 7, 16, LIGHT_GRAY_WOOL, {});

  // side table under the picture: a dark oak slab top on the floor
  g.set(16, 6, 16, ...B.slab("dark_oak", "top"));

  // linen cupboard: a barrel against the east end, with a fern on its lid
  g.set(18, 6, 16, BARREL, { facing: "up", open: "false" });
  g.set(18, 7, 16, POTTED_FERN, {});

  // lamps: hanging lanterns from the ceiling, one over the picture end and one over the east end
  g.set(14, 8, 17, ...B.lantern(true));
  g.set(18, 8, 17, ...B.lantern(true));
}
