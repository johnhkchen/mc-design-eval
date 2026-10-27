// Way 269714220, Mt Eden / Eden Terrace edge of the CBD: a 1920s red-brick, three-storey shop-top block. Each cell's
// floors sit on its own ground (a basalt foundation below), the walls go on every face the lidar leaves open, and the
// roof steps through the 4, 8, 12 and 14 block tiers. Cream plaster string courses, head rows and coping; dark-oak
// shopfronts and doors on the street faces; lamps behind some glass; a roof plant room on the top tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269714220.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269714220.nbt";
const SIZE = [33, 26, 50];
const TIERS = [4, 8, 12, 14];   // the lidar roof heights, smoothed to these flat tiers

const BRICK = "bricks", PLASTER = "smooth_quartz", PLINTH = "polished_basalt", OAK = "dark_oak_planks", DECK = "smooth_stone", STONE = "stone_bricks";
const R = (block, state) => ({ block, state });
const key = (x, z) => `${x},${z}`;
const cellKey = (x, y, z) => `${x},${y},${z}`;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const pane = (alongX) => (alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const bayOf = (d, c) => (d === "N" || d === "S" ? c.x : c.z);   // the coordinate that runs along a face
const outer = (d, c) => ({ N: -c.z, S: c.z, W: -c.x, E: c.x })[d];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..32, z 0..49
const cell = new Map(cells.map(([x, z, g, h]) => [key(x, z), { x, z, g, h }]));
const at = (x, z) => cell.get(key(x, z));

// Massing: the median of each cell's 3x3 lidar roof, snapped to a tier. A roof within 2 blocks of its own ground is
// a courtyard or annex deck; anything else gets whole storeys above its ground, a parapet up to the tier.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const snap = (v) => TIERS.reduce((best, t) => (Math.abs(t - v) <= Math.abs(best - v) ? t : best));
for (const c of cell.values()) {
  const around = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) around.push(n.h); }
  const hm = median(around);
  c.deck = hm - c.g <= 2;
  if (c.deck) { c.T = c.g; c.top = c.g + 1; continue; }
  const hs = snap(hm);
  c.n = Math.min(3, Math.max(1, Math.floor((hs - c.g) / 4 + 0.4)));   // storeys of 4 blocks, at most three
  c.T = c.g + 4 * c.n;                          // wall top (the roof plate sits on T-1)
  c.p = Math.max(0, Math.min(2, hs - c.T));     // parapet up to the tier
  c.top = c.T + c.p;
}

// Open air from outside the building at (x, y, z): beyond the footprint, or above a neighbour's top.
const open = (x, y, z) => { const n = at(x, z); return !n || y >= n.top; };
const outwardOf = (x, z, y) => Object.keys(DIRS).find((d) => open(x + DIRS[d][0], y, z + DIRS[d][1]));

// The street skin: basalt plinth, plaster sill and head rows, brick piers, sash glass, dark-oak shopfronts.
function skin(c, x, y, z, out) {
  const alongX = out === "N" || out === "S";
  const pier = bayOf(out, { x, z }) % 3 === 0;
  if (y >= c.T) return R(y === c.top - 1 ? PLASTER : BRICK);   // parapet and coping
  const k = Math.floor((y - c.g) / 4), r = (y - c.g) % 4, ground = k === 0;
  if (r === 0) return R(ground ? PLINTH : PLASTER);             // base course, then string courses
  if (r === 3) return R(ground ? OAK : PLASTER);                // shop fascia, or one continuous head band
  if (pier) return R(ground ? OAK : BRICK);
  return R("glass_pane", pane(alongX));
}

// What stands at (x, y, z) before the decoration: foundation, deck, floor slabs, roof plate, the skin, or air.
function base(x, y, z) {
  const c = at(x, z); if (!c) return null;
  if (y < c.g) return R(PLINTH);
  if (c.deck) return y === c.g ? R(DECK) : null;
  if (y >= c.top) return null;
  const out = outwardOf(x, z, y);
  if (out) return skin(c, x, y, z, out);
  const slab = (y < c.T && (y - c.g) % 4 === 0) || y === c.T - 1;
  return slab ? R(DECK) : null;
}

const over = new Map();
const put = (x, y, z, role) => over.set(cellKey(x, y, z), role);

// Entrances: on the two longest runs of street-side window bays, the bay nearest the run's middle, outermost cell.
const entrances = [];
for (const d of Object.keys(DIRS)) {
  const cs = [...cell.values()].filter((c) => !c.deck && outwardOf(c.x, c.z, c.g + 1) === d);
  const bays = [...new Set(cs.map((c) => bayOf(d, c)))].sort((a, b) => a - b);
  const runs = [];
  for (const b of bays) { const last = runs.at(-1); if (last && last.at(-1) === b - 1) last.push(b); else runs.push([b]); }
  const run = runs.sort((a, b) => b.length - a.length)[0];
  if (!run || run.length < 5) continue;
  const mid = run[run.length >> 1];
  const [c] = cs.filter((q) => run.includes(bayOf(d, q)) && bayOf(d, q) % 3 !== 0)
    .sort((a, b) => Math.abs(bayOf(d, a) - mid) - Math.abs(bayOf(d, b) - mid) || outer(d, b) - outer(d, a));
  if (c) entrances.push({ d, c, len: run.length });
}
for (const { d, c } of entrances.sort((a, b) => b.len - a.len).slice(0, 2)) {
  const facing = { N: "south", S: "north", W: "east", E: "west" }[d];   // the door faces into the building
  const door = (half) => R("dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
  put(c.x, c.g + 1, c.z, door("lower"));
  put(c.x, c.g + 2, c.z, door("upper"));
  put(c.x, c.g + 3, c.z, R("dark_oak_slab", { type: "top", waterlogged: "false" }));   // canopy lip over the door
  const ix = c.x - DIRS[d][0], iz = c.z - DIRS[d][1];
  if (at(ix, iz) && !base(ix, c.g + 3, iz)) put(ix, c.g + 3, iz, R("lantern", { hanging: "true", waterlogged: "false" }));
}

// Warm lamps behind some window glass: lanterns on the ground floor, glowstone above, standing on the floor inside.
for (const c of cell.values()) {
  if (c.deck) continue;
  for (let k = 0; k < c.n; k++) {
    const y = c.g + 4 * k + 1, out = outwardOf(c.x, c.z, y);
    if (!out || bayOf(out, c) % 3 === 0 || (bayOf(out, c) + k) % 6 !== 2) continue;
    if (over.has(cellKey(c.x, y, c.z))) continue;
    const ix = c.x - DIRS[out][0], iz = c.z - DIRS[out][1];
    if (!at(ix, iz) || base(ix, y, iz)) continue;
    put(ix, y, iz, k === 0 ? R("lantern", { hanging: "false", waterlogged: "false" }) : R("glowstone"));
  }
}

// Roof plant room: a 4 x 3 stone box with iron-bar louvres and a coping, on the top tier, nearest its middle.
const TMAX = Math.max(...[...cell.values()].filter((c) => !c.deck).map((c) => c.T));
const topCells = [...cell.values()].filter((c) => !c.deck && c.T === TMAX);
const topSet = new Set(topCells.map((c) => key(c.x, c.z)));
const cxm = topCells.reduce((s, c) => s + c.x, 0) / topCells.length, czm = topCells.reduce((s, c) => s + c.z, 0) / topCells.length;
let plant = null;
for (let x0 = 0; x0 <= SIZE[0] - 4; x0++) for (let z0 = 0; z0 <= SIZE[2] - 3; z0++) {
  let fits = true;
  for (let dz = 0; dz < 3 && fits; dz++) for (let dx = 0; dx < 4 && fits; dx++) fits = topSet.has(key(x0 + dx, z0 + dz));
  if (!fits) continue;
  const d2 = (x0 + 1.5 - cxm) ** 2 + (z0 + 1 - czm) ** 2;
  if (!plant || d2 < plant.d2) plant = { x0, z0, d2 };
}
if (plant) {
  const { x0, z0 } = plant;
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 4; dx++) {
    const x = x0 + dx, z = z0 + dz, edgeNS = dz === 0 || dz === 2;
    put(x, TMAX, z, R(STONE));
    put(x, TMAX + 1, z, edgeNS && (dx === 1 || dx === 2)
      ? R("iron_bars", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" })
      : R(STONE));
    put(x, TMAX + 2, z, R(PLASTER));
  }
}

// Anything that stands on nothing gets a brick under it (the skin's courses can step past a neighbour's top).
const role = (x, y, z) => over.get(cellKey(x, y, z)) ?? base(x, y, z);
for (let y = 1; y < SIZE[1]; y++) for (const c of cell.values()) {
  if (base(c.x, y, c.z) && !role(c.x, y - 1, c.z) && y - 1 >= c.g) put(c.x, y - 1, c.z, R(BRICK));
}

const g = new Voxels(SIZE);
for (const c of cell.values()) for (let y = 0; y < SIZE[1]; y++) {
  const r = role(c.x, y, c.z);
  if (r) g.set(c.x, y, c.z, r.block, r.state);
}
const stats = g.save(OUT);
console.log(`way_269714220: ${stats.blocks} blocks, ${stats.palette} palette entries, top ${TMAX + 3}, plant room at ${plant ? `${plant.x0},${plant.z0}` : "none"}`);
