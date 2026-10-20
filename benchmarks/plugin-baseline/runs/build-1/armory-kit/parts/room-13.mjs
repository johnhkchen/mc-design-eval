// Interior designer for "West aisle 4F" (room 13): a top-level walkway under the trusses.
// Floor air is y 22..26 over x 6..19, z 36..131. The walkway lane x 12..13 (under the doorway) and x 10..11,
// x 14..15 stay clear. West: oak-fence-and-slab tables with stair benches, a lantern on each table. East: fence
// lamp posts with azalea planters. Focal piece: a quartz-framed garden bed at x 16..19, z 39..43, just inside
// the doorway's view, with a sea lantern in its heart.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 6;
const X1 = 19;
const Z0 = 36;
const Z1 = 131;
const Y = 22;

const LEGEND = {
  Q: "smooth_quartz",
  G: "grass_block",
  L: "sea_lantern",
  F: "oak_fence",
  T: ["smooth_stone_slab", { type: "top" }],
  N: ["polished_andesite_stairs", { facing: "north", half: "bottom" }],
  U: ["polished_andesite_stairs", { facing: "south", half: "bottom" }],
  l: ["lantern", { hanging: "false" }],
  k: ["lantern", { hanging: "false" }],
  a: "azalea",
  f: "flowering_azalea",
};

// one grid per layer, rows along +z from Z0, columns along +x from X0 (x = X0 + column)
function blank() {
  return Array.from({ length: Z1 - Z0 + 1 }, () => Array(X1 - X0 + 1).fill(" "));
}
const put = (grid, x, z, c) => { grid[z - Z0][x - X0] = c; };

const floor = blank();
const top = blank();
const shelf = blank();

// focal bed: quartz frame x 16..19, z 39..43
for (let x = 16; x <= 19; x++) { put(floor, x, 39, "Q"); put(floor, x, 43, "Q"); }
for (let z = 39; z <= 43; z++) { put(floor, 16, z, "Q"); put(floor, 19, z, "Q"); }
for (let z = 40; z <= 42; z++) { put(floor, 17, z, "G"); put(floor, 18, z, "G"); }
put(floor, 18, 41, "L");
put(top, 17, 40, "f"); put(top, 18, 40, "a");
put(top, 17, 41, "a");
put(top, 17, 42, "f"); put(top, 18, 42, "a");

// west tables every 8 z from 42: fence post, top slab, a bench each side, a lantern on the slab
for (let k = 0; k < 12; k++) {
  const z0 = 42 + 8 * k;
  put(floor, 8, z0, "F");
  put(top, 8, z0, "T");
  put(shelf, 8, z0, "l");
  put(floor, 8, z0 - 1, "N");
  put(floor, 8, z0 + 1, "U");
}

// east lamp posts every 8 z from 46, each with a lantern on the post and a planter of azaleas beside it
for (let k = 0; k < 11; k++) {
  const z1 = 46 + 8 * k;
  put(floor, 18, z1, "F");
  put(top, 18, z1, "k");
  put(floor, 19, z1, "G");
  put(top, 19, z1, "a");
  put(floor, 19, z1 + 1, "G");
  put(top, 19, z1 + 1, "f");
}

export function build(g) {
  layers(g, [X0, Y, Z0], LEGEND, [floor, top, shelf]);
}
