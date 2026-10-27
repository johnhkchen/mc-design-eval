// The Wakefield, Auckland (way 293020887): a 1980s concrete-frame office block on a basalt plinth. Nine storeys over most
// of the footprint, a ten-storey ring round an eleven-storey core, and a two-block plant screen on the core that brings the
// top to 46. Lidar roof heights are median-smoothed and snapped to the 4-block storey grid (36 / 40 / 44). The site falls
// from the north-west (ground 0) to the south-east (ground 9): every column stands on its own foundation, and the downhill
// side shows its extra storeys. Facade: white-concrete piers and band courses, light-grey spandrels, blue glass panes in a
// 4-block storey rhythm, a basalt base course, a double-door entrance under a lintel with hanging lanterns on the west face,
// glowstone behind some panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020887.cells.json", "utf8"));
const W = 75, D = 69, Y = 58;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1);   // each footprint cell's ground (its foundation top), -1 = not footprint
const R = grid(0);    // the lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// roof tiers: the median lidar roof over a 5 x 5 window (footprint cells only), snapped to the 4-block storey grid
const H = grid(-1);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b);
  H[x][z] = Math.round(v[v.length >> 1] / 4) * 4;
}
const TOP = Math.max(...H.flat());   // the core's tier (44)

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E (north is z - 1)
// a wall face is exposed where the next cell is off the footprint or its column has ended below y
const faces = (x, y, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || H[x + dx][z + dz] <= y);

const B = new Map();   // "x,y,z" -> { block, state }
const at = (x, y, z) => B.get(`${x},${y},${z}`);
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const lit = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 7 === 0;

const panes = [], lamps = [];
// one wall cell: a pier every fourth block, a spandrel under each window band, glass between. A cell with two exposed faces
// (every cell on the footprint's diagonal edge has two) takes the face that looks off the footprint, so a stepped edge gets
// bays rather than a column of piers
function facade(x, y, z, ex, h, g) {
  const [dx, dz] = ex.find(([ox, oz]) => !inside(x + ox, z + oz)) ?? ex[0];
  const u = dz !== 0 ? x : z;   // position along the wall
  if (y === h - 1) put(x, h, z, "white_concrete");   // parapet on the roof edge
  if (y === g) return put(x, y, z, "polished_blackstone_bricks");   // basalt base course
  if (u % 4 === 0 || y % 4 === 3) return put(x, y, z, "white_concrete");   // piers and band courses
  if (y % 4 === 0) return put(x, y, z, "light_gray_concrete");   // spandrel
  panes.push({ x, y, z, dx, dz });   // a glass pane (its connections are set after the whole wall is known)
  if (y % 4 === 1 && lit(x, y, z)) lamps.push([x - dx, y, z - dz]);   // a warm light behind some panes
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const g = G[x][z], h = H[x][z];
  for (let y = 0; y < g; y++) put(x, y, z, "stone");   // foundation: fill from y 0 to the cell's ground
  // a taller cell's floor over a lower neighbour's roof: solid at that roof's course, so the step's wall has a floor under it
  const steps = new Set();
  for (const [dx, dz] of DIRS) if (inside(x + dx, z + dz) && H[x + dx][z + dz] < h) steps.add(H[x + dx][z + dz] - 1);
  for (let y = g; y < h; y++) {
    const ex = faces(x, y, z);
    if (ex.length) facade(x, y, z, ex, h, g);
    else if (y === h - 1) put(x, y, z, "gray_concrete");   // roof membrane
    else if (y % 4 === 0 || y === g || steps.has(y)) put(x, y, z, "smooth_stone");   // storey floors
  }
}

// glass panes connect along the wall to whatever stands beside them
for (const { x, y, z, dx, dz } of panes) {
  const on = (ox, oz) => (at(x + ox, y, z + oz) ? "true" : "false");
  const st = dz !== 0 ? { east: on(1, 0), west: on(-1, 0) } : { north: on(0, -1), south: on(0, 1) };
  put(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false", ...st });
}
for (const [x, y, z] of lamps) if (inside(x, z) && !at(x, y, z)) put(x, y, z, "glowstone");

// roof plant on the core: a screen ring two cells in from the core's edge, air-conditioning units inside it
const dist = grid(-1), q = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || H[x][z] !== TOP) continue;
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || H[x + dx][z + dz] !== TOP)) { dist[x][z] = 0; q.push([x, z]); }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && H[nx][nz] === TOP && dist[nx][nz] < 0) { dist[nx][nz] = dist[x][z] + 1; q.push([nx, nz]); }
  }
}
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const d = dist[x][z];
  if (d === 2) { put(x, TOP, z, "light_gray_concrete"); put(x, TOP + 1, z, "light_gray_concrete"); }
  else if (d >= 3 && x % 3 === 0 && z % 3 === 0) put(x, TOP, z, "iron_block");
}

// the entrance: a double door on the west face (x 0, z 6 and 7) at ground level, a lintel course above, lanterns hanging over it
const doorState = (z, half) => ({ facing: "west", half, hinge: z === 6 ? "left" : "right", open: "false", powered: "false" });
for (const z of [6, 7]) {
  put(0, 0, z, "dark_oak_door", doorState(z, "lower"));
  put(0, 1, z, "dark_oak_door", doorState(z, "upper"));
}
put(0, 2, 7, "lantern", { hanging: "true", waterlogged: "false" });

const g = new Voxels([W, Y, D]);
for (const [k, { block, state }] of B) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }
console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020887.nbt"));
