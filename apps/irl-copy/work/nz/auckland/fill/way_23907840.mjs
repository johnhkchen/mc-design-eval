// Formery East, Auckland (way 23907840): a 1970s concrete-frame office block, 13 storeys with a plant core. Pale precast
// piers and white spandrels, tinted glazing in between, a dark andesite base at street level with a glazed lobby, and a
// smooth stone parapet. The lidar roof is smoothed over 5 x 5 cells and snapped to flat tiers (8, 20, 36, 52, 58): the
// main slab tops out at 52 (13 storeys of 4 blocks), the core at 58 (a plant room), and the low wings step down. Storey
// lines sit on absolute 4-block lines so every slab and spandrel lines up across the sloping site.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907840.cells.json", "utf8"));
const W = 38, H = 70, D = 35;
const PLINTH = "polished_andesite", PIER = "light_gray_concrete", SPANDREL = "white_concrete", GLASS = "gray_stained_glass_pane";
const CORNICE = "smooth_stone", ROOF = "gray_concrete", FLOOR = "light_gray_concrete", DOOR = "glass", PLANT = "iron_block";
const BAY = 6;                                             // column grid: a pier every sixth cell on each facade
const K = (x, z) => `${x},${z}`;
// [side, dx, dz, run]: run is the axis the wall runs along on that side
const DIRS = [["north", 0, -1, "x"], ["south", 0, 1, "x"], ["east", 1, 0, "z"], ["west", -1, 0, "z"]];
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const fp = new Map();
for (const [x, z, g, R] of cells) fp.set(K(x, z), { x, z, g, R });
const at2 = (x, z) => fp.get(K(x, z));

// Smooth the lidar roof over a 5 x 5 window, then snap it to a tier. A cell is never shorter than one storey above its
// own ground, and tiers end on a storey line (the core's 58 is its plant room).
for (const c of fp.values()) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = at2(c.x + dx, c.z + dz); if (o) { s += o.R; n++; } }
  c.S = s / n;
  const tier = c.S >= 55 ? 58 : c.S >= 49 ? 52 : c.S >= 30 ? 36 : c.S >= 12 ? 20 : 8;
  c.T = Math.max(tier, Math.ceil((c.g + 4) / 4) * 4);
}

// The sides of a cell at height y that face open air: off the footprint, or beside a column that stands lower than y.
const openSides = (c, y) => DIRS.filter(([, dx, dz]) => { const o = at2(c.x + dx, c.z + dz); return !o || y >= o.T; });

// The entrance: the south-facing frontage nearest the middle of the footprint, three bays wide, a glass door in the
// centre bay and a lintel over all three.
const southFace = [...fp.values()].filter((c) => openSides(c, c.g).some(([side]) => side === "south"));
const meanX = southFace.reduce((s, c) => s + c.x, 0) / southFace.length;
const doorCell = southFace.sort((a, b) => Math.abs(a.x - meanX) - Math.abs(b.x - meanX) || b.z - a.z)[0];

// The whole volume first (so neighbours can be read for pane connections and lamps), then written out in one pass.
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
      else if (y % 4 === 0 && y > 0) put(x, y, z, FLOOR);
      continue;
    }
    const onNS = open.some(([side]) => side === "north" || side === "south");
    const onEW = open.some(([side]) => side === "east" || side === "west");
    const run = onNS ? "x" : "z";
    const isPier = pillar || (onNS && x % BAY === 0) || (onEW && z % BAY === 0);
    const ground = y < 4;
    if (y === T - 1) { put(x, y, z, CORNICE); continue; }             // parapet on the outer edge
    if (ground) {                                                    // street level: base course, lobby glass, lintel
      if (y === g) put(x, y, z, PLINTH);
      else if (y === 3) put(x, y, z, CORNICE);
      else if (isPier) put(x, y, z, PLINTH);
      else put(x, y, z, GLASS, run);
    } else if (y % 4 === 0 || y % 4 === 3) put(x, y, z, isPier ? PIER : SPANDREL);  // storey lines: spandrel bands
    else put(x, y, z, isPier ? PIER : GLASS, run);
  }
  // roof plant: a 3 x 3 box, two blocks high, on the main slab's roof cap (interior cells only, one per 12 x 12 bay)
  if (!openSides(c, T - 1).length && x % 12 >= 2 && x % 12 <= 4 && z % 12 >= 2 && z % 12 <= 4 && T === 52) {
    put(x, T, z, PLANT); put(x, T + 1, z, PLANT);
  }
}

// Entrance: a glass door in the middle of the south frontage, a lintel over the three bays around it.
for (let i = -1; i <= 1; i++) {
  const ex = doorCell.x + i, ez = doorCell.z;
  const c = at2(ex, ez);
  if (!c) continue;
  put(ex, 3, ez, CORNICE);
  if (i === 0) { put(ex, c.g, ez, DOOR); put(ex, c.g + 1, ez, DOOR); put(ex, c.g + 2, ez, DOOR); }
}

// Warm lamps behind some upper-floor windows, one cell back from the glass with the interior air between.
for (const c of fp.values()) for (let y = Math.max(c.g, 4); y < c.T; y++) {
  const cell = get(c.x, y, c.z);
  if (!cell || cell.b !== GLASS) continue;
  const out = openSides(c, y)[0];
  if (!out) continue;
  const h = hash(c.x, y, c.z);
  const lamp = h % 11 === 0 ? "glowstone" : h % 53 === 0 ? "shroomlight" : null;
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
console.log(v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907840.nbt"));
