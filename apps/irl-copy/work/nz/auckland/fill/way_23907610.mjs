// Scene Three, Auckland: a late-1990s glass-curtain office tower on a stone-clad podium. Lidar roof is about 60 blocks
// (50 m) above its lowest ground: a 56 block main mass, a 60 crown, mid setbacks at 48, 36 and 24, and a 3-storey wing
// at 12 and 16. Blue-green glass between dark grey mullions and white precast spandrels; the podium is stone with a
// shopfront storey on the street. Storeys are 4 blocks on absolute 4-block lines, so every floor slab and spandrel
// lines up across the sloping site. The volume is a shell: glass on the outside, air behind it, a slab per storey, and
// structural piers on a 6-block grid so every slab rests on something.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907610.cells.json", "utf8"));
const W = 80, D = 79, H = 72;
const FOUND = "stone_bricks", PODIUM = "stone_bricks", PLINTH = "polished_andesite", GLASS = "cyan_stained_glass_pane";
const MULLION = "iron_block", SPANDREL = "white_concrete", PIER = "light_gray_concrete", FLOOR = "light_gray_concrete";
const CORNICE = "smooth_quartz", ROOF = "smooth_stone", PLANT = "light_gray_concrete", PODIUM_SPANDREL = "smooth_stone";
// smoothed lidar roof -> flat tier top (blocks above y 0); a cell is never shorter than one storey above its own ground
const TIERS = [[14, 12], [18, 16], [26, 24], [38, 36], [50, 48], [57, 56], [Infinity, 60]];
const PODIUM_TOP = 24;                                              // at or below this, the cell is stone podium
const BAY = 6;                                                      // interior structural grid: every floor slab rests on a column
const K = (x, z) => `${x},${z}`;
// [side, dx, dz, run]: run is the axis the wall runs along on that side
const DIRS = [["north", 0, -1, "x"], ["south", 0, 1, "x"], ["east", 1, 0, "z"], ["west", -1, 0, "z"]];
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const fp = new Map();
for (const [x, z, g, R] of cells) fp.set(K(x, z), { x, z, g, R });
const at2 = (x, z) => fp.get(K(x, z));

// Smooth the lidar roof over a 5 x 5 window of footprint cells, then snap it to a tier.
for (const c of fp.values()) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = at2(c.x + dx, c.z + dz); if (o) { s += o.R; n++; } }
  c.S = s / n;
  const tier = TIERS.find(([lim]) => c.S <= lim)[1];
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
  const podium = T <= PODIUM_TOP;
  for (let y = 0; y < g; y++) put(x, y, z, FOUND);                  // foundation: solid up to this cell's ground
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
    const pier = open.length > 1 || (run === "x" ? x : z) % 3 === 0; // corners and every third bay are mullions
    const row = y % 4, storey = Math.floor(y / 4);
    if (y === T - 1) put(x, y, z, CORNICE);                          // cornice on the top of the wall
    else if (y === g) put(x, y, z, PLINTH);                          // base course on the ground line
    else if (row === 0) put(x, y, z, podium ? PODIUM_SPANDREL : SPANDREL);
    else if (row === 3 && storey > 0) put(x, y, z, podium ? PODIUM : PIER);   // transom above the first storey
    else if (pier) put(x, y, z, podium ? PODIUM : MULLION);
    else put(x, y, z, GLASS, run);
  }
  // a parapet on the outer edge, and a plant room over the top tier (solid, roof-capped); two cells in from the edge so
  // the crown reads as a block rather than a spike
  if (DIRS.some(([, dx, dz]) => !at2(x + dx, z + dz))) put(x, T, z, CORNICE);
  if (T === maxT && depth.get(K(x, z)) >= 2 && (x + z) % 2 === 0) for (let y = T; y < T + 3; y++) put(x, y, z, y === T + 2 ? ROOF : PLANT);
}

// Entrance: the lowest-ground podium frontage on the south side (else any lowest run), three bays wide with a glass
// door in the centre bay and a lintel over all three. The side bays keep their mullions and glazing.
const cand = [...fp.values()].filter((c) => c.T <= PODIUM_TOP && openSides(c, c.g).length);
const gMin = Math.min(...cand.map((c) => c.g));
const low = cand.filter((c) => c.g === gMin);
const south = low.filter((c) => openSides(c, c.g).some(([side]) => side === "south"));
const front = (south.length ? south : low).sort((a, b) => a.x - b.x || a.z - b.z);
const door = front[Math.floor(front.length / 2)];
const doorRun = openSides(door, door.g)[0][3];
const outward = openSides(door, door.g)[0];
const doorFacing = outward[0];
for (let i = -1; i <= 1; i++) {
  const ex = doorRun === "x" ? door.x + i : door.x, ez = doorRun === "x" ? door.z : door.z + i;
  if (!at2(ex, ez)) continue;
  put(ex, door.g + 2, ez, CORNICE);                                  // lintel over the three bays
  if (i === 0) { put(ex, door.g, ez, "DOOR_LOWER"); put(ex, door.g + 1, ez, "DOOR_UPPER"); }
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
  if (cell.b === "DOOR_LOWER" || cell.b === "DOOR_UPPER") {
    const half = cell.b === "DOOR_LOWER" ? "lower" : "upper";
    v.set(x, y, z, "dark_oak_door", { facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
    continue;
  }
  let st = null;
  if (cell.b === GLASS) {                                            // panes join their neighbours along the wall's run
    const link = (dx, dz) => (get(x + dx, y, z + dz) ? "true" : "false");
    st = cell.run === "x"
      ? { north: "false", south: "false", east: link(1, 0), west: link(-1, 0), waterlogged: "false" }
      : { north: link(0, -1), south: link(0, 1), east: "false", west: "false", waterlogged: "false" };
  }
  v.set(x, y, z, cell.b, st);
}
console.log(v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907610.nbt"));
