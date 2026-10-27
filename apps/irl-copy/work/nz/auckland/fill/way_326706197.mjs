import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Москва House, Newton/Eden Terrace edge of the city, seen from Maungawhau. Read from the record: roof 22-26 blocks
// above its lowest ground (~21 m), so a six-storey block, built as a 1960s concrete-framed mid-rise: a white-rendered
// frame of piers and ribbon windows, a stone base course, black shopfront fascias at street level, and a stair core
// and plant on the roof. Floors every 4 blocks on one grid from y 6 up; the ground storey follows the slope, the
// downhill side showing extra storeys. A hollow shell: an air gap behind the glass, a floor slab per storey.

const DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const SIZE = [47, 39, 33];
const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_326706197.cells.json`, "utf8"));

// Lidar roof noise snapped to four flat tops: 26 the tower, 22 the wings, 14 annexes, 6 rim stubs.
// Ground under a cell is at least 1 (y 0 is filled under the zero-ground cells so every storey has a floor).
const cellAt = new Map();
for (const [x, z, ground, roof] of cells) {
  const T = roof >= 24 ? 26 : roof >= 20 ? 22 : roof >= 12 ? 14 : 6;
  cellAt.set(`${x},${z}`, { x, z, g: Math.max(ground, 1), T });
}
const cell = (x, z) => cellAt.get(`${x},${z}`);
const kOf = (x, y, z) => `${x},${y},${z}`;
const isSlab = (y) => y >= 6 && (y - 6) % 4 === 0;
// horizontal faces open to the air at height y: outside the footprint, or above a lower neighbour's roof
const openDirs = (x, z, y) => DIR.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || y >= n.T; });
const paneState = (E) => (E[0][0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const put = new Map();
const set = (x, y, z, block, state) => put.set(kOf(x, y, z), { block, state });
const env = [];

for (const c of cellAt.values()) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { set(c.x, y, c.z, "stone_bricks"); continue; }                // foundation to the ground
    const E = openDirs(c.x, c.z, y);
    if (y === c.T - 1) { set(c.x, y, c.z, E.length ? "smooth_stone" : "stone"); continue; }   // cornice / roof
    if (isSlab(y)) { set(c.x, y, c.z, "light_gray_concrete"); continue; }        // floor slab per storey
    if (!E.length) continue;                                                     // interior air
    const pier = E.length > 1 || (E[0][0] !== 0 ? c.z : c.x) % 3 === 0;         // piers every 3rd column
    const ground = y < 6;
    if (ground && y === c.g) { set(c.x, y, c.z, "stone_bricks"); continue; }     // base course
    let block, state;
    if (ground && y === 5) { block = pier ? "smooth_quartz" : "black_concrete"; }  // shopfront fascia
    else if (!ground && (y - 6) % 4 === 3) { block = pier ? "smooth_quartz" : "white_concrete"; } // spandrel
    else if (pier) { block = "smooth_quartz"; }
    else { block = "glass_pane"; state = paneState(E); }
    set(c.x, y, c.z, block, state);
    env.push({ x: c.x, y, z: c.z, E, g: c.g, ground, window: block === "glass_pane" });
  }
}

// Entrance: the largest run of ground-storey windows on one face, its middle bay becomes the door.
const byFace = new Map();
for (const e of env) {
  if (!e.window || !e.ground || e.E.length !== 1 || e.g > 2 || e.y !== e.g + 1) continue;
  const k = e.E[0].join(",");
  byFace.set(k, [...(byFace.get(k) ?? []), e]);
}
const face = [...byFace.entries()].sort((a, b) => b[1].length - a[1].length)[0];
if (face) {
  const [k, run] = face;
  const along = (e) => (e.E[0][0] !== 0 ? e.z : e.x);
  run.sort((a, b) => along(a) - along(b));
  const d = run[Math.floor(run.length / 2)];
  const facing = NAME[k];
  const door = (y, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  set(d.x, d.g + 1, d.z, "iron_door", door(d.g, "lower"));
  set(d.x, d.g + 2, d.z, "iron_door", door(d.g, "upper"));
  set(d.x, d.g + 3, d.z, "smooth_quartz");                                     // lintel over the door
}

// Warm light: a glowstone or shroomlight in the air gap behind about a quarter of the windows, only where it stands.
for (const e of env) {
  if (!e.window) continue;
  if ((e.x * 5 + e.z * 11 + e.y * 7) % 4 !== 0) continue;
  const [dx, dz] = e.E[0];
  const ix = e.x - dx, iz = e.z - dz, ic = cell(ix, iz);
  if (!ic || e.y < ic.g || e.y >= ic.T || put.has(kOf(ix, e.y, iz))) continue;
  if (!put.has(kOf(ix, e.y - 1, iz))) continue;                              // needs a floor under it
  set(ix, e.y, iz, (e.x + e.z) % 3 === 0 ? "shroomlight" : "glowstone");
}

// Roof: a stair and lift core on the tower (3x3, glazed on each face's middle, capped), and plant units.
const tower = [...cellAt.values()].filter((c) => c.T === 26);
const cx = tower.reduce((s, c) => s + c.x, 0) / tower.length, cz = tower.reduce((s, c) => s + c.z, 0) / tower.length;
let core = null, best = Infinity;
for (const c of tower) {
  const ring = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) ring.push(cell(c.x + i, c.z + j));
  if (ring.some((n) => !n || n.T !== 26)) continue;
  const d = (c.x - cx) ** 2 + (c.z - cz) ** 2;
  if (d < best) { best = d; core = c; }
}
const inCore = (x, z) => core && Math.abs(x - core.x) <= 1 && Math.abs(z - core.z) <= 1;
if (core) {
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const x = core.x + i, z = core.z + j, faceMid = Math.abs(i) + Math.abs(j) === 1;
    for (const y of [26, 27]) {
      if (faceMid) {
        const E = i !== 0 ? [[i, 0]] : [[0, j]];
        set(x, y, z, "glass_pane", paneState(E));
      } else set(x, y, z, "white_concrete");
    }
    set(x, 28, z, "smooth_stone");
  }
}
for (const c of tower) {
  if (c.x % 6 !== 1 || c.z % 5 !== 2 || inCore(c.x, c.z)) continue;
  if (core && Math.abs(c.x - core.x) <= 2 && Math.abs(c.z - core.z) <= 2) continue;
  set(c.x, 26, c.z, "iron_block");
}

// No floating blocks: everything above the ground stands on something in its column.
let floating = 0;
for (const k of put.keys()) {
  const [x, y, z] = k.split(",").map(Number);
  if (y > 0 && !put.has(kOf(x, y - 1, z))) floating++;
}
if (floating) console.warn(`${floating} blocks have air directly below them`);

const g = new Voxels(SIZE);
for (const [k, { block, state }] of put) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${FILL}/way_326706197.nbt`);
console.log(`way_326706197: ${out.blocks} blocks, ${out.palette} palette entries, ${floating} floating`);
