import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Science Centre 302: a late-20th-century concrete-frame office block on a granite plinth. The lidar roof reads as a
// stepped massing (a 17-storey core, an 11-storey setback, a 7-storey wing and a 3-storey low), so the footprint is
// cut into four clean tiers at 20, 36, 52 and 68 blocks (storeys of 4 from y 8, the first floor on the uphill ground).
// Facades are pale concrete frames (white pilasters, light-grey spandrels) with tinted glass between, a 1-block air
// gap behind the glass and a slab per storey; warm lanterns and glowstone sit in some bays. Nothing has interior rooms.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_749960888.cells.json", "utf8"));
const W = 75, H = 82, D = 91;
const FLOOR0 = 8;                      // first floor slab, above the uphill ground (max 7)
const key = (x, z) => x + "," + z;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the lidar roof, averaged over each cell's footprint neighbours to take out the noise, then cut into four tiers
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(key(x, z), { x, z, ground, roof });
const smooth = new Map();
for (const [k, c] of foot) {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const q = foot.get(key(c.x + dx, c.z + dz)); if (q) { s += q.roof; n++; } }
  smooth.set(k, s / n);
}
const topOf = (r) => (r < 27 ? 20 : r < 46 ? 36 : r < 61 ? 52 : 68);
const top = new Map();
for (const [k] of foot) top.set(k, topOf(smooth.get(k)));
const has = (x, z) => foot.has(key(x, z));
const T = (x, z) => top.get(key(x, z)) ?? 0;
const inS = (x, z, y) => has(x, z) && T(x, z) > y;     // footprint cell standing at height y
const hash = (x, y, z) => (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0;

const g = new Voxels([W, H, D]);

for (let y = 0; y < 68; y++) {
  // exposure at this height: ring 0 touches air (outside or a lower tier), ring 1 is one cell in
  const S = [...foot.values()].filter((c) => T(c.x, c.z) > y);
  const ring0 = new Set();
  for (const c of S) if (NB.some(([dx, dz]) => !inS(c.x + dx, c.z + dz, y))) ring0.add(key(c.x, c.z));
  const ring1 = new Set();
  for (const c of S) {
    const k = key(c.x, c.z);
    if (!ring0.has(k) && NB.some(([dx, dz]) => ring0.has(key(c.x + dx, c.z + dz)))) ring1.add(k);
  }
  for (const c of S) {
    const { x, z, ground } = c, k = key(x, z);
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }              // foundation
    if (y < FLOOR0) { g.set(x, y, z, "polished_granite"); continue; }        // plinth
    const o = (y - FLOOR0) % 4;                                             // 0 floor, 1-2 glazing, 3 spandrel/ceiling
    const storey = Math.floor((y - FLOOR0) / 4);
    if (o === 0) { g.set(x, y, z, storey === 0 ? "polished_granite" : "light_gray_concrete"); continue; }
    if (o === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (ring0.has(k)) {
      // frames: pilasters on the grid of each face (3-block bays), glass between
      const exX = !inS(x - 1, z, y) || !inS(x + 1, z, y), exZ = !inS(x, z - 1, y) || !inS(x, z + 1, y);
      const pil = exX && !exZ ? z % 3 === 0 : exZ && !exX ? x % 3 === 0 : (x % 3 === 0 || z % 3 === 0);
      if (pil) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, hash(x, y, z) % 5 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
    } else if (ring1.has(k) && o === 1) {
      // the air gap behind the glass: warm light on the floor in some bays
      const h = hash(x, y, z) % 100;
      if (h < 5) g.set(x, y, z, "glowstone");
      else if (h < 12) g.set(x, y, z, "lantern", { hanging: "false" });
    }
  }
}

// parapets on the edge of each tier's roof, one block above the roof deck
for (const c of foot.values()) {
  const t = T(c.x, c.z);
  if (NB.some(([dx, dz]) => !has(c.x + dx, c.z + dz) || T(c.x + dx, c.z + dz) !== t)) g.set(c.x, t, c.z, "white_concrete");
}

// roof plant on the core: two air-handling boxes in dark grey (so they read against the light roof), each placed at
// the first spot near the core's centre whose 1-block margin is still core roof, and not touching the other box
const core = [...foot.values()].filter((c) => T(c.x, c.z) === 68);
const cx = Math.round(core.reduce((s, c) => s + c.x, 0) / core.length), cz = Math.round(core.reduce((s, c) => s + c.z, 0) / core.length);
const boxOk = (x0, z0, w, d) => {
  for (let x = x0 - 2; x <= x0 + w + 1; x++) for (let z = z0 - 2; z <= z0 + d + 1; z++) if (T(x, z) !== 68) return false;
  return true;
};
const placed = [];
for (let r = 0; r <= 14 && placed.length < 2; r++) for (let dz = -r; dz <= r && placed.length < 2; dz++) for (let dx = -r; dx <= r && placed.length < 2; dx++) {
  if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
  const x0 = cx + dx - 3, z0 = cz + dz - 2;
  const clash = placed.some(([px, pz]) => Math.abs(px - x0) < 9 && Math.abs(pz - z0) < 7);
  if (clash || !boxOk(x0, z0, 6, 4)) continue;
  placed.push([x0, z0]);
  for (let x = x0; x < x0 + 6; x++) for (let z = z0; z < z0 + 4; z++) {
    g.set(x, 68, z, "gray_concrete"); g.set(x, 69, z, "gray_concrete");
    if (x > x0 && x < x0 + 5 && z > z0 && z < z0 + 3) g.set(x, 70, z, "iron_bars");
  }
}

// entrance: a recessed portico on the uphill face (highest ground, first in z then x), a door with a hanging lantern
// inside, pilaster posts either side and the spandrel as lintel
let door = null;
for (const c of foot.values()) {
  if (T(c.x, c.z) <= FLOOR0) continue;
  const out = NB.find(([dx, dz]) => !has(c.x + dx, c.z + dz));
  if (!out) continue;
  if (!door || c.ground > door.ground || (c.ground === door.ground && (c.z < door.z || (c.z === door.z && c.x < door.x)))) door = { ...c, out };
}
if (door) {
  const [ox, oz] = door.out, facing = DIR[`${ox},${oz}`], inward = [-ox, -oz];
  const [tx, tz] = oz !== 0 ? [1, 0] : [0, 1];
  for (const s of [-1, 1]) {
    const fx = door.x + s * tx, fz = door.z + s * tz;
    if (has(fx, fz)) for (const y of [FLOOR0 + 1, FLOOR0 + 2]) g.set(fx, y, fz, "white_concrete");
  }
  for (const [y, half] of [[FLOOR0 + 1, "lower"], [FLOOR0 + 2, "upper"]])
    g.set(door.x, y, door.z, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
  const ix = door.x + inward[0], iz = door.z + inward[1];
  if (has(ix, iz)) g.set(ix, FLOOR0 + 2, iz, "lantern", { hanging: "true" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_749960888.nbt");
