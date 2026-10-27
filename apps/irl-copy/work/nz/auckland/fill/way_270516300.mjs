// Eden 4 (way 270516300), Mt Eden / Eden Terrace: a five-storey 1970s-80s concrete office block over a shopfront ground
// floor. Lidar roofs are median-smoothed and snapped to two tiers: a five-storey body (roof 20, 4-block storeys) and a
// central core two blocks higher (roof 22, the lidar's 21-22 cells) with its own plant boxes. Pale quartz piers, dark grey
// spandrels and a quartz string course per storey, blue-tinted glass in the window bands, a dark plinth and fascia at the
// street, a dark-oak door in a recess with a lintel, parapets on every roof edge, glowstone and lanterns behind some panes.
// Every column is solid from y 0 up to its roof (foundation below the ground), so no tier floats. No interiors: the glass
// has a one-cell air gap behind it, and everything else is solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_270516300.cells.json`, "utf8"));
const W = 59, D = 73, H = 35;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (NEIGH.some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of NEIGH) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed lidar roof (3 x 3), then two clean tiers: the core at 22, the body at 20
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (r) => (r >= 21 ? 22 : 20);
const TOP = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  TOP[x][z] = Math.max(tierOf(median(x, z)), G[x][z] + 8);   // at least two storeys above its own ground
}

// a cell face is open to the air at height y on the footprint edge, or where a neighbour's column has stopped below y
const exposed = (x, z, y) => dist[x][z] === 1 || NEIGH.some(([dx, dz]) => inside(x + dx, z + dz) && TOP[x + dx][z + dz] <= y);
const pier = (x, z) => (x + z) % 3 === 0;                                 // a 3-block mullion rhythm along any face
// glass rows: the shopfront's two rows above its plinth (ground floor ends at the fascia, y 3), then rows 1 and 2 of each storey
const glassRow = (y, g) => (y < 3 ? y > g : y % 4 === 1 || y % 4 === 2);

// the facade of an exposed cell at height y, below its roof
function facadeBlock(x, z, y) {
  const g = G[x][z];
  if (y === g) return "polished_andesite";                                // dark plinth at the street
  if (y === 3) return "quartz_block";                                     // ground-floor fascia, also the first string course
  if (y % 4 === 0 && y > 3) return "gray_concrete";                       // dark spandrel
  if (y % 4 === 3) return "quartz_block";                                 // string course
  return pier(x, z) ? "quartz_block" : "light_blue_stained_glass";        // glass band, piers every 3 blocks
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g = G[x][z], top = TOP[x][z], dd = dist[x][z];
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");                  // foundation up to this cell's ground
  for (let y = g; y < top; y++) {
    const ex = exposed(x, z, y);
    if (y === top - 1 && !ex) { put(x, y, z, "gray_concrete"); continue; }   // roof membrane inside the parapet
    if (ex) { put(x, y, z, facadeBlock(x, z, y)); continue; }
    if (dd === 2 && glassRow(y, g)) continue;                              // air gap behind the glass
    put(x, y, z, "light_gray_concrete");                                    // floor slabs and the solid core
  }
}

// quartz parapets on every roof edge: the footprint's rim and any step down to a lower neighbour
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const top = TOP[x][z];
  const edge = dist[x][z] === 1 || NEIGH.some(([dx, dz]) => !inside(x + dx, z + dz) || TOP[x + dx][z + dz] < top);
  if (edge) put(x, top, z, "quartz_block");
}

// plant boxes on the roofs of the body and the core: 2 x 2 grey boxes with a stone-slab cap, set in from the parapets
for (let x = 5; x + 1 < W; x += 9) for (let z = 4; z + 1 < D; z += 9) {
  const t = TOP[x][z];
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cs.every(([a, b]) => inside(a, b) && dist[a][b] >= 3 && TOP[a][b] === t)) continue;
  for (const [a, b] of cs) {
    put(a, t, b, "gray_concrete");
    put(a, t + 1, b, "gray_concrete");
    put(a, t + 2, b, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// glowstone behind some glass bands: air-gap cells that a glass pane looks through
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 2) {
  const g = G[x][z];
  for (let y = g; y < TOP[x][z] - 1; y++) {
    if (!glassRow(y, g) || (x * 5 + z * 7 + y * 3) % 11 !== 0) continue;
    if (NEIGH.some(([dx, dz]) => inside(x + dx, z + dz) && dist[x + dx][z + dz] === 1 && !pier(x + dx, z + dz))) {
      put(x, y, z, "glowstone");
    }
  }
}

// lanterns on the shopfront floor, a few cells back from the glass
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 2 && (x * 3 + z * 5) % 9 === 0) {
  const g = G[x][z];
  if (glassRow(g + 1, g)) put(x, g + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// the entrance: the street-edge cell nearest the middle, facing out; a double-height door in a recess, with a lintel
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1) {
  const out = NEIGH.find(([dx, dz]) => !inside(x + dx, z + dz));
  if (!out) continue;
  const score = G[x][z] * 100 + Math.abs(x - W / 2) + Math.abs(z - D / 2);
  if (!door || score < door.score) door = { x, z, out, score };
}
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const { x: dx0, z: dz0, out: [nx, nz] } = door;
const gy = G[dx0][dz0];
const facing = FACING[`${nx},${nz}`];
const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
// the recess: the inner cell is open for the door's height, so the entrance has a floor and a room behind it
const ix = dx0 - nx, iz = dz0 - nz;
for (let y = gy; y < gy + 3; y++) put(ix, y, iz, "air");
put(dx0, gy, dz0, "dark_oak_door", doorState("lower"));
put(dx0, gy + 1, dz0, "dark_oak_door", doorState("upper"));
// dark lintel band over the door, along the face
const tx = nz !== 0 ? 1 : 0, tz = nx !== 0 ? 1 : 0;
for (let k = -1; k <= 1; k++) {
  const a = dx0 + k * tx, b = dz0 + k * tz;
  if (inside(a, b) && dist[a][b] === 1) put(a, gy + 2, b, "gray_concrete");
}

const info = v.save(`${DIR}/way_270516300.nbt`);
console.log(`way_270516300: ${info.blocks} blocks, palette ${info.palette}; door at ${dx0},${gy},${dz0} facing ${facing}`);
