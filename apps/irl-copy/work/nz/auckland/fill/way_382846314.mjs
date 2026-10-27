import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 382846314 has no record (OSM: civic or unrecorded). Read as an unnamed 1960s-70s Auckland concrete office block:
// a white concrete frame with bay glazing in tinted blue glass, light floor bands, a 3-storey tower over 2-storey
// wings, a cornice and parapet, a plant room on the roof, and entrances at the street side. The ground falls east and
// south under it, so the downhill side carries a stone plinth and its extra storeys.

const cellsFile = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_382846314.cells.json";
const outFile = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_382846314.nbt";
const cells = JSON.parse(readFileSync(cellsFile, "utf8"));

const SX = 45, SY = 27, SZ = 43;
const SLABS = [2, 6, 10, 14];   // floor lines: each storey is 4 blocks, slab + 3 blocks of wall
const TIERS = [6, 10, 14];      // roof tiers (1, 2, 3 storeys above the floor at 2)
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const HORIZ = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];   // [dx, dz, outward name]

const ck = (x, z) => `${x},${z}`;
const kk = (x, y, z) => (z * SY + y) * SX + x;

// Each column: its ground g and roof tier t. The lidar roof is quantised to the nearest tier (ties down, so the
// 12-block roofs step down to the 10 tier and only the 13-14 core rises to the tower), and never lower than 3 blocks
// of wall above the ground.
const col = new Map();
for (const [x, z, g, r] of cells) {
  const near = TIERS.reduce((b, L) => (Math.abs(L - r) < Math.abs(b - r) ? L : b), TIERS[0]);
  const lowest = TIERS.find((L) => L >= g + 3) ?? TIERS.at(-1);
  col.set(ck(x, z), { g, t: Math.max(near, lowest) });
}

// Solid: the foundation (y 0..g) and the body (g+1..t) are one column, so every block sits on the one below.
const solid = (x, y, z) => {
  const c = col.get(ck(x, z));
  return !!c && (y < 0 || y <= c.t);
};
const exposed = (x, y, z) => HORIZ.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// Depth from the outside, over the solid volume: 1 = skin (facade, roof, plinth), 2 = the layer behind it, 3+ = core.
// Depth 2 in the body, between floor slabs, is the air gap behind the glass.
const depth = new Map();
const queue = [];
for (const [s, c] of col) {
  const [x, z] = s.split(",").map(Number);
  for (let y = 0; y <= c.t; y++) {
    if (DIRS.some(([dx, dy, dz]) => !solid(x + dx, y + dy, z + dz))) { depth.set(kk(x, y, z), 1); queue.push([x, y, z]); }
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, y, z] = queue[i];
  const d = depth.get(kk(x, y, z)) + 1;
  for (const [dx, dy, dz] of DIRS) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (ny < 0 || !solid(nx, ny, nz)) continue;
    const k = kk(nx, ny, nz);
    if (!depth.has(k)) { depth.set(k, d); queue.push([nx, ny, nz]); }
  }
}

// Entrances: two doors on the lowest street-side walls, away from the wall's piers, each with a step up to the floor.
const doorCands = [];
for (const [s, c] of col) {
  const [x, z] = s.split(",").map(Number);
  if (c.g > 1) continue;
  const ex = exposed(x, 3, z);
  if (ex.length !== 1) continue;
  const u = ex[0][1] ? x : z;
  if (u % 4 === 0) continue;
  doorCands.push({ x, z, g: c.g, out: ex[0] });
}
doorCands.sort((a, b) => a.g - b.g || a.x - b.x || a.z - b.z);
const doors = [];
for (const d of doorCands) {
  if (doors.length < 2 && doors.every((e) => Math.abs(e.x - d.x) + Math.abs(e.z - d.z) >= 10)) doors.push(d);
}
const doorAt = new Map(doors.map((d) => [ck(d.x, d.z), d.out]));

// The facade: bays of glass between piers every 4 blocks, a light band at each floor, a white lintel at the top of
// each storey, and the entrance doors at the ground floor.
const B = new Map();
const put = (x, y, z, block, state) => B.set(kk(x, y, z), { x, y, z, block, state });

function facade(x, y, z, ex) {
  const F = SLABS.filter((s) => s <= y).pop();
  const rel = y - F;
  const u = ex[0][1] ? x : z;
  const pier = ex.length > 1 || u % 4 === 0;
  const out = doorAt.get(ck(x, z));
  if (out && F === 2 && rel <= 3) {
    if (rel === 0) return put(x, y, z, "stone_stairs",{ facing: out[2], half: "bottom", shape: "straight", waterlogged: "false" });
    if (rel === 1) return put(x, y, z, "iron_door", { facing: out[2], half: "lower", hinge: "left", open: "false", powered: "false" });
    if (rel === 2) return put(x, y, z, "iron_door", { facing: out[2], half: "upper", hinge: "left", open: "false", powered: "false" });
    return put(x, y, z, "light_gray_concrete");   // canopy lip over the door
  }
  if (rel === 0) return put(x, y, z, "light_gray_concrete");
  if (rel === 3) return put(x, y, z, "white_concrete");
  put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
}

for (const [s, c] of col) {
  const [x, z] = s.split(",").map(Number);
  for (let y = 0; y <= c.t; y++) {
    const d = depth.get(kk(x, y, z));
    const body = y > c.g;
    const slab = SLABS.includes(y);
    const ex = exposed(x, y, z);
    if (d === 1 && !body) { put(x, y, z, "stone_bricks"); continue; }                  // plinth course
    if (d === 1 && y === c.t) { put(x, y, z, ex.length ? "light_gray_concrete" : "gray_concrete"); continue; }   // cornice / roof
    if (d === 1) { facade(x, y, z, ex); continue; }
    if (d === 2 && body && !slab) continue;                                             // air gap behind the glass, storey by storey
    put(x, y, z, slab && d === 2 ? "light_gray_concrete" : "white_concrete");           // floor slab or core
  }
  // parapet on the roof edge
  if (exposed(x, c.t, z).length) put(x, c.t + 1, z, "white_concrete");
}

// Plant room: a 5 x 5 box on the top tier, set in from its edges, on the roof slab.
const tower = (x, z) => col.get(ck(x, z))?.t === 14;
let box = null;
for (const ring of [1, 0]) {
  let best = null;
  for (let x0 = -ring; x0 <= 40 + ring && !best; x0++) for (let z0 = -ring; z0 <= 38 + ring; z0++) {
    let ok = true;
    for (let dx = -ring; dx < 5 + ring && ok; dx++) for (let dz = -ring; dz < 5 + ring && ok; dz++) if (!tower(x0 + dx, z0 + dz)) ok = false;
    if (ok) { best = { x0, z0 }; break; }
  }
  if (best) { box = best; break; }
}
if (box) {
  for (let dx = 0; dx < 5; dx++) for (let dz = 0; dz < 5; dz++) {
    const x = box.x0 + dx, z = box.z0 + dz;
    put(x, 15, z, "white_concrete");
    put(x, 16, z, "light_gray_concrete");
    put(x, 17, z, "white_concrete");
    put(x, 18, z, "gray_concrete");
  }
}

// Warm light: glowstone on the floor of some windows' air gaps, behind the glass.
const lit = [];
for (const b of B.values()) {
  if (!b.block.endsWith("stained_glass_pane")) continue;
  const F = SLABS.filter((s) => s <= b.y).pop();
  if (b.y - F !== 1 || (b.x * 3 + b.z * 5 + b.y) % 9 !== 0) continue;
  for (const [dx, dz] of HORIZ) {
    const nx = b.x + dx, nz = b.z + dz;
    if (depth.get(kk(nx, b.y, nz)) === 2 && !B.has(kk(nx, b.y, nz))) { lit.push([nx, b.y, nz]); break; }
  }
}
for (const [x, y, z] of lit) put(x, y, z, "glowstone");

// Panes join their neighbours in the wall plane (piers, panes, doors), as in the game.
for (const b of B.values()) {
  if (!b.block.endsWith("_pane")) continue;
  const conn = {};
  for (const [dx, dz, name] of HORIZ) conn[name] = B.has(kk(b.x + dx, b.y, b.z + dz)) ? "true" : "false";
  b.state = { north: conn.north, east: conn.east, south: conn.south, west: conn.west, waterlogged: "false" };
}

// Checks: nothing floats (every block has one below it) and the plant room sits on the roof.
// A block over the air gap is a ceiling inside a sealed room, not a floater; a block over open air outside is.
let floating = 0, ceilings = 0;
for (const b of B.values()) {
  if (b.y === 0 || B.has(kk(b.x, b.y - 1, b.z))) continue;
  if (depth.get(kk(b.x, b.y - 1, b.z)) === 2) ceilings++; else floating++;
}

const g = new Voxels([SX, SY, SZ]);
for (const b of B.values()) g.set(b.x, b.y, b.z, b.block, b.state);
const stats = g.save(outFile);

const tiers = {};
for (const c of col.values()) tiers[c.t] = (tiers[c.t] || 0) + 1;
console.log(JSON.stringify({ blocks: stats.blocks, palette: stats.palette, floating, doors: doors.length, glowstone: lit.length, plantRoom: !!box, tiers }));
