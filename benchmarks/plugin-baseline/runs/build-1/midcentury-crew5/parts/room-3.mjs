// ROOM dining (interior designer): box [11,2,14,15,4,18]. A 3x2 table at x=12..14, z=15..16 with six birch stair chairs
// (three each side, backs to the walls of the table row), a birch sideboard under the west window (x=11, z=14..16), spruce
// trapdoor panelling on the west wall beyond it (x=11, z=17..18), and a hung lantern over the table from the beam at x=13.
// The lane at x=15 stays clear from the kitchen (z=13), living (z=19) and the east opening (x=16), so every way in reaches
// the table. Floor is the shell's terrazzo; nothing is written at y=1 or outside the box.
import { sideboard, panel_wall } from "../vocab.mjs";
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // west wall: sideboard under the window, fronts toward the room
  sideboard(g, 11, 14, 3, "z", "east");
  // west wall beyond the sideboard: spruce panelling (open trapdoors, halves alternating)
  panel_wall(g, 11, 17, 2, 4, "east");
  panel_wall(g, 11, 18, 2, 4, "east");

  // table and chairs, origin (11, 2, 14); rows run along +z (z=14..18), columns along +x (x=11..15)
  layers(g, [11, 2, 14], {
    N: B.stairs("birch", "north", "bottom"), // chair on the north side, back to the north
    S: B.stairs("birch", "south", "bottom"), // chair on the south side, back to the south
    L: B.fence("spruce"), // table leg at each corner
    T: B.slab("spruce", "bottom"), // table top
    H: B.lantern(true), // pendant lantern, hung from the beam at x=13
  }, [
    // y=2: chairs, legs
    [
      " NNN.",
      " L.L.",
      " L.L.",
      " SSS.",
      ".....",
    ],
    // y=3: table top
    [
      "     ",
      " TTT.",
      " TTT.",
      "     ",
      "     ",
    ],
    // y=4: pendant over the table centre
    [
      "     ",
      "  H  ",
      "     ",
      "     ",
      "     ",
    ],
  ]);
}
