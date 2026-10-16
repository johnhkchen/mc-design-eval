// P4 parlour: the front room of the gable block, box x55..57 y3..6 z10..12. Entered from the west at (54,3,10) into
// (55,3,10) and through the partition door (56,3..4,13). Kept clear: the entry lane x55 (z10..12), the cell (56,12) in
// front of the partition door, and the window cell (58,4..5,11) outside the table.
// Focal piece: the table under the east window, with a standing lamp on it. Two stair chairs on its north and south
// sides, a barrel sideboard with a flower pot against the front wall, and one hanging lantern over the room.
import { chair, hanging_lantern } from "../vocab.mjs";
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Floor: y3 (rows along z 10..12, columns along x 55..57). Y4..y5 hold the sideboard's pot, the table top, its lamp.
  layers(
    g,
    [55, 3, 10],
    {
      B: ["barrel", { facing: "up" }],
      F: "spruce_fence",
      T: ["spruce_slab", { type: "top" }],
      P: "flower_pot",
      L: ["lantern", { hanging: "false" }],
    },
    [
      [
        // y3: barrel sideboard at (56,10), table leg at (57,11)
        " B ",
        "  F",
        "   ",
      ],
      [
        // y4: pot on the barrel, table top slab at (57,11)
        " P ",
        "  T",
        "   ",
      ],
      [
        // y5: standing lamp on the table
        "   ",
        "  L",
        "   ",
      ],
    ],
  );

  // Stair chairs: north of the table (sitter faces south) and south of it (sitter faces north).
  chair(g, 57, 3, 10, "south");
  chair(g, 57, 3, 12, "north");

  // One hanging lantern over the room, from the ceiling block at y7.
  hanging_lantern(g, 56, 6, 11);
}
