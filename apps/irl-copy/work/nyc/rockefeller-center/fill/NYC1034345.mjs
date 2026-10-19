// 36 West 47th Street, 1924: a Midtown office block built under the 1916 setback law. A cream terracotta-and-sandstone
// shaft on a gray polished base, with an 18-storey tower core (roof 55) across the middle of the lot, 15- and 10-storey setbacks
// stepping down toward the north and the south ends, and a two-storey shopfront wing on 47th Street (the south face,
// high z) with two entrances. Built as a hollow shell: one-block walls, glass panes with an air gap behind them, a floor slab on
// every storey line, a roof slab on each tier. Every tier height is a storey line plus one (7, 16, 31, 46, 55), so each
// roof sits on a floor slab and each column stands solid from y 0. The lidar roofs are median-smoothed in 3x3, mapped to
// those five tiers, then majority-filtered so no tier is a speckle.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034345.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 22, L = 27, SIZE_Y = 67;

const grid = (v) => Array.from({ length: W }, () => Array(L).fill(v));
const ground = grid(0), roofRaw = grid(0), inFoot = grid(false);
for (const [x, z, g, r] of cells) { ground[x][z] = g; roofRaw[x][z] = r; inFoot[x][z] = true; }

const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < L && inFoot[x][z];

// Median of the 3x3 lidar roofs (drops the single-cell zero holes and the spikes), then one tier per cell.
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(roofRaw[x + dx][z + dz]);
  v.sort((p, q) => p - q);
  return v[v.length >> 1];
};
const tierOf = (m) => (m < 12 ? 7 : m < 24 ? 16 : m < 39 ? 31 : m < 51 ? 46 : 55);
const tier0 = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) if (inFoot[x][z]) tier0[x][z] = tierOf(median(x, z));

// Majority of the 3x3 tiers, ties to the taller one: removes the speckle where two tiers meet.
const H = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!inFoot[x][z]) continue;
  const count = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) {
    const t = tier0[x + dx][z + dz]; count.set(t, (count.get(t) ?? 0) + 1);
  }
  let best = 0, bestN = -1;
  for (const [t, n] of count) if (n > bestN || (n === bestN && t > best)) { best = t; bestN = n; }
  H[x][z] = best;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const solid = (x, z, y) => inside(x, z) && H[x][z] > y;
const exposed = (x, z, y, [nx, nz]) => solid(x, z, y) && !solid(x + nx, z + nz, y);
const faceOf = (x, z, y) => DIRS.find((d) => exposed(x, z, y, d)) ?? null;

// Piers: the corners of each run of wall and every third cell along a face. The rest of a face is glazing.
const pierAt = (x, z, y, face) => {
  const along = face[0] !== 0 ? [0, 1] : [1, 0];
  const u = face[0] !== 0 ? z : x;
  const corner = !exposed(x + along[0], z + along[1], y, face) || !exposed(x - along[0], z - along[1], y, face);
  return corner || u % 3 === 0;
};

// Street entrances on the south face (high z, 47th Street), with a dark awning over each door.
const DOORS = [{ x: 5, z: 26 }, { x: 15, z: 26 }];
const doorAt = (x, z) => DOORS.find((d) => d.x === x && d.z === z);
const AWNING = (x, z, y) => y === 3 && z === 26 && DOORS.some((d) => Math.abs(d.x - x) <= 1);

const g = new Voxels([W, SIZE_Y, L]);
const GLAZING_X = { north: "true", south: "true", east: "false", west: "false" };   // pane on an east/west face
const GLAZING_Z = { north: "false", south: "false", east: "true", west: "true" };   // pane on a north/south face

// Each column solid from y 0 to its tier: foundation to ground (none here, but it holds for any slope).
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!inFoot[x][z]) continue;
  for (let y = 0; y < ground[x][z]; y++) g.set(x, y, z, "stone_bricks");
}

// Shell: exterior faces get the facade, the interior is air with a floor slab on every storey line and a roof slab.
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!inFoot[x][z]) continue;
  const R = H[x][z];
  for (let y = Math.max(0, ground[x][z]); y < R; y++) {
    const face = faceOf(x, z, y);
    if (!face) {
      if (y === 0 || y % 3 === 0 || y === R - 1) g.set(x, y, z, "stone");   // floor slabs, roof slab
      continue;
    }
    if (y === R - 1) { g.set(x, y, z, "smooth_sandstone"); continue; }    // parapet
    if (y === R - 2) { g.set(x, y, z, "white_terracotta"); continue; }    // cornice
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }        // granite base course
    if (AWNING(x, z, y)) { g.set(x, y, z, "dark_oak_planks"); continue; }
    const door = doorAt(x, z);
    if (door && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const pier = pierAt(x, z, y, face);
    if (y <= 2) { g.set(x, y, z, pier ? "polished_andesite" : "glass_pane", pier ? undefined : (face[0] !== 0 ? GLAZING_X : GLAZING_Z)); continue; }
    if (y % 3 === 0) { g.set(x, y, z, "white_terracotta"); continue; }   // spandrel at each storey line
    if (pier) { g.set(x, y, z, "smooth_sandstone"); continue; }
    g.set(x, y, z, "glass_pane", face[0] !== 0 ? GLAZING_X : GLAZING_Z);
  }
}

// Warm light: a glowstone on the floor slab one cell inside some windows, in the first window row of a storey.
const lit = (x, y, z) => (x * 5 + z * 3 + y) % 4 === 0;
for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!inFoot[x][z]) continue;
  for (let y = 1; y < H[x][z] - 2; y++) {
    const face = faceOf(x, z, y);
    if (!face || y % 3 !== 1 || doorAt(x, z) || AWNING(x, z, y) || pierAt(x, z, y, face) || !lit(x, y, z)) continue;
    const ix = x - face[0], iz = z - face[1];
    if (!inside(ix, iz) || solid(ix, iz, y) || !solid(ix, iz, y - 1)) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// A glazed room: stone floor and roof slabs, corner posts, and panes between them on the walls, air inside.
const room = (x0, x1, z0, z1, y0, y1, wall) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    const onX = x === x0 || x === x1, onZ = z === z0 || z === z1;
    if (y === y0 || y === y1) g.set(x, y, z, "stone");
    else if (!onX && !onZ) continue;
    else if (onX && onZ) g.set(x, y, z, wall);
    else if (onX) g.set(x, y, z, (z - z0) % 2 === 1 ? "glass_pane" : wall, GLAZING_X);
    else g.set(x, y, z, (x - x0) % 2 === 1 ? "glass_pane" : wall, GLAZING_Z);
  }
};

// Penthouse on the tower roof (55): a glazed room on the roof slab, two lamps on its floor.
room(7, 14, 9, 14, 55, 58, "smooth_sandstone");
g.set(9, 56, 11, "glowstone"); g.set(12, 56, 12, "glowstone");

// Water tower on a 46-tier terrace: four spruce posts from the roof slab, an oak tank on top with a spruce cap.
const flat2 = (t, x0, z0) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inside(x0 + dx, z0 + dz) && H[x0 + dx][z0 + dz] === t
  && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([ex, ez]) => inside(x0 + dx + ex, z0 + dz + ez) && H[x0 + dx + ex][z0 + dz + ez] === t));
let tank = null;
for (let x0 = 2; x0 < W - 3 && !tank; x0++) for (let z0 = 2; z0 < L - 3 && !tank; z0++) if (flat2(46, x0, z0)) tank = [x0, z0];
if (tank) {
  const [x0, z0] = tank;
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
    for (let y = 46; y <= 48; y++) g.set(x0 + dx, y, z0 + dz, "spruce_log");
    for (let y = 49; y <= 50; y++) g.set(x0 + dx, y, z0 + dz, "oak_planks");
    g.set(x0 + dx, 51, z0 + dz, "spruce_planks");
  }
}

// Mechanical room on a 31-tier terrace: a small stone box with a cap.
let plant = null;
for (let x0 = 2; x0 < W - 3 && !plant; x0++) for (let z0 = 2; z0 < L - 3 && !plant; z0++) if (flat2(31, x0, z0)) plant = [x0, z0];
if (plant) {
  const [x0, z0] = plant;
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
    for (let y = 31; y <= 32; y++) g.set(x0 + dx, y, z0 + dz, "stone_bricks");
    g.set(x0 + dx, 33, z0 + dz, "stone");
  }
}

const out = `${DIR}/NYC1034345.nbt`;
const stats = g.save(out);

if (process.argv.includes("--map")) {
  for (let z = 0; z < L; z++) console.log(String(z).padStart(2), H.map((c) => String(c[z]).padStart(3)).join(""));
}
console.log(`wrote ${out}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
