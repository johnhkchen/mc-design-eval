// The Vibe, Mt Eden: a five-storey 1980s office block on a stone base, pale concrete piers and spandrels, tinted glass
// bands, a flat roof with a parapet, plant and a lift core. Footprint 47 x 38; lidar roof 23 blocks above y 0.
// Plinth to y 2 on every cell (lidar grounds run 0..2), then storeys of 4: floors at y 2, 6, 10, 14, 18; roof 23.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1067540364.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1067540364.nbt";

// Lidar roofs are noisy: a 3x3 median, then snap to the three tiers the massing can hold (23 main, 19 and 15 wings).
const raw = new Map();
for (const [x, z, , r] of cells) raw.set(`${x},${z}`, r);
const near = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const k = `${x + dx},${z + dz}`; if (raw.has(k)) v.push(raw.get(k)); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const ROOF = new Map();
for (const [x, z] of [...raw.keys()].map((k) => k.split(",").map(Number))) { const m = near(x, z); ROOF.set(`${x},${z}`, m >= 21 ? 23 : m >= 17 ? 19 : 15); }

const inFp = (x, z) => ROOF.has(`${x},${z}`);
const roofAt = (x, z) => ROOF.get(`${x},${z}`) ?? 0;
const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
// a side is exterior at height y when the cell beyond it is off the footprint or stands lower than y
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || roofAt(x + dx, z + dz) <= y);
// steps down to a lower neighbour get a solid ledge under the wall that rises from it
const ledges = (x, z) => {
  const s = new Set(), r = roofAt(x, z);
  for (const [dx, dz] of DIRS) if (inFp(x + dx, z + dz) && roofAt(x + dx, z + dz) < r) s.add(roofAt(x + dx, z + dz) - 1);
  return s;
};
const FLOORS = [2, 6, 10, 14, 18];
const floorOf = (y) => FLOORS.filter((f) => f <= y).pop();
const LIGHT = new Set(["glowstone", "shroomlight"]);

// Entrance: the north face (lowest z) at the middle of its run, a single-exposure cell so the door is not in a corner.
const north = [...ROOF.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => { const e = exposed(x, 3, z); return e.length === 1 && e[0][2] === "N"; })
  .sort((a, b) => a[0] - b[0]);
const [entX, entZ] = north[north.length >> 1];

const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });

for (const key of ROOF.keys()) {
  const [x, z] = key.split(",").map(Number);
  const r = roofAt(x, z), ledge = ledges(x, z);
  for (let y = 0; y < 2; y++) put(x, y, z, "stone_bricks");                         // base course
  for (let y = 2; y < r; y++) {
    const ex = exposed(x, y, z);
    if (y === r - 1) { put(x, y, z, ex.length ? "smooth_stone" : "gray_concrete"); continue; }   // parapet coping / roof deck
    if (!ex.length) { if (FLOORS.includes(y) || ledge.has(y)) put(x, y, z, "stone"); continue; }  // floor slabs; air between
    if (x === entX && z === entZ && (y === 2 || y === 3)) {                              // the entrance door, 2 high
      const half = y === 2 ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (FLOORS.includes(y)) { put(x, y, z, "polished_andesite"); continue; }           // storey string courses
    const k = y - floorOf(y);
    if (k === 3) { put(x, y, z, "white_concrete"); continue; }                         // spandrel under each window band
    const onEW = ex.some((d) => d[0] !== 0), u = onEW ? z : x;
    if (ex.length >= 2 || u % 3 === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // corners and piers
    if (y < 6) put(x, y, z, "glass");                                                 // shopfront
    else put(x, y, z, "light_blue_stained_glass_pane", {});                           // window (state set at flush)
  }
}

// Warm light behind some lower window rows: a light in the air gap just inside the glass (shroomlight at street level).
for (const [key, v] of [...B]) {
  if (!(v.block === "glass" || v.block.endsWith("stained_glass_pane"))) continue;
  const [x, y, z] = key.split(",").map(Number);
  if (y - floorOf(y) !== 1) continue;
  const ex = exposed(x, y, z);
  if (ex.length !== 1) continue;
  const h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
  if (h % 4 !== 0) continue;
  const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || exposed(ix, y, iz).length || B.has(`${ix},${y},${iz}`)) continue;
  put(ix, y, iz, y < 6 ? "shroomlight" : "glowstone");
}

// Roof: a lift core and plant on the main roof, found on deck cells well inside the parapet.
const topFree = (x, z) => inFp(x, z) && roofAt(x, z) === 23 && exposed(x, 22, z).length === 0;
const cs = [...ROOF.keys()].map((k) => k.split(",").map(Number));
const cxm = cs.reduce((a, c) => a + c[0], 0) / cs.length, czm = cs.reduce((a, c) => a + c[1], 0) / cs.length;
const spots = [];
for (const [x, z] of cs) {
  let ok = true; for (let i = 0; i < 2 && ok; i++) for (let j = 0; j < 2 && ok; j++) ok = topFree(x + i, z + j);
  if (ok) spots.push([x, z, Math.hypot(x - cxm, z - czm)]);
}
spots.sort((a, b) => a[2] - b[2]);
const used = new Set(), free = (x, z, w, d) => { for (let i = -1; i <= w; i++) for (let j = -1; j <= d; j++) if (used.has(`${x + i},${z + j}`)) return false; return true; };
const mark = (x, z, w, d) => { for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) used.add(`${x + i},${z + j}`); };
const core = [...cs].filter(([x, z]) => topFree(x, z) && topFree(x + 3, z + 3)).sort((a, b) => Math.hypot(a[0] - cxm, a[1] - czm) - Math.hypot(b[0] - cxm, b[1] - czm))[0];
if (core) {
  const [x0, z0] = core;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { put(x0 + i, 23, z0 + j, "stone_bricks"); put(x0 + i, 24, z0 + j, "stone_bricks"); put(x0 + i, 25, z0 + j, "stone_bricks"); put(x0 + i, 26, z0 + j, "stone_bricks"); put(x0 + i, 27, z0 + j, "smooth_stone"); }
  mark(x0, z0, 4, 4);
}
let ahus = 0;
for (const [x, z] of spots) {
  if (ahus >= 3 || !free(x, z, 2, 2)) continue;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { put(x + i, 23, z + j, "light_gray_concrete"); put(x + i, 24, z + j, "iron_block"); }
  mark(x, z, 2, 2); ahus++;
}

// Panes join their neighbours like a real window grid: a side is joined when the cell beyond holds a wall block, not a light or a door.
const joins = (x, y, z) => { const v = B.get(`${x},${y},${z}`); return !!v && !LIGHT.has(v.block) && v.block !== "oak_door"; };
for (const [key, v] of B) {
  if (!v.block.endsWith("stained_glass_pane")) continue;
  const [x, y, z] = key.split(",").map(Number);
  v.state = { north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)), east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), waterlogged: "false" };
}

// Flush to the voxel volume.
const g = new Voxels([47, 36, 38]);
for (const [key, v] of B) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const res = g.save(OUT);

// Check: every block above the ground has something under it, except the roof deck and the roof plant.
let hanging = 0;
for (const [key, v] of B) {
  const [x, y, z] = key.split(",").map(Number);
  if (y > 0 && !B.has(`${x},${y - 1},${z}`) && v.block !== "gray_concrete") hanging++;
}
console.log(JSON.stringify({ cells: ROOF.size, tiers: [...new Set(ROOF.values())], blocks: res.blocks, palette: res.palette, hanging, entrance: [entX, entZ], core: core ?? null, ahus }));
