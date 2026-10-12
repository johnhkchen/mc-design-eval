// Room: East passage (interior designer). Inner air x31..34, y6..8, z18..19 (plan.md ROOMS).
// Ways in: gallery door (30,6..7,18) west, bedroom 3 door (33,6..7,17) north, tunnel (35,6..7,18) east to the primary.
// Layout: the z=18 row stays clear as the walking line (x31..34, y6..7). The z=19 row holds the bench, the art panel
// beside it, and a side table with a pot. One hanging lantern lights the row; the art sits in the brightest light.
// The y=8 row is headroom (roof cells cleared by the roofs part), so the art and the lantern stay at y=7.
import { B } from "../vocab.mjs";

export function build(g) {
  // Doors in the partitions (plan.md: doors placed by interior designers).
  for (const y of [6, 7]) {
    g.set(30, y, 18, ...B.door("dark_oak", "east", y === 6 ? "lower" : "upper", "left"));
    g.set(33, y, 17, ...B.door("dark_oak", "south", y === 6 ? "lower" : "upper", "left"));
  }

  // Bench: two oak stairs as seats, back against the south partition (facing south = high side to the south).
  g.set(31, 6, 19, ...B.stairs("oak", "south", "bottom"));
  g.set(32, 6, 19, ...B.stairs("oak", "south", "bottom"));

  // Focal art: a 1x2 panel on the wall above the bench, framed in quartz and dark oak (y=7 only; y=8 is roof).
  g.set(31, 7, 19, "dark_oak_planks", {});
  g.set(32, 7, 19, "smooth_quartz", {});

  // Side table: oak fence post with a top-half quartz slab, a flower pot on the top.
  g.set(33, 6, 19, "oak_fence", {});
  g.set(33, 7, 19, ...B.slab("smooth_quartz", "top"));
  g.set(33, 8, 19, "flower_pot", {});

  // Hanging lantern at the east end of the row, hung on a chain from the top plate (34,9,19); the chain takes the cell
  // above the lantern now that the roof cell there is cleared as headroom.
  g.set(34, 8, 19, ...B.chain("y"));
  g.set(34, 7, 19, "lantern", { hanging: "true", waterlogged: "false" });
}
