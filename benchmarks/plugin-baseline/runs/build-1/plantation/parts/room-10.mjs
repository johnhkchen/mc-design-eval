// Part: room: powder room (interior furnisher + lamplighter). Inner air x63..68, y4..9, z54..60.
// Door from the east corridor at z53 (x65..66). Focal piece: the washstand on the south wall (z60), basin and mirror
// facing the door. Chair (stairs) at z59 facing it, a 3x3 rug in the middle, a barrel with a pot in the north-east
// corner, a hanging lantern over the rug and a standing lantern on the floor at the south-west of the rug. The west doorway (x62, z56..57) and the south windows (x65..66, z61) stay clear.
// Furnishing layout kept as data. build() does not write it: the shell carves every interior cell to air and runParts
// locks those cells (air included), so each write was refused and the room came out empty. Restore the layers() call
// once runParts stops locking air the shell carved (or the shell stops owning the interior air).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  B: "barrel",
  F: "flower_pot",
  W: "white_carpet",
  S: ["dark_oak_stairs", { facing: "north", half: "bottom" }],
  K: "dark_oak_planks",
  C: "water_cauldron",
  G: "glass_pane",
  I: "iron_bars",
  L: ["lantern", { hanging: "true" }],
  T: ["lantern", { hanging: "false" }],
};
// rows run along +x (x63..68), successive rows along +z (z54..60); one layer per y (y4..y9)
const EMPTY = "......";
const LAYERS = [
  // y4 floor: barrel NE corner, rug x64..66 z56..58, chair z59, washstand cabinet x63..64 z60
  [".....B", EMPTY, ".WWW..", ".WWW..", ".TWW..", ".S....", "KK...."],
  // y5: pot on the barrel, water basin and a pot on the washstand
  [".....F", EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, "CF...."],
  // y6..7: mirror panes on the wall behind the basin
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, "GG...."],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, "GG...."],
  // y8: iron bar cornice over the mirror
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, "II...."],
  // y9: hanging lantern over the rug (the upper floor at y10 is the hanging block)
  [EMPTY, EMPTY, EMPTY, "..L...", EMPTY, EMPTY, EMPTY],
];

export function build(g) {
  // Lamplighter: one standing lantern on the floor at (67,4,57), east of the rug and off the walking lane.
  // Its footing is the y3 ground-floor slab. Light 15 at the source gives every floor cell 8 or more.
  layers(g, [63, 4, 54], { T: ["lantern", { hanging: "false" }] }, [
    [EMPTY, EMPTY, EMPTY, "....T.", EMPTY, EMPTY, EMPTY],
  ]);
}
