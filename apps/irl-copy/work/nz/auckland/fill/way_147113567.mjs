// Endeans Building, Auckland CBD (way 147113567): a 1970s-style concrete-frame office block, ten storeys on a
// 39 x 38 footprint with a 12-storey shoulder and a 15-storey core, read from the lidar roof record. Each column is
// a stack of 4-block storeys: a slab row at y % 4 == 0 (and at every tier's roof), a 2-row glass band in pale
// concrete piers, a dark spandrel, and a cornice and parapet. Only the outside ring is built; the rest is air behind
// the glass, with floor slabs across the footprint. The ground floor has a base course, a shopfront and one door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_147113567.cells.json`, "utf8"));
const g = new Voxels([39, 74, 38]);

// The lidar roof (blocks above y 0) becomes a clean tier: low wings snap to their storey, the main body is 40 (10
// storeys), the tower shoulder 48, the core 60. A storey is 4 blocks, so every tier top is a multiple of 4.
function tierTop(roof) {
  if (roof <= 12) return 8;
  if (roof <= 28) return Math.round(roof / 4) * 4;
  if (roof <= 42) return 40;
  if (roof <= 52) return 48;
  return 60;
}

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
if (raw.size !== cells.length) throw new Error("duplicate footprint cells");
// lidar noise: each cell's roof is the mean over its 3 x 3 footprint neighbourhood, so the tiers step in clean masses
const smooth = (c) => {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(key(c.x + dx, c.z + dz)); if (o) { sum += o.roof; n++; }
  }
  return sum / n;
};
const cols = [...raw.values()].map((c) => ({ ...c, top: tierTop(Math.round(smooth(c))) }));
const col = new Map(cols.map((c) => [key(c.x, c.z), c]));
const inFoot = (x, z) => col.has(key(x, z));
const filled = (x, y, z) => { const c = col.get(key(x, z)); return !!c && y < c.top; };

const DIRS = [
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
];
// the outward faces of a wall cell: a neighbour that is not inside the building at that height
const exposed = (x, y, z) => DIRS.filter((d) => !filled(x + d.dx, y, z + d.dz));
const run = (x, z, d) => (d.axis === "x" ? x : z);   // position along the face, for the pier rhythm

// tiers' roof rows: every filled cell at one of these rows is a slab, so each tier stands on the slab below it
const ROOFY = new Set(cols.map((c) => c.top - 1));

const placed = new Map();
const K = (x, y, z) => `${x},${y},${z}`;
const has = (x, y, z) => placed.has(K(x, y, z));
function put(x, y, z, block, state) { g.set(x, y, z, block, state); placed.set(K(x, y, z), block); }

// The entrance: the face with the most ground-floor wall cells (south wins a tie), its middle cell takes the door.
const groundWall = new Map();
for (const c of cols) {
  const ex = exposed(c.x, 1, c.z);
  if (ex.length !== 1) continue;
  if (!groundWall.has(ex[0].name)) groundWall.set(ex[0].name, []);
  groundWall.get(ex[0].name).push({ c, d: ex[0] });
}
let entrance = null;
for (const d of DIRS) {
  const list = groundWall.get(d.name) ?? [];
  if (!list.length) continue;
  if (!entrance || list.length > entrance.list.length) entrance = { d, list };
}
const doorAt = new Map();
if (entrance) {
  const sorted = entrance.list.sort((a, b) => run(a.c.x, a.c.z, a.d) - run(b.c.x, b.c.z, b.d));
  const mid = sorted[Math.floor(sorted.length / 2)];
  doorAt.set(key(mid.c.x, mid.c.z), mid.d);
}

// Walls, slabs and foundation, column by column
const panes = [];
for (const c of cols) {
  for (let y = 0; y < c.top; y++) {
    if (y < c.ground) { put(c.x, y, c.z, "stone"); continue; }
    const ex = exposed(c.x, y, c.z);
    if (!ex.length) {
      if (y % 4 === 0 || ROOFY.has(y)) put(c.x, y, c.z, "stone");
      continue;
    }
    if (y === 1 || y === 2) {
      const door = doorAt.get(key(c.x, c.z));
      if (door) {
        put(c.x, y, c.z, "oak_door", { facing: door.name, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
    }
    if (y === 0) { put(c.x, y, c.z, "polished_granite"); continue; }                  // base course
    if (y === c.top - 1) { put(c.x, y, c.z, "smooth_stone"); continue; }             // cornice under the roof
    if (y % 4 === 0) { put(c.x, y, c.z, "smooth_stone"); continue; }                 // storey band
    if (y % 4 === 3) { put(c.x, y, c.z, y < 4 ? "smooth_stone" : "gray_concrete"); continue; }   // fascia / spandrel
    const corner = ex.length > 1;
    if (corner || run(c.x, c.z, ex[0]) % 3 === 0) {                                  // pale concrete piers
      put(c.x, y, c.z, y < 4 ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    put(c.x, y, c.z, "light_blue_stained_glass_pane");
    panes.push({ x: c.x, y, z: c.z, d: ex[0], run: run(c.x, c.z, ex[0]) });
  }
}

// Glass panes connect along their own wall to any solid neighbour in the same plane, so each band reads as one grid
for (const p of panes) {
  const hit = (dx, dz) => (has(p.x + dx, p.y, p.z + dz) ? "true" : "false");
  const sides = p.d.axis === "x"
    ? { east: hit(1, 0), west: hit(-1, 0), north: "false", south: "false" }
    : { north: hit(0, -1), south: hit(0, 1), east: "false", west: "false" };
  g.set(p.x, p.y, p.z, "light_blue_stained_glass_pane", { ...sides, waterlogged: "false" });
}

// Warm light: a glowstone or shroomlight on the floor just inside some upper-storey windows, the air gap kept above it
let lamps = 0;
for (const p of panes) {
  if (p.y % 4 !== 1 || p.y < 5 || (p.run + p.y) % 6 !== 1) continue;
  const ix = p.x - p.d.dx, iz = p.z - p.d.dz;
  if (!filled(ix, p.y, iz) || has(ix, p.y, iz) || exposed(ix, p.y, iz).length) continue;
  put(ix, p.y, iz, lamps++ % 3 === 2 ? "shroomlight" : "glowstone");
}

// A parapet on every exposed roof edge, roof plant on the lower roofs, and the core's penthouse with a spire
for (const c of cols) if (exposed(c.x, c.top - 1, c.z).length) put(c.x, c.top, c.z, "light_gray_concrete");
// a cell whose (2n+1)-square of neighbours is all footprint at the same tier top: far enough from any edge
const inset = (c, n, top) => {
  for (let dx = -n; dx <= n; dx++) for (let dz = -n; dz <= n; dz++) {
    const o = col.get(key(c.x + dx, c.z + dz));
    if (!o || o.top !== top) return false;
  }
  return true;
};
for (const c of cols) {
  if ((c.top === 40 || c.top === 48) && inset(c, 2, c.top) && (c.x * 7 + c.z * 3) % 13 === 0) {
    put(c.x, c.top, c.z, "light_gray_concrete");
    put(c.x, c.top + 1, c.z, "light_gray_concrete");
  }
}
const core = cols.filter((c) => c.top === 60);
const pent = core.filter((c) => inset(c, 3, 60));
for (const c of pent) {
  put(c.x, 60, c.z, "light_gray_concrete");
  put(c.x, 61, c.z, "light_gray_concrete");
  put(c.x, 62, c.z, "smooth_stone");
}
if (pent.length) {
  const cx = pent.reduce((s, c) => s + c.x, 0) / pent.length, cz = pent.reduce((s, c) => s + c.z, 0) / pent.length;
  const mid = pent.reduce((a, c) => ((c.x - cx) ** 2 + (c.z - cz) ** 2 < (a.x - cx) ** 2 + (a.z - cz) ** 2 ? c : a));
  for (const y of [63, 64, 65]) put(mid.x, y, mid.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/way_147113567.nbt`);
const counts = {};
g.forEachCell((i, v) => { const b = g.palette[v].block; counts[b] = (counts[b] ?? 0) + 1; });
console.log(JSON.stringify({ footprint: cols.length, tiers: [...new Set(cols.map((c) => c.top))].sort((a, b) => a - b), entrance: entrance?.d.name, panes: panes.length, lamps, blocks: g.count(), counts }, null, 1));
