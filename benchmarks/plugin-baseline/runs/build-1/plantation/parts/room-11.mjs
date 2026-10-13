// Part: room: living room (room-11). Vaulted two-storey drawing room, inside its box x38..47, z62..74 (floor y4, air to y16).
// Focal piece: a stone hearth on the west wall (x38, z65..69) with a lit campfire, a sofa of stairs (x40) facing it, a rug,
// a coffee table, chairs on the east side, a jukebox piano by the north wall, barrels and a pot in the south-west corner.
// Light: standing lanterns on the table, the piano and a barrel, and a hanging lantern on a chain from the vault panel.
// Lanes stay clear: from the hall doorways (z61) along z62, from the kitchen opening (x48) and to the rear porch door (z75).
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [38, 4, 62]; // x38, floor-air row y4, z62 (rows run along +x, successive rows along +z)

const LEGEND = {
  h: "smooth_stone",
  c: ["campfire", { lit: "true" }],
  S: ["dark_oak_stairs", { facing: "east", half: "bottom" }], // sofa seats, backs to the east, facing the hearth
  C: ["dark_oak_stairs", { facing: "east", half: "bottom" }], // chairs round the table
  r: "red_carpet",
  T: "dark_oak_fence", // table post
  t: ["dark_oak_slab", { type: "top" }], // table top
  j: "jukebox", // piano
  B: "barrel",
  L: ["lantern", { hanging: "false" }], // standing lantern
  p: "flower_pot",
};

// y4: the furnished floor. z62 is the lane from the hall doors; z72..73 the corner cabinet.
const FLOOR = [
  "..........", // z62
  "........j.", // z63 piano against the north wall, x46
  "..Srrrrr..", // z64
  "h.Srrrrr..", // z65 hearth on the west wall
  "h.SrrrrC..", // z66
  "c.SrrTrC..", // z67 campfire in the hearth, coffee table x43
  "h.SrrrrC..", // z68
  "h.Srrrrr..", // z69
  "..........", // z70
  "..........", // z71
  "B.......L.", // z72 barrel cabinet, south-west; lantern by the rear door
  "B.........", // z73
  "..........", // z74 clear under the Palladian window
];

// y5: things standing on the floor pieces (lantern on the piano, table top, lantern and pot on the barrels).
const Y5 = [
  "..........", // z62
  "........L.", // z63 lantern on the piano
  "..........", // z64
  "..........", // z65
  "..........", // z66
  ".....t....", // z67 coffee table top (x43)
  "..........", // z68
  "..........", // z69
  "..........", // z70
  "..........", // z71
  "L.........", // z72 lantern on the barrel
  "p.........", // z73 flower pot on the barrel
  "..........", // z74
];

// y6: a standing lantern on the coffee table top.
const Y6 = [
  "..........", "..........", "..........", "..........", "..........",
  ".....L....", // z67, on the table top at y5
  "..........", "..........", "..........", "..........", "..........", "..........", "..........",
];

// The shell leaves the living room unclaimed, so the layout above is placed.
export function build(g) {
  // Floor and furniture (y4), the tabletop and its lanterns (y5..6).
  layers(g, ORIGIN, LEGEND, FLOOR);
  layers(g, [38, 5, 62], LEGEND, [Y5]);
  layers(g, [38, 6, 62], LEGEND, [Y6]);

  // Lamplighter: a south-east standing lantern on the floor, and the hanging lantern on its chain from the vault panel.
  g.set(46, 4, 74, ...B.lantern(false)); // south-east corner, on the floor (y3)
  g.set(41, 16, 70, ...B.chain("y"));
  g.set(41, 15, 70, ...B.lantern(true));
}
