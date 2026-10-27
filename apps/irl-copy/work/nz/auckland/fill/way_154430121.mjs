import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 154430121: a 1980s concrete-framed office block on the CBD edge, seen from Maungawhau. White concrete frame and
// piers, grey tinted glazing in pane bands, light-grey spandrels, polished andesite base, a stepped tower to the north.
// Cells are [x, z, ground, roof]; y 0 is the lowest ground. Floors sit on lines y = 3, 7, 11 ... (ground floor at 3, so
// the downhill side shows a lower-ground storey below it); roofs snap to storey lines (19, 23, 27, 31).
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${SRC}/way_154430121.cells.json`, "utf8"));

const FOUND = "stone_bricks", BASE = "polished_andesite", BELT = "white_concrete", PIER = "white_concrete";
const SPAN = "light_gray_concrete", ROOF = "smooth_stone", CAP = "white_concrete", SLAB = "stone";
const GLASS = "gray_stained_glass_pane", GLOW = "glowstone", LAMP = "lantern";
const FLOOR0 = 3, STOREY = 4;

const top = new Map();
for (const [x, z, g, r] of cells) top.set(`${x},${z}`, { g, r });
const inF = (x, z) => top.has(`${x},${z}`);

// outward faces: N = -z, S = +z, W = -x, E = +x
const DIRS = { N: [0, -1, "north"], S: [0, 1, "south"], W: [-1, 0, "west"], E: [1, 0, "east"] };
function faceOf(x, z) {
  for (const k of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[k]; if (!inF(x + dx, z + dz)) return k; }
  return null;
}
// a facade runs along x (N/S faces) or z (W/E faces); the pier grid is counted along it
const along = (x, z, f) => (f === "N" || f === "S" ? x : z);
const lineOf = (x, z, f) => (f === "N" || f === "S" ? z : x);

// Roof tiers: the 5x5 median of the lidar roof over footprint cells, snapped to the storey lines. Median kills the
// edge spikes (roof 31-33 on single cells); the four tops give a podium of wings with a tower stepping up to the north.
const TIER = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = top.get(`${x + dx},${z + dz}`); if (c) v.push(c.r); }
  v.sort((a, b) => a - b);
  const med = v[v.length >> 1];
  TIER.set(`${x},${z}`, med < 21 ? 19 : med < 25 ? 23 : med < 29 ? 27 : 31);
}
const tierOf = (x, z) => TIER.get(`${x},${z}`);

// Entrance: the longest run of street-level (ground 3) facade cells on one face-line; the door sits at its middle.
const runs = new Map();
for (const [x, z, g] of cells) {
  const f = faceOf(x, z); if (!f || g !== FLOOR0) continue;
  const k = `${f}:${lineOf(x, z, f)}`; if (!runs.has(k)) runs.set(k, []);
  runs.get(k).push(along(x, z, f));
}
let ENT = null;
for (const [k, list] of runs) {
  if (list.length < 3 || (ENT && list.length <= ENT.n)) continue;
  list.sort((a, b) => a - b);
  const [f, line] = k.split(":");
  ENT = { f, line: Number(line), m: list[list.length >> 1], n: list.length };
}
const isEntrance = (x, z, f) => ENT && f === ENT.f && lineOf(x, z, f) === ENT.line && Math.abs(along(x, z, f) - ENT.m) <= 1;

// structure grid through the interior, so the slabs stand on something
const column_ = (x, z) => !faceOf(x, z) && x % 6 === 0 && z % 6 === 0;

// A pane band: the glass runs along the facade, so it connects to its neighbours in that direction.
function glass(f) {
  const along_x = f === "N" || f === "S";
  return [GLASS, { north: String(!along_x), south: String(!along_x), east: String(along_x), west: String(along_x), waterlogged: "false" }];
}
const door = (f, half) => ["iron_door", { facing: DIRS[f][2], half, hinge: "left", open: "false", powered: "false" }];

// the blocks: [block, state?] per cell
const g = new Voxels([42, 46, 52]);
const put = (x, y, z, b) => { if (!b) return; if (Array.isArray(b)) g.set(x, y, z, b[0], b[1]); else g.set(x, y, z, b); };
const isFloor = (y, gnd) => y === gnd || (y >= FLOOR0 && (y - FLOOR0) % STOREY === 0);

for (const [x, z, gnd] of cells) {
  const T = tierOf(x, z), f = faceOf(x, z), a = f ? along(x, z, f) : 0;
  const ent = f && isEntrance(x, z, f);
  const column = column_(x, z);
  for (let y = 0; y < T; y++) {
    if (y < gnd) { put(x, y, z, FOUND); continue; }
    if (y === T - 1) { put(x, y, z, f ? CAP : ROOF); continue; }
    if (column) { put(x, y, z, PIER); continue; }
    if (!f) { if (isFloor(y, gnd)) put(x, y, z, SLAB); continue; }   // interior: air between slabs (no interiors)
    // facade
    if (ent && y === 6) { put(x, y, z, BASE); continue; }             // entrance canopy band
    if (ent && (y === 4 || y === 5)) { put(x, y, z, a === ENT.m ? door(f, y === 4 ? "lower" : "upper") : PIER); continue; }
    if (isFloor(y, gnd)) { put(x, y, z, y < FLOOR0 ? FOUND : y === FLOOR0 ? BASE : BELT); continue; }
    if (y < FLOOR0) { put(x, y, z, a % 3 === 0 ? FOUND : glass(f)); continue; }   // lower-ground slit windows
    const rel = (y - FLOOR0) % STOREY;                                 // 1, 2 glazed; 3 spandrel
    put(x, y, z, rel === 3 ? SPAN : a % 3 === 0 ? PIER : glass(f));
  }
}

// Roof plant: a 3 x 3 lift and plant room on the tallest tier, standing on its roof cap.
{
  const tall = cells.filter(([x, z]) => tierOf(x, z) === 31).map(([x, z]) => [x, z]);
  if (tall.length) {
    const cx = Math.round(tall.reduce((s, c) => s + c[0], 0) / tall.length);
    const cz = Math.round(tall.reduce((s, c) => s + c[1], 0) / tall.length);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx, z = cz + dz;
      if (!inF(x, z) || tierOf(x, z) !== 31) continue;
      put(x, 31, z, SPAN); put(x, 32, z, SPAN);
    }
  }
}

// Warm light behind some glazing (glowstone on the air side of the pane), and a standing lantern in the entrance hall.
for (const [x, z, gnd] of cells) {
  const f = faceOf(x, z); if (!f) continue;
  const [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz;                       // the air cell behind this facade cell
  if (!inF(ix, iz) || faceOf(ix, iz) || column_(ix, iz)) continue;
  if (isEntrance(x, z, f)) continue;
  const T = tierOf(x, z);
  for (let y = FLOOR0 + 1; y < T - 1; y++) {
    const rel = (y - FLOOR0) % STOREY;
    if (rel === 0 || rel === 3 || along(x, z, f) % 3 === 0) continue;   // only glazed cells
    if ((x * 5 + z * 3 + y * 7) % 11 === 0) g.set(ix, y, iz, GLOW);
  }
}
if (ENT) {
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    const f = faceOf(x, z);
    if (!f || !isEntrance(x, z, f) || along(x, z, f) !== ENT.m) continue;
    const [dx, dz] = DIRS[f];
    const ix = x - dx, iz = z - dz;
    if (inF(ix, iz) && !faceOf(ix, iz)) g.set(ix, 4, iz, LAMP, { hanging: "false", waterlogged: "false" });
  }
}

const stats = g.save(`${SRC}/way_154430121.nbt`);
console.log(JSON.stringify({ footprint: cells.length, ...stats, entrance: ENT }));
