// Mt Eden / Eden Terrace side (way 269468262): a 1980s mixed-use block on the crater's downhill edge, six storeys over a
// shopfront ground floor. Lidar roofs are median-smoothed and snapped to the 4-block storey grid (24, 20, 16, 12, 8, 4):
// a six-storey slab stepping down to two- and three-storey wings. Pale precast facade (white piers, light-grey spandrels,
// a white string course per storey), blue glass in a 3-block rhythm, a dark stone sill and shopfront at street level, a
// dark-oak door under a dark lintel band, parapets and plant boxes on the roof, glowstone behind some upper panes.
// Every column is solid from y 0 up to its roof (foundation below the ground), so no tier floats. Interiors are air
// with a floor slab per storey; the facade's inner layer is air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269468262.cells.json`, "utf8"));
const W = 58, D = 52, H = 39;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
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

// median-smoothed lidar roof, snapped to a storey tier (24 = six storeys, down to 4 = one)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (r) => (r >= 22 ? 24 : r >= 18 ? 20 : r >= 14 ? 16 : r >= 10 ? 12 : r >= 6 ? 8 : 4);
const TOP = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  let top = tierOf(median(x, z));
  while (top < G[x][z] + 4) top += 4;   // at least one storey above its own ground
  TOP[x][z] = top;
}

// a cell face is open to the air at height y on the footprint edge, or where a neighbour's column has stopped below y
const exposed = (x, z, y) => dist[x][z] === 1 || NEIGH.some(([dx, dz]) => inside(x + dx, z + dz) && TOP[x + dx][z + dz] <= y);
const shopEnd = (g) => Math.floor(g / 4) * 4 + 4;                        // ground storey ends here (fascia row is shopEnd - 1)
const pier = (x, z) => (x + z) % 3 === 0;                                 // a 3-block mullion rhythm along any face
const windowRow = (y, g) => (y < shopEnd(g) ? y > g && y < shopEnd(g) - 1 : y % 4 === 1 || y % 4 === 2);

// the facade of an exposed cell at height y (below its roof)
function facadeBlock(x, z, y) {
  const g = G[x][z], end = shopEnd(g);
  if (y < end) {                                                          // shopfront
    if (y === g) return "polished_andesite";                              // dark stone sill
    if (y === end - 1) return "white_concrete";                           // fascia
    return pier(x, z) ? "polished_andesite" : "light_blue_stained_glass";
  }
  const r = y % 4;
  if (r === 0) return "light_gray_concrete";                              // spandrel
  if (r === 3) return "white_concrete";                                   // string course
  return pier(x, z) ? "white_concrete" : "light_blue_stained_glass";      // window band
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g = G[x][z], top = TOP[x][z], dd = dist[x][z];
  for (let y = 0; y < g; y++) {                                           // foundation up to this cell's ground, a course line on the open face
    put(x, y, z, dd === 1 && y % 4 === 3 ? "smooth_stone" : "stone_bricks");
  }
  for (let y = g; y < top; y++) {
    if (y === top - 1) { put(x, y, z, dd === 1 ? "smooth_stone" : "gray_concrete"); continue; }   // cornice / roof membrane
    if (exposed(x, z, y)) { put(x, y, z, facadeBlock(x, z, y)); continue; }
    if (dd === 2) {                                                       // inner layer: air behind the glass, else solid
      if (windowRow(y, g)) continue;
      put(x, y, z, y % 4 === 0 || y === g ? "light_gray_concrete" : "white_concrete");
    } else if (y === g || y % 4 === 0) {                                  // interior: a floor slab per storey, air between
      put(x, y, z, "light_gray_concrete");
    }
  }
}

// parapets on the outer ring, with a slab cap
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1) {
  put(x, TOP[x][z], z, "white_concrete");
  put(x, TOP[x][z] + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// plant boxes on the roof of the tall core, 2 x 2 x 2 with a slab cap
for (let x = 4; x + 1 < W; x += 10) for (let z = 3; z + 1 < D; z += 8) {
  const t = TOP[x][z];
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (t < 20 || !cs.every(([a, b]) => inside(a, b) && dist[a][b] >= 3 && TOP[a][b] === t)) continue;
  for (const [a, b] of cs) {
    put(a, t, b, "light_gray_concrete");
    put(a, t + 1, b, "light_gray_concrete");
    put(a, t + 2, b, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// glowstone behind some upper panes: inner-layer air cells that a glass pane looks through
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 2) {
  const g = G[x][z];
  for (let y = shopEnd(g); y < TOP[x][z] - 1; y++) {
    if (!windowRow(y, g) || (x * 5 + z * 7 + y * 3) % 13 !== 0) continue;
    if (NEIGH.some(([dx, dz]) => inside(x + dx, z + dz) && dist[x + dx][z + dz] === 1 && !pier(x + dx, z + dz))) {
      put(x, y, z, "glowstone");
    }
  }
}

// the entrance: the lowest street-edge cell nearest the middle, facing out; a double-height door under a dark lintel
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
put(dx0, gy, dz0, "dark_oak_door", doorState("lower"));
put(dx0, gy + 1, dz0, "dark_oak_door", doorState("upper"));
// the room behind the door is open: clear the inner cell's wall for the door's height
const ix = dx0 - nx, iz = dz0 - nz;
for (let y = gy; y < gy + 3; y++) put(ix, y, iz, "air");
// dark lintel band over the door, along the face
const tx = nz !== 0 ? 1 : 0, tz = nx !== 0 ? 1 : 0;
for (let k = -1; k <= 1; k++) {
  const a = dx0 + k * tx, b = dz0 + k * tz;
  if (inside(a, b) && dist[a][b] === 1) put(a, gy + 2, b, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

const info = v.save(`${DIR}/way_269468262.nbt`);
console.log(`way_269468262: ${info.blocks} blocks, palette ${info.palette}; door at ${dx0},${gy},${dz0} facing ${facing}`);
