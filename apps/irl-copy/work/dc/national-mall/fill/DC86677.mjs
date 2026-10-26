// 1133 15th St NW: a six-storey pale-stone and tinted-glass office on a stepped massing.
// The lidar roof is snapped to three flat tiers (19 tower, 16 wings, 13 front range), and each storey is 3 blocks
// (a 4-block ground floor). A shell of walls sits on the footprint's outer faces and on every step face, a one-block
// air gap stands behind the glass, and a solid core keeps every tier standing on what is below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86677.cells.json", "utf8"));
const W = 24, D = 13, H = 31;

const ground = Array.from({ length: W }, () => Array(D).fill(null));
const roofRaw = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) { ground[x][z] = g; roofRaw[x][z] = r; }
const onFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] !== null;

// Lidar noise: roof readings under 10 are not roofs (three cells read 3); take the median of the real neighbours.
const roofFixed = roofRaw.map((col, x) => col.map((r, z) => {
  if (r !== null && r >= 10) return r;
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const a = x + dx, b = z + dz;
    if ((dx || dz) && onFoot(a, b) && roofRaw[a][b] >= 10) near.push(roofRaw[a][b]);
  }
  near.sort((p, q) => p - q);
  return near[near.length >> 1];
}));
// Flat tiers: 18-19 is the tower, 15-17 the wings, the 14 front range; heights are the tops of the solid.
const tier = (r) => (r >= 18 ? 19 : r >= 15 ? 16 : 13);
const top = (x, z) => tier(roofFixed[x][z]);
const g0 = (x, z) => ground[x][z];

// Storey lines (floor slabs) above the ground floor: a 4-block ground storey, then 3-block storeys.
const FLOORS = [4, 7, 10, 13, 16];
const GROUND_TOP = 3;                  // the shopfront glass runs from the ground line up to here

const inV = (x, y, z) => onFoot(x, z) && y >= g0(x, z) && y < top(x, z);
const shell = (x, y, z) => inV(x, y, z) &&
  (!inV(x - 1, y, z) || !inV(x + 1, y, z) || !inV(x, y, z - 1) || !inV(x, y, z + 1));
const ring = (x, y, z) => inV(x, y, z) && !shell(x, y, z) &&
  (shell(x - 1, y, z) || shell(x + 1, y, z) || shell(x, y, z - 1) || shell(x, y, z + 1));

// The front (south, z = D-1) entrance: two door cells recessed one block in, lintel above.
const ENTRY_X = [10, 13];
const inEntryOpening = (x, y, z) => z === D - 1 && x >= ENTRY_X[0] && x <= ENTRY_X[1] &&
  y >= g0(x, z) + 1 && y <= g0(x, z) + 2;
const isDoor = (x, y, z) => z === D - 2 && (x === 11 || x === 12) && y >= g0(x, z) + 1 && y <= g0(x, z) + 2;

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < H) v.set(x, y, z, block, state); };
const box = (x0, x1, y0, y1, z0, z1, block) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, block);
};

// Pier columns: every third bay on a face, and both corners of a face are piers.
const pierAt = (x, z, exX, exZ) => {
  if (exX && exZ) return true;
  if (exX) return z % 3 === 0 || z === D - 1;
  return x % 3 === 0 || x === W - 1;
};

const TINT_GLASS = "light_blue_stained_glass_pane", SHOP_GLASS = "gray_stained_glass_pane";
const panes = new Map();                                             // "x,y,z" -> pane block, joined to its neighbours below
const STONE = "smooth_quartz", BASE = "stone_bricks", CORE = "smooth_stone";

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (ground[x][z] === null) continue;
  const g = g0(x, z), t = top(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, BASE);                    // foundation under the lower ground
  for (let y = g; y < t; y++) {
    const exX = !inV(x - 1, y, z) || !inV(x + 1, y, z);
    const exZ = !inV(x, y, z - 1) || !inV(x, y, z + 1);
    if (inEntryOpening(x, y, z) || isDoor(x, y, z)) continue;        // the open doorway is air; doors written below
    if (z === D - 1 && x >= ENTRY_X[0] - 1 && x <= ENTRY_X[1] + 1 && y === g + 3) { put(x, y, z, STONE); continue; }
    if (shell(x, y, z)) {
      if (y === t - 1) { put(x, y, z, BASE); continue; }             // parapet
      if (y === g) { put(x, y, z, BASE); continue; }                 // base course
      if (FLOORS.includes(y)) { put(x, y, z, STONE); continue; }     // spandrel at each floor line
      const ground_ = y <= GROUND_TOP;
      if (pierAt(x, z, exX, exZ)) { put(x, y, z, ground_ ? BASE : STONE); continue; }
      panes.set(`${x},${y},${z}`, ground_ ? SHOP_GLASS : TINT_GLASS);
      continue;
    }
    // interior: floors and roof are solid, the window gap behind the glass is air, the rest is solid core
    if (y === g || FLOORS.includes(y) || y === t - 1) { put(x, y, z, CORE); continue; }
    if (ring(x, y, z)) continue;
    put(x, y, z, CORE);
  }
}

// Glass panes join the neighbouring panes of their own wall (never across a pier or the air gap).
for (const [key, block] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const join = (a, b, c) => (panes.has(`${a},${b},${c}`) ? "true" : "false");
  put(x, y, z, block, { east: join(x + 1, y, z), west: join(x - 1, y, z), north: join(x, y, z - 1), south: join(x, y, z + 1), waterlogged: "false" });
}

// Doors: a double door two blocks high, set in the recess; a hanging lantern either side of the opening.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (ground[x][z] === null) continue;
  const g = g0(x, z);
  if (isDoor(x, g + 1, z)) {
    const hinge = x === 11 ? "left" : "right";
    for (const half of ["lower", "upper"]) {
      put(x, half === "lower" ? g + 1 : g + 2, z, "oak_door",
        { facing: "south", half, hinge, open: "false", powered: "false" });
    }
  }
}
for (const x of ENTRY_X) {
  const g = g0(x, D - 1);
  put(x, g + 2, D - 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light in some windows: a lantern on the ground floor, a glowstone or shroomlight in the window gap above.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (ground[x][z] === null) continue;
  const g = g0(x, z), t = top(x, z);
  for (let y = g + 1; y < t - 1; y++) {
    if (!shell(x, y, z) || FLOORS.includes(y) || inEntryOpening(x, y, z)) continue;
    const exX = !inV(x - 1, y, z) || !inV(x + 1, y, z);
    const exZ = !inV(x, y, z - 1) || !inV(x, y, z + 1);
    if (pierAt(x, z, exX, exZ) || y === t - 1 || y === g) continue;
    const inward = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].find(([a, b]) => inV(a, y, b) && !shell(a, y, b));
    if (!inward) continue;
    const h = (x * 7 + y * 13 + z * 29) % 11;
    if (y <= GROUND_TOP && h % 3 === 0) put(inward[0], y, inward[1], "lantern", { hanging: "false", waterlogged: "false" });
    if (y > GROUND_TOP && h === 0) put(inward[0], y, inward[1], "glowstone");
  }
}

// Roof plant on the tower: two boxes of mechanical units standing on the roof.
box(9, 11, 19, 19, 2, 3, "light_gray_concrete");
box(16, 18, 19, 19, 4, 5, "light_gray_concrete");

const stats = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86677.nbt");
console.log(JSON.stringify(stats));
