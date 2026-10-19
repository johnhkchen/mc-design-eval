// 149 West 45 Street (NYC 1022633), Lyceum Theatre, 1903, Commercial & Office. A ten-storey Renaissance Revival block of
// red brick on a granite base: a shopfront storey, a calcite belt course at every 3-block floor line, paired glass
// windows between brick piers, a calcite cornice and a stone parapet. The lidar roof gives a tall block at 30 across the
// north, a 27 wing, a 24 street wing along the south end (the 45th Street front, with the entrance), a 7 annex on the
// north strip and an open court. Rooftop: a glowing penthouse on the tall block and a brick stack on the street wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1022633.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 24, D = 54;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const GROUND = Array.from({ length: W }, () => Array(D).fill(null));
const RAW = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) { GROUND[x][z] = g; RAW[x][z] = r; }
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && GROUND[x][z] !== null;

// The lidar roof is speckled: a 3x3 median cleans it, then the cell snaps to the tiers the data shows.
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) v.push(RAW[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (v) => (v <= 2 ? 0 : v <= 12 ? 7 : v <= 25 ? 24 : v <= 28 ? 27 : 30);   // 0 = open court
const TIER = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (has(x, z)) TIER[x][z] = tierOf(median(x, z));

// Distance in cells from the footprint edge: 0 = perimeter (a wall), 1 = the room behind it.
const DIST = Array.from({ length: W }, () => Array(D).fill(Infinity));
let frontier = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++)
  if (has(x, z) && DIRS.some(([dx, dz]) => !has(x + dx, z + dz))) { DIST[x][z] = 0; frontier.push([x, z]); }
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && DIST[nx][nz] === Infinity) { DIST[nx][nz] = DIST[x][z] + 1; next.push([nx, nz]); }
  }
  frontier = next;
}

// Faces of a cell at height y that are outside the building: no neighbour, or a neighbour whose roof is below y.
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz) || TIER[x + dx][z + dz] <= y);

// The block map: key "x,y,z" -> { block, state }. Written to the Voxels at the end, after the glass knows its neighbours.
const B = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(key(x, y, z), { block, state });
const glass = [];

// Doorway on the 45th Street front (south, z 53): double-height door at the cell's ground, granite jambs, a black transom.
const DOOR_X = 11, FRONT_Z = D - 1;

// One exterior wall block. Corners are calcite quoins; the ground storey is a granite base and a shopfront with glass
// between granite piers; above it, a belt course at every floor line (y % 3 == 0), paired windows in brick piers.
function wallBlock(x, y, z, T, g, ex) {
  if (y === g && y < 3) return "polished_granite";
  if (y === T - 1) return "stone_bricks";                  // parapet
  if (y === T - 2) return "calcite";                       // cornice
  if (ex.length >= 2) return "calcite";                    // quoins
  const onZ = ex.some(([, dz]) => dz !== 0);               // a face whose normal is along z runs along x
  const pier = (onZ ? x : z) % 3 === 0;
  if (y < 3) return pier ? "polished_granite" : "glass_pane";
  if (y % 3 === 0) return "calcite";                       // belt course at the floor line
  if (y <= T - 3 && !pier) return "glass_pane";            // two window rows under each belt
  return "bricks";
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!has(x, z)) continue;
  const g = GROUND[x][z], T = TIER[x][z];

  if (T === 0) {                                           // open court: paving on the foundation
    for (let y = 0; y < g; y++) put(x, y, z, y === g - 1 ? "smooth_stone" : "stone_bricks");
    if (g === 0) put(x, 0, z, "smooth_stone");
    continue;
  }
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks"); // foundation up to the lowest of the cell's ground

  for (let y = g; y < T; y++) {
    const ex = faces(x, z, y);
    const edge = DIST[x][z] === 0 || ex.length > 0;
    if (!edge) {                                           // room behind the glass: air, with floor slabs and a roof
      if (y === g || (y % 3 === 0 && y > 0)) put(x, y, z, "smooth_stone");
      else if (y === T - 1) put(x, y, z, "blackstone");
      continue;
    }
    if (z === FRONT_Z && y >= g && y <= g + 1 && (x === DOOR_X || x === DOOR_X - 1 || x === DOOR_X + 1)) {
      if (x === DOOR_X) {
        const half = y === g ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      } else put(x, y, z, "polished_granite");
      continue;
    }
    if (z === FRONT_Z && y === g + 2 && Math.abs(x - DOOR_X) <= 1 && g < 3) { put(x, y, z, "black_concrete"); continue; }
    const block = wallBlock(x, y, z, T, g, ex);
    put(x, y, z, block);
    if (block === "glass_pane") glass.push({ x, y, z, out: ex[0] });
  }
}

// Warm light behind some upper windows, standing on the floor slab, in the room the glass looks into.
for (const { x, y, z, out } of glass) {
  if (y % 3 !== 1 || y < 4) continue;
  if (((x * 7) + (z * 3) + y) % 8 !== 0) continue;
  const ix = x - out[0], iz = z - out[1];
  if (!has(ix, iz) || DIST[ix][iz] === 0 || B.has(key(ix, y, iz))) continue;
  put(ix, y, iz, (x + z) % 3 === 0 ? "shroomlight" : "glowstone");
}

// Find the nearest n x n square of cells at roof tier t, all in the room (not on the perimeter), to the target.
function squareAt(n, t, [tx, tz]) {
  let best = null;
  for (let x0 = 0; x0 + n <= W; x0++) for (let z0 = 0; z0 + n <= D; z0++) {
    let ok = true;
    for (let dx = 0; dx < n && ok; dx++) for (let dz = 0; dz < n && ok; dz++)
      ok = has(x0 + dx, z0 + dz) && TIER[x0 + dx][z0 + dz] === t && DIST[x0 + dx][z0 + dz] >= 1;
    if (!ok) continue;
    const d = Math.abs(x0 + (n - 1) / 2 - tx) + Math.abs(z0 + (n - 1) / 2 - tz);
    if (!best || d < best.d) best = { x0, z0, d };
  }
  return best;
}

// Rooftop penthouse on the tall block: a 3 x 3 box, floor on the tar roof, glass on the sides, a stone cap, a light inside.
const PH = squareAt(3, 30, [11, 40]);
if (PH) {
  const { x0, z0 } = PH;
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
    const x = x0 + dx, z = z0 + dz, corner = dx !== 1 && dz !== 1;
    put(x, 30, z, "polished_granite");
    put(x, 33, z, "stone_bricks");
    if (dx === 1 && dz === 1) { put(x, 31, z, "glowstone"); continue; }
    put(x, 31, z, corner ? "bricks" : "glass_pane");
    put(x, 32, z, corner ? "bricks" : "glass_pane");
  }
}

// A brick stack on the street wing's roof: a 2 x 2 flue, cap stone.
const ST = squareAt(2, 24, [18, 50]);
if (ST) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    const x = ST.x0 + dx, z = ST.z0 + dz;
    for (let y = 24; y < 27; y++) put(x, y, z, "bricks");
    put(x, 27, z, "stone_bricks");
  }
}

// Glass panes connect to whatever stands beside them (piers, glass, quoins), as the game draws a pane run.
const PANE_SIDES = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
const side = (x, y, z, s) => { const [dx, dz] = PANE_SIDES[s]; return B.has(key(x + dx, y, z + dz)) ? "true" : "false"; };

const g = new Voxels([W, 42, D]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (block === "glass_pane") {
    g.set(x, y, z, block, { east: side(x, y, z, "east"), north: side(x, y, z, "north"), south: side(x, y, z, "south"), west: side(x, y, z, "west"), waterlogged: "false" });
  } else g.set(x, y, z, block, state);
}
const out = g.save(`${HERE}/NYC1022633.nbt`);
console.log(`NYC1022633.nbt: ${out.blocks} blocks, palette ${out.palette}`);
