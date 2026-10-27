// Aecom House, Auckland (way 266494219): a 1990s concrete-frame office tower, ten storeys over stepped setbacks (lidar
// roof 40 at the core, 36 around it, 28 and 24 on the wings). The lidar roof is median-smoothed and snapped to the 4-block
// storey grid, so every tier is a whole number of storeys and stands on the one below. Facade: a basalt plinth at the
// ground, a dark-oak-framed shopfront with a door on the north face, then a 4-block storey rhythm (white spandrel and head
// bands, quartz piers every third block, tinted glass between: cyan on the tower, light blue on the wings). Parapets
// on every roof edge; a plant room on the core roof. Glowstone sits behind some panes; interiors are air behind the
// glass with a solid floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_266494219.cells.json", "utf8"));
const W = 70, D = 73, TOP = 54;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// depth in from the footprint edge (1 on the outside ring), by BFS through the footprint
const depth = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { depth[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !depth[nx][nz]) { depth[nx][nz] = depth[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, snapped to whole storeys (4 blocks): the tower tiers and the wings' steps
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));    // the tier's top (roof surface at T - 1)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  T[x][z] = Math.min(40, Math.max(8, 4 * Math.round(median(x, z) / 4)));
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose tier stops below y
const faces = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || T[nx][nz] <= y;
});

// the entrance: the north run's cell nearest the middle, on the lowest ground (door bay at G 0 or 1)
const northRun = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 1 && T[x][z] >= 16) northRun.push([x, z]);
}
const door = northRun.length ? northRun[northRun.length >> 1] : null;
const doorBay = new Set();
if (door) for (const [x, z] of northRun) if (Math.abs(x - door[0]) <= 1 && z === door[1]) doorBay.add(x);

// the volume, cell by cell: null is air; glass records where a pane needs an air gap behind it
const grid = Array.from({ length: W }, () => Array.from({ length: TOP }, () => Array(D).fill(null)));
const glass = [];
const put = (x, y, z, block, state) => { grid[x][y][z] = { block, state }; };

const isGlassy = (x, z) => T[x][z] >= 36;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g = G[x][z], top = T[x][z];
  for (let y = 0; y < top; y++) {
    if (y < g) { put(x, y, z, "polished_basalt"); continue; }                    // foundation under the ground
    const F = faces(x, z, y);
    if (!F.length) {
      put(x, y, z, y === top - 1 ? "smooth_stone" : "light_gray_concrete");      // core and roof cover
      continue;
    }
    // the wall's face is the one on the footprint's edge; a step down inside the footprint is not a wall of its own
    const edge = F.filter(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));
    // the bay rhythm runs along x + z, so a stepped (diagonal) wall keeps its piers and panes as a straight wall does
    const f = edge.length ? edge[0] : F[0], along = x + z;
    const [dx, dz] = DIRS[f];
    const ym = y % 4;
    if (door && doorBay.has(x) && f === "N" && y === g + 3) { put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }   // canopy over the door
    if (y < 4) {                                                               // ground storey: shopfront
      if (y === g) { put(x, y, z, "polished_basalt"); continue; }
      if (door && x === door[0] && z === door[1] && f === "N" && (y === g + 1 || y === g + 2)) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: y === g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === 3) { put(x, y, z, "polished_basalt"); continue; }
      if (along % 4 === 0) { put(x, y, z, "polished_basalt"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", paneState(f));
      glass.push([x, y, z, dx, dz]);
      continue;
    }
    if (y === top - 1) { put(x, y, z, "smooth_quartz"); continue; }             // cornice course
    if (ym === 1 || ym === 2) {
      if (along % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }        // pier
      put(x, y, z, isGlassy(x, z) ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", paneState(f));
      glass.push([x, y, z, dx, dz]);
      continue;
    }
    put(x, y, z, "white_concrete");                                            // spandrel (y%4 0 or 3)
  }
  // a coping on the roof edge: one block up from the tier's top, on the footprint's edge only
  if (depth[x][z] === 1 && faces(x, z, top - 1).length) put(x, top, z, "smooth_quartz");
}

// the pane's connections run along its wall: east-west on a north or south face, north-south on east or west
function paneState(face) {
  const ns = face === "N" || face === "S";
  return { north: String(!ns), south: String(!ns), east: String(ns), west: String(ns), waterlogged: "false" };
}

// an air gap behind each pane (glowstone in some), where the cell behind is solid interior
for (const [x, y, z, dx, dz] of glass) {
  if (y % 4 === 0 || y % 4 === 3) continue;
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || y < G[ix][iz] || y >= T[ix][iz] || faces(ix, iz, y).length) continue;
  grid[ix][y][iz] = (x * 31 + y * 17 + z * 7) % 9 === 0 ? { block: "glowstone" } : null;
}

// the plant room on the core roof: a solid box three blocks high, set in from the roof edges
for (let x = 9; x <= 23; x++) for (let z = 36; z <= 52; z++) {
  if (!inside(x, z) || T[x][z] !== 40 || depth[x][z] < 4) continue;
  put(x, 40, z, "light_gray_concrete"); put(x, 41, z, "light_gray_concrete"); put(x, 42, z, "smooth_stone");
}

// the lanterns in the entrance recess, hanging from the canopy
if (door) {
  const [x, z] = door;
  for (const dxs of [-1, 1]) put(x + dxs, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

const g = new Voxels([W, TOP, D]);
for (let x = 0; x < W; x++) for (let y = 0; y < TOP; y++) for (let z = 0; z < D; z++) {
  const c = grid[x][y][z];
  if (c) g.set(x, y, z, c.block, c.state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_266494219.nbt");
