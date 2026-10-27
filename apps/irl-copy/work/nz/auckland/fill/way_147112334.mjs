// The Beach, Auckland (way 147112334): a 1970s concrete-and-glass office tower, a 14-storey shaft on a stepped podium,
// its roof about 58 blocks above its lowest ground (lidar 57-58 on the north-east block, 26-28 on the west podium,
// 44-56 on the south wings). Footprint 46 x 51 with an irregular outline; the lidar roof is median-smoothed and snapped
// to a 4-block storey grid (a 58 crown with a 2-block parapet), no tier below two storeys above its own ground.
// Foundation is solid stone from y 0 to each cell's ground, so nothing floats on the slope. Facade: a 4-block storey
// rhythm (white concrete spandrel at every storey line, cyan glass in three-pane bays between light-grey concrete piers,
// corners as piers), a polished andesite base course, a shopfront zone on the ground storey, a dark-oak entrance
// under a stone fascia canopy. Glowstone behind some panes, a plant room on the crown. Interiors are air with a
// floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112334.cells.json", "utf8"));
const W = 46, D = 51, H = 71;
const G = Array.from({ length: W }, () => Array(D).fill(-1));    // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));     // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const OPP = { N: "S", S: "N", E: "W", W: "E" };
const nb = (x, z, k) => [x + DIRS[k][0], z + DIRS[k][1]];

// the lidar roof, smoothed: the median of the footprint cells in a 5 x 5 window (noise and ragged edges go, so each tier is a flat slab)
const med = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
// the storey grid: roofs of 54 and over are the crown (58 with a parapet), the rest snap to 8-block steps (two storeys,
// so the setbacks read as slabs and not teeth), and no tier stands under two storeys above its own ground
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const r = med(x, z), gr = G[x][z];
  const snapped = r >= 54 ? 58 : 8 * Math.round(r / 8);
  T[x][z] = Math.max(snapped, 4 * Math.ceil(gr / 4) + 4);
}
const top = (x, z) => (inside(x, z) ? T[x][z] : 0);

// a face is exposed at height y when the cell beside it is outside the footprint or its tier stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [nx, nz] = nb(x, z, k);
  return !inside(nx, nz) || top(nx, nz) <= y;
});
// the roof edge: a parapet on any roof cell with a lower neighbour or open air beside it
const roofEdge = (x, z) => Object.keys(DIRS).some((k) => {
  const [nx, nz] = nb(x, z, k);
  return !inside(nx, nz) || top(nx, nz) < top(x, z);
});

// the entrance: the longest run of exposed north or south faces at street level (ground 0-1), middle of the run
// (the run follows the stepped outline: the next column's street cell, within a row either way)
const runs = [];
for (const face of ["N", "S"]) {
  let run = [];
  const flush = () => { if (run.length >= 3) runs.push({ face, cells: run }); run = []; };
  for (let x = 0; x < W; x++) {
    const hits = [];
    for (let zz = 0; zz < D; zz++) if (inside(x, zz) && G[x][zz] <= 1 && exposed(x, zz, G[x][zz]).includes(face)) hits.push([x, zz]);
    const next = hits.find(([, zz]) => run.length && Math.abs(zz - run[run.length - 1][1]) <= 1);
    if (next) run.push(next);
    else { flush(); if (hits.length) run.push(hits[0]); }
  }
  flush();
}
if (!runs.length) throw new Error("no street-level face for the entrance");
runs.sort((a, b) => b.cells.length - a.cells.length);
const best = runs[0];
const mid = Math.floor(best.cells.length / 2);
const [doorX, doorZ] = best.cells[mid];
const ENTRANCE = new Map([[`${doorX},${doorZ}`, best.face]]);                       // the door, middle of the run
const FASCIA = new Set(best.cells.slice(mid - 1, mid + 2).map(([x, z]) => `${x},${z}`));  // the stone canopy over three bays

const g = new Voxels([W, H, D]);

// glass panes connect along their wall: an east-west wall (north or south face) runs east and west
const glassFor = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the facade block of an exposed cell at height y: base course, shopfront, spandrels on the storey lines, bays with piers
function facade(y, gr, face, bay, faces) {
  const corner = faces.length >= 2;
  if (y === gr) return { block: "polished_andesite" };
  const firstBand = 4 * Math.ceil((gr + 1) / 4);                       // the first storey line above the base
  if (y < firstBand) {                                                  // ground storey: shopfront glass on piers
    if (corner || bay % 3 === 0) return { block: "light_gray_concrete" };
    return { block: "cyan_stained_glass_pane", state: glassFor(face) };
  }
  if (y % 4 === 0) return { block: "white_concrete" };                  // spandrel on every storey line
  if (corner || bay % 3 === 0) return { block: "light_gray_concrete" };  // piers in every third bay
  return { block: "cyan_stained_glass_pane", state: glassFor(face) };
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], t = T[x][z];
  // foundation: stone from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // base course on the ground, a floor plate per storey inside (air otherwise), the roof deck on top
  g.set(x, gr, z, "polished_andesite");
  const edge = roofEdge(x, z);
  for (let y = gr + 1; y < t; y++) {
    const key = `${x},${z}`;
    const faces = exposed(x, z, y);
    if (y === t - 1) {                                                  // roof deck (on the top layer)
      g.set(x, y, z, edge ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (edge && y === t - 2) { g.set(x, y, z, "light_gray_concrete"); continue; }   // parapet course
    if (faces.length === 0) {
      if (y % 4 === 0) g.set(x, y, z, "smooth_stone");                  // floor slab per storey, air between
      continue;
    }
    const face = faces[0];
    const bay = face === "N" || face === "S" ? x : z;
    const firstBand = 4 * Math.ceil((gr + 1) / 4);
    // entrance: a dark-oak door on the middle cell of the run (two cells high), the stone fascia over the run's top row
    if (ENTRANCE.get(key) === face && (y === gr + 1 || y === gr + 2)) {
      const facing = { N: "north", S: "south", E: "east", W: "west" }[face];
      g.set(x, y, z, "dark_oak_door", { facing, half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (FASCIA.has(key) && y === firstBand - 1) { g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    const f = facade(y, gr, face, bay, faces);
    g.set(x, y, z, f.block, f.state);
  }
}

// the canopy's posts: the entrance fascia's stone slab reads as a canopy on its own row; a dark-oak door on each side
// has a lantern under the fascia (hanging, on the air just inside the glass)
for (const [k, face] of ENTRANCE) {
  const [x, z] = k.split(",").map(Number);
  const gr = G[x][z];
  const [ix, iz] = nb(x, z, OPP[face]);
  if (inside(ix, iz) && !g.get(ix, gr + 2, iz)) g.set(ix, gr + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// warm light behind some panes: a glowstone in the air just inside a lit bay on the upper storeys
let lit = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], t = T[x][z];
  for (let y = gr + 5; y < t - 2; y++) {
    if (y % 4 === 0) continue;
    const faces = exposed(x, z, y);
    if (faces.length !== 1) continue;
    const face = faces[0];
    const bay = face === "N" || face === "S" ? x : z;
    if (bay % 3 === 0 || (x * 7 + z * 3 + y) % 5 !== 0) continue;
    const [ix, iz] = nb(x, z, OPP[face]);
    if (!inside(ix, iz) || exposed(ix, iz, y).length || g.get(ix, y, iz)) continue;
    g.set(ix, y, iz, lit++ % 6 === 5 ? "shroomlight" : "glowstone");
  }
}

// the plant room on the crown: a 6 x 4 box of light-grey concrete with a louvred band and a stone cap, standing on the
// 58 deck, set in from the parapet
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || T[x][z] !== 58) continue;
  if (x < 18 || x > 23 || z < 22 || z > 25) continue;
  const edge = x === 18 || x === 23 || z === 22 || z === 25;
  for (let y = 58; y <= 60; y++) {
    if (!edge) continue;
    if (y === 59 && (x + z) % 2 === 0) g.set(x, y, z, "iron_bars");
    else g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, 61, z, "stone_bricks");
}

// roof plant on the west podium: a few chilled-water units on the 28 deck, clear of its parapet
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || T[x][z] !== 28 || roofEdge(x, z)) continue;
  if (x % 6 === 3 && z % 6 === 2) g.set(x, 28, z, "light_gray_concrete");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112334.nbt");
console.log(`way_147112334: ${stats.blocks} blocks, ${stats.palette} palette entries`);
