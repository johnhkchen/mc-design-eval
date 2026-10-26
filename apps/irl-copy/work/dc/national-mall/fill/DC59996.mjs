// DC59996: a three-tier educational block on 421 P St NW, Shaw. Red brick on a stone plinth, sandstone belt and
// cornices, a central pavilion with a door on the street front, and a small core rising one course above it.
// Massing comes from the lidar roof heights: wings 4 high, the central podium 5, the core 6 (x13-17, z2-4), the
// east end bay 5. Each cell's column is solid from y0 to its top, with a floor slab at y3 and a one-block air gap
// behind every window, so the glass reads as glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59996.cells.json", "utf8"));
const W = 29, D = 7, H_MAX = 18;

// Tier per cell: the lidar's flat tiers (4 wings, 5 podium and east bay, 6 core), read off the cells file as a check
const tierOf = (x, z) => {
  if (x === 28) return 5;
  if (x >= 11 && x <= 19) return x >= 13 && x <= 17 && z >= 2 && z <= 4 ? 6 : 5;
  return 4;
};
// a sanity check against the lidar: each tier's mean lidar reading should sit close to the tier (single-cell noise is smoothed)
for (const t of [4, 5, 6]) {
  const r = cells.filter(([x, z]) => tierOf(x, z) === t).map((c) => c[3]);
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  if (Math.abs(mean - t) > 0.5) throw new Error(`tier ${t} mean lidar ${mean.toFixed(2)}`);
}

const H = (x, z) => tierOf(x, z);
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const facade = (x, z) => z === 0 || z === D - 1 || x === 0 || x === W - 1;
// a cell is wall (shell) when it's on the outer face or stands on a tier edge (a neighbour is a different height or out)
const shell = (x, z) => facade(x, z) || [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => !inside(a, b) || H(a, b) !== H(x, z));
// windows on the street and back faces in bays of three (pier at x % 3 == 0), and one pane per end wall
const winCol = (x) => x % 3 !== 0;
const isWindow = (x, y, z) => {
  if (y < 1 || y > 2 && y !== 4) return false;
  if (z === 0 || z === D - 1) return winCol(x) && !(x === 15 && y <= 2);
  if (x === 0 || x === W - 1) return z === 3;
  return false;
};

const map = new Map();                           // "x,y,z" -> [block, state]
const put = (x, y, z, b, s) => map.set(`${x},${y},${z}`, [b, s]);
const at = (x, y, z) => map.get(`${x},${y},${z}`);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const top = H(x, z) - 1, sh = shell(x, z);
  for (let y = 0; y <= top; y++) {
    if (y === 0) { put(x, y, z, sh ? "stone_bricks" : "smooth_stone"); continue; }
    if (y === top) { put(x, y, z, sh ? "smooth_sandstone" : "smooth_stone"); continue; }
    if (y === 3) { put(x, y, z, sh ? "smooth_sandstone" : "smooth_stone"); continue; }     // belt course and floor slab
    if (!sh) continue;                                                                    // air behind the glass
    if (isWindow(x, y, z)) continue;                                                       // glass set below
    put(x, y, z, "bricks");
  }
}

// the street door under a small canopy on the central pavilion
put(15, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(15, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [14, 15, 16]) put(x, 3, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// glass panes, each joined to any neighbour that is not air (so frames read as frames)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (const y of [1, 2, 4]) {
  if (!isWindow(x, y, z) || (y === 4 && H(x, z) < 6)) continue;
  if (!(shell(x, z) && isWindow(x, y, z))) continue;
  const conn = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
  put(x, y, z, "glass_pane", { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" });
}

// warm light behind a few windows, on the floor of the air gap
for (const [x, y, z] of [[2, 1, 1], [8, 1, 1], [13, 1, 1], [17, 1, 1], [23, 1, 1], [26, 1, 1]]) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
put(4, 1, 1, "glowstone"); put(21, 1, 1, "glowstone");

// roof plant on the podium and the core
for (const [x, y, z] of [[12, 5, 2], [18, 5, 4], [15, 6, 3]]) put(x, y, z, "iron_block");

const g = new Voxels([W, H_MAX, D]);
let n = 0;
for (const [key, [b, s]] of map) {
  const [x, y, z] = key.split(",").map(Number);
  if (y >= H_MAX) throw new Error(`block above the build at ${key}`);
  g.set(x, y, z, b, s); n++;
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59996.nbt");
console.log(`DC59996: ${n} blocks, ${g.palette.length - 1} block states`);
