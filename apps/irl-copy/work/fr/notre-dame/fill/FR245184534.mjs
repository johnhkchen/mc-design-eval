// FR245184534: the Hôtel de la Motte Montgoubert, a residential hôtel particulier on the lidar footprint (20 x 37 blocks, 6 storeys).
// Cream limestone walls (calcite, with stone-brick plinth and smooth-stone floor bands), the lidar roof snapped to five flat tiers
// (5, 8, 14, 17, 20, 22 blocks): the low tiers end in a zinc cap, the tall main block (20-22) under a grey mansard.
// Storeys: plinth 0-1, ground 2-3 (shopfront, door, lanterns), then floor bands on y = 4, 7, 10, 13, 16 with a window row
// beneath each (5-6, 8-9, 11-12, 14-15, 17-18). Window voids sit behind the glass (air one cell in, between the floor bands).
// Every interior cell is solid, every floor band spans the footprint, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184534.cells.json`, "utf8"));

const W = 20, H = 38, D = 37;
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const FLOORS = [4, 7, 10, 13, 16];                     // floor bands, every cell (interior too)
const isFloor = (y) => FLOORS.includes(y);
const isWindowRow = (y) => y >= 2 && y <= 18 && !isFloor(y) && y !== 1;

// Lidar roof: 3x3 median per cell, snapped to the five tiers.
const lidar = new Map();
for (const [x, z, , r] of cells) lidar.set(`${x},${z}`, { g: 0, r, T: 0 });
const at = (x, z) => lidar.get(`${x},${z}`);
const tierOf = (m) => (m >= 20 ? 22 : m >= 17 ? 20 : m >= 14 ? 17 : m >= 10 ? 14 : m >= 7 ? 8 : 5);
for (const [key, c] of lidar) {
  const [x, z] = key.split(",").map(Number), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.T = tierOf(vals[Math.floor(vals.length / 2)]);
}
const topAt = (x, z) => at(x, z)?.T ?? 0;             // 0 outside the footprint: open air
const exposedDirs = (x, z, y) => NEI.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([n]) => n);

// Mansard zone (the 20 and 22 tiers): distance inward from each tier's edge.
const dist = new Map();
for (const [key, c] of lidar) {
  if (c.T < 20) continue;
  const [x, z] = key.split(",").map(Number);
  if (NEI.some(([, dx, dz]) => topAt(x + dx, z + dz) !== c.T)) dist.set(key, 0);
}
for (let k = 0; k < 40; k++) for (const [key, c] of lidar) {
  if (c.T < 20 || dist.has(key)) continue;
  const [x, z] = key.split(",").map(Number);
  const ds = NEI.map(([, dx, dz]) => dist.get(`${x + dx},${z + dz}`)).filter((d) => d !== undefined);
  if (ds.length) dist.set(key, Math.min(...ds) + 1);
}
function outwardOf(x, z, d) {
  for (const [name, dx, dz] of NEI) {
    const n = dist.get(`${x + dx},${z + dz}`);
    if (d === 0 ? topAt(x + dx, z + dz) !== topAt(x, z) : n === d - 1) return name;
  }
  return "north";
}

// Entrances: the south tip (4,36) and the north cell (8,0), a door on a plinth with a chiseled bay and hanging lanterns.
const doorMap = new Map(), bayMap = new Map(), lanternMap = new Map();
for (const [x0, z0, face] of [[4, 36, "south"], [8, 0, "north"]]) {
  if (!lidar.has(`${x0},${z0}`)) continue;
  doorMap.set(`${x0},${z0}`, face);
  for (const dx of [-1, 0, 1]) bayMap.set(`${x0 + dx},${z0}`, face);
  for (const dx of [-1, 1]) lanternMap.set(`${x0 + dx},${z0}`, face);
}

// Chimney stacks on the two highest interior flat-ish tops, nearest two targets.
const chim = new Map();
for (const [tx, tz] of [[9, 12], [9, 26]]) {
  let best = null;
  for (const [key, c] of lidar) {
    const [x, z] = key.split(",").map(Number);
    if (c.T < 20 || exposedDirs(x, z, c.T - 1).length || chim.has(key)) continue;
    const m = Math.abs(x - tx) + Math.abs(z - tz);
    if (!best || m < best.m) best = { key, m };
  }
  if (best) chim.set(best.key, true);
}

// Window voids: the cell one step inboard of each window (solid interior, not exposed), air in the window rows.
const voids = new Set(), pierAt = (x, z, exp) => ((exp.includes("north") || exp.includes("south")) ? x : z) % 3 === 0;
for (const [key, c] of lidar) {
  const [x, z] = key.split(",").map(Number);
  for (const y of [2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18]) {
    if (y >= c.T) continue;
    const exp = exposedDirs(x, z, y);
    if (!exp.length || pierAt(x, z, exp)) continue;
    const [, dx, dz] = NEI.find(([n]) => n === exp[0]);
    const ix = x - dx, iz = z - dz;
    if (topAt(ix, iz) > y && !exposedDirs(ix, iz, y).length) voids.add(`${ix},${iz},${y}`);
    else if (topAt(ix, iz) > y && exposedDirs(ix, iz, y).length) continue;
  }
}

const lit = (x, z, y) => (x * 5 + z * 3 + y * 2) % 17 === 0;

// Classify one cell: [block, state] or null (air).
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { T } = c, key = `${x},${z}`;
  if (y >= T) {                                                     // chimney stacks on the roof
    if (chim.has(key) && y <= T + 1) return y === T + 1 ? ["stone_brick_slab", { type: "top", waterlogged: "false" }]
      : ["stone_brick_wall", { east: "none", north: "none", south: "none", west: "none", up: "true", waterlogged: "false" }];
    return null;
  }
  if (y <= 1) return ["stone_bricks"];                              // plinth and foundation, every cell
  const cornice = T >= 20 ? (T === 22 ? 19 : 18) : T - 2, cap = T - 1;   // the cornice band; the flat tiers cap in zinc
  if (T >= 20 && y >= cornice) {                                    // mansard tiers: the grey roof above the cornice
    const rows = T === 22 ? [20, 21] : [19];
    if (y === cornice) return ["smooth_stone"];
    const j = y - rows[0], d = dist.get(key) ?? 99;
    if (j < 0 || j >= rows.length) return null;
    if (d === j) return ["deepslate_tile_stairs", { facing: outwardOf(x, z, d), half: "bottom", shape: "straight", waterlogged: "false" }];
    if (d > j) return ["deepslate_tiles"];
    return null;
  }
  if (y === cap && T < 20) return ["deepslate_tiles"];           // the flat low tiers: zinc cap
  if (y === cornice && T < 20) return ["stone_bricks"];
  if (y === 4 && bayMap.has(key)) return ["chiseled_stone_bricks"]; // the lintel bay over the door
  if (isFloor(y)) return ["smooth_stone"];                        // floor bands, interior too
  const exp = exposedDirs(x, z, y);
  if (!exp.length) return voids.has(`${x},${z},${y}`) ? null : ["calcite"];
  if (y === 1) return ["stone_bricks"];
  if ((y === 2 || y === 3) && doorMap.has(key)) {                 // the door: lower and upper halves
    return ["dark_oak_door", { facing: doorMap.get(key), half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y === 3 && lanternMap.has(key)) return ["lantern", { hanging: "true", waterlogged: "false" }];
  const onZ = exp.includes("north") || exp.includes("south");
  if (pierAt(x, z, exp)) return ["calcite"];                      // pier between the windows
  const st = onZ ? { north: "false", south: "false", east: "true", west: "true" }
                 : { north: "true", south: "true", east: "false", west: "false" };
  if (y === 5) return ["iron_bars", st];                          // the noble floor's balcony rail
  if (y === 2 || y === 3 || isWindowRow(y)) {
    if ((y === 3 || y === 9 || y === 15) && lit(x, z, y)) return ["glowstone"];   // a warm window, behind the glass
    return ["glass_pane", st];
  }
  return ["calcite"];
}

const g = new Voxels([W, H, D]);
let placed = 0;
for (const [key, c] of lidar) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < Math.min(H, c.T + 2); y++) {
    const b = cls(x, z, y);
    if (b) { g.set(x, y, z, b[0], b[1]); placed++; }
  }
}
// The one column the lidar's roof reads as past the top (the chimney stacks) is already included above.
const out = `${DIR}/FR245184534.nbt`;
const r = g.save(out);
console.log(JSON.stringify({ cells: cells.length, placed, ...r }));
