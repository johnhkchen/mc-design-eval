import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
// Part: room: east hall bath. Interior box x63..68, y11..16, z54..60 (plan: the hall bath for the east rooms and the wing).
// Layout: the tub is the focal piece on the south wall, facing the north door; the vanity (basin on a quartz counter)
// is on the west wall by the west doorway; linen barrels sit on the east wall by the window; a bath mat lies in front
// of the tub. One hanging lantern from the ceiling lights the room.
// Not built yet: shell.mjs fills the whole interior box with air (its fill of x27..68 z43..60 y4..16), and runParts locks
// every cell an earlier part wrote, air included. All 252 cells of this room are therefore locked, so every write below
// was refused. The layout is kept here for when the shell leaves this room's interior open to the furnishing parts.
const ORIGIN = [63, 11, 54]; // top-left interior cell (x63, z54); rows run along +x, successive rows along +z

const LEGEND = {
  Q: "smooth_quartz", // counter block
  C: "cauldron", // basin on the counter
  P: "flower_pot", // vanity pot
  W: ["water_cauldron", { level: "3" }], // the tub
  M: "white_carpet", // bath mat
  B: "barrel", // linen barrels
  K: ["dark_oak_stairs", { facing: "east", half: "bottom", shape: "straight" }], // stool, seat faces the vanity
  H: ["lantern", { hanging: "true" }], // ceiling lantern
  L: ["lantern", { hanging: "false" }], // standing lantern on the floor by the tub
};

// stand row y11: floor furniture (rows z54..z60, columns x63..x68; no spaces, one character per cell)
const FLOOR = [
  "QK...B", // z54: vanity counter by the north-west corner, linen barrel by the east wall
  "QK...B", // z55: counter, stool, barrel
  "......", // z56: west door lane (x63) stays clear
  "......", // z57
  "......", // z58: window side (x68) stays clear
  ".MMMML", // z59: bath mat in front of the tub, lantern at the east end
  ".WWWW.", // z60: the tub along the south wall
];

// counter top row y12
const TOP = [
  "C.....", // z54: basin on the counter
  "P.....", // z55: flower pot on the counter
];

// ceiling row y16
const CEILING = [
  "......",
  "......",
  "..H...", // z56: hanging lantern over the room's centre, clear of both doorways
];

// Lamplighter: the designer's two lights only, a hanging lantern under the ceiling plate over the room's centre and a
// standing lantern on the floor at the east end, against the wall by the tub. Both are placed into air.
export function build(g) {
  g.set(64, 16, 55, ...B.lantern(true)); // ceiling lantern, hung from the y17 plate (64,55 keeps both lanes clear)
  g.set(68, 11, 59, ...B.lantern(false)); // floor lantern on the y10 floor, east end
}
