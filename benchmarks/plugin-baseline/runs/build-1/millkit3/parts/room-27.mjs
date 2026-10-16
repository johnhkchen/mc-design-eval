// P4 porch in the angle: bench, wash stand, hanging lantern. Inner air x49..52, y3..5, z9..11 (the box in rooms.json).
// Lane kept clear: x51 from the steps (51,3,8) to the wing door (51,3,12), and (52,3,10) in front of the gable's door (53,3,10).
// Posts at (49,9), (52,9), (49,11) belong to the porch run (fittings), so the furniture stands on column x50 and the corner.
import { chair } from "../vocab.mjs";
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Two seats: a bench-side chair on the north row and a chair on the west side, both facing the table at (50,3..4,10).
  chair(g, 50, 3, 9, "south");
  chair(g, 49, 3, 10, "east");

  // Table (fence leg + top slab), basin cauldron in the corner, flower pot on the sill, lantern on the table.
  // The barrel wash stand was dropped: its only free cell (50,3,11) is the wing window's sill (an earlier part).
  layers(g, [49, 3, 9], {
    T: ["spruce_fence", {}],
    W: ["water_cauldron", { level: "3" }],
    P: ["spruce_slab", { type: "top", waterlogged: "false" }],
    F: ["flower_pot", {}],
    L: ["lantern", { hanging: "false" }],
  }, [
    [
      "    ",
      " T  ",
      "   W",
    ],
    [
      "    ",
      " P  ",
      " F  ",
    ],
    [
      "    ",
      " L  ",
      "    ",
    ],
  ]);
}
