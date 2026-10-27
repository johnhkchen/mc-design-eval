// 55 Symonds Accommodation, Auckland (way 431352653): a 1990s-2000s concrete-frame residential block on Symonds Street, read
// from the lidar: a 16-storey tower (roof 64, its outer ring stepped down to 56 and a plant room on the core up to 67), a
// 12-storey wing (roof 48) on the west, and a 2-storey pavilion (roof 8) on the low south-west corner. Storey lines sit on an
// absolute 4-block grid so they run level over the slope; the foundation is grey concrete down to each cell's ground. Facade:
// white concrete piers and storey lines, light-grey spandrels, light-blue tinted glass panes in a pier every third pane; the
// ground storey is a shopfront (clear glass in dark-oak piers) with a stone lintel and a canopy over the street door. Interiors
// are air with a floor slab per storey; some panes show glowstone on the floor behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_431352653.cells.json", "utf8"));
const W = 53, D = 46, TOP = 79;
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

// median-smoothed lidar roof, then tops on the storey grid (every top is a multiple of 4)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // top surface (exclusive) of each cell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z];
  // tower: core 64, outer two cells set back to 56; wings and pavilions at their lidar storey; never under one storey above ground
  const top = r >= 58 ? (d >= 3 ? 64 : 56) : 4 * Math.round(r / 4);
  H[x][z] = Math.max(top, 4 * Math.ceil((G[x][z] + 4) / 4));
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

// the street door: the lowest outer-ring face with a free side to the street
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
  const idx = onEW ? z : x;
  const L = 4 * Math.ceil((g + 4) / 4);   // first storey line above the ground storey (3 to 7 rows of shopfront)

  // foundation down to the ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone");

  if (shell) {
    for (let y = g; y <= deck; y++) {
      if (y === g) put(x, y, z, "stone_bricks");                                              // base course
      else if (y < L) {                                                                       // shopfront: clear glass, dark-oak piers
        if (idx % 3 === 0) put(x, y, z, "dark_oak_planks");
        else put(x, y, z, "glass_pane");
      }
      else if (y === deck) put(x, y, z, "white_concrete");                                    // cornice
      else if (y % 4 === 0) put(x, y, z, "white_concrete");                                   // storey line
      else if (y % 4 === 3) put(x, y, z, "light_gray_concrete");                              // spandrel
      else if (idx % 3 === 0) put(x, y, z, "white_concrete");                                 // pier (frame)
      else put(x, y, z, "light_blue_stained_glass_pane");
    }
    put(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });             // parapet on every shell top
  } else {
    // interior: a floor slab per storey, air between, a roof deck on top
    for (let y = g; y < deck; y++) if (y === g || y % 4 === 0) put(x, y, z, "smooth_quartz");
    put(x, deck, z, "smooth_stone");
  }
}

// the entrance: a door on the street face at ground, a stone lintel over it and its neighbours on the face, a canopy out
if (door) {
  const { x, z, out } = door, g = G[x][z];
  put(x, g + 1, z, "dark_oak_door", { facing: FACING[out], half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, g + 2, z, "dark_oak_door", { facing: FACING[out], half: "upper", hinge: "left", open: "false", powered: "false" });
  const along = out === "E" || out === "W" ? [[0, -1], [0, 0], [0, 1]] : [[-1, 0], [0, 0], [1, 0]];
  for (const [dx, dz] of along) {
    if (!inside(x + dx, z + dz)) continue;
    put(x + dx, g + 3, z + dz, "stone_bricks");                                                 // lintel
    const [ox, oz] = [x + dx + DIRS[out][0], z + dz + DIRS[out][1]];
    if (!inside(ox, oz)) put(ox, g + 3, oz, "smooth_stone");                                    // canopy, 3 wide, one block out
  }
  const [lx, lz] = [x + DIRS[out][0], z + DIRS[out][1]];
  if (!inside(lx, lz)) put(lx, g + 2, lz, "lantern", { hanging: "true", waterlogged: "false" });  // lantern under the canopy
}

// rooftop plant room: a 9 x 7 box on the core (roof 64), walls to 66, a cap at 67, lanterns on its corners
const core = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === 64 && dist[x][z] >= 3) core.push([x, z]);
const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length), cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
const plantX = [cx - 4, cx + 4], plantZ = [cz - 3, cz + 3];
const plantCells = [];
for (let x = plantX[0]; x <= plantX[1]; x++) for (let z = plantZ[0]; z <= plantZ[1]; z++) {
  if (!inside(x, z) || H[x][z] !== 64) continue;
  plantCells.push([x, z]);
  const edge = x === plantX[0] || x === plantX[1] || z === plantZ[0] || z === plantZ[1];
  for (const y of [64, 65]) if (edge) put(x, y, z, "light_gray_concrete");
  put(x, 66, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const [x, z] of [[plantX[0], plantZ[0]], [plantX[1], plantZ[0]], [plantX[0], plantZ[1]], [plantX[1], plantZ[1]]]) {
  if (plantCells.some(([px, pz]) => px === x && pz === z)) put(x, 67, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// warm lights: a glowstone on the floor just behind some panes, only where a floor slab holds it up
for (const [key, p] of [...plan]) {
  if (p.block !== "light_blue_stained_glass_pane" && p.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  if (!(y % 4 === 1 || y === G[x][z] + 1) || !lamp(x, y, z)) continue;
  const ex = exposed(x, z);
  if (!ex.length) continue;
  const [dx, dz] = DIRS[ex[0]], ix = x - dx, iz = z - dz;   // the inward neighbour, opposite the exposed face
  if (inside(ix, iz) && !plan.has(`${ix},${y},${iz}`) && plan.has(`${ix},${y - 1},${iz}`)) put(ix, y, iz, "glowstone");
}

// panes connect to the solid blocks and panes beside them
const DIR4 = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
for (const [key, p] of plan) {
  if (p.block !== "light_blue_stained_glass_pane" && p.block !== "glass_pane") continue;
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
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_431352653.nbt");
console.log(JSON.stringify(out));
