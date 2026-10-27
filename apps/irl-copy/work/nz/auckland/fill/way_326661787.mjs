// Church of Scientology, Mt Eden: a 1970s concrete office block, four storeys on a stepped footprint.
// Each cell's lidar roof is quantised to 4 / 8 / 12 / 16 block tiers (a storey is 4 blocks); the 16 tier sets back
// two cells at its top storey, so the massing reads as a tower on a podium. Each storey is a ribbon of glass with
// concrete piers and a spandrel, a base course at the ground, a cornice on the parapet, and an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326661787.cells.json`, "utf8"));
const W = 49, D = 70, Y = 29;

const PIER = "white_concrete", BAND = "light_gray_concrete", CORNICE = "smooth_stone";
const BASE = "stone_bricks", GLASS = "light_blue_stained_glass_pane", ROOF = "gray_concrete";
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];            // N, S, W, E (outward normals)

// footprint: cell -> ground G and storey-tier top H (quantised lidar roof; lidar 1..5 -> 4, 6..9 -> 8, 10..13 -> 12, 14+ -> 16)
const cell = new Map();
const cellAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? undefined : cell.get(z * W + x));
for (const [x, z, g, r] of cells) {
  const tier = r <= 5 ? 4 : r <= 9 ? 8 : r <= 13 ? 12 : 16;
  cell.set(z * W + x, { G: g, H: Math.max(tier, g + 2) });
}

// setback: steps in from the 16-tier's outer edge (distance 1 = edge cell); the top storey keeps cells at distance >= 3
const tall = (x, z) => cellAt(x, z)?.H === 16;
const setDist = new Map(), queue = [];
for (const [k, c] of cell) {
  if (c.H !== 16) continue;
  const x = k % W, z = Math.floor(k / W);
  if (DIRS.some(([dx, dz]) => !tall(x + dx, z + dz))) { setDist.set(k, 1); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i], x = k % W, z = Math.floor(k / W), d = setDist.get(k);
  for (const [dx, dz] of DIRS) {
    if (!tall(x + dx, z + dz)) continue;
    const n = (z + dz) * W + (x + dx);
    if (!setDist.has(n)) { setDist.set(n, d + 1); queue.push(n); }
  }
}
const dOf = (x, z) => setDist.get(z * W + x) ?? 99;

// occupied: inside the building at height y (the block column from its ground to its top, minus setback cells)
function occ(x, z, y) {
  const c = cellAt(x, z);
  if (!c || y < c.G || y >= c.H) return false;
  if (y >= 12 && c.H === 16 && dOf(x, z) < 3) return false;
  return true;
}
// the outward normal of an exposed face at this height (null if the cell is interior)
function outward(x, z, y) {
  for (const [dx, dz] of DIRS) if (!occ(x + dx, z + dz, y)) return [dx, dz];
  return null;
}
// the storey's base row: 4-block storeys on absolute lines 4, 8, 12; the ground storey starts at G
const bandBase = (c, y) => (y >= 12 ? 12 : y >= 8 ? 8 : y >= 4 ? 4 : c.G);

const g = new Voxels([W, Y, D]);

// the main entrance: the ground-floor face to the east with the largest x (ties to the north)
let door = null;
for (const [k, c] of cell) {
  const x = k % W, z = Math.floor(k / W), y = c.G + 1;
  if (!occ(x, z, y) || occ(x + 1, z, y)) continue;
  if (!door || x > door.x || (x === door.x && z < door.z)) door = { x, z, G: c.G };
}

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = cellAt(x, z); if (!c) continue;
  for (let y = 0; y < c.G; y++) g.set(x, y, z, BASE);                     // foundation up to the lidar ground
  for (let y = c.G; y < Y; y++) {
    if (!occ(x, z, y)) continue;
    const top = !occ(x, z, y + 1), p = y - bandBase(c, y), ground = bandBase(c, y) === c.G;
    const face = outward(x, z, y);
    if (!face) {                                                          // interior: floor slabs, an air gap otherwise
      if (top) g.set(x, y, z, BAND);
      else if (p === 0) g.set(x, y, z, ground ? BASE : BAND);
      continue;
    }
    if (top) { g.set(x, y, z, CORNICE); continue; }                       // parapet / cornice
    if (p === 0) { g.set(x, y, z, ground ? BASE : BAND); continue; }     // base course or storey string course
    if (!ground && p === 3) { g.set(x, y, z, PIER); continue; }          // spandrel under each window ribbon
    const [dx] = face, u = dx !== 0 ? z : x;                              // position along the face
    if (u % 4 === 0) { g.set(x, y, z, PIER); continue; }                 // concrete pier every 4 blocks
    const state = dx !== 0                                                // the pane runs along the face
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    g.set(x, y, z, GLASS, state);
  }
}

// the lit rooms: a lamp in the air behind some glass (glowstone upstairs, a lantern on the ground floor)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = cellAt(x, z); if (!c) continue;
  for (let y = c.G + 1; y < c.H; y++) {
    const face = outward(x, z, y); if (!face) continue;
    const p = y - bandBase(c, y), ground = bandBase(c, y) === c.G;
    if (p !== 1) continue;
    const [dx, dz] = face, u = dx !== 0 ? z : x;
    if (u % 8 !== 2 || u % 4 === 0) continue;
    const ix = x - dx, iz = z - dz;                                       // one block in from the glass
    if (!occ(ix, iz, y) || outward(ix, iz, y)) continue;
    if (ground) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else g.set(ix, y, iz, "glowstone");
  }
}

// the entrance: a dark oak door in the glass with a canopy on two posts, out over the path
if (door) {
  const { x, z, G } = door;
  g.set(x, G + 1, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, G + 2, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let dz = -1; dz <= 1; dz++) for (let dx = 1; dx <= 2; dx++)
    if (!occ(x + dx, z + dz, G + 3)) g.set(x + dx, G + 3, z + dz, BAND);
  for (const dz of [-1, 1]) for (let y = 0; y <= G + 2; y++) g.set(x + 2, y, z + dz, PIER);
}

// roof: a plant room on the 16 tier's setback roof (3x3, two storeys) and two plant boxes on the 12-tier terrace
let core = null;
for (const [k, c] of cell) {
  if (c.H !== 16) continue;
  const x = k % W, z = Math.floor(k / W);
  let ok = true;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!occ(x + dx, z + dz, 15) || dOf(x + dx, z + dz) < 3) ok = false;
  if (ok && (!core || dOf(x, z) > core.d)) core = { x, z, d: dOf(x, z) };
}
if (core) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
  g.set(core.x + dx, 16, core.z + dz, PIER);
  g.set(core.x + dx, 17, core.z + dz, dx === 0 && dz === 0 ? CORNICE : PIER);
}
let boxes = 0; const placed = [];
for (let z = 0; z < D - 1 && boxes < 2; z++) for (let x = 0; x < W - 1 && boxes < 2; x++) {
  const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (sq.some(([sx, sz]) => cellAt(sx, sz)?.H !== 12 || tall(sx, sz) || !occ(sx, sz, 11))) continue;
  if (placed.some(([px, pz]) => Math.abs(px - x) < 5 && Math.abs(pz - z) < 5)) continue;
  for (const [sx, sz] of sq) g.set(sx, 12, sz, ROOF);
  placed.push([x, z]); boxes++;
}

g.save(`${DIR}/way_326661787.nbt`);
console.log(`way_326661787: ${g.count()} blocks, ${g.palette.length - 1} block states, door ${door ? `${door.x},${door.z}` : "none"}, plant room ${core ? "yes" : "no"}, plant boxes ${boxes}`);
