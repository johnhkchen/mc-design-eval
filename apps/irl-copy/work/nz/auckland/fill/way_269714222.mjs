// Mt Eden shop-block, 1920s: a three-storey brick block with cream render (piers, frames, string courses, cornice)
// on a basalt plinth, a shopfront at street level, a flat roof on the lidar's tiers: main block 14, wings 10 and 6.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269714222.cells.json`, "utf8"));
const W = 33, H = 26, D = 41;

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => F.has(key(x, z));
const median = (v) => v.sort((a, b) => a - b)[v.length >> 1];

// Lidar roof: median over the 3x3 footprint neighbourhood (noise out), snapped to three flat tiers.
const TOP = new Map();
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number), v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = F.get(key(x + dx, z + dz)); if (n) v.push(n.roof); }
  const s = median(v);
  TOP.set(k, s >= 11 ? 14 : s >= 7 ? 10 : 6);
}

const FLOORS = [5, 9, 13];          // string courses / floor slabs; the top one (13 on the main block) is the roof deck
const FASCIA = 4;                   // dark timber fascia over the shopfront
const M = {
  found: "cobblestone", plinth: "stone_bricks", brick: "bricks", cream: "smooth_quartz",
  floor: "smooth_stone", roof: "light_gray_concrete", plant: "smooth_quartz", fascia: "dark_oak_planks",
};
const DIRS = [["N", 0, -1, "north"], ["S", 0, 1, "south"], ["E", 1, 0, "east"], ["W", -1, 0, "west"]];

// A cell's faces: the sides open to the air, and the sides against a lower tier (a setback wall).
const faces = (x, z) => {
  const t = TOP.get(key(x, z)), out = [];
  for (const [n, dx, dz, full] of DIRS) {
    const nb = key(x + dx, z + dz);
    if (!F.has(nb)) out.push({ n, dx, dz, full, exposed: true });
    else if (TOP.get(nb) < t) out.push({ n, dx, dz, full, exposed: false });
  }
  return out;
};
const along = (f, x, z) => (f.n === "N" || f.n === "S" ? x : z);
// Bay rhythm on a facade: brick pier, cream frame, glass pane (a 3-block window bay).
const bay = (a) => (a % 4 === 0 ? "pier" : a % 4 === 2 ? "glass" : "frame");
// Glass pane connected along the facade it sits in.
const pane = (f) => (f.n === "N" || f.n === "S"
  ? { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" }
  : { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" });

// Front door: on the north face, the middle of the exposed north cells that are not corners.
const northCells = [];
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number), fs = faces(x, z);
  if (fs.length === 1 && fs[0].n === "N" && fs[0].exposed) northCells.push([x, z]);
}
northCells.sort((a, b) => a[0] - b[0]);
const door = northCells.length ? northCells[northCells.length >> 1] : null;

const g = new Voxels([W, H, D]);
const shell = new Set();

for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  const base = c.ground, t = TOP.get(k), fs = faces(x, z);
  if (fs.length) shell.add(k);
  const corner = fs.length >= 2, exposed = fs.some((f) => f.exposed);

  for (let y = 0; y < base; y++) g.set(x, y, z, M.found);

  for (let y = base; y < t; y++) {
    const deck = y === t - 1;
    const floor = FLOORS.includes(y) || y === base;
    if (!fs.length) {                                      // interior: a hollow with floor slabs and a roof membrane
      if (deck) g.set(x, y, z, M.roof);
      else if (floor) g.set(x, y, z, M.floor);
      continue;
    }
    if (y === base) { g.set(x, y, z, M.plinth); continue; }
    if (deck) { g.set(x, y, z, M.cream); continue; }      // cornice
    if (FLOORS.includes(y)) { g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (corner) { g.set(x, y, z, M.cream); continue; }      // quoins
    if (y === FASCIA) { g.set(x, y, z, M.fascia); continue; }
    const f = fs[0], kind = bay(along(f, x, z));
    if (kind === "pier") g.set(x, y, z, M.brick);
    else if (kind === "frame") g.set(x, y, z, M.cream);
    else g.set(x, y, z, "glass_pane", pane(f));
  }

  if (exposed) {                                          // parapet on the open roof edge
    const conn = { north: "none", east: "none", south: "none", west: "none" };
    for (const f of fs) if (f.exposed) {
      if (f.n === "N" || f.n === "S") { conn.east = "low"; conn.west = "low"; }
      else { conn.north = "low"; conn.south = "low"; }
    }
    g.set(x, t, z, "stone_brick_wall", { up: "true", ...conn });
  }
}

// The front door: two halves in the ground-floor bay, facing out.
if (door) {
  const [x, z] = door, base = F.get(key(x, z)).ground;
  g.set(x, base + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, base + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light behind some glass: a lamp on the floor of the room inside each lit window, never on a wall.
for (const k of shell) {
  const [x, z] = k.split(",").map(Number), fs = faces(x, z);
  if (fs.length !== 1) continue;
  const f = fs[0], a = along(f, x, z);
  if (bay(a) !== "glass") continue;
  const ix = x - f.dx, iz = z - f.dz, ik = key(ix, iz);
  if (!F.has(ik) || shell.has(ik)) continue;
  const base = F.get(k).ground, t = TOP.get(k);
  for (const y of [base + 1, 6, 10]) {
    if (y >= t - 1 || FLOORS.includes(y) || y === FASCIA) continue;
    const lit = y === base + 1 ? a % 8 === 6 : a % 8 === 2;   // shopfront lit a bit differently from the upper floors
    if (lit) g.set(ix, y, iz, y === base + 1 ? "shroomlight" : "glowstone");
  }
}

// Rooftop plant room: a 3 x 3 block on the interior of the main tier, raised two blocks above the roof.
const roofMain = [...F.keys()].filter((k) => TOP.get(k) === 14 && !shell.has(k)).map((k) => k.split(",").map(Number));
if (roofMain.length) {
  const cx = Math.round(roofMain.reduce((s, [x]) => s + x, 0) / roofMain.length);
  const cz = Math.round(roofMain.reduce((s, [, z]) => s + z, 0) / roofMain.length);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = key(cx + dx, cz + dz);
    if (!F.has(k) || shell.has(k) || TOP.get(k) !== 14) continue;
    g.set(cx + dx, 14, cz + dz, M.plant);
    g.set(cx + dx, 15, cz + dz, M.plant);
    g.set(cx + dx, 16, cz + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const out = `${DIR}/way_269714222.nbt`;
const r = g.save(out);
const tiers = { 14: 0, 10: 0, 6: 0 };
for (const k of F.keys()) tiers[TOP.get(k)]++;
console.log(JSON.stringify({ cells: F.size, tiers, shell: shell.size, door, blocks: r.blocks, palette: r.palette, out }));
