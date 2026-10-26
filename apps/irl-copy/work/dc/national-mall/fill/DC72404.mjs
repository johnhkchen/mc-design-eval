// DC72404: 1200 5th St NW, a 1900s red-brick walk-up apartment. Storeys are two blocks (a solid floor course over a
// window row), so each window band sits over air with a floor under it and the roof cap stands on a floor.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72404.cells.json", "utf8"));
const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72404.nbt";
const X = 10, Y = 18, Z = 9;
const g = new Voxels([X, Y, Z]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(), lidar = new Map();
for (const [x, z, gr, r] of cells) { ground.set(key(x, z), gr); lidar.set(key(x, z), r); }
const inF = (x, z) => ground.has(key(x, z));

// Lidar roof is noisy: each cell takes the median of its footprint neighbourhood (3x3, footprint only), giving clean tiers.
const roof = new Map();
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number), vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) vals.push(lidar.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  roof.set(k, vals[Math.floor(vals.length / 2)]);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the faces of cell (x, z) at row y that look onto air: outside the footprint, or onto a neighbour that stops below y
function exposed(x, z, y) {
  const ex = new Set();
  for (const [dx, dz] of DIRS) {
    const n = roof.get(key(x + dx, z + dz));
    if (n === undefined || n <= y) ex.add(dx ? "x" : "z");
  }
  return ex;
}

const DOOR = { x: 7, z: 0 };   // the entrance on the north face (the lowest side, the street)
for (const [k, r] of roof) {
  const [x, z] = k.split(",").map(Number), gr = ground.get(k);
  for (let y = 0; y < r; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation under the cell
    const ex = exposed(x, z, y), wall = ex.size > 0;
    if (y === 0) {                                                             // base course, plinth at grade
      if (x === DOOR.x && z === DOOR.z) g.set(x, y, z, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y === r - 1) {                                                         // roof cap; the outer ring is the cornice
      g.set(x, y, z, wall ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y % 2 === 0) {                                                         // floor course (storey line) / interior floor
      if (wall) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, "smooth_stone");
      if (wall && x === DOOR.x && z === DOOR.z && y === 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // window row: interior air behind glass, brick piers between windows
    if (!wall) continue;
    if (x === DOOR.x && z === DOOR.z && y === 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (ex.size === 2) { g.set(x, y, z, "bricks"); continue; }                // corner pier
    const along = ex.has("z") ? x : z;                                       // a north/south face runs along x, an east/west face along z
    if (along % 2 === 0) {
      const warm = (x + 2 * y + z) % 4 === 0;                                   // warm light in about a quarter of the windows
      g.set(x, y, z, warm ? "glowstone" : "light_gray_stained_glass_pane");
    } else g.set(x, y, z, "bricks");
  }
}

// Roof equipment: two brick chimney stacks on interior roof cells at the top two tiers.
const chimneys = [];
for (const [k, r] of roof) {
  const [x, z] = k.split(",").map(Number);
  const interior = DIRS.every(([dx, dz]) => inF(x + dx, z + dz));
  if (interior && r >= 5 && chimneys.length < 2 && (chimneys.length === 0 || r === 6)) chimneys.push([x, z, r]);
}
for (const [x, z, r] of chimneys) { g.set(x, r, z, "bricks"); g.set(x, r + 1, z, "bricks"); }

const stats = g.save(FILE);
console.log(JSON.stringify({ footprint: cells.length, roofTiers: [...new Set(roof.values())].sort(), chimneys, ...stats }));
