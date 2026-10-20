// Room 18, Aperture bike room (interior designer): inner air x 203..246, y 1..6, z 28..49 (the walk level is y 1).
// Lockers (barrels and chests) run down the west wall, bike racks (fence posts with iron-bar hoops) down the east wall,
// and the focal piece is a repair bench on the south wall (barrels under a top slab, a crafting table and a lantern on
// it). Lanes: row z 28 along the north wall and the centre column x 214..215 stay clear. Lights are hanging lanterns
// under the ceiling plus standing lanterns at the bench. Drawn as text and placed with layers().
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 203, X1 = 246, Z0 = 28, Z1 = 49, Y0 = 1, Y1 = 6;

// Palette only: lockers are stone cabinets (polished_andesite, smooth_quartz), the bench base is polished_andesite
// with a top slab, its tool block an iron_block.
const LEGEND = {
  b: "polished_andesite",
  c: "smooth_quartz",
  f: "oak_fence",
  i: "iron_bars",
  t: ["smooth_stone_slab", { type: "top" }],
  w: "iron_block",
  L: ["lantern", { hanging: "true" }],
  s: ["lantern", { hanging: "false" }],
};

// Grid of characters per layer y, indexed [y - Y0][z - Z0][x - X0]; ' ' stays as it is.
const W = X1 - X0 + 1, D = Z1 - Z0 + 1, H = Y1 - Y0 + 1;
const cells = Array.from({ length: H }, () => Array.from({ length: D }, () => Array(W).fill(" ")));
const put = (x, y, z, ch) => { cells[y - Y0][z - Z0][x - X0] = ch; };
const fillRow = (x0, x1, y, z, ch) => { for (let x = x0; x <= x1; x++) put(x, y, z, ch); };

// Lockers, west wall (x 203): barrels stacked two high on z 30..33, chests on z 36..39
for (let z = 30; z <= 33; z++) { put(203, 1, z, "b"); put(203, 2, z, "b"); }
for (let z = 36; z <= 39; z++) put(203, 1, z, "c");

// Bike racks, east wall (x 241): a post every second row, iron-bar hoops between them, two high
for (let z = 30; z <= 44; z += 2) put(241, 1, z, "f");
for (let z = 31; z <= 45; z += 2) { put(241, 1, z, "i"); put(241, 2, z, "i"); }

// Focal piece: repair bench on the south side, barrels under a top-slab counter, a crafting table and a lantern on it
fillRow(218, 226, 1, 46, "b");
fillRow(218, 226, 2, 46, "t");
put(221, 3, 46, "w");
put(224, 3, 46, "s");

// Hanging lanterns under the ceiling (y 6), on a grid of 8 blocks; the room tool says where the dark cells are.
// (206, 31) and (230, 31) already hold a hanging lantern from an earlier part, so this part leaves them alone.
const LIT_BY_EARLIER = new Set(["206,31", "230,31"]);
for (const x of [206, 214, 222, 230, 238, 245]) for (const z of [31, 39, 46]) if (!LIT_BY_EARLIER.has(`${x},${z}`)) put(x, 6, z, "L");

const rows = cells.map((layer) => layer.map((r) => r.join("")));
// the bench sits under the lanterns' grid; a barrel row needs no more: the rows are final
export function build(g) {
  layers(g, [X0, Y0, Z0], LEGEND, rows);
}
