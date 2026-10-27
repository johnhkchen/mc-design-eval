// The Vincent (way 260078289), Eden Terrace side of the CBD ridge: a 1980s-style concrete-frame tower of about 13 storeys
// on a basalt base. The lidar roof is flat at 62 blocks over most of the footprint, with a few low cells (3 to 5: a wing or
// an atrium roof) and edge noise. Roofs are median-smoothed (3x3) and snapped to a 4-block storey grid: >= 58 is the tower
// (roof 60 + parapet to 62), anything lower is a tier at its nearest storey line, at least 12. Storey lines sit on absolute
// y (slabs at 8, 12, ..., 60), so neighbouring cells line up. Everything below 8 is solid basalt (the foundation, and the
// base course where the ground is lower). Walls are the one-block ring at the footprint edge and at every step down; they
// carry the facade: a basalt band at 8, light-grey spandrels on each storey line, pale-concrete piers every 3 blocks and
// blue glass between them, a pale corner pier, a cornice on each tier, and a pale parapet. The entrance is a dark-oak
// door on the south face with a shroomlight behind. Some windows have glowstone behind the glass (an air gap, not a room).
// Interiors are air with a slab per storey, and the roof plant is a few pale blocks on the tower roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260078289.cells.json", "utf8"));
const W = 43, D = 40, H = 75;
const BASE = 8;                                  // the ground-storey slab line, above the lowest ground
const TOWER = 60;                                // the tower's roof (the parapet is one block above, 61)
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
// the top (roof line) of each cell: the tower, or a tier on the storey grid
const L = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z);
  L[x][z] = r >= 58 ? TOWER : Math.min(TOWER - 4, Math.max(BASE + 4, 4 * Math.round(r / 4)));
}
// the sides a cell shows to the outside: off the footprint, or down a step to a lower tier
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || L[x + dx][z + dz] < L[x][z]);

// distance in cells from the footprint edge (for the roof plant, which sits in from the parapet)
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1))) {
  dist[x][z] = 1; queue.push([x, z]);
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// the entrance: a wall cell on the south face, near the middle of that face
const south = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const ex = exposed(x, z);
  if (ex.length === 1 && ex[0][2] === "south") south.push([x, z]);
}
south.sort((a, b) => a[0] - b[0]);
const door = south.length ? south[south.length >> 1] : null;

const V = new Voxels([W, H, D]);
const isWall = (x, z) => exposed(x, z).length > 0;

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const top = L[x][z], ex = exposed(x, z), wall = ex.length > 0, corner = ex.length > 1;
  // foundation and base course: solid basalt from the bottom up to the ground storey line
  for (let y = 0; y < BASE; y++) V.set(x, y, z, "polished_andesite");

  if (!wall) {
    // an interior: a slab on each storey line (the roof on top), air between: no room is filled
    for (let y = BASE; y <= top; y += 4) V.set(x, y, z, "light_gray_concrete");
    if (top === TOWER && dist[x][z] >= 4 && x % 6 < 2 && z % 6 < 2) V.set(x, TOWER + 1, z, "light_gray_concrete");   // roof plant
    continue;
  }

  // the facade: u runs along the single exposed face (x for a north or south face, z for an east or west one)
  const [dx, dz] = ex[0];
  const u = dz !== 0 ? x : z;
  for (let y = BASE; y <= top; y++) {
    let block;
    if (y === BASE) block = "polished_andesite";                         // the basalt band at the ground storey line
    else if (y % 4 === 0) block = "light_gray_concrete";                 // spandrel on each storey line
    else if (corner || u % 3 === 0) block = "white_concrete";            // pale pier, and the corner
    else block = y > top - 4 ? "gray_stained_glass" : "light_blue_stained_glass";   // the top storey of each tier is a darker crown
    V.set(x, y, z, block);

    // some windows are lit: glowstone one block in, behind the glass (an air gap, not a room)
    if (block.endsWith("stained_glass") && (x * 7 + z * 13 + y * 5) % 9 === 0 && !corner) {
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && !isWall(ix, iz)) V.set(ix, y, iz, "glowstone");
    }
  }
  // a cornice and parapet on the tier's roof line
  V.set(x, top + 1, z, "white_concrete");
}

// the entrance: a dark-oak door (2 high) on the south face, with a shroomlight inside
if (door) {
  const [x, z] = door;
  for (const [y, half] of [[BASE, "lower"], [BASE + 1, "upper"]]) {
    V.set(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
  }
  V.set(x, BASE + 1, z - 1, "shroomlight");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260078289.nbt";
const { blocks, palette } = V.save(out);
console.log(`The Vincent: ${blocks} blocks, ${palette} palette entries, ${south.length} south wall cells, door ${door ? door.join(",") : "none"}`);
