// Part: room: cottage parlour. Guest cottage parlour, inner air x77..86 z65..69, stand row y2 (plan.md FLOORS / ROOMS).
// Layout: hearth (campfire, lit) on the west wall; a three-seat sofa of dark_oak_stairs facing it; a coffee table
// (dark_oak_fence with a top slab) with two chairs; a red rug; a barrel cabinet with a candle on the east wall.
// Doorways: front z64 x81..82, bedroom z70 x80, bath z70 x85. The lane from the front door runs along z65 and z69.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 77;
const Y0 = 2; // stand row: furniture sits here, the floor block is y1
const Z0 = 65;

// rows run along +x (x77..86), successive rows along +z (z65..69)
const ROWS = [
  "bc.......B", // z65: hearth breast and firebox at the west end, barrel cabinet at the east
  "bSrNr.....", // z66: hearth jamb, sofa seat, rug, north chair
  ".SrTr.....", // z67: sofa seat, rug, table
  ".SrQr.....", // z68: sofa seat, rug, south chair
  "..........", // z69: open lane to the bedroom and bath doors
];

const LEGEND = {
  c: ["campfire", { lit: "true", facing: "east", signal_fire: "false", waterlogged: "false" }],
  b: "bricks",
  S: ["dark_oak_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" }],
  N: ["dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }],
  Q: ["dark_oak_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" }],
  r: "red_carpet",
  T: "dark_oak_fence",
  B: ["barrel", { facing: "up", open: "false" }],
};

export function build(g) {
  layers(g, [X0, Y0, Z0], LEGEND, ROWS);
  // chimney breast above the hearth jamb, so the firebox reads as a fireplace
  g.set(77, 3, 65, "bricks");
  g.set(77, 4, 65, "bricks");

  // table top: a top slab on the fence post (sits on the fence's 1.5 height at y3.5..4)
  g.set(80, 3, 67, ...B.slab("dark_oak", "top"));
  // a candle lit on the table top (cell y4) and a candle lit on the barrel cabinet
  g.set(80, 4, 67, "candle", { candles: "1", lit: "true", waterlogged: "false" });
  g.set(86, 3, 65, "candle", { candles: "2", lit: "true", waterlogged: "false" });

  // lights: a hanging lantern from the ceiling over the sofa and one over the lane
  g.set(79, 5, 68, "lantern", { hanging: "true", waterlogged: "false" });
  g.set(84, 5, 67, "lantern", { hanging: "true", waterlogged: "false" });
}
