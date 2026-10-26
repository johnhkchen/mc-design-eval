// FR245157321: a Haussmann-era residential block (1900, six storeys under a zinc-grey mansard) on the lidar footprint.
// The lidar's roof heights, smoothed and snapped, set the tiers (5 to 30, and the 33 tier that carries the mansard).
// Storeys are 5 blocks: a smooth-stone floor string on y = 0 mod 5, a calcite band, two glass rows, a calcite band.
// The noble floor's lower band is a balcony rail. Interiors are air behind the facade, with a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245157321.cells.json`, "utf8"));

const W = 122, H = 49, D = 79;
const TIERS = [5, 10, 15, 20, 25, 30, 33];
const MAIN = 33;

const fp = new Map();                                 // "x,z" -> { g, lidar, T }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => (at(x, z)?.T ?? 0);           // 0 where there is no building: a missing neighbour is open air
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Smooth the lidar: 3x3 median over the footprint, then snap to the nearest tier. Under 4 blocks is open ground.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = med <= 3 ? 0 : TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) ? t : best));
}

// Mansard: distance inward from the top tier's edge (edge = 0), over the cells whose top is the main tier.
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

// Entrances: on each outer face (no footprint cell beyond it), two doors on the long faces, one on the short ones.
// A chiseled hood over each door, and a lantern hung under it.
const doorMap = new Map(), bayMap = new Map();
for (const [name, dx, dz] of NEI) {
  const cand = [];
  for (const [key, c] of fp) {
    const [x, z] = key.split(",").map(Number);
    if (c.T >= 25 && !at(x + dx, z + dz)) cand.push([x, z]);
  }
  if (cand.length < 4) continue;
  const ax = dz !== 0 ? 0 : 1;                        // the face runs along x (north, south) or z (east, west)
  cand.sort((a, b) => a[ax] - b[ax]);
  const picks = cand.length >= 20 ? [Math.floor(cand.length / 3), Math.floor((2 * cand.length) / 3)] : [Math.floor(cand.length / 2)];
  for (const i of picks) {
    const [x0, z0] = cand[i];
    doorMap.set(`${x0},${z0}`, name);
    for (const d of [-1, 0, 1]) bayMap.set(ax === 0 ? `${x0 + d},${z0}` : `${x0},${z0 + d}`, name);
  }
}

// One cell's block at height y: [block, state] or null (air).
// Rows: foundation below ground; y=0 base course; y%5=0 floor string (solid across the footprint); the storey bands
// y%5=1 and y%5=4 (calcite; the noble floor's lower band is a rail); y%5=2,3 the window rows (glass, calcite piers).
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { g, T } = c;
  if (y < g) return ["stone_bricks"];                 // foundation under the ground
  if (T === 0 || y >= T) return null;
  if (y === 0) return ["stone_bricks"];               // base course
  const dk = `${x},${z}`;
  if (T === MAIN && y >= 30) {                        // the mansard: stairs on the edge, full blocks inside
    const j = y - 30, d = dist.get(dk) ?? 99;
    if (d === j) return ["deepslate_tile_stairs", { facing: outwardOf(x, z, d), half: "bottom", shape: "straight", waterlogged: "false" }];
    return d > j ? ["deepslate_tiles"] : null;
  }
  if (T === MAIN && y === 29) return ["stone_bricks"];  // cornice, solid under the mansard
  if (y === T - 1) return exposedDirs(x, z, y).length ? ["stone_bricks"] : ["deepslate_tiles"];  // parapet or flat roof
  if (y % 5 === 0) return ["smooth_stone"];           // floor string: a slab across each storey
  const dirs = exposedDirs(x, z, y);
  if (!dirs.length) return null;                      // interior air behind the facade
  const onZ = dirs.includes("north") || dirs.includes("south");
  const panes = onZ ? { north: "false", south: "false", east: "true", west: "true" }
                    : { north: "true", south: "true", east: "false", west: "false" };
  if (y === 4 && bayMap.has(dk)) return ["chiseled_stone_bricks"];   // the door's hood
  if (doorMap.has(dk) && (y === 1 || y === 2)) {
    return ["dark_oak_door", { facing: doorMap.get(dk), half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (doorMap.has(dk) && y === 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
  if (y === 1) return ["stone_bricks"];               // ground storey rustication
  if (y % 5 === 1 || y % 5 === 4) {
    if (y === 6) return ["iron_bars", panes];         // the noble floor's balcony rail
    return ["calcite"];
  }
  if ((onZ ? x : z) % 3 === 0) return ["calcite"];    // pier
  return ["glass_pane", panes];
}

const g = new Voxels([W, H, D]);
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) { const b = cls(x, z, y); if (b) g.set(x, y, z, b[0], b[1]); }
}

// Warm light behind some glass: a glowstone one cell inside the pane (the air gap stays everywhere else).
let lights = 0;
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number), c = at(x, z);
  for (let y = 2; y < c.T; y++) {
    if (y % 5 !== 2 && y % 5 !== 3) continue;
    if ((x * 31 + z * 17 + y * 7) % 13 !== 0) continue;
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

const out = `${DIR}/FR245157321.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries, ${lights} lit windows, ${chimneys} chimneys, doors ${[...doorMap.keys()].join(" ")}`);
