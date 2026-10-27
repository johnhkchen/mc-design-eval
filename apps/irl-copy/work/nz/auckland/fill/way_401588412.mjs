// Argent Hall, Auckland (way 401588412): a 1980s concrete-frame office tower on a basalt plinth, 16 storeys to a 64-block
// roof. The lidar roof is near flat (62 over most of the footprint), so the core rises to 64 and the outer two cells step
// down to a 60-block terrace: a setback the record does not show, kept shallow. Storey lines sit on an absolute 4-block
// grid so they run level over the slope; the foundation is basalt down to each cell's ground. Facade: white concrete storey
// lines and piers, light-grey spandrels, tinted cyan glass panes (a pier every third pane on the tower, every second on
// the podium), a shopfront on the ground storey, a door on the lowest street face under a lintel, a roof plant room with
// lanterns. Interiors are air with a floor slab per storey; some windows show glowstone on the floor behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588412.cells.json", "utf8"));
const W = 37, D = 27, TOP = 76;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

// edge distance: 1 on the outer ring of the footprint, BFS inwards
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed lidar roof, then tops on the storey grid: core 64, outer ring 60, lower wings where the lidar is low
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // top surface (exclusive) of each cell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z];
  const top = r >= 58 ? (d >= 3 ? 64 : 60) : 4 * Math.round(r / 4);
  H[x][z] = Math.max(top, 4 * Math.ceil((G[x][z] + 8) / 4));  // at least two storeys above the ground under the cell
}

// exposed faces: outside the footprint, or beside a neighbour that stops lower
const exposed = (x, z) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] < H[x][z];
});

// the plan: every block by cell, so panes can be connected to their neighbours before they are set
const plan = new Map();
const put = (x, y, z, block, state) => {
  if (!inside(x, z) || y < 0 || y >= TOP) return;
  plan.set(`${x},${y},${z}`, { block, state });
};

// the entrance: the street face at the lowest ground (a shell cell with a face to outside)
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1) {
  const out = exposed(x, z).filter(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));
  if (out.length && (!door || G[x][z] < G[door.x][door.z])) door = { x, z, out: out[0] };
}

const lamp = (x, y, z) => (x * 7 + y * 13 + z * 3) % 11 === 0;   // about one window in eleven

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g = G[x][z], top = H[x][z], deck = top - 1;
  const ex = exposed(x, z), shell = ex.length > 0;
  const onEW = ex.includes("E") || ex.includes("W");
  const podium = (y) => y < 12;

  // foundation down to the ground, then the deck over the whole cell
  for (let y = 0; y < g; y++) put(x, y, z, "polished_basalt");
  put(x, deck, z, "smooth_stone");

  for (let y = g; y < deck; y++) {
    if (shell) {
      // walls: base course, storey lines, spandrels, and glazing between piers
      const r = y % 4, idx = onEW ? z : x, piers = podium(y) ? 2 : 3;
      if (y === g) put(x, y, z, "polished_basalt");
      else if (r === 0) put(x, y, z, "white_concrete");
      else if (r === 3) put(x, y, z, "light_gray_concrete");
      else if (idx % piers === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "cyan_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    } else if (y === g || y % 4 === 0) {
      put(x, y, z, "smooth_quartz");   // a floor slab per storey, air between
    }
  }
  if (shell) put(x, deck + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // parapet on the exposed top edge
}

// the entrance: a door on the street face, a stone lintel over it and its two neighbours on the face
if (door) {
  const { x, z, out } = door, g = G[x][z];
  put(x, g + 1, z, "dark_oak_door", { facing: FACING[out], half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, g + 2, z, "dark_oak_door", { facing: FACING[out], half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const [dx, dz] of out === "E" || out === "W" ? [[0, -1], [0, 0], [0, 1]] : [[-1, 0], [0, 0], [1, 0]]) {
    if (inside(x + dx, z + dz)) put(x + dx, g + 3, z + dz, "stone_bricks");
  }
}

// warm lights: a glowstone on the floor just behind some panes (on a floor slab, so it stands)
for (const [key, p] of [...plan]) {
  if (p.block !== "cyan_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  if (y % 4 !== 1 || !lamp(x, y, z)) continue;
  const ex = exposed(x, z);
  if (!ex.length) continue;
  const [dx, dz] = DIRS[ex[0]], ix = x - dx, iz = z - dz;   // the inward neighbour, opposite the exposed face
  if (inside(ix, iz) && !plan.has(`${ix},${y},${iz}`)) put(ix, y, iz, "glowstone");
}

// rooftop plant room: walls round a 66-high slab, lanterns on its corners
const plantX = [12, 22], plantZ = [8, 16];
for (let x = plantX[0]; x <= plantX[1]; x++) for (let z = plantZ[0]; z <= plantZ[1]; z++) {
  if (!inside(x, z) || H[x][z] < 64) continue;
  const edge = x === plantX[0] || x === plantX[1] || z === plantZ[0] || z === plantZ[1];
  for (const y of [64, 65]) if (edge) put(x, y, z, "light_gray_concrete");
  put(x, 66, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const [x, z] of [[plantX[0], plantZ[0]], [plantX[1], plantZ[0]], [plantX[0], plantZ[1]], [plantX[1], plantZ[1]]]) {
  put(x, 67, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// panes connect to the solid blocks and panes beside them
const DIR4 = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
for (const [key, p] of plan) {
  if (p.block !== "cyan_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const st = {};
  for (const [side, [dx, dz]] of Object.entries(DIR4)) st[side] = plan.has(`${x + dx},${y},${z + dz}`) ? "true" : "false";
  st.waterlogged = "false";
  p.state = st;
}

const g = new Voxels([W, TOP, D]);
for (const [key, p] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, p.block, p.state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588412.nbt");
console.log(JSON.stringify(out));
