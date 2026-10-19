// 123 West 44th Street: an NYC individual landmark, a Commercial & Office building of 1894. Read as a masonry office block
// of its years: red brick piers and window reveals, cream terracotta storey bands, a granite base, a heavy cornice and
// a parapet, about fourteen storeys of 3 blocks. Footprint 27 x 11 is a U of two wings joined across the back (high z),
// open to the 44th Street frontage (low z) on a light court. The lidar roof is clean flat tiers at 44, a setback attic of
// 47 where it reads highest (the wing corners), and a 15-block lower tier on one court-edge cell. Lidar holes walled in
// on three sides are light wells: filled and skylit. The lidar's 1-block cells on the street terrace are paving.
// Windows: two-block ribbons between brick piers every third column, set one block back from the wall (air at the
// reveal, glass in the wall plane, air behind), with a glowstone behind some panes. Ground floor: granite piers and
// clear shopfronts, a double entrance on the east wing's street front under a black canopy with two hanging lanterns.
// No interiors: each window's air gap is one block deep and every storey has a solid floor band.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022629.cells.json`, "utf8"));
const X = 27, Y = 59, Z = 11;
const MAIN = 44, ATTIC = 47;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const roofAt = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NB = Object.values(DIRS);

// Mass: the tall lidar cells, and lidar holes with three or more tall neighbours (walled in, a light well).
const tall = (x, z) => inFoot(x, z) && roofAt(x, z) >= 20;
const nTall = (x, z) => NB.filter(([dx, dz]) => tall(x + dx, z + dz)).length;
const mass = (x, z) => inFoot(x, z) && (tall(x, z) || nTall(x, z) >= 3 || (roofAt(x, z) >= 5 && roofAt(x, z) < 20));
// Clean tiers: the wing roofs at 44, the attic where the lidar reads 46-47, a 15-block lower tier for the 5-19 cells.
const topOf = (x, z) => {
  if (!mass(x, z)) return 0;
  const r = roofAt(x, z);
  if (r >= 46) return ATTIC;
  if (r >= 20 || r === 0) return MAIN;
  return 15;
};
const skylit = (x, z) => mass(x, z) && roofAt(x, z) < 5;

const g = new Voxels([X, Y, Z]);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const massCols = cols.filter(([x, z]) => mass(x, z));

// Faces: a block's outward neighbour is open (outside the footprint, not mass, or lower than this height).
const faceDirs = (x, y, z) => Object.entries(DIRS)
  .filter(([, [dx, dz]]) => !mass(x + dx, z + dz) || topOf(x + dx, z + dz) <= y)
  .map(([d]) => d);

// 1. Solid core to each roof (the foundation is the base course at y 0, so every cell stands on the ground or on paving).
for (const [x, z] of massCols) for (let y = 0; y < topOf(x, z); y++) g.set(x, y, z, "stone_bricks");

// 2. Non-mass footprint cells are paving at y 0: the court and the terrace (lidar 0 and 1) under the building.
for (const [x, z] of cols) if (!mass(x, z)) g.set(x, 0, z, "smooth_stone");

// Storey rows: base course at y 0, a shopfront at y 1-2, cream bands at every third block (the floor line), two-block
// windows between, a cornice under the roof. The attic has its own band at 44, one window row at 45 and a cap at 46.
const rowOf = (y, T) => {
  if (y === 0) return "base";
  if (y === T - 1) return "cap";
  if (T === ATTIC) return y === 44 ? "band" : "win";
  if (y % 3 === 0) return "band";
  return y <= 2 ? "shop" : "win";
};
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z

const windows = [];   // applied after the faces, so no face overwrites a pane or its air gap
for (const [x, z] of massCols) {
  const T = topOf(x, z);
  for (let y = 0; y < T; y++) {
    const dirs = faceDirs(x, y, z);
    if (!dirs.length) { if (y === T - 1) g.set(x, y, z, skylit(x, z) ? "glass" : "gray_concrete"); continue; }
    const [d] = dirs, [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const corner = dirs.length > 1;
    const row = rowOf(y, T);
    if (row === "base") { g.set(x, y, z, "polished_granite"); continue; }
    if (row === "cap") { g.set(x, y, z, "smooth_stone"); continue; }
    if (row === "band") { g.set(x, y, z, "white_terracotta"); continue; }
    if (corner || u % 3 === 0) { g.set(x, y, z, row === "shop" ? "polished_granite" : "bricks"); continue; }
    // A window bay: the opening is air, the pane sits one block in, a block of air behind it. The air must stay inside
    // the mass (not a face of its own), or a thin wall or bridge would be punched through its far side.
    const G = [x - dx, y, z - dz], P = [x - 2 * dx, y, z - 2 * dz];
    const solidAt = (c) => mass(c[0], c[2]) && topOf(c[0], c[2]) > y;
    if (solidAt(G) && solidAt(P) && faceDirs(P[0], y, P[2]).length === 0) {
      g.set(x, y, z, "air");
      windows.push({ G, P, pane: dx === 0 ? NS : EW, warm: lit(u, y, "NSEW".indexOf(d)) });
    } else g.set(x, y, z, "bricks");
  }
}
for (const { G, P, pane, warm } of windows) {
  g.set(...G, "glass_pane", pane);
  if (warm) g.set(...P, "glowstone"); else g.set(...P, "air");
}

// 3. Roof: a parapet on the roof's edge (a wall of stone brick on the cornice, two high) where the roof meets open
// ground, a gravel-grey roof covering inside, and two plant boxes on the wing roof.
for (const [x, z] of massCols) {
  if (topOf(x, z) !== MAIN) continue;
  if (NB.some(([dx, dz]) => !mass(x + dx, z + dz))) {
    g.set(x, MAIN, z, "stone_brick_wall"); g.set(x, MAIN + 1, z, "stone_brick_wall");
  }
}
const interior = massCols.filter(([x, z]) => topOf(x, z) === MAIN && NB.every(([dx, dz]) => mass(x + dx, z + dz) && topOf(x + dx, z + dz) === MAIN));
const near = (tx, tz) => interior.reduce((b, c) => (Math.hypot(c[0] - tx, c[1] - tz) < Math.hypot(b[0] - tx, b[1] - tz) ? c : b));
for (const [tx, tz] of [[4, 8], [22, 8]]) {
  const [x, z] = near(tx, tz);
  g.set(x, MAIN, z, "light_gray_concrete"); g.set(x, MAIN + 1, z, "light_gray_concrete");
}

// 4. Street entrance on the east wing (x 21-22, low z): a double dark-oak door in the wall with a vestibule behind it,
// granite piers to either side, a black canopy at y 4 standing on a granite wall behind it, two hanging lanterns.
for (let y = 1; y <= 2; y++) for (const x of [21, 22]) g.set(x, y, 2, "air");
for (const y of [1, 2, 3]) for (const x of [20, 23]) g.set(x, y, 1, "polished_granite");
g.set(21, 1, 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(21, 2, 1, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(22, 1, 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(22, 2, 1, "dark_oak_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (let x = 20; x <= 23; x++) { g.set(x, 4, 0, "black_concrete"); g.set(x, 4, 1, "polished_granite"); }
for (const x of [21, 22]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

const stats = g.save(`${DIR}/NYC1022629.nbt`);
const tops = massCols.map(([x, z]) => topOf(x, z));
console.log(JSON.stringify({ cells: cols.length, mass: massCols.length, maxTop: Math.max(...tops), windows: windows.length, ...stats }));
