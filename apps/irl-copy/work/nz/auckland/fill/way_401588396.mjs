// Tasman Building (way 401588396), Mt Eden / Newton edge, Auckland: a 1970s precast-concrete office block.
// The massing follows the lidar roof record: a 10-storey tower (roof 40), a 9-storey lower block on the south-west
// (roof 36), a 5-storey wing along the north-west (roof 20), and a plant penthouse (roof 44) set in from the tower's edges.
// Storey lines sit on absolute y = 4k (slab, two glass rows, spandrel), so every tier stacks on the one below; the
// foundation fills up to each cell's ground, and the downhill (east) side shows its full height. Ground floor: stone base,
// shopfront glazing, two entrances with canopies. Interiors are air behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588396.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588396.nbt";
const W = 31, H = 56, D = 32;

const M = {
  base: "stone_bricks", slab: "light_gray_concrete", wall: "white_concrete", glass: "cyan_stained_glass",
  roof: "smooth_stone", parapet: "light_gray_concrete", canopy: "stone_brick_slab", door: "dark_oak_door",
  plant: "light_gray_concrete", grille: "iron_bars",
};
const DIR_LIST = [["east", [1, 0]], ["west", [-1, 0]], ["south", [0, 1]], ["north", [0, -1]]];
const OPP = { east: "west", west: "east", south: "north", north: "south" };

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, ground, roof] of JSON.parse(readFileSync(CELLS, "utf8"))) fp.set(key(x, z), { ground, roof });
const inside = (x, z) => fp.has(key(x, z));
// solid up to the next storey line at or above the ground (the foundation, and a stone base course)
const base = (x, z) => { const g = fp.get(key(x, z)).ground; return g === 0 ? 0 : 4 * Math.ceil(g / 4); };

// Roof tiers: each lidar roof height classed, then a 3x3 vote so the tiers come out as flat blocks, not noise
const tierOf = (r) => (r < 30 ? 20 : r < 38 ? 36 : r < 42 ? 40 : 44);
const rawTier = new Map([...fp].map(([k, c]) => [k, tierOf(c.roof)]));
const smooth = new Map();
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number), votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const t = rawTier.get(key(x + dx, z + dz)); if (t === undefined) continue;
    votes.set(t, (votes.get(t) ?? 0) + (dx || dz ? 1 : 1.5));
  }
  let best = rawTier.get(k), bw = -1;
  for (const [t, w] of votes) if (w > bw || (w === bw && t > best)) { best = t; bw = w; }
  smooth.set(k, best);
}
// the penthouse: 44-tier cells at least r from any cell below it, so it steps in from the tower's edges
const core = (r) => {
  const s = new Set();
  for (const [k, t] of smooth) {
    if (t !== 44) continue;
    const [x, z] = k.split(",").map(Number);
    let ok = true;
    for (let dz = -r; dz <= r && ok; dz++) for (let dx = -r; dx <= r && ok; dx++) if (smooth.get(key(x + dx, z + dz)) !== 44) ok = false;
    if (ok) s.add(k);
  }
  return s;
};
let pent = core(2); if (pent.size < 8) pent = core(1);
const T = new Map();
for (const [k, t] of smooth) T.set(k, pent.has(k) ? 44 : t === 44 ? 40 : t);
const top = (x, z) => T.get(key(x, z)) ?? 0;

// a face is open when the cell beside it is outside the footprint, or stands lower (air above its roof)
const faceOpen = (x, y, z, dx, dz) => !inside(x + dx, z + dz) || y >= top(x + dx, z + dz);
const exposed = (x, y, z) => DIR_LIST.some(([, [dx, dz]]) => faceOpen(x, y, z, dx, dz));
const edge = (x, z, t) => DIR_LIST.some(([, [dx, dz]]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < t);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glassAt = new Set();
const at3 = (x, y, z) => `${x},${y},${z}`;

// the facade of a storey: y%4 0 = slab/string course, 1-2 = glass rows (piers every third bay), 3 = spandrel
function facade(x, y, z) {
  const ph = y % 4;
  if (ph === 0) return put(x, y, z, y === 0 ? M.base : M.slab);
  if (ph === 3) return put(x, y, z, M.wall);
  const alongZ = faceOpen(x, y, z, 1, 0) || faceOpen(x, y, z, -1, 0);
  const pier = (alongZ ? z : x) % 3 === 0;
  if (pier) return put(x, y, z, M.wall);
  glassAt.add(at3(x, y, z));
  put(x, y, z, M.glass);
}

for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number), t = top(x, z), L = base(x, z);
  for (let y = 0; y < t; y++) {
    if (y < L) put(x, y, z, M.base);
    else if (y === t - 1) put(x, y, z, M.roof);
    else if (exposed(x, y, z)) facade(x, y, z);
    else if (y % 4 === 0) put(x, y, z, M.slab);
  }
  if (edge(x, z, t)) put(x, t, z, M.parapet);
}

// entrances: ground-level faces on the low side, a door at y 1-2 under a canopy on posts
const cand = [];
for (const [k, c] of fp) {
  if (c.ground !== 0) continue;
  const [x, z] = k.split(",").map(Number);
  for (const [name, [dx, dz]] of DIR_LIST) {
    if (inside(x + dx, z + dz)) continue;
    const lx = -dz, lz = dx;
    if (!inside(x + lx, z + lz) || !inside(x - lx, z - lz)) continue;
    cand.push({ x, z, name, dx, dz, lx, lz });
  }
}
cand.sort((a, b) => (b.x + b.z) - (a.x + a.z));
const doors = cand.length ? [cand[0]] : [];
const second = cand.find((e) => doors.every((d) => Math.abs(d.x - e.x) + Math.abs(d.z - e.z) >= 8));
if (second) doors.push(second);
for (const e of doors) {
  const facing = OPP[e.name];
  glassAt.delete(at3(e.x, 1, e.z)); glassAt.delete(at3(e.x, 2, e.z));
  put(e.x, 1, e.z, M.door, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(e.x, 2, e.z, M.door, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const d of [1, 2]) for (const k of [-1, 0, 1]) {
    const cx = e.x + e.dx * d + e.lx * k, cz = e.z + e.dz * d + e.lz * k;
    if (!inside(cx, cz)) put(cx, 3, cz, M.canopy, { type: "bottom", waterlogged: "false" });
  }
  for (const k of [-1, 1]) {
    const px = e.x + e.dx * 2 + e.lx * k, pz = e.z + e.dz * 2 + e.lz * k;
    if (!inside(px, pz)) for (let y = 0; y < 3; y++) put(px, y, pz, M.parapet);
  }
}

// roof plant: two 3x2 boxes on the 40 roof, away from every edge and the penthouse, screened on top
let boxes = 0;
const boxed = new Set();
for (const [k] of fp) {
  if (boxes >= 2) break;
  const [x0, z0] = k.split(",").map(Number);
  let ok = true;
  for (let dz = -1; dz <= 2 && ok; dz++) for (let dx = -1; dx <= 3 && ok; dx++) if (top(x0 + dx, z0 + dz) !== 40) ok = false;
  if (!ok) continue;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) boxed.add(key(x0 + dx, z0 + dz));
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) {
    put(x0 + dx, 40, z0 + dz, M.plant); put(x0 + dx, 41, z0 + dz, M.plant); put(x0 + dx, 42, z0 + dz, M.grille);
  }
  boxes++;
}

// warm lights: a lamp standing on the floor slab just inside some lower glass rows, the air gap behind the glass
let lamps = 0;
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number), t = top(x, z);
  for (let y = 1; y < t - 1; y += 4) {
    if (y < base(x, z) || (x * 73 + z * 151 + y * 37) % 7 !== 0) continue;
    for (const [, [dx, dz]] of DIR_LIST) {
      if (!glassAt.has(at3(x, y, z)) || !faceOpen(x, y, z, dx, dz)) continue;
      const ix = x - dx, iz = z - dz;
      if (!inside(ix, iz) || g.get(ix, y, iz) || !g.get(ix, y - 1, iz)) continue;
      const pick = (x + z + y) % 3;
      if (pick === 0) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      else put(ix, y, iz, pick === 1 ? "glowstone" : "shroomlight");
      lamps++; break;
    }
  }
}

// the parapet and roof are part of the build (see edge()); the counts go to the log so the massing is checkable
const tiers = {};
for (const [, t] of T) tiers[t] = (tiers[t] ?? 0) + 1;
const saved = g.save(OUT);
console.log(JSON.stringify({ tiers, penthouse: pent.size, doors: doors.length, plantBoxes: boxes, lamps, boxedCells: boxed.size, ...saved }));
