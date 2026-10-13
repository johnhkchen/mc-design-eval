// Part: room: entrance hall (interior furnisher + lamplighter). Inner air x45..50, z43..60, y4..9 (rooms.json box).
// The grand stair (x45..46, z54..60) is the stair joiner's, already built: its foot and rising flight stay clear.
// Layout: a red runner down the centre lane x47..48 to the stair; two console tables with a pot and a candle flank the
// front door; a dark-oak settee (stairs as seats) on each side wall; a coat rack (fence post + lantern) in the NE corner;
// standing lanterns on fence posts at the back corners; two hanging lanterns down the centre line under the upper hall.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN_X = 45;
const ORIGIN_Z = 43;

const LEGEND = {
  C: "red_carpet",
  P: "dark_oak_planks",
  F: "dark_oak_fence",
  s: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
  e: ["dark_oak_stairs", { facing: "east", half: "bottom" }],
  c: "flower_pot",
  k: ["candle", { candles: "1", lit: "true" }],
  L: ["lantern", { hanging: "false" }],
};

// x45..50 per row, z43..60 down the rows ('.' = nothing here)
const FLOOR_Y4 = [
  "..CC.F", // z43 coat rack foot, carpet
  "P.CC.P", // z44 console tables
  "..CC..", // z45
  "..CC..", // z46 parlour door x44 and dining door x51 stay clear
  "..CC..", // z47
  "F.CC..", // z48 lamp post against the west wall
  "s.CC.e", // z49 settees against the side walls
  "s.CC.e", // z50
  "..CC..", // z51 corridor doors stay clear
  "..CC..", // z52
  "......", // z53
  "......", // z54 stair steps at x45..46 (not drawn here)
  "......", // z55
  ".....F", // z56 lamp post, NE of the stair
  "......", // z57
  "......", // z58
  "....F.", // z59 lamp post by the wing opening
  "......", // z60 wing opening lane x47..50
];

// rows by z (43..60): every row not named is free
const rowsAt = (named) => Array.from({ length: 18 }, (_, i) => named[43 + i] ?? "......");

const Y5 = rowsAt({
  43: ".....F", // coat rack
  44: "c....k", // pot on the west console, candle on the east one
  48: "L.....", // standing lantern on the west lamp post
  56: ".....L", // standing lantern on the fence post
  59: "....L.", // standing lantern on the fence post
});

const Y6 = rowsAt({ 43: ".....F" }); // coat rack, top post
const Y7 = rowsAt({ 43: ".....L" }); // coat rack lantern on top

// The shell leaves this room's air unclaimed, so the layout above is placed: the furniture rows, then the hanging lanterns.
export function build(g) {
  layers(g, [ORIGIN_X, 4, ORIGIN_Z], LEGEND, FLOOR_Y4);
  layers(g, [ORIGIN_X, 5, ORIGIN_Z], LEGEND, Y5);
  layers(g, [ORIGIN_X, 6, ORIGIN_Z], LEGEND, Y6);
  layers(g, [ORIGIN_X, 7, ORIGIN_Z], LEGEND, Y7);

  // hanging lanterns down the centre line, under the upper hall ceiling (y10 is solid for z43..49)
  for (const z of [44, 48]) {
    g.set(47, 9, z, ...B.chain("y"));
    g.set(47, 8, z, ...B.lantern(true));
  }

  // lamplighter: three standing lanterns on the floor (y3 is under them), off the designer's footprint. The stair foot
  // (x45 z56..57) reads 8+ from the lantern at x47 z56, so no hidden light under the stair is needed.
  g.set(45, 4, 43, ...B.lantern(false));
  g.set(50, 4, 46, ...B.lantern(false));
  g.set(47, 4, 56, ...B.lantern(false));
}
