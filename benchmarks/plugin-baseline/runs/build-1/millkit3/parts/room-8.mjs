// P1 east chamber: family bedroom, inner air x19..21, y3..6, z11..13. Entered from the galerie through the French
// doors (x20..21, z10); the back door (20, 3..4, 14) opens into the east cabinet.
// Resolved conflict: the plan's beds (heads on the east wall x22 at z11 and z13) put their feet on x20 z11, which is
// the French-door cell, so the room could not be entered. Here the beds run north-south against the SOUTH wall z14
// instead (the solid cells at x19 and x21; the back door sits at x20 between them): heads at z13, feet at z12, and
// the clear lane is the x20 column from the front doors down to the back door. The dresser stands in the NW corner.
import { bed, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Dresser (NW corner, against the west partition) with the bedside lamp on its top: B = barrel, L = standing
  // lantern. One lamp is enough for the 3 x 3 room (every floor cell 10+), and it stands on a block, so it needs no
  // chain to the roof (the roof is laid after the shell, not yet in this build).
  const legend = {
    B: ["barrel", { facing: "up" }],
    L: ["lantern", { hanging: "false" }],
  };
  layers(g, [19, 3, 11], legend, [
    [ // y3: floor-stand layer
      "B  ",
      "   ",
      "   ",
    ],
    [ // y4: on the barrel top
      "L  ",
      "   ",
      "   ",
    ],
  ]);

  // Two beds whole, heads against the south wall z14 (x19 and x21 are solid there), feet at z12, facing south.
  for (const x of [19, 21]) {
    if (!bed(g, [x, 3, 12], "south", "pink")) console.log(`P1 east chamber: bed at x${x} refused`);
  }
}
