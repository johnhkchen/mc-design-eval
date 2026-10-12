// ROOM master bedroom (interior designer): master suite, orange accents, spruce floor (shell lays it at y=1).
// Inner air box [23,2,22,30,4,24]; entered from the corridor through the open cells (23..24, 21).
// Floor grid from `mcd plan` (origin x=23, z=22; rows along +x, successive rows along +z), layers y=2, 3, 4:
//   wardrobe wall on the west (x=23..24, z=23..24): spruce body, open trapdoor fronts facing the room.
//   focal bed: two orange beds, heads against the north partition (z=22), feet at z=23, x=27..28.
//   barrel nightstands either side of the head (x=26 with a standing lantern, x=29 with a potted cactus).
//   egg-chair reading corner by the east glass (x=31, z=22..23): orange seat stair at (30,23) facing the glass,
//   iron-trapdoor back at x=29, and an orange carpet under the foot of the bed.
//   light: hanging lanterns under the ceiling at (24,4,23), (27,4,23), (30,4,23) and a standing lantern on the nightstand.
// Walk: entry (23..24, 22) -> (25,22) -> (25,23) -> (26,23/24) -> row z=24 along the carpet to the reading corner.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    w: "spruce_planks",                                  // wardrobe body
    T: B.trapdoor("spruce", "east", "bottom", true),     // wardrobe fronts (open, facing the room)
    n: "barrel",                                         // nightstand
    H: ["orange_bed", { facing: "north", part: "head" }],
    F: ["orange_bed", { facing: "north", part: "foot" }],
    K: B.trapdoor("iron", "east", "bottom", true),       // egg chair back
    S: B.stairs("smooth_red_sandstone", "west", "bottom"), // egg chair seat, back toward the room, faces the glass
    c: "orange_carpet",
    L: B.lantern(false),                                 // standing lantern on the nightstand
    P: "potted_cactus",
    h: B.lantern(true),                                  // hanging lantern under the ceiling
  };
  // rows: z=22 (north, by the corridor), z=23, z=24 (south, by the slider); columns: x=23..30
  const y2 = [
    "   nHHn ",
    "wT  FFKS",
    "wT  cc  ",
  ];
  const y3 = [
    "   L  P ",
    "wT    K ",
    "wT      ",
  ];
  const y4 = [
    "        ",
    " h  h  h",
    "        ",
  ];
  layers(g, [23, 2, 22], legend, [y2, y3, y4]);
}
