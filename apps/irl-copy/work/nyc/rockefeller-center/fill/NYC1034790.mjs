// NYC1034790: 37 West 54th Street, 1920, mixed residential and commercial. A 5 x 17 block footprint, eight
// storeys of red brick on a stone plinth, a shopfront and entrance on the street face (z 0), a flat roof tier
// at y 24 with a parapet, and a chimney and roof box. The lidar roof (22 to 24) is smoothed to one tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034790.cells.json`, "utf8"));

const X = 5, Z = 17, TOP = 24, Y = 28;

// Storeys are 3 blocks: ground y 0-2, then 3-5, 6-8, ... 21-23. Every y % 3 == 0 row is a stone course
// (sill and lintel); the other two rows of each storey are window rows.
const COURSE = (y) => y % 3 === 0 && y >= 3 && y <= 21;
const WINDOW = (y) => y >= 1 && y <= 23 && y % 3 !== 0;
const FLOOR = (y) => y <= 21 && y % 3 === 0 || y === 23;   // slab under each storey, and the roof at 23

const door = (y) => ({ facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
const lantern = { hanging: "false", waterlogged: "false" };
const topSlab = { type: "top", waterlogged: "false" };

// The skin of a perimeter cell (x, y, z) at a row that is above its foundation.
function skin(x, y, z) {
  const front = z === 0, rear = z === Z - 1, side = x === 0 || x === X - 1;
  if (y === 0) return ["stone_bricks"];                                      // plinth
  if (y === 24) return ["bricks"];                                           // parapet
  if (y === 25) return ["stone_brick_slab", topSlab];                        // parapet cap
  if (front && y === 3 && x >= 1 && x <= 3) return ["dark_oak_slab", { type: "bottom", waterlogged: "false" }]; // shop canopy
  if (front && y <= 2) {                                                     // shopfront and entrance
    if (x === 1) return ["dark_oak_door", door(y)];
    if (x === 2 || x === 3) return ["glass"];
    return ["bricks"];
  }
  if (COURSE(y)) return ["smooth_stone"];
  if (WINDOW(y) && (front || rear)) {                                        // 1 pane wide, framed in white terracotta
    if (x === 1 || x === 3) return ["white_terracotta"];
    if (x === 2) return ["glass"];
    return ["bricks"];
  }
  if (WINDOW(y) && side) {                                                   // three bays along each side wall
    const bay = [3, 7, 11].find((w) => Math.abs(z - w) <= 1);
    if (bay !== undefined) return z === bay ? ["glass"] : ["white_terracotta"];
  }
  return ["bricks"];
}

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, [block, state]) => g.set(x, y, z, block, state);

for (const [x, z, G] of cells) {
  const perimeter = x === 0 || x === X - 1 || z === 0 || z === Z - 1;
  for (let y = 0; y <= 25; y++) {
    if (y < G) { put(x, y, z, ["stone_bricks"]); continue; }                 // foundation under a raised cell
    if (y >= TOP) { if (perimeter) put(x, y, z, skin(x, y, z)); continue; }  // parapet only
    if (perimeter) { put(x, y, z, skin(x, y, z)); continue; }
    if (FLOOR(y)) put(x, y, z, [y === 23 ? "stone" : "smooth_stone"]);       // interior floors (no interiors)
  }
}

// Warm light behind some glass (the air gap at z 1 and z 15), and the roof: a chimney and a roof box.
const fixtures = [
  [3, 1, 1, ["lantern", lantern]],
  [2, 7, 1, ["glowstone"]],
  [2, 13, 1, ["lantern", lantern]],
  [2, 19, 1, ["glowstone"]],
  [2, 10, 15, ["lantern", lantern]],
];
for (const [x, y, z, b] of fixtures) put(x, y, z, b);
for (let y = 24; y <= 26; y++) put(3, y, 13, ["bricks"]);                    // chimney
put(3, 27, 13, ["stone_brick_slab", topSlab]);
for (const y of [24, 25]) for (const [x, z] of [[1, 5], [2, 5], [1, 6], [2, 6]]) put(x, y, z, ["stone_bricks"]); // roof box

const counts = g.save(`${DIR}/NYC1034790.nbt`);
console.log(counts);
