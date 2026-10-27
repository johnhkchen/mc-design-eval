// Auckland University Press (Grafton, lidar roof ~40 above its lowest ground): a 1970s concrete-frame office and
// teaching block, nine storeys on a stepped massing. Terracotta spandrels and light precast piers in bays of three,
// grey tinted glazing, a dark andesite base course and a smooth-stone string course and cornice. The lidar roof is
// smoothed (median over 5 x 5) into flat tiers at 24, 28, 32, 36 and a 40 core with a plant room. A raw roof of 9 or
// less is the lidar's podium fringe: one or two storeys, not a tower. Storeys sit on absolute 4-block lines, so the
// floors line up across the slope; the solid core and the foundation below each cell's ground carry everything above.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907825.cells.json", "utf8"));
const W = 48, H = 52, D = 42;
const BASE = "polished_andesite", PIER = "light_gray_concrete", SPANDREL = "terracotta", BAND = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane", FLOOR = "light_gray_concrete", ROOF = "gray_concrete", CORE = "light_gray_concrete";
const PLANT = "stone_bricks", AC = "iron_block", CANOPY = "stone_bricks", DOOR = "dark_oak_door";
const TIERS = [[37.5, 40], [34.5, 36], [30.5, 32], [25.5, 28]];   // smoothed roof -> flat tier top; below the last, 24
const K = (x, z) => `${x},${z}`;
// [side, dx, dz, run]: run is the axis the wall runs along on that side
const DIRS = [["north", 0, -1, "x"], ["south", 0, 1, "x"], ["east", 1, 0, "z"], ["west", -1, 0, "z"]];
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];

const fp = new Map();
for (const [x, z, g, R] of cells) fp.set(K(x, z), { x, z, g, R });
const at2 = (x, z) => fp.get(K(x, z));

// Tier per cell: the lidar's podium fringe (raw roof 9 or less) is one or two storeys; every other cell takes the
// median of its 5 x 5 window (podium cells excluded), snapped to a tier, and is never shorter than one storey above
// its own ground.
for (const c of fp.values()) {
  const base = Math.ceil((c.g + 4) / 4) * 4;
  if (c.R <= 9) { c.T = base; continue; }
  const w = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = at2(c.x + dx, c.z + dz); if (o && o.R > 9) w.push(o.R); }
  const S = w.length ? median(w) : c.R;
  const tier = (TIERS.find(([lim]) => S >= lim) ?? [, 24])[1];
  c.T = Math.max(tier, base);
}

// Active at y: standing above its own ground and below its tier. A side is open to air at y when the neighbour does
// not reach y (missing, or lower than y).
const active = (c, y) => y >= c.g && y < c.T;
const openSides = (c, y) => DIRS.filter(([, dx, dz]) => { const o = at2(c.x + dx, c.z + dz); return !o || y >= o.T; });

// Depth in cells from the open air at each height (1 = the facade): the glazing ring is 1, the air behind it is 2,
// and everything 3 or deeper is solid core.
const depthAt = [];
for (let y = 0; y < H; y++) {
  const depth = new Map(), queue = [];
  for (const c of fp.values()) if (active(c, y) && openSides(c, y).length) { depth.set(K(c.x, c.z), 1); queue.push(c); }
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i], d = depth.get(K(c.x, c.z));
    for (const [, dx, dz] of DIRS) {
      const o = at2(c.x + dx, c.z + dz);
      if (o && active(o, y) && !depth.has(K(o.x, o.z))) { depth.set(K(o.x, o.z), d + 1); queue.push(o); }
    }
  }
  depthAt.push(depth);
}
const depthOf = (c, y) => depthAt[y].get(K(c.x, c.z)) ?? 3;

// The whole volume first (so neighbours can be read for pane connections), then written out in one pass.
const G = new Array(W * H * D).fill(null);
const idx = (x, y, z) => (y * D + z) * W + x;
const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D;
const put = (x, y, z, b, extra = {}) => { if (inside(x, y, z)) G[idx(x, y, z)] = { b, ...extra }; };
const get = (x, y, z) => (inside(x, y, z) ? G[idx(x, y, z)] : null);

// Entrance first, so the facade pass can leave its bays glazed: the lowest street frontage, the east side if it has
// one, with the door in the middle of its run.
const gMin = Math.min(...[...fp.values()].filter((c) => openSides(c, c.g).length).map((c) => c.g));
const low = [...fp.values()].filter((c) => c.g === gMin && openSides(c, c.g).length);
const east = low.filter((c) => openSides(c, c.g).some(([side]) => side === "east"));
const front = (east.length ? east : low).sort((a, b) => a.z - b.z || a.x - b.x);
const door = front[Math.floor(front.length / 2)];
const [doorSide, , , doorRun] = openSides(door, door.g)[0];
const bay = (i) => (doorRun === "x" ? [door.x + i, door.z] : [door.x, door.z + i]);
const entranceBay = new Set();
for (let i = -1; i <= 1; i++) { const [bx, bz] = bay(i); if (at2(bx, bz)) entranceBay.add(K(bx, bz)); }

for (const c of fp.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) put(x, y, z, BASE);                    // foundation: solid up to this cell's ground
  for (let y = g; y < T; y++) {
    const d = depthOf(c, y), row = y % 4, storey = Math.floor(y / 4), top = y === T - 1;
    if (d === 1) {
      const open = openSides(c, y), run = open[0][3];
      const along = run === "x" ? x : z;
      const pier = open.length > 1 || along % 3 === 0;
      if (y === g) put(x, y, z, BASE);                                // base course on the ground line
      else if (top) put(x, y, z, BAND);                               // cornice on the top of the wall
      else if (row === 0) put(x, y, z, storey === 0 ? BASE : SPANDREL);
      else if (row === 3) put(x, y, z, PIER);                         // the storey line is the concrete band
      else if (storey === 0 && entranceBay.has(K(x, z))) put(x, y, z, GLASS, { run });   // shopfront
      else put(x, y, z, pier ? PIER : GLASS, { run });
    } else if (d === 2) {
      if (top || y === g) put(x, y, z, top ? ROOF : FLOOR);
      else if (row === 0 || row === 3) put(x, y, z, FLOOR);           // the slab each storey stands on
      else if (row === 1 && hash(x, y, z) % 8 === 0) put(x, y, z, hash(x, 0, z) % 2 ? "glowstone" : "shroomlight");
    } else {
      put(x, y, z, top ? ROOF : CORE);
    }
  }
  // a parapet on the outer edge of the tier, and roof plant: a plant room on the 40 core, air-conditioning boxes on the
  // lower roofs. Each sits on the roof below it.
  if (openSides(c, T).length && depthOf(c, T - 1) === 1) put(x, T, z, BAND);
  if (T === 40 && depthOf(c, 39) >= 3 && x % 7 >= 2 && x % 7 <= 4 && z % 7 >= 2 && z % 7 <= 4) {
    put(x, 40, z, PLANT); put(x, 41, z, PLANT);
  } else if (T < 40 && depthOf(c, T - 1) >= 3 && x % 6 === 3 && z % 6 === 3) put(x, T, z, AC);
}

// The entrance: a dark oak door in the middle bay, glazed bays either side, stone pilasters and a lintel-canopy
// over the three. The footprint fills the volume with no margin, so the canopy is flush with the facade (a
// projecting one would fall outside the grid).
for (let i = -1; i <= 1; i++) {
  const [bx, bz] = bay(i);
  if (!at2(bx, bz)) continue;
  for (let y = door.g + 1; y <= door.g + 2; y++) put(bx, y, bz, GLASS, { run: doorRun });
  if (i === 0) {
    const st = { facing: doorSide, hinge: "left", open: "false", powered: "false" };
    put(bx, door.g, bz, DOOR, { state: { ...st, half: "lower" } });
    put(bx, door.g + 1, bz, DOOR, { state: { ...st, half: "upper" } });
  }
  put(bx, door.g + 3, bz, CANOPY);
}
for (const i of [-2, 2]) {
  const [bx, bz] = bay(i);
  if (!at2(bx, bz)) continue;
  for (let y = door.g; y <= door.g + 3; y++) put(bx, y, bz, CANOPY);
}

const v = new Voxels([W, H, D]);
for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const cell = get(x, y, z);
  if (!cell) continue;
  let st = cell.state ?? null;
  if (cell.b === GLASS && cell.run) {                                 // panes join their neighbours along the wall's run
    const link = (dx, dz) => (get(x + dx, y, z + dz)?.b === GLASS ? "true" : "false");
    st = cell.run === "x"
      ? { north: "false", south: "false", east: link(1, 0), west: link(-1, 0), waterlogged: "false" }
      : { north: link(0, -1), south: link(0, 1), east: "false", west: "false", waterlogged: "false" };
  }
  if (cell.b === "glowstone" || cell.b === "shroomlight") st = null;
  v.set(x, y, z, cell.b, st);
}
console.log(v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907825.nbt"));
