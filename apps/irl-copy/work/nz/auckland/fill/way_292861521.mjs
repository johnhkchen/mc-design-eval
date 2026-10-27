// Way 292861521, Eden Terrace side of Maungawhau: a 1980s concrete-frame office tower. A 15-storey main body (lidar 62)
// with a one-storey-higher core (lidar 68) at the east end; the 3x3 median of the lidar roof snaps to those two flat tiers.
// Ground: a basalt plinth to the lowest cell's ground, a base course, then a shopfront storey (glass bays, a fascia band).
// Above, a 4-block storey rhythm: a light concrete floor line, two rows of tinted glass between light concrete mullions
// (every third cell a pier), a dark spandrel, a smooth-stone coping on the roof. Facades are the exposed walls only, so
// interiors are air with a slab per storey and a roof deck; warm glowstone sits behind some glass on the first window row.
// The entrance is a dark-oak door on the south face, under a slab canopy on two posts. Plant boxes stand on the main roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861521.cells.json", "utf8"));
const W = 31, D = 35, H = 82;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar roof: 3x3 median, then two flat tiers (the 62 main body, the 68 core); a low wing would take 24
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));    // the roof tier of each cell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z);
  T[x][z] = m >= 66 ? 68 : m >= 40 ? 62 : 24;
}
const top = (x, z) => (inside(x, z) ? T[x][z] : 0);

// a wall voxel: under its own roof and open to the air, or to a neighbour whose roof is lower (a setback's side)
const exposed = (x, y, z) => y < T[x][z] && DIRS.some(([dx, dz]) => y >= top(x + dx, z + dz));

// the facade of an exposed voxel: a 4-block storey (floor line at 0, two window rows, spandrel at 3), mullions every third
// cell along the wall, a basalt base course, a shopfront storey below y 4, and a smooth-stone coping on top
function facade(x, y, z) {
  const fx = y >= top(x - 1, z) || y >= top(x + 1, z);  // the open side is along x: the wall runs along z
  const fz = y >= top(x, z - 1) || y >= top(x, z + 1);
  const along = fx ? z : x;
  const pier = (fx && fz) || along % 3 === 0;
  if (y === T[x][z] - 1) return ["smooth_stone"];
  if (y === G[x][z]) return ["polished_basalt"];
  if (y < 4) {
    if (y === 3) return ["light_gray_concrete"];
    return pier ? ["polished_andesite"] : ["glass"];
  }
  const k = y % 4;
  if (k === 0) return ["light_gray_concrete"];
  if (k === 3) return ["gray_concrete"];
  if (pier) return ["light_gray_concrete"];
  return ["light_blue_stained_glass"];
}

// what a footprint voxel holds: a plinth below its ground, the facade where exposed, otherwise floor slabs and a deck
function cellBlock(x, y, z) {
  const g = G[x][z];
  if (y < g) return ["polished_basalt"];
  if (exposed(x, y, z)) return facade(x, y, z);
  if (y === g) return ["smooth_stone"];
  if (y === T[x][z] - 1) return ["gray_concrete"];
  if (y % 4 === 0) return ["light_gray_concrete"];
  return null;
}

const g = new Voxels([W, H, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (let y = 0; y < T[x][z]; y++) {
    const b = cellBlock(x, y, z);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// the entrance: a door on the south face nearest the middle, two blocks tall, under a slab canopy on two posts
const faces = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) for (const [dx, dz] of DIRS) {
  if (!inside(x + dx, z + dz)) faces.push({ x, z, dx, dz });
}
const southFaces = faces.filter((f) => f.dz === 1 && f.dx === 0).sort((a, b) => Math.abs(a.x - 15) - Math.abs(b.x - 15));
const ent = southFaces[0] ?? faces[0];
const facing = { "0,1": "north", "0,-1": "south", "1,0": "west", "-1,0": "east" }[`${ent.dx},${ent.dz}`];
const ey = G[ent.x][ent.z];
g.set(ent.x, ey, ent.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ent.x, ey + 1, ent.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
const lat = ent.dx !== 0 ? [0, 1] : [1, 0];                       // the wall's direction, across the door
for (const o of [1, 2]) for (const l of [-1, 0, 1]) {
  if (o === 2 && l === 0) continue;                                // the outer row is held up by two posts at its ends
  const cx = ent.x + ent.dx * o + lat[0] * l, cz = ent.z + ent.dz * o + lat[1] * l;
  if (!inside(cx, cz)) g.set(cx, ey + 2, cz, "smooth_stone_slab", { type: "bottom" });
}
for (const l of [-1, 1]) {
  const px = ent.x + ent.dx * 2 + lat[0] * l, pz = ent.z + ent.dz * 2 + lat[1] * l;
  if (inside(px, pz)) continue;
  for (let y = 0; y <= ey + 1; y++) g.set(px, y, pz, "polished_andesite");
}

// warm light behind some glass: a glowstone on the first window row, in the air just inside the pane
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (let y = 1; y < T[x][z] - 1; y++) {
    if (y % 4 !== 1 || y < G[x][z]) continue;
    const b = cellBlock(x, y, z);
    if (!b || b[0] !== "light_blue_stained_glass" || (x * 7 + y * 5 + z * 11) % 5 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (!inside(nx, nz) || y < G[nx][nz] || y >= T[nx][nz] - 1 || cellBlock(nx, y, nz)) continue;
      g.set(nx, y, nz, "glowstone");
      break;
    }
  }
}

// roof plant: three 3 x 2 boxes on the main roof, each with a ring of main-roof cells around it, two blocks tall
const plant = [];
for (let x = 0; x < W && plant.length < 3; x++) for (let z = 0; z < D && plant.length < 3; z++) {
  let ok = true;
  for (let dx = -1; dx <= 3 && ok; dx++) for (let dz = -1; dz <= 2 && ok; dz++) {
    if (!inside(x + dx, z + dz) || T[x + dx][z + dz] !== 62) ok = false;
  }
  if (!ok || plant.some(([px, pz]) => Math.abs(px - x) < 6 && Math.abs(pz - z) < 6)) continue;
  plant.push([x, z]);
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) for (let y = 62; y < 64; y++) {
    g.set(x + dx, y, z + dz, "light_gray_concrete");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861521.nbt");
