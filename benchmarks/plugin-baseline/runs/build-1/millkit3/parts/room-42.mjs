// P7 east parlour: the mirror of the west parlour. Box x91..93, y3..6, z10..12 (inner air).
// Ways in: front door (91, 3..4, 9) and the partition door (93, 3..4, 13). Keep (91,3,10) and (93,3,12) clear (doorway
// first cells). The stair flight at x91 (z11..15) is the stair joiner's and runs through the box's west column.
// Layout: bed on the east wall (foot 92, head 93 against the solid wall x94 at z10); a spruce table (fence + top
// slab) at (92,·,11) with a stair chair on its east side; a flower pot on the table; one hanging lantern over it.
import { bed, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { chair } from "../vocab.mjs";

export function build(g) {
  // bed: foot (92,3,10), head (93,3,10) against the east wall; orange is the east unit's colour (plan palette)
  bed(g, [92, 3, 10], "east", "orange");

  // table and its chair: the table is a fence leg with a top slab over it (top face at y5, the pot's cell)
  chair(g, 93, 3, 11, "west");

  // layers: origin [91, 3, 10], rows along +x, successive rows along +z (z10, z11, z12)
  const legend = {
    F: "spruce_fence",
    S: ["spruce_slab", { type: "top" }],
    P: "flower_pot",
    L: ["lantern", { hanging: "true" }],
  };
  layers(g, [91, 3, 10], legend, [
    ["   ", " F ", "   "],   // y3: table leg at (92,3,11)
    ["   ", " S ", "   "],   // y4: top slab over it
    ["   ", " P ", "   "],   // y5: flower pot on the top face
    ["   ", " L ", "   "],   // y6: lantern hangs from the ceiling block at (92,7,11)
  ]);
}
