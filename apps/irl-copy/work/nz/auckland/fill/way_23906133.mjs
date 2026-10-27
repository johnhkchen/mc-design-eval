// Architecture East, Auckland: a 1980s concrete-frame office block. Pale precast spandrels and light-grey concrete piers,
// bronze-grey glass, a dark andesite plinth and a shopfront storey at street level. The lidar roof is smoothed into four
// flat tiers (12, 20, 28, 36) and a 40 core with a plant room on top. Storeys are 4 blocks on absolute 4-block lines,
// so every floor slab and spandrel lines up across the sloping site.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23906133.cells.json", "utf8"));
const W = 105, D = 79, H = 55;
const PLINTH = "polished_andesite", GLASS = "gray_stained_glass_pane", PIER = "light_gray_concrete", SPANDREL = "white_concrete";
const CORNICE = "smooth_stone", ROOF = "gray_concrete", FLOOR = "light_gray_concrete", DOOR = "glass";
const TIERS = [[15, 12], [23, 20], [33, 28], [38, 36]];   // smoothed lidar roof -> flat tier top; above the last, the 40 core
const BAY = 6;                                             // interior structural grid: every floor slab rests on a column
const K = (x, z) => `${x},${z}`;
// [side, dx, dz, run]: run is the axis the wall runs along on that side
const DIRS = [["north", 0, -1, "x"], ["south", 0, 1, "x"], ["east", 1, 0, "z"], ["west", -1, 0, "z"]];
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const fp = new Map();
for (const [x, z, g, R] of cells) fp.set(K(x, z), { x, z, g, R });
const at2 = (x, z) => fp.get(K(x, z));

// Smooth the lidar roof over a 5 x 5 window of footprint cells, then snap it to a tier. A cell is never shorter
// than one storey above its own ground.
for (const c of fp.values()) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = at2(c.x + dx, c.z + dz); if (o) { s += o.R; n++; } }
  c.S = s / n;
  const tier = (TIERS.find(([lim]) => c.S <= lim) ?? [, 40])[1];
  c.T = Math.max(tier, Math.ceil((c.g + 4) / 4) * 4);
}
const maxT = Math.max(...[...fp.values()].map((c) => c.T));

// The sides of a cell at height y that face open air: off the footprint, or beside a column that stands lower than y.
const openSides = (c, y) => DIRS.filter(([, dx, dz]) => { const o = at2(c.x + dx, c.z + dz); return !o || y >= o.T; });
// Depth in cells from the outside edge (1 = the wall itself), so the warm lamps sit just behind the glass.
const depth = new Map(), queue = [];
for (const c of fp.values()) if (openSides(c, 0).length) { depth.set(K(c.x, c.z), 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(K(c.x, c.z));
  for (const [, dx, dz] of DIRS) { const o = at2(c.x + dx, c.z + dz); if (o && !depth.has(K(o.x, o.z))) { depth.set(K(o.x, o.z), d + 1); queue.push(o); } }
}

// The whole volume first (so neighbours can be read for pane connections), then written out in one pass.
const G = new Array(W * H * D).fill(null);
const idx = (x, y, z) => (y * D + z) * W + x;
const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D;
const put = (x, y, z, b, run = null) => { if (inside(x, y, z)) G[idx(x, y, z)] = { b, run }; };
const get = (x, y, z) => (inside(x, y, z) ? G[idx(x, y, z)] : null);

for (const c of fp.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) put(x, y, z, PLINTH);                  // foundation: solid up to this cell's ground
  const pillar = x % BAY === 0 && z % BAY === 0;
  for (let y = g; y < T; y++) {
    const open = openSides(c, y);
    if (!open.length) {                                              // interior: air behind the glass, slabs, a roof cap
      if (pillar) put(x, y, z, PIER);
      else if (y === T - 1) put(x, y, z, ROOF);
      else if (y % 4 === 0) put(x, y, z, FLOOR);
      continue;
    }
    const run = open[0][3];
    const pier = open.length > 1 || (run === "x" ? x : z) % 3 === 0;   // corners and every third bay are piers
    const row = y % 4, storey = Math.floor(y / 4);
    if (y === T - 1) put(x, y, z, CORNICE);                          // cornice on the top of the wall
    else if (y === g) put(x, y, z, PLINTH);                          // base course on the ground line
    else if (row === 0 || row === 3) put(x, y, z, storey === 0 ? CORNICE : SPANDREL);
    else put(x, y, z, pier ? PIER : GLASS, run);
  }
  // a parapet on the outer edge, and a plant room over the top tier (solid, roof-capped); two cells in from the edge so
  // the core's thin crown reads as a block rather than a spike
  if (DIRS.some(([, dx, dz]) => !at2(x + dx, z + dz))) put(x, T, z, CORNICE);
  if (T === maxT && maxT >= 36 && depth.get(K(x, z)) >= 2) for (let y = T; y < T + 4; y++) put(x, y, z, y === T + 3 ? ROOF : PIER);
}

// Entrance: the lowest-ground street frontage on the south side (else any lowest run), three bays wide with a glass
// door in the centre bay and a lintel over all three. The side bays keep their piers and glazing.
const cand = [...fp.values()].filter((c) => openSides(c, c.g).length);
const gMin = Math.min(...cand.map((c) => c.g));
const low = cand.filter((c) => c.g === gMin);
const south = low.filter((c) => openSides(c, c.g).some(([side]) => side === "south"));
const front = (south.length ? south : low).sort((a, b) => a.x - b.x || a.z - b.z);
const door = front[Math.floor(front.length / 2)];
const doorRun = openSides(door, door.g)[0][3];
for (let i = -1; i <= 1; i++) {
  const ex = doorRun === "x" ? door.x + i : door.x, ez = doorRun === "x" ? door.z : door.z + i;
  if (!at2(ex, ez)) continue;
  put(ex, door.g + 2, ez, CORNICE);
  if (i === 0) { put(ex, door.g, ez, DOOR); put(ex, door.g + 1, ez, DOOR); }
}

// Warm lamps on the inside of some windows, one cell back from the glass with the interior air between.
for (const c of fp.values()) for (let y = c.g; y < c.T; y++) {
  const cell = get(c.x, y, c.z);
  if (!cell || cell.b !== GLASS) continue;
  const out = openSides(c, y)[0];
  const h = hash(c.x, y, c.z);
  const lamp = h % 9 === 0 ? "glowstone" : h % 41 === 0 ? "shroomlight" : null;
  const ix = c.x - out[1], iz = c.z - out[2], inner = at2(ix, iz);
  if (lamp && inner && inner.T > y && !get(ix, y, iz)) put(ix, y, iz, lamp);
}

const v = new Voxels([W, H, D]);
for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const cell = get(x, y, z);
  if (!cell) continue;
  let st = null;
  if (cell.b === GLASS) {                                            // panes join their neighbours along the wall's run
    const link = (dx, dz) => (get(x + dx, y, z + dz) ? "true" : "false");
    st = cell.run === "x"
      ? { north: "false", south: "false", east: link(1, 0), west: link(-1, 0), waterlogged: "false" }
      : { north: link(0, -1), south: link(0, 1), east: "false", west: "false", waterlogged: "false" };
  }
  v.set(x, y, z, cell.b, st);
}
console.log(v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23906133.nbt"));
