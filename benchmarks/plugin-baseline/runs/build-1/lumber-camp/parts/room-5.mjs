// Part: room: Woodshed (interior furnisher + lamplighter). Inner air x=5..12, y=1..3, z=18..20 (plan.md ROOMS).
// The lane x=5..8 stays clear from the back door (7,1,18) and the open south side; the cordwood (grounds part) fills
// x=9..12, z=18..19. The focal piece is the chopping stump at (11,1,20) with a standing lantern on it, and a kindling
// barrel beside it at (9,1,20). One hanging lantern under the roof slab at (7,4,19) lights the lane.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLantern } from "../vocab.mjs";

export function build(g) {
  // Floor furniture (y=1) and the lantern standing on the stump (y=2). Columns run x=5..12, rows z=18..20.
  layers(g, [5, 1, 18], {
    "B": ["barrel", { facing: "up" }],
    "S": ["spruce_log", { axis: "y" }],
  }, [
    [
      "        ",
      "        ",
      "    B S ",
    ],
  ]);
  layers(g, [5, 2, 18], {
    "L": B.lantern(false),
  }, [
    [
      "        ",
      "        ",
      "      L ",
    ],
  ]);

  // The hanging lanterns under the roof slabs (7,5,19) and (5,5,18): they light the lane and the far corner.
  hangLantern(g, 7, 4, 19, 0);
  hangLantern(g, 5, 4, 18, 0);
}
