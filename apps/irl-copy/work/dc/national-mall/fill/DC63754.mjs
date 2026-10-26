// 1111 Massachusetts Ave NW: a 1920s-30s Indiana-limestone commercial block. Ground-floor shopfronts on the north
// frontage, a 3-storey podium with a 4-storey tower at the centre (storeys 3 blocks, cornice on top, penthouse on the
// tower), glass in calcite piers, and an air gap behind every window for a glowstone or a dark room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63754.cells.json", "utf8"));
const W = 20, H = 25, D = 22;
const k2 = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { x, z, g, r }]));
const inF = (x, z) => cell.has(k2(x, z));
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// lidar roof heights are noisy: snap each to a flat tier (1-storey, 2-storey, 3-storey podium, 3-storey + parapet, tower)
const tierOf = (r) => (r <= 4 ? 3 : r <= 7 ? 6 : r <= 10 ? 9 : r === 11 ? 11 : 13);
const tierAt = new Map(cells.map(([x, z, , r]) => [k2(x, z), tierOf(r)]));
// a tower of fewer than 4 cells is a lidar stub (a chimney or a roof hatch), not a tower: it steps down to the podium
const seen = new Set();
for (const c of cell.values()) {
  const start = k2(c.x, c.z);
  if (seen.has(start) || tierAt.get(start) !== 13) continue;
  const comp = [start]; seen.add(start);
  for (let i = 0; i < comp.length; i++) {
    const [x, z] = comp[i].split(",").map(Number);
    for (const [dx, dz] of DIRS) { const n = k2(x + dx, z + dz); if (tierAt.get(n) === 13 && !seen.has(n)) { seen.add(n); comp.push(n); } }
  }
  if (comp.length < 4) for (const n of comp) tierAt.set(n, 11);
}
const T = (c) => tierAt.get(k2(c.x, c.z));

// depth: 1 = facade (touches outside), 2 = one cell in, ...
const depth = new Map(); const queue = [];
for (const c of cell.values()) if (DIRS.some(([dx, dz]) => !inF(c.x + dx, c.z + dz))) { depth.set(k2(c.x, c.z), 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(k2(c.x, c.z));
  for (const [dx, dz] of DIRS) { const n = k2(c.x + dx, c.z + dz); if (inF(c.x + dx, c.z + dz) && !depth.has(n)) { depth.set(n, d + 1); queue.push(cell.get(n)); } }
}
const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));

// the two entrances: the tall block's north door (centre bay) and the shopfront door on the low north wing
const doors = [{ x: 15, z: 8, canopy: [14, 15, 16] }, { x: 8, z: 4, canopy: [7, 8, 9] }];
const doorAt = new Map(); const canopyAt = new Set();
for (const d of doors) { doorAt.set(k2(d.x, d.z), d); for (const cx of d.canopy) canopyAt.add(`${cx},2,${d.z}`); }
const lanternAt = new Set(["14,1,8"]);

// window glass: facade cells in a window row, not a pier. Behind each, the depth-2 cell is an air gap
const glassAt = new Set(); const airAt = new Set();
for (const c of cell.values()) {
  if (depth.get(k2(c.x, c.z)) !== 1) continue;
  const t = T(c); const outs = outDirs(c.x, c.z); if (!outs.length) continue;
  const [dx, dz] = outs.find(([, dz]) => dz !== 0) ?? outs[0];
  const i = dz !== 0 ? c.x : c.z; const bay = t === 3 ? 4 : 3;
  for (let y = c.g + 1; y < t - 1; y++) {
    if (y % 3 === 0) continue;                                    // storey line
    if (doorAt.has(k2(c.x, c.z)) && y <= 1) continue;
    if (canopyAt.has(`${c.x},${y},${c.z}`)) continue;
    if (i % bay === 0) continue;                                  // pier
    glassAt.add(`${c.x},${y},${c.z}`);
    const ix = c.x - dx, iz = c.z - dz;
    if (inF(ix, iz) && depth.get(k2(ix, iz)) >= 2 && y >= cell.get(k2(ix, iz)).g && y < T(cell.get(k2(ix, iz))) - 1) airAt.add(`${ix},${y},${iz}`);
  }
}

const V = new Voxels([W, H, D]);
const paneState = (wallNS) => (wallNS
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const placed = { glass: 0, glow: 0 };
for (const c of cell.values()) {
  const t = T(c), dep = depth.get(k2(c.x, c.z));
  const outs = dep === 1 ? outDirs(c.x, c.z) : [];
  const wallNS = outs.some(([, dz]) => dz !== 0);
  for (let y = 0; y < t; y++) {
    const kk = `${c.x},${y},${c.z}`;
    if (y < c.g) { V.set(c.x, y, c.z, "stone_bricks"); continue; }      // foundation
    if (y === t - 1) { V.set(c.x, y, c.z, "smooth_stone"); continue; }  // cornice / roof deck
    if (airAt.has(kk)) {
      if ((c.x + 2 * y + 3 * c.z) % 10 === 0) { V.set(c.x, y, c.z, "glowstone"); placed.glow++; }
      continue;                                                         // air gap behind the glass
    }
    if (doorAt.has(k2(c.x, c.z)) && y <= 1) {
      V.set(c.x, y, c.z, "oak_door", { facing: "south", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (canopyAt.has(kk)) { V.set(c.x, y, c.z, "red_wool"); continue; }
    if (lanternAt.has(kk)) { V.set(c.x, y, c.z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (dep === 1 && outs.length) {
      if (y === c.g) { V.set(c.x, y, c.z, "polished_andesite"); continue; }   // base course
      if (y % 3 === 0) { V.set(c.x, y, c.z, "smooth_stone"); continue; }    // storey line
      if (glassAt.has(kk)) { V.set(c.x, y, c.z, "glass_pane", paneState(wallNS)); placed.glass++; continue; }
    }
    V.set(c.x, y, c.z, "calcite");
  }
}
// penthouse: the tower's interior top, two blocks of stone standing on the tower deck
for (const c of cell.values()) {
  if (T(c) !== 13 || depth.get(k2(c.x, c.z)) < 2) continue;
  if (c.x < 14 || c.x > 16 || c.z < 11 || c.z > 13) continue;
  V.set(c.x, 13, c.z, "stone_bricks"); V.set(c.x, 14, c.z, "smooth_stone");
}
const stats = V.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63754.nbt");
console.log(JSON.stringify({ ...stats, ...placed }));
