// 24 West 46th Street, 1920: a mixed residential and commercial brick block. A 17-block brick tower on the north
// (low z) end with a 15-block setback over its east half, and a 5-block shopfront wing to the south. Built as a hollow
// shell: 1-block brick walls, glass panes with air behind them, a stone floor slab per storey, a roof slab under a
// calcite cornice and stone parapet. Lidar roofs are median-smoothed, then snapped to three flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034259.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 5, L = 26, SIZE_Y = 29;

const grid = (v) => Array.from({ length: W }, () => Array(L).fill(v));
const ground = grid(0), roofRaw = grid(0), inFoot = grid(false);
for (const [x, z, g, r] of cells) { ground[x][z] = g; roofRaw[x][z] = r; inFoot[x][z] = true; }

// Median of the 3x3 lidar roofs around a cell (drops the single-cell 0 hole and the 4/15 spikes).
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const a = x + dx, b = z + dz;
    if (a >= 0 && a < W && b >= 0 && b < L && inFoot[a][b]) v.push(roofRaw[a][b]);
  }
  v.sort((p, q) => p - q);
  return v[v.length >> 1];
};
// Three clean tiers: the 17-block tower, the 15-block setback, the 5-block shopfront wing.
const tierOf = (m) => (m >= 16 ? 17 : m >= 10 ? 15 : 5);

const H = grid(0);                       // roof height above y 0 per footprint cell (block layers)
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) if (inFoot[x][z]) H[x][z] = tierOf(median(x, z));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const massAt = (x, z, y) => x >= 0 && x < W && z >= 0 && z < L && inFoot[x][z] && H[x][z] > y;
// A cell on the outside of the massing: solid here, open to the air on this side.
const exposed = (x, z, y, [nx, nz]) => massAt(x, z, y) && !massAt(x + nx, z + nz, y);
const faceOf = (x, z, y) => DIRS.find((d) => exposed(x, z, y, d)) ?? null;
// Piers: the corners of each run of wall, and every third cell along a face; the rest of a face is glazing.
const pierAt = (x, z, y, face) => {
  const tan = face[0] !== 0 ? [0, 1] : [1, 0];
  const u = face[0] !== 0 ? z : x;
  const corner = !exposed(x + tan[0], z + tan[1], y, face) || !exposed(x - tan[0], z - tan[1], y, face);
  return corner || u % 3 === 0;
};
const glassAt = (x, z, y, face) => !pierAt(x, z, y, face);

const DOORS = [
  { x: 0, z: 20, facing: "east" },     // shopfront wing, west face
  { x: 2, z: 25, facing: "north" },    // south end of the wing
];
const isDoor = (x, z, y) => y >= 1 && y <= 2 && DOORS.some((d) => d.x === x && d.z === z);

const g = new Voxels([W, SIZE_Y, L]);

// Foundation: solid from y 0 up to each cell's own ground (none here, but the rule holds for any slope).
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!inFoot[x][z]) continue;
  for (let y = 0; y < ground[x][z]; y++) g.set(x, y, z, "stone_bricks");
}

const GLAZING = { north: "true", south: "true", east: "false", west: "false" };
const lit = (x, y, z) => ((x * 5 + z * 3 + y) % 4 === 0);

for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!inFoot[x][z]) continue;
  const R = H[x][z];
  for (let y = 0; y < R; y++) {
    const face = faceOf(x, z, y);
    if (!face) {
      // Interior: a floor slab on each storey line, the roof slab under the cornice, air everywhere else.
      if (y === 0 || (y % 3 === 0 && y < R - 2) || y === R - 2) g.set(x, y, z, "stone");
      continue;
    }
    const pier = pierAt(x, z, y, face);

    if (y === R - 1) { g.set(x, y, z, "stone_bricks"); continue; }           // parapet
    if (y === R - 2) { g.set(x, y, z, "calcite"); continue; }                // cornice
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }           // base course
    if (isDoor(x, z, y)) {
      const d = DOORS.find((q) => q.x === x && q.z === z);
      const half = y === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: d.facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y <= 2) {                                    // ground floor: shopfront glass in piers of granite
      if (pier) g.set(x, y, z, "polished_granite");
      else g.set(x, y, z, "glass");
      continue;
    }
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                // storey line
    if (pier) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", face[0] !== 0 ? GLAZING :{ north: "false", south: "false", east: "true", west: "true" });
  }
}

// Warm light behind some glass: glowstone on the storey's floor slab, one cell inside the wall.
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!inFoot[x][z]) continue;
  for (let y = 1; y < H[x][z] - 2; y++) {
    const face = faceOf(x, z, y);
    if (!face || isDoor(x, z, y) || y % 3 === 0 || !glassAt(x, z, y, face)) continue;
    const ix = x - face[0], iz = z - face[1];                        // one cell inside the wall
    if (!inFoot[ix]?.[iz] || massAt(ix, iz, y) || !lit(x, y, z)) continue;
    if (y - 1 !== 0 && (y - 1) % 3 !== 0) continue;                 // needs a floor slab under it
    g.set(ix, y, iz, "glowstone");
  }
}

// Penthouse on the setback roof: two blocks of stair-free box sitting on the roof slab (row 13).
for (const x of [2, 3]) for (const z of [4, 5]) for (const y of [14, 15]) g.set(x, y, z, "stone_bricks");

const out = `${DIR}/NYC1034259.nbt`;
const stats = g.save(out);

if (process.argv.includes("--map")) {
  for (let z = 0; z < L; z++) console.log(String(z).padStart(2), H.map((c) => String(c[z]).padStart(2)).join(" "));
}
console.log(`wrote ${out}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
