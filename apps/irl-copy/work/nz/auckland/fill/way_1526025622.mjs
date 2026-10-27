// Way 1526025622, Eden Terrace side of the Mt Eden rim: no record, so it reads as a 1960s-70s concrete office block
// (pale precast frame, dark ribbon glazing, a basalt base for the local stone). Five storeys over a 4-block plinth,
// stepping down to a 4-storey wing on the east and a one-storey annex on the north-east, with a plant box on the roof.
// The lidar roof is smoothed to the nearest 4-block course: tops at 10, 14, 18, 22 and 26.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1526025622.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..38, z 0..24
const W = 39, D = 25, H = 40;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const GLASS = "light_blue_stained_glass";

// every footprint cell: its ground, and its top (a tier on the 4-block grid, so slabs fall on multiples of 4, the roof slab at T-2, the parapet at T-1)
const F = Array.from({ length: D }, () => new Array(W).fill(null));
for (const [x, z, ground, roof] of cells) F[z][x] = { g: ground, T: Math.max(10, 4 * Math.round((roof - 2) / 4) + 2) };
const at = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? F[z][x] : null);

// the faces of a wall voxel that look out: off the footprint, or above the neighbour's roof slab (a setback's open side)
const openDirs = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || y >= n.T - 1; });
// the parapet stands only on the edge of a tier: off the footprint, or beside a lower tier
const parapetEdge = (x, z, T) => DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T < T; });

function solid(x, z, y) {
  const c = at(x, z); if (!c) return false;
  if (y < 4) return true;                                    // foundation and the basalt base course
  if (y >= c.T) return false;
  if (y === c.T - 1) return parapetEdge(x, z, c.T);          // parapet on the edge
  if (y % 4 === 0) return true;                              // storey slabs and the roof slab at T-2
  return openDirs(x, z, y).length > 0;                       // walls on the open faces; the rest is interior air
}

function block(x, z, y) {
  const c = at(x, z);
  if (y < c.g) return "stone";                               // below the ground
  if (y < 4) return "polished_basalt";
  if (y === c.T - 1) return "light_gray_concrete";           // cornice-cap parapet
  if (y % 4 === 0) return y === c.T - 2 ? "light_gray_concrete" : (openDirs(x, z, y).length ? "light_gray_concrete" : "white_concrete");
  const o = openDirs(x, z, y);
  const xFace = o.some(([dx]) => dx), zFace = o.some(([, dz]) => dz);
  if (xFace && zFace) return "light_gray_concrete";          // corner pilaster
  const bay = xFace ? z : x;                                 // a pier every third bay, two glazed bays between
  if (y % 4 === 1) return y < 8 ? "polished_basalt" : "light_gray_concrete";   // shopfront base; spandrel above
  return bay % 3 ? GLASS : "white_concrete";
}

// a glazed bay sits one block back in its reveal: the wall cell is air and the glass is in the room behind it (the cell inside, if it is air)
function recessOf(x, z, y) {
  if (!solid(x, z, y) || block(x, z, y) !== GLASS) return null;
  const [dx, dz] = openDirs(x, z, y)[0];
  const ix = x - dx, iz = z - dz;
  return at(ix, iz) && !solid(ix, iz, y) ? [ix, iz] : null;
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 0; y < c.T; y++) {
    if (!solid(x, z, y)) continue;
    const r = recessOf(x, z, y);
    if (r) g.set(r[0], y, r[1], GLASS); else g.set(x, y, z, block(x, z, y));
  }
}

// the entrance: a glazed bay on the longer street-facing side, at ground level, with a lintel band over the door
const doors = { 1: [], "-1": [] };
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!at(x, z)) continue;
  const o = openDirs(x, z, 5), zo = o.find(([dx, dz]) => dz && !dx);
  if (zo && x % 3 !== 0 && !o.some(([dx]) => dx)) doors[zo[1]].push({ x, z, dz: zo[1] });
}
const side = doors[1].length >= doors[-1].length ? doors[1] : doors[-1];
const door = side[Math.floor(side.length / 2)];
if (door) {
  const facing = door.dz > 0 ? "south" : "north";
  const st = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  g.set(door.x, 5, door.z, "dark_oak_door", st("lower"));
  g.set(door.x, 6, door.z, "dark_oak_door", st("upper"));
  g.set(door.x, 7, door.z, "light_gray_concrete");
}

// warm light behind some glazed bays: a glowstone two blocks in, in the room behind the glass (air only)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 6; y < c.T - 2; y++) {
    if (!recessOf(x, z, y) || (x * 5 + z * 3 + y) % 7 !== 0) continue;
    const [dx, dz] = openDirs(x, z, y)[0];
    const ix = x - 2 * dx, iz = z - 2 * dz, ic = at(ix, iz);
    if (ic && ic.T > y && !solid(ix, iz, y)) g.set(ix, y, iz, "glowstone");
  }
}

// roof plant: a solid 5 x 3 box with a cap, on the main tier's roof slab, nearest the middle of the block
let best = null;
for (let z0 = 1; z0 + 3 < D - 1; z0++) for (let x0 = 1; x0 + 5 < W - 1; x0++) {
  let ok = true;
  for (let z = z0 - 1; z <= z0 + 3 && ok; z++) for (let x = x0 - 1; x <= x0 + 5 && ok; x++) { const c = at(x, z); if (!c || c.T !== 26) ok = false; }
  if (!ok) continue;
  const d = Math.hypot(x0 + 2.5 - 19, z0 + 1 - 12);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) for (let z = best.z0; z < best.z0 + 3; z++) for (let x = best.x0; x < best.x0 + 5; x++) {
  g.set(x, 25, z, "white_concrete"); g.set(x, 26, z, "white_concrete"); g.set(x, 27, z, "light_gray_concrete");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1526025622.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
