// Commercial Bay, Auckland: a 2010s glass-and-concrete office tower complex on a stone-plinth podium.
// Massing follows the lidar roof per cell (median-smoothed, snapped to 8-block tiers, so setbacks step in as it rises).
// Each storey is 4 blocks: a white concrete slab at y % 4 == 0, two window rows, and a spandrel at y % 4 == 3.
// The perimeter is a 1-block glass-and-mullion wall; the cells behind it are air (an air gap behind the glass),
// and every slab sits on the spandrel below it, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 140, D = 177, Y = 222;
const cells = JSON.parse(readFileSync(`${DIR}/way_1486395920.cells.json`, "utf8"));

const ix = (x, z) => x * D + z;
const G = new Int16Array(W * D).fill(-1);   // lowest ground under each cell, -1 = outside the footprint
const R = new Int16Array(W * D);            // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[ix(x, z)] = g; R[ix(x, z)] = r; }

// A built cell has a roof clearly above its ground; the rest is open ground (courtyard, atrium, plaza).
const built = new Uint8Array(W * D);
for (let i = 0; i < W * D; i++) if (G[i] >= 0 && R[i] > G[i] + 3) built[i] = 1;

// Roof tier per built cell: median of built roofs in a 5x5 window, snapped to 8 blocks (two storeys).
const T = new Int16Array(W * D);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const i = ix(x, z); if (!built[i]) continue;
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const nx = x + dx, nz = z + dz;
    if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue;
    const j = ix(nx, nz); if (built[j]) vals.push(R[j]);
  }
  vals.sort((a, b) => a - b);
  T[i] = Math.min(208, Math.max(8, Math.round(vals[vals.length >> 1] / 8) * 8));
}
// Second pass on the tiers: a one- or two-cell lidar spike no longer stands as a needle beside its neighbours.
const T1 = Int16Array.from(T);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const i = ix(x, z); if (!built[i]) continue;
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const nx = x + dx, nz = z + dz;
    if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue;
    const j = ix(nx, nz); if (built[j]) vals.push(T1[j]);
  }
  vals.sort((a, b) => a - b);
  T[i] = vals[vals.length >> 1];
}

// Deterministic scatter, so the same run gives the same building.
const hash = (x, y, z) => (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0;

const env = (x, y, z) => x >= 0 && z >= 0 && x < W && z < D && built[ix(x, z)] === 1 && y >= 0 && y < T[ix(x, z)];
const exposedZ = (x, y, z) => !env(x, y, z + 1) || !env(x, y, z - 1);   // the wall runs along x
const exposedX = (x, y, z) => !env(x + 1, y, z) || !env(x - 1, y, z);   // the wall runs along z
const perim = (x, y, z) => exposedZ(x, y, z) || exposedX(x, y, z);
const outsideFootprint = (x, z) => x < 0 || z < 0 || x >= W || z >= D || G[ix(x, z)] < 0;
const glassFor = (top) => (top >= 120 ? "light_blue_stained_glass" : "cyan_stained_glass");

// Entrances: ground-floor street frontage (footprint edge onto open ground outside), one door per 12 bays.
const doors = new Map();   // "x,z" -> facing
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const i = ix(x, z);
  if (!built[i] || G[i] !== 0 || !perim(x, 1, z)) continue;
  const zWall = exposedZ(x, 1, z), xWall = exposedX(x, 1, z);
  const bay = zWall ? x : z;
  if (bay % 12 !== 4) continue;
  if (zWall && outsideFootprint(x, z + (outsideFootprint(x, z - 1) ? -1 : 1))) doors.set(`${x},${z}`, "north");
  else if (xWall && outsideFootprint(x + (outsideFootprint(x - 1, z) ? -1 : 1), z)) doors.set(`${x},${z}`, "east");
}
const nearDoor = (x, z) => [-1, 0, 1].some((dx) => [-1, 0, 1].some((dz) => doors.has(`${x + dx},${z + dz}`)));

const v = new Voxels([W, Y, D]);
const stats = { built: 0, open: 0, blocks: 0 };

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const i = ix(x, z); if (G[i] < 0) continue;
  const gr = G[i];

  // Open ground inside the footprint: a paved foundation, nothing above it.
  if (!built[i]) {
    stats.open++;
    for (let y = 0; y <= gr; y++) v.set(x, y, z, y === gr ? "smooth_stone" : "stone_bricks");
    continue;
  }
  stats.built++;
  const top = T[i];

  for (let y = 0; y < top; y++) {
    if (y <= gr) { v.set(x, y, z, "stone_bricks"); continue; }      // plinth, up to the lowest ground under the cell
    const m = y % 4;
    if (m === 0) { v.set(x, y, z, "white_concrete"); continue; }   // storey slab
    if (m === 3) { v.set(x, y, z, "light_gray_concrete"); continue; } // spandrel, and the roof cap at top - 1

    // window rows, m = 1 and 2
    if (!perim(x, y, z)) {
      // the air gap behind the glass: warm light in some of the cells beside a window
      const nearGlass = perim(x + 1, y, z) || perim(x - 1, y, z) || perim(x, y, z + 1) || perim(x, y, z - 1);
      if (m === 1 && nearGlass && hash(x, y, z) % 23 === 0) v.set(x, y, z, "glowstone");
      else if (m === 2 && nearGlass && hash(x, y, z) % 31 === 0) v.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (y === 1 || y === 2) {
      if (doors.has(`${x},${z}`)) {
        const facing = doors.get(`${x},${z}`);
        v.set(x, y, z, "iron_door", { facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
    }
    const bay = exposedZ(x, y, z) ? x : z;
    if (bay % 3 === 0) v.set(x, y, z, "iron_block");               // mullion
    else v.set(x, y, z, glassFor(top));                           // glass pane
  }
  if (top >= 8 && nearDoor(x, z)) v.set(x, 3, z, "black_concrete"); // dark canopy over each entrance
}

// Roof: parapet on the edge, plant and terraces inside. Each piece stands on the cap below it.
let mastCell = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const i = ix(x, z); if (!built[i]) continue;
  const top = T[i];
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return outsideFootprint(nx, nz) || !built[ix(nx, nz)] || T[ix(nx, nz)] < top;
  });
  if (edge) { v.set(x, top, z, "light_gray_concrete"); continue; }
  const h = hash(x, top, z);
  if (top <= 40) {
    v.set(x, top - 1, z, "moss_block");                              // podium terrace
    if (h % 3 === 0) v.set(x, top, z, "moss_carpet");
    continue;
  }
  if (h % 11 === 0) {                                                 // plant boxes, 2 or 3 high
    const hh = 2 + (h % 2);
    for (let y = top; y < top + hh; y++) v.set(x, y, z, "gray_concrete");
  } else if (h % 17 === 1) {
    v.set(x, top, z, "iron_block");                                   // rooftop unit
  }
  if (!mastCell || top > T[ix(mastCell[0], mastCell[1])]) mastCell = [x, z];
}
// A mast on the tallest tower, standing on its cap.
if (mastCell) {
  const [mx, mz] = mastCell, top = T[ix(mx, mz)];
  for (let y = top; y < top + 9 && y < Y; y++) v.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false" });
}

v.save(`${DIR}/way_1486395920.nbt`);
console.log(JSON.stringify({ ...stats, doors: doors.size, count: v.count(), mastCell }));
