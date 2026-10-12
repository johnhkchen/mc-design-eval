// ROOM bedroom 2 (interior designer): inner air [26,2,18,30,4,20], spruce floor, yellow accent. Entered from the west
// doorway (25,2..3,19) and the en-suite door (29,2..3,17) to bath 2, so both entry cells (26,19) and (29,18) stay clear.
// Layout (floor y=2; x across, z down):
//   z18: lectern desk (26) + spruce stair seat (27), open floor (28), en-suite door cell (29), wardrobe (30)
//   z19: open path (26..28), barrel nightstand with lantern (29), wardrobe doors (30)
//   z20: yellow carpet (26..27), yellow bed foot (28) head (29), spruce headboard (30)
// Light: barrel-top lantern at the bed head (nothing above y=4 is solid here, so no hanging lantern); cactus on the wardrobe.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SPRUCE_PLANKS, YELLOW_BED, YELLOW_CARPET, BARREL, LANTERN, LECTERN, POTTED_CACTUS } from "../vocab.mjs";

const put = (g, x, y, z, block, state) => g.set(x, y, z, block, state);

export function build(g) {
  // desk: a lectern workstation against the west wall, with a spruce stair as the seat on its east side
  put(g, 26, 2, 18, LECTERN, { facing: "east" });
  put(g, 27, 2, 18, ...B.stairs("spruce", "east", "bottom"));

  // bed: foot (28,20), head (29,20) against the east wall, spruce headboard (30,20) on the wall side
  put(g, 28, 2, 20, YELLOW_BED, { facing: "east", part: "foot" });
  put(g, 29, 2, 20, YELLOW_BED, { facing: "east", part: "head" });
  put(g, 30, 2, 20, SPRUCE_PLANKS);
  put(g, 30, 3, 20, SPRUCE_PLANKS);

  // bedside: barrel nightstand at (29,19) with a lantern standing on it
  put(g, 29, 2, 19, BARREL);
  put(g, 29, 3, 19, LANTERN, { hanging: false });

  // wardrobe: two-high spruce cabinet at (30,18) with open trapdoor doors on its south face, a cactus on top
  put(g, 30, 2, 18, SPRUCE_PLANKS);
  put(g, 30, 3, 18, SPRUCE_PLANKS);
  put(g, 30, 2, 19, ...B.trapdoor("spruce", "south", "bottom", true));
  put(g, 30, 3, 19, ...B.trapdoor("spruce", "south", "top", true));
  put(g, 30, 4, 18, POTTED_CACTUS);

  // yellow accent: carpet at the foot of the bed
  put(g, 26, 2, 20, YELLOW_CARPET);
  put(g, 27, 2, 20, YELLOW_CARPET);
}
