// FR245184453: a residential Haussmann-era block (1878, seven storeys under a zinc-grey mansard) on the lidar footprint.
// Storeys: a plinth and ground floor (y 1..4, lintel at 4), then six storeys of 3 rows (a string course on y = 5 mod 3,
// two window rows above it), a cornice on y = 23 that every cell carries, and a 3-row mansard on the main tier (27).
// The lidar's 27 and 25 tiers are snapped by a 3x3 median; the 25 tier is a lower wing with a flat parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184453.cells.json`, "utf8"));

const W = 13, H = 43, D = 11;
const MAIN = 27, WING = 25;                      // the lidar's tiers (blocks above y 0)
const CORNICE = 23;                              // the top of storey 7; the roof band starts above it
const SLABS = [5, 8, 11, 14, 17, 20];            // floor slabs and string courses (every cell, interior too)

const fp = new Map();                            // "x,z" -> { g, lidar, T }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => at(x, z)?.T ?? 0;        // 0 outside the footprint: open air
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// Smooth the lidar: 3x3 median, snapped to the nearer of the two tiers (kills the stepped and noisy edge cells).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = Math.abs(med - MAIN) <= Math.abs(med - WING) ? MAIN : WING;
}

// Mansard: distance inward from the main tier's edge (edge = 0), over the cells whose top is the main tier.
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
// The stair facing at distance d: towards the neighbour that is one step nearer the edge (or the open side at d = 0).
function outwardOf(x, z, d) {
  for (const [name, dx, dz] of NEI) {
    const nx = x + dx, nz = z + dz;
    if (d === 0 ? !isMain(nx, nz) : dist.get(`${nx},${nz}`) === d - 1) return name;
  }
  return "north";
}

// Which faces of a cell at height y are exposed to air (no footprint cell beside it that reaches that row).
const exposedDirs = (x, z, y) => NEI.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([n]) => n);

// Entrances: the street fronts (south, and the short north run), a door with a chiseled bay and hanging lanterns.
const doorMap = new Map(), bayMap = new Map(), lanternMap = new Map();
for (const [x0, z0, face] of [[6, 10, "south"], [10, 0, "north"]]) {
  if (!fp.has(`${x0},${z0}`)) continue;
  doorMap.set(`${x0},${z0}`, face);
  for (const dx of [-1, 0, 1]) bayMap.set(`${x0 + dx},${z0}`, face);
  for (const dx of [-1, 1]) lanternMap.set(`${x0 + dx},${z0}`, face);
}

// Two chimney stacks on the main tier's flat top, each the deepest-inside cell nearest a target.
const chim = new Map();
for (const [tx, tz] of [[4, 5], [9, 6]]) {
  let best = null;
  for (const key of dist.keys()) {
    const [x, z] = key.split(",").map(Number), d = dist.get(key);
    if (d < 3 || chim.has(key)) continue;
    const m = Math.abs(x - tx) + Math.abs(z - tz);
    if (!best || m < best.m) best = { key, m };
  }
  if (best) chim.set(best.key, true);
}

// Some windows are lit (glowstone behind the glass in the storey's top row), chosen by a fixed pattern.
const lit = (x, z, y) => (x * 5 + z * 3 + y * 2) % 17 === 0;

// Classify one cell: [block, state] or null (air).
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { T } = c, key = `${x},${z}`;
  if (y >= T) {                                  // a chimney stands on the main tier's flat top
    if (chim.has(key) && isMain(x, z) && y <= T + 2) {
      return y === T + 2 ? ["stone_brick_slab", { type: "top", waterlogged: "false" }]
        : ["stone_brick_wall", { east: "none", north: "none", south: "none", west: "none", up: "true", waterlogged: "false" }];
    }
    return null;
  }
  if (y === 0) return ["stone_bricks"];          // the base course: the cell's foundation, on every cell
  if (y >= CORNICE) {                            // the cornice and the roof band (zinc-grey mansard, flat wing caps)
    const exposed = exposedDirs(x, z, y).length > 0;
    if (y === CORNICE) return ["stone_bricks"];
    if (!isMain(x, z)) return exposed ? ["stone_bricks"] : ["deepslate_tiles"];          // wing parapet and cap
    const j = y - (CORNICE + 1), d = dist.get(key) ?? 99;                                   // j: row within the mansard
    if (d === j) return ["deepslate_tile_stairs", { facing: outwardOf(x, z, d), half: "bottom", shape: "straight", waterlogged: "false" }];
    if (d > j) return ["deepslate_tiles"];
    return null;
  }
  if (SLABS.includes(y)) return ["smooth_stone"];  // floor slabs and string courses
  const dirs = exposedDirs(x, z, y), ext = dirs.length > 0;
  if (!ext) return null;                         // interior air behind the facade
  if (y === 1) return ["stone_bricks"];          // plinth
  if (y === 4) return bayMap.has(key) ? ["chiseled_stone_bricks"] : ["calcite"];   // lintel course, the bay over the door
  if (doorMap.has(key) && (y === 1 || y === 2)) {
    return ["dark_oak_door", { facing: doorMap.get(key), half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y === 3 && lanternMap.has(key)) return ["lantern", { hanging: "true", waterlogged: "false" }];
  const onZ = dirs.includes("north") || dirs.includes("south");
  if ((onZ ? x : z) % 3 === 0) return ["calcite"];                      // pier between the windows
  const st = onZ ? { north: "false", south: "false", east: "true", west: "true" }
                 : { north: "true", south: "true", east: "false", west: "false" };
  if (y === 6) return ["iron_bars", st];                                 // the noble floor's balcony rail
  if ((y === 3 || (y - 5) % 3 === 2) && lit(x, z, y)) return ["glowstone"];   // a warm window, behind the glass
  return ["glass_pane", st];
}

const g = new Voxels([W, H, D]);
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) { const b = cls(x, z, y); if (b) g.set(x, y, z, b[0], b[1]); }
}
const out = g.save(`${DIR}/FR245184453.nbt`);
console.log(JSON.stringify(out));
