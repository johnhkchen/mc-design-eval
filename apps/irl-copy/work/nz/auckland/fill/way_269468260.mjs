// Auckland office block (way 269468260), read as a 1970s concrete-frame commercial block: five storeys on a stepped
// massing, a shopfront at the ground floor, a glazed curtain-wall-ish facade with white spandrels and light-grey piers.
// Lidar roof heights are median-smoothed and snapped to the 4-block storey grid (never under two storeys over the cell's
// own ground, capped at the 20 the lidar gives). Every column is solid from y 0 to its top, so each storey stands on the
// one below; the facade is only where a face is exposed (the outside, or a neighbour that stops lower), and behind each
// window bay sits an air gap with a warm light in some. Plant boxes sit on the top tier, a basalt cornice on the parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468260.cells.json", "utf8"));
const W = 40, D = 54, H = 33, TOP_MAX = 20;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                   // N, S, W, E

// roof tiers: 3x3 median of the lidar, snapped to 4-block storeys
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const snapped = 4 * Math.round(median(x, z) / 4);
  T[x][z] = Math.min(TOP_MAX, Math.max(snapped, 4 * Math.ceil((G[x][z] + 8) / 4)));
}

// faces of a cell at height y that show: the outside, or a neighbour whose top is at or below y
const exposure = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || T[x + dx][z + dz] <= y);
const toOutside = (x, z) => DIRS.some(([dx, dz]) => !inside(x + dx, z + dz));

const vox = new Voxels([W, H, D]);
const glass = [];                                                  // [x, y, z, outward dx, dz] of each glazed bay

// facade: rel 0 is the storey line (sill, or the base course on the shopfront), rel 3 the head band, 1-2 the glazing
const facade = (x, y, z, ex) => {
  // a stair-stepped edge cell has two outside faces too: read the outward one (a corner pier falls on the bay grid)
  const outward = ex.filter(([dx, dz]) => !inside(x + dx, z + dz));
  const face = outward[0] ?? ex[0];
  const k = Math.floor(y / 4), rel = y % 4, shop = k === Math.floor(G[x][z] / 4);
  const [dx] = face, u = dx !== 0 ? z : x;                                       // position along the face
  if (rel === 0) return vox.set(x, y, z, shop ? "polished_andesite" : "white_concrete");
  if (rel === 3) return vox.set(x, y, z, "white_concrete");
  if (u % 3 === 0) return vox.set(x, y, z, "light_gray_concrete");              // pier between bays
  glass.push([x, y, z, face[0], face[1]]);
  return vox.set(x, y, z, Math.floor(u / 3) % 4 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
};

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g = G[x][z], top = T[x][z];
  for (let y = 0; y < top; y++) {
    if (y < g) { vox.set(x, y, z, toOutside(x, z) ? "polished_andesite" : "light_gray_concrete"); continue; }   // foundation
    const ex = exposure(x, z, y);
    if (ex.length) facade(x, y, z, ex);
    else vox.set(x, y, z, "light_gray_concrete");                                                              // structure
  }
  if (toOutside(x, z)) vox.set(x, top, z, "polished_andesite");                                                // parapet cornice
}

// window bays: the cell behind each glazed bay is air (a gap behind the glass), with a warm light in some
for (const [x, y, z, dx, dz] of glass) {
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || exposure(ix, iz, y).length) continue;
  const rel = y % 4, pick = (x * 7 + z * 13 + y * 3) % 17;
  let block = "air";
  if (rel === 1 && pick === 0) block = "shroomlight";
  else if (rel === 1 && pick === 9) block = "glowstone";
  vox.set(ix, y, iz, block);
}

// the entrance: a double-height-free single door on the north face of the lowest street-side cell, under a canopy
const north = cells.filter(([x, z]) => !inside(x, z - 1)).map(([x, z]) => [x, z, G[x][z]]);
const minG = Math.min(...north.map(c => c[2]));
const row = north.filter(c => c[2] === minG).sort((a, b) => a[0] - b[0]);
const [ex, ez, eg] = row[row.length >> 1];
const k = Math.floor(eg / 4), yLo = 4 * k + 1, yHi = 4 * k + 2;
vox.set(ex, 4 * k, ez, "polished_andesite");                                                   // step
for (let x = ex - 1; x <= ex + 1; x++) if (inside(x, ez)) vox.set(x, 4 * k + 3, ez, "smooth_stone");   // canopy band
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
vox.set(ex, yLo, ez, "dark_oak_door", { ...door, half: "lower" });
vox.set(ex, yHi, ez, "dark_oak_door", { ...door, half: "upper" });
vox.set(ex, yLo, ez + 1, "air");
vox.set(ex, yHi, ez + 1, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: one 2x2 plant room (two high, capped) on the top tier every 12 cells, not a field of stacks
const topMax = Math.max(...cells.map(([x, z]) => T[x][z]));
for (let x = 0; x < W - 1; x++) for (let z = 0; z < D - 1; z++) {
  if (x % 12 !== 5 || z % 12 !== 5) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([a, b]) => inside(a, b) && T[a][b] === topMax)) continue;
  for (const [a, b] of quad) {
    vox.set(a, topMax, b, "smooth_stone"); vox.set(a, topMax + 1, b, "smooth_stone"); vox.set(a, topMax + 2, b, "polished_andesite");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468260.nbt";
const { blocks, palette } = vox.save(out);
console.log(`way_269468260: ${blocks} blocks, ${palette} palette entries, footprint ${cells.length}, tiers ${[...new Set(cells.map(([x, z]) => T[x][z]))].sort((a, b) => a - b)}`);
