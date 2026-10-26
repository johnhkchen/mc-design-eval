// FR245184564: a 1894 Haussmann residential block of eight storeys in cream limestone under a zinc mansard, on the lidar
// footprint. Storey lines (smooth_quartz string courses) every 4 blocks from a rusticated base (y 0) and a ground storey
// (y 0-4); the cornice sits at y 32 and the mansard rises in four layers to y 37. The lidar tiers are snapped: the main
// block (roof 35+) gets the mansard, lower wings (30-34, 25-29, below) take flat cornices at storey lines. Every column
// is solid from y 0 up to its top, so each storey and each mansard layer stands on the one below. The mansard inset is
// the distance in from the block's edge (1 block per layer), so the roof slopes in rather than standing as a box.
// The facade is a one-cell skin: each window is a glass pane with a one-cell air gap behind it (some lit with glowstone
// or shroomlight), between calcite piers, and quoins at the corners. The south front has a recessed doorway with a
// lantern over it (a projecting canopy would sit outside the footprint, which the build doesn't allow).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184564.cells.json`, "utf8"));

const W = 16, H = 53, D = 40;
const MANSARD = 33;                                   // first mansard layer; the main roof's top is y 37
const MANSARD_LAYERS = 4;
const k = (x, y, z) => `${x},${y},${z}`;

// the footprint, its lidar roof smoothed by a 3x3 median and snapped to a tier
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const at = (x, z) => fp.get(`${x},${z}`);
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.main = med >= 35;                                 // the main block, mansard roof
  c.top = c.main ? 0 : med >= 30 ? 33 : med >= 25 ? 29 : 25;   // wing cornices on storey lines
}

// mansard depth: 1 at the main block's edge, rising inward (Chebyshev steps to the nearest non-main cell)
const depth = new Map();
const queue = [];
for (const [key, c] of fp) {
  if (!c.main) continue;
  const [x, z] = key.split(",").map(Number);
  let edge = false;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (!n || !n.main) edge = true; }
  if (edge) { depth.set(key, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(`${x},${z}`);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = at(x + dx, z + dz), nk = `${x + dx},${z + dz}`;
    if (n && n.main && !depth.has(nk)) { depth.set(nk, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// each column's exclusive top: a wing's tier, or the mansard stepping up from the edge to the main roof
for (const [key, c] of fp) {
  if (c.main) c.E = MANSARD + Math.min(depth.get(key) ?? MANSARD_LAYERS, MANSARD_LAYERS);
  else c.E = c.top;
}

const solid = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.E; };
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !solid(x + dx, y, z + dz)).map(([n]) => n);

// window rows: two per storey (the storey's floor line + 1 and + 2), and the mansard's dormer rows
const windowRow = (y) => (y < 32 && (y % 4 === 1 || y % 4 === 2)) || y === 34 || y === 35;
const SHOP_DOOR = { x: 11, z: 39 };                  // the south face's middle cell
const doorCell = (x, y, z) => x === SHOP_DOOR.x && z === SHOP_DOOR.z && (y === 1 || y === 2);

// pass 1: find the windows (pane + air gap behind) and the lit ones
const panes = new Map();                             // key -> { pane state }
const air = new Set();
const lit = new Map();
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.E; y++) {
    if (y === 0 || !windowRow(y)) continue;
    const ex = exposed(x, y, z);
    if (ex.length !== 1) continue;                   // corners and interior stay piers
    const face = ex[0], [dx, dz] = DIRS[face];
    const u = dz !== 0 ? x : z;
    if (u % 3 !== 1 || doorCell(x, y, z)) continue;
    const state = dz !== 0
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    panes.set(k(x, y, z), state);
    const ix = x - dx, iz = z - dz;                  // the cell behind the glass
    if (solid(ix, y, iz)) {
      air.add(k(ix, y, iz));
      if (y % 4 === 1 && (x * 7 + z * 13 + y) % 4 === 0) lit.set(k(ix, y, iz), (x + z) % 2 ? "glowstone" : "shroomlight");
    }
  }
}

// pass 2: the blocks themselves
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.E; y++) {
    const K = k(x, y, z);
    if (air.has(K)) { if (lit.has(K)) put(x, y, z, lit.get(K)); continue; }
    if (doorCell(x, y, z)) {
      const half = y === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (panes.has(K)) { put(x, y, z, "glass_pane", panes.get(K)); continue; }
    const ex = exposed(x, y, z);
    const top = !solid(x, y + 1, z);
    let block;
    if (top && y >= MANSARD) block = "deepslate_tiles";            // zinc-grey mansard covering
    else if (top) block = "smooth_quartz";                        // wing parapet
    else if (ex.length === 0) block = "stone";                    // mass
    else if (y === 0) block = "stone_bricks";                     // rusticated base
    else if (ex.length >= 2 || y % 4 === 0) block = "smooth_quartz";   // quoins and storey lines
    else if (y >= MANSARD) block = "deepslate_tiles";
    else block = "calcite";                                       // the limestone skin
    put(x, y, z, block);
  }
}

// the lantern above the doorway, and two brick chimneys on the mansard's flat top
put(SHOP_DOOR.x, 3, SHOP_DOOR.z, "lantern", { hanging: "false", waterlogged: "false" });
for (const [key, c] of fp) {
  if (!c.main || (depth.get(key) ?? 0) < MANSARD_LAYERS) continue;
  const [x, z] = key.split(",").map(Number);
  if (x % 5 !== 2 || z % 8 !== 4) continue;
  for (let y = 37; y <= 39; y++) put(x, y, z, "bricks");
}

const stats = g.save(`${DIR}/FR245184564.nbt`);
console.log("FR245184564", stats, "mansard cells", [...fp.values()].filter((c) => c.main).length, "wings", [...fp.values()].filter((c) => !c.main).length);
