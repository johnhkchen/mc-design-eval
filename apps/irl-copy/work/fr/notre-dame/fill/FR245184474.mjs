// FR245184474: a 1904 residential block on the Seine's left bank, seven storeys of calcite on a stone plinth under a dark
// slate roof. Storeys are 5 blocks: string course (y = 1 mod 5), sill, two glass rows, lintel. Every tier top lands on a
// lintel (6, 11, ... 36). The lidar roofs (3x3 median, snapped to a tier) give a 36 main block, a 26 / 21 / 16 / 11 court
// on the notch side, and a 2-block plinth. The shell is one block thick with air behind the glass; a floor slab spans
// every storey, and interior roofs are slate.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184474.cells.json`, "utf8"));

const W = 25, H = 52, D = 19;
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const SNAP = [[28, 36], [23, 26], [19, 21], [14, 16], [9, 11], [5, 6], [0, 2]];   // lidar roof height -> tier top
const SLAB = { type: "bottom", waterlogged: "false" };

const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => at(x, z)?.T ?? 0;         // no building = 0: open air at every row

// Lidar roof: 3x3 median over the footprint, then snapped to the nearest tier (flat tiers, no noisy edge cells).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = SNAP.find(([lo]) => med >= lo)[1];
}

// Which faces of a cell at height y see air (a neighbour missing, or lower than this row).
const exposedDirs = (x, z, y) => NEI.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([n]) => n);
const exposed = (x, z, y) => exposedDirs(x, z, y).length > 0;

// Window bays on each face: 2 glass, 2 pier, along the face (x on north/south, z on east/west). Corners are piers.
const bayOf = (face, x, z) => (face === "north" || face === "south" ? x : z);
const isWindowBay = (i) => i % 4 === 1 || i % 4 === 2;
const bayWin = (x, z, y) => { const dirs = exposedDirs(x, z, y); return dirs.length > 0 && dirs.every((f) => isWindowBay(bayOf(f, x, z))); };
const glassRow = (y) => (y + 4) % 5 === 2 || (y + 4) % 5 === 3;
const lit = (x, z, y) => (x * 7 + z * 5 + y * 3) % 5 === 0;     // about one window in five has a light behind it
const glowAt = (x, z, y) => glassRow(y) && NEI.some(([, dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return at(nx, nz) && y < at(nx, nz).T && glassRow(y) && bayWin(nx, nz, y) && lit(nx, nz, y);
});

// The entrance: the south face's middle at the top tier (a run of three tier-36 cells), then a canopy over it.
let door = null;
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (z !== D - 1 || c.T !== 36 || topAt(x - 1, z) !== 36 || topAt(x + 1, z) !== 36) continue;
  if (!door || Math.abs(x - W / 2) < Math.abs(door.x - W / 2)) door = { x, z };
}

// Three 2x2 chimneys on the main roof, away from the edges, spaced apart.
const chimneyCells = new Set(), tops = [];
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (c.T !== 36 || tops.length >= 3) continue;
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => [x + dx, z + dz]);
  if (!quad.every(([qx, qz]) => topAt(qx, qz) === 36 && !exposed(qx, qz, 35))) continue;
  if (tops.some(([tx, tz]) => Math.abs(tx - x) < 6 && Math.abs(tz - z) < 6)) continue;
  tops.push([x, z]);
  for (const [qx, qz] of quad) chimneyCells.add(`${qx},${qz}`);
}

// The block at (x, y, z) as [id, state], or null for air.
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { T, g } = c, key = `${x},${z}`;
  if (y < g || y === 0) return ["stone_bricks"];                       // foundation to the ground, base course
  if (y >= T) {
    if (chimneyCells.has(key) && y <= T + 3) return y < T + 3 ? ["bricks"] : ["stone_brick_slab", SLAB];
    return y === T && exposed(x, z, T - 1) ? ["stone_brick_slab", SLAB] : null;   // cornice on the edge
  }
  if (door && z === door.z) {
    const dx = Math.abs(x - door.x);
    if (dx === 0 && (y === 2 || y === 3)) return ["dark_oak_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    if (dx <= 1 && y === 4) return ["dark_oak_slab", { type: "bottom", waterlogged: "false" }];   // canopy
    if (dx === 1 && y === 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
  }
  if (y === T - 1 && !exposed(x, z, y)) return ["deepslate_tiles"];      // interior roof
  const rel = (y + 4) % 5;                                              // 0 string, 1 sill, 2-3 glass, 4 lintel
  if (rel === 0) return ["stone_bricks"];                               // floor slab, whole footprint
  if (!exposed(x, z, y)) return glowAt(x, z, y) ? ["glowstone"] : null; // air behind the glass
  if (rel === 4) return ["smooth_stone"];                               // lintel band
  const win = bayWin(x, z, y);
  if (rel === 1) return win ? ["smooth_stone", null] : ["calcite"];     // sill under each window
  return win ? ["glass"] : ["calcite"];
}

const out = new Voxels([W, H, D]);
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) {
    const b = cls(x, z, y);
    if (b) out.set(x, y, z, b[0], b[1] ?? undefined);
  }
}
out.save(`${DIR}/FR245184474.nbt`);
