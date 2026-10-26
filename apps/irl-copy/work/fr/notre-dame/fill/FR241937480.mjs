// FR241937480: a Haussmann-era residential block (1850, seven storeys under a zinc mansard), built on the lidar footprint.
// Storeys are 4 blocks (1 string course + 2 window rows + 1 lintel), so the storey lines fall on y = 1 mod 4 and every
// roof tier (33, 29, 25, ...) lands on a lintel. The core (33) carries the mansard; the lower tiers are flat with parapets.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241937480.cells.json`, "utf8"));

const W = 45, H = 49, D = 24;
const TIERS = [2, 5, 9, 13, 17, 21, 25, 29, 33];   // all 1 mod 4: each tier top is a lintel row
const MAIN = 33;

const fp = new Map();                               // "x,z" -> { g, lidar, T }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => (at(x, z)?.T ?? 0);         // 0 where there is no building: a missing neighbour is open air
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Smooth the lidar: 3x3 median, then snap to the nearest tier (kills the noisy edge cells and the stepped roof).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) ? t : best));
}

// Mansard: distance inward from the core's edge (edge = 0), over the cells whose top is the main tier.
const isMain = (x, z) => topAt(x, z) === MAIN;
const dist = new Map(), queue = [];
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (isMain(x, z) && NEI.some(([, dx, dz]) => !isMain(x + dx, z + dz))) { dist.set(key, 0); queue.push(key); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i].split(",").map(Number), d = dist.get(queue[i]);
  for (const [, dx, dz] of NEI) {
    const k = `${x + dx},${z + dz}`;
    if (isMain(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push(k); }
  }
}
// The way out of the slope at distance d: towards the edge (the open side for d = 0, else the neighbour one step nearer).
function outwardOf(x, z, d) {
  for (const [name, dx, dz] of NEI) {
    const nx = x + dx, nz = z + dz;
    if (d === 0 ? !isMain(nx, nz) : dist.get(`${nx},${nz}`) === d - 1) return name;
  }
  return "north";
}

// Which faces of a cell at height y are exposed to air (no building cell beside it that reaches that row).
const exposedDirs = (x, z, y) => NEI.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([n]) => n);

// Doors: the middle of each main face's street-side run (south and north), with a chiseled bay over them.
const doorMap = new Map(), bayMap = new Map(), lanternMap = new Map();
for (const [name, dz] of [["south", 1], ["north", -1]]) {
  const xs = [];
  for (const key of fp.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (isMain(x, z) && topAt(x, z + dz) <= 2) xs.push([x, z]);
  }
  if (!xs.length) continue;
  const z0 = xs[0][1];
  const sameFace = xs.filter(([, z]) => z === z0).map(([x]) => x).sort((a, b) => a - b);
  const x0 = sameFace[Math.floor(sameFace.length / 2)];
  doorMap.set(`${x0},${z0}`, name);
  for (const dx of [-1, 0, 1]) bayMap.set(`${x0 + dx},${z0}`, name);
  for (const dx of [-1, 1]) lanternMap.set(`${x0 + dx},${z0}`, name);
}

// Classify one cell: [block, state] or null (air). Rows: y=0 base; y%4=1 storey string (solid floor);
// y%4=0 lintel; y%4=2,3 window band (glass, piers, balconies at the noble floor). Interior rows stay air.
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { T } = c;
  if (y >= T) return null;
  if (y === 0) return ["stone_bricks"];
  if (isMain(x, z) && y >= 30) {                    // the mansard: stairs on the edge, full blocks inside, flat top
    const j = y - 30, d = dist.get(`${x},${z}`) ?? 99;
    if (d === j) return ["deepslate_tile_stairs", { facing: outwardOf(x, z, d), half: "bottom", shape: "straight", waterlogged: "false" }];
    if (d > j) return ["deepslate_tiles"];
    return null;
  }
  if (isMain(x, z) && y === 29) return ["stone_bricks"];   // cornice
  const dirs = exposedDirs(x, z, y), ext = dirs.length > 0;
  if (y === T - 1) return ext ? ["stone_bricks"] : ["deepslate_tiles"];   // roof cap; a parapet at the edge
  if (y % 4 === 1) return ["smooth_stone"];                         // storey string = floor slab
  if (!ext) return null;                                            // interior air behind the facade
  const dk = `${x},${z}`;
  if (y === 4 && bayMap.has(dk)) return ["chiseled_stone_bricks"];
  if (y === 3 && lanternMap.has(dk)) return ["lantern", { hanging: "true", waterlogged: "false" }];
  if ((y === 2 || y === 3) && doorMap.has(dk)) {
    return ["dark_oak_door", { facing: doorMap.get(dk), half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y % 4 === 0) return ["calcite"];
  const onZ = dirs.includes("north") || dirs.includes("south");
  if ((onZ ? x : z) % 3 === 0) return ["calcite"];                  // pier
  const st = onZ ? { north: "false", south: "false", east: "true", west: "true" }
                 : { north: "true", south: "true", east: "false", west: "false" };
  if (y === 6) return ["iron_bars", st];                           // noble floor: a balcony rail across the window
  return ["glass_pane", st];
}

const g = new Voxels([W, H, D]);
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) { const b = cls(x, z, y); if (b) g.set(x, y, z, b[0], b[1]); }
}

// Warm light behind some upper-floor glass: a glowstone one cell inside the pane (the air gap stays everywhere else).
let lights = 0;
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number), c = at(x, z);
  for (let y = 9; y < c.T; y += 1) {
    if (y % 4 !== 3 || (x * 31 + z * 17 + y * 7) % 13 !== 0) continue;
    const dirs = exposedDirs(x, z, y); if (!dirs.length) continue;
    const b = cls(x, z, y); if (!b || b[0] !== "glass_pane") continue;
    const [, dx, dz] = NEI.find(([n]) => n === OPP[dirs[0]]);
    const ix = x + dx, iz = z + dz;
    if (at(ix, iz) && cls(ix, iz, y) === null) { g.set(ix, y, iz, "glowstone"); lights++; }
  }
}

// Roof plant: brick chimney stacks on the mansard's flat top (where the top is full, 4+ cells in).
let chimneys = 0;
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!isMain(x, z) || (dist.get(key) ?? 0) < 4 || x % 10 !== 5 || z % 7 !== 3) continue;
  for (let y = 33; y <= 35; y++) g.set(x, y, z, "bricks");
  g.set(x, 36, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  chimneys++;
}

const out = `${DIR}/FR241937480.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries, ${lights} lit windows, ${chimneys} chimneys, doors ${[...doorMap.keys()].join(" ")}`);
