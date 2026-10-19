// 48 West 46 Street, 1920 mixed residential and commercial building: a 5 x 23 block lot (about 5.6 x 25.6 m) in red
// brick with limestone trim. Street frontage on the south face (high z, 46th Street is on the south side of the lot):
// a three-storey commercial wing (z 18-22, lidar roof ~10) with glass shopfronts, a dark-wood fascia and a recessed
// entrance door. The rear body (z 0-17, lidar roof ~16) is five storeys of windows in pairs with a single pier between,
// a limestone cornice and a brick parapet. The step between them (z 17) is an exposed brick face above the wing roof.
// A small stair housing on the rear roof gives a door out onto the roof; a chimney and an air-handler sit beside it.
// Storey lines are every three blocks from y 0 for the whole building, so floors line up across the setback. Cells
// sit on their own ground: foundation fills below it, the shell and floor slabs stand on that. Interior cells are
// floor slabs and air (no rooms); the glass is a block out from a solid wall with air behind it. Glowstone sits
// behind some panes at the rear, on the shopfront and in the wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034266.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 5, Z = 23, Y = 29;

const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
// Lidar roofs flattened to one tier per zone, snapped to the storey lattice (tops at 3k + 1, so the roof slab is a belt).
const lattice = (r) => 3 * Math.round((r - 1) / 3) + 1;
const rearTop = lattice(median(cells.filter(([, z]) => z <= 17).map((c) => c[3])));   // 16
const wingTop = lattice(median(cells.filter(([, z]) => z >= 18).map((c) => c[3])));   // 10

const cellAt = new Map(cells.map((c) => [`${c[0]},${c[1]}`, c]));
const has = (x, z) => cellAt.has(`${x},${z}`);
const ground = (x, z) => cellAt.get(`${x},${z}`)[2];
const inHouse = (x, z) => x >= 1 && x <= 3 && z >= 5 && z <= 8;               // stair housing on the rear roof
const roofAt = (x, z) => (inHouse(x, z) ? rearTop + 3 : z >= 18 ? wingTop : rearTop);

// Null for interior cells. Otherwise the row the exposed wall starts at: the ground for a cell on the lot line, or the
// roof of the lower neighbour (the step face above the wing, the housing's walls above the rear roof).
function wallFrom(x, z) {
  let from = null;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz)) return ground(x, z);
    if (roofAt(nx, nz) < roofAt(x, z)) from = Math.max(from ?? 0, roofAt(nx, nz));
  }
  return from;
}

const SIDE_WINDOWS = new Set([2, 4, 11, 14, 20]);                             // party-wall windows, toward the back
const EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// The exposed wall at (x, y, z) below its roof row. Rows 1-2 of each storey are the openings; row 0 is the plinth, rows
// 3k are limestone belts; the top belt is the cornice.
function wallBlock(x, y, z, R) {
  const side = x === 0 || x === 4, end = z === 0 || z === Z - 1;
  if (y === 0) return ["stone_bricks"];
  if (inHouse(x, z)) return y === R - 1 ? ["stone_bricks"] : ["bricks"];
  if (y === R - 1) return ["calcite"];
  if (y % 3 === 0) return z === Z - 1 && y === 3 && x >= 1 && x <= 3 ? ["dark_oak_planks"] : ["calcite"];
  if (side && end) return ["calcite"];
  if (side) return SIDE_WINDOWS.has(z) ? ["glass_pane", NS] : ["bricks"];
  if (x === 2) return ["bricks"];
  if (z === Z - 1 && y <= 2) return ["glass"];                                 // shopfront glass, street ground floor
  return ["glass_pane", EW];
}

const vox = new Voxels([X, Y, Z]);
for (const [x, z, gr] of cells) {
  const R = roofAt(x, z), W = wallFrom(x, z), rim = W !== null;
  for (let y = 0; y < R; y++) {
    if (y < gr) vox.set(x, y, z, rim ? "stone_bricks" : "stone");              // foundation under the cell's ground
    else if (rim && y >= W) { const [b, s] = wallBlock(x, y, z, R); vox.set(x, y, z, b, s); }
    else if (y % 3 === 0) vox.set(x, y, z, y === R - 1 ? "gravel" : "smooth_stone");   // floor slab, roof surface
  }
  if (rim && !inHouse(x, z)) vox.set(x, R, z, "bricks");                       // parapet on the roof edge
}

// Doors, roof equipment and warm light on top of the wall pattern.
const door = (x, y, z, facing, half) => vox.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
door(2, 1, 0, "north", "lower"); door(2, 2, 0, "north", "upper");                  // rear service door
door(2, 1, Z - 1, "south", "lower"); door(2, 2, Z - 1, "south", "upper");          // street entrance
door(2, 16, 8, "south", "lower"); door(2, 17, 8, "south", "upper");                // housing door onto the roof
for (const y of [16, 17]) vox.set(1, y, 11, "bricks");                            // chimney
vox.set(1, 18, 11, "calcite");
vox.set(3, 16, 12, "iron_block");                                                 // air-handler
for (const [x, y, z] of [[1, 4, 2], [3, 7, 2], [1, 10, 2], [3, 13, 2], [1, 1, 20], [3, 1, 20], [3, 4, 20]])
  vox.set(x, y, z, "glowstone");

const out = vox.save(`${DIR}/NYC1034266.nbt`);
console.log(`rear roof ${rearTop}, wing roof ${wingTop}; ${out.blocks} blocks, ${out.palette} palette entries`);
