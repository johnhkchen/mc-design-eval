// 1110 New York Ave NW: a 1980s-90s Washington office tower, limestone-clad (calcite) on a dark base, tinted glazing in
// a 3-bay grid, massing from the lidar roof heights: median-smoothed, then quantised to clean tiers (3, 6, 12, 15, 17, 20).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58494.cells.json`, "utf8"));
const W = 26, D = 39, H = 32;

// lidar roof height per footprint cell (null outside the footprint)
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , roof] of cells) raw[z][x] = roof;

// 3x3 median over footprint neighbours kills lidar spikes; then the tier the median falls in
const TIERS = [[19, 20], [16, 17], [13, 15], [9, 12], [5, 6]];
const tierOf = (m) => { for (const [min, t] of TIERS) if (m >= min) return t; return 3; };
// two passes: the second irons out the ragged steps the first leaves on the east wings
const median = (src) => {
  const out = Array.from({ length: D }, () => Array(W).fill(null));
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (src[z][x] === null) continue;
    const vals = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const v = src[z + dz]?.[x + dx]; if (v != null) vals.push(v);
    }
    vals.sort((a, b) => a - b);
    out[z][x] = vals[vals.length >> 1];
  }
  return out;
};
const smooth = median(median(raw));
const T = Array.from({ length: D }, () => Array(W).fill(-1));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (smooth[z][x] !== null) T[z][x] = tierOf(smooth[z][x]);

const tAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? -1 : T[z][x]);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward faces a cell shows at height y: the neighbour is off the footprint or its tier stops below y
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const t = tAt(x + dx, z + dz); return t < 0 || t <= y; });

const STONE = "calcite", BASE = "polished_andesite", GLASS = "light_blue_stained_glass", ROOF = "gray_concrete";
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([W, H, D]);
const windows = [];   // [x, y, z, dx, dz] of every glazed cell, to carve its air gap behind
const glazeOr = (x, y, z, dx, dz, pier) => {
  if (pier) { g.set(x, y, z, STONE); return; }
  g.set(x, y, z, GLASS); windows.push([x, y, z, dx, dz]);
};

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = T[z][x]; if (t < 0) continue;
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) { g.set(x, y, z, y === t - 1 ? ROOF : STONE); continue; }   // floor slabs and roof inside
    if (y === t - 1) { g.set(x, y, z, t >= 6 ? BASE : STONE); continue; }      // cornice / podium cap
    if (y === 0) { g.set(x, y, z, BASE); continue; }                           // dark plinth course
    if (ex.length >= 2) { g.set(x, y, z, STONE); continue; }                  // corner pier
    const [dx, dz] = ex[0];
    const pier = (dx ? z : x) % 3 === 0;                                      // 3-block bay: glass, glass, pier
    if (y <= 2) glazeOr(x, y, z, dx, dz, pier);                               // shopfront / lobby glazing
    else if (y === 3) g.set(x, y, z, STONE);                                  // storey band over the ground floor
    else if (y % 2 === 0) g.set(x, y, z, STONE);                              // spandrel: storey line
    else glazeOr(x, y, z, dx, dz, pier);                                      // window row
  }
}

// an air gap behind every window; some hold a warm light
for (const [x, y, z, dx, dz] of windows) {
  const ix = x - dx, iz = z - dz;
  const t = tAt(ix, iz);
  if (t < 0 || t <= y || exposed(ix, y, iz).length) continue;
  if (hash(x, y, z) % 9 === 0) g.set(ix, y, iz, hash(x, y, z) % 3 === 0 ? "shroomlight" : "glowstone");
  else g.set(ix, y, iz, "air");
}

// the entrance: a door in the low lobby recess under the tower's south face, with a dark canopy band above it
g.set(13, 1, 38, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(13, 2, 38, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 11; x <= 16; x++) g.set(x, 3, 37, BASE);

// roof: a stone mechanical penthouse on the 20-tier crown, glazed on its edges, capped
const PX0 = 12, PX1 = 16, PZ0 = 22, PZ1 = 26;
for (let z = PZ0; z <= PZ1; z++) for (let x = PX0; x <= PX1; x++) {
  const edge = [x === PX0 ? [-1, 0] : null, x === PX1 ? [1, 0] : null, z === PZ0 ? [0, -1] : null, z === PZ1 ? [0, 1] : null].filter(Boolean);
  g.set(x, 20, z, STONE);
  if (!edge.length) { g.set(x, 21, z, STONE); g.set(x, 22, z, ROOF); continue; }
  const [dx, dz] = edge[0];
  if (edge.length >= 2) g.set(x, 21, z, STONE);
  else if ((dx ? z : x) % 3 === 0) g.set(x, 21, z, STONE);
  else { g.set(x, 21, z, GLASS); g.set(x - dx, 21, z - dz, "air"); }
  g.set(x, 22, z, ROOF);
}

const { blocks, palette } = g.save(`${DIR}/DC58494.nbt`);
console.log(JSON.stringify({ blocks, palette, maxRoof: Math.max(...T.flat()), windows: windows.length }));
