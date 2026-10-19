// 30 West 46th Street, 2013 commercial and office building: a seven-storey Midtown office block about 23 blocks (about
// 25 m) high, stepped down to 46th Street. The lidar roof reads as clean tiers: a 7-block two-storey base along the street
// (z 0), a 14-block set-back shoulder (z 1-3) with an 18-block NW corner and a 16-block NE corner, and the 23-block body
// behind (z 4-19), with a 3-block mechanical penthouse on its roof. Facade: calcite piers on a 3-block bay rhythm, dark
// blue glass in the bays, light-grey spandrels at every third row as floor slabs, a smooth-quartz cornice and a parapet on
// each roof edge. Ground floor: a black bulkhead and clear shopfront glass, with the entrance at x 7-8 (double iron doors
// in a recess under a black canopy). Glass sits one block out from an air pocket one block deep with solid core behind,
// so no interiors. Warm glowstone sits in some pockets.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1088772.cells.json`, "utf8"));
const X = 17, Y = 35, Z = 20;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tiers in block heights above y 0, flattened from the lidar. Outside the footprint the top is 0.
const penthouse = (x, z) => x >= 5 && x <= 10 && z >= 8 && z <= 12;
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if (x === 0 && z <= 3) return 18;                       // NW corner
  if (z === 0) return 7;                                  // two-storey base on 46th Street
  if (z <= 3) return x === 16 ? 16 : 14;                  // set-back shoulder, NE corner a little higher
  return 23;                                              // the seven-storey body
};
const topAt = (x, z) => roofAt(x, z) + (penthouse(x, z) ? 3 : 0);

// A cell is open at height y when it is outside the footprint or its top is at or below y.
const open = (x, y, z) => topAt(x, z) <= y;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };       // outward; N = low z = the 46th Street frontage
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const K = { N: 1, S: 2, W: 3, E: 4 };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const CLEAR = { ...NS };
const paneState = (d) => (d === "N" || d === "S" ? NS : EW);
// Position along the face and its last cell: x on N/S faces (0..16), z on E/W faces (0..19).
const bayU = (d, x, z) => (d === "N" || d === "S" ? x : z);
const maxU = (d) => (d === "N" || d === "S" ? 16 : 19);
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;        // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const cols = cells.map(([x, z]) => [x, z]);

// 1. Solid mass: a granite plinth course at y 0, the core from the ground (at least y 1) up to each cell's top.
for (const [x, z] of cols) {
  g.set(x, 0, z, "polished_granite");
  for (let y = Math.max(groundAt(x, z), 1); y < topAt(x, z); y++) g.set(x, y, z, "stone");
}

// 2. Facades on every exposed side, by storey row: light-grey spandrels at y = 0 mod 3 (the floor slabs), glass in the
// rows between, calcite piers at every third bay and at the corners. The top row is the smooth-quartz cornice.
// Ground floor on 46th Street: a black bulkhead at y 1 and clear glass above. Pockets go in behind the upper glass.
const recesses = [];
for (const [x, z] of cols) {
  const top = topAt(x, z), pen = penthouse(x, z);
  for (let y = 1; y < top; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const u = bayU(d, x, z), pier = u % 3 === 0 || u === maxU(d);
    const street = d === "N" && z === 0;
    if (y === top - 1) g.set(x, y, z, "smooth_quartz");
    else if (pen) g.set(x, y, z, "light_gray_concrete");
    else if (y % 3 === 0) g.set(x, y, z, "light_gray_concrete");
    else if (pier) g.set(x, y, z, "calcite");
    else if (street && y === 1) g.set(x, y, z, "black_concrete");
    else if (street || y <= 2) g.set(x, y, z, "glass_pane", street ? CLEAR : paneState(d));
    else g.set(x, y, z, "cyan_stained_glass_pane", paneState(d));

    const glassRow = !pen && !pier && y >= 7 && y % 3 !== 0 && y !== top - 1;
    if (glassRow) {
      const [dx, dz] = DIRS[d], px = x - dx, pz = z - dz;   // one block in, behind the glass
      if (inFoot(px, pz) && topAt(px, pz) > y && !faceOf(px, y, pz)) recesses.push([px, y, pz, lit(u, y, K[d])]);
    }
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Roof surfaces: the cornice row on every cell's top, and a parapet slab on each roof edge (a lower neighbour or none).
// The penthouse has no parapet of its own.
for (const [x, z] of cols) {
  const top = topAt(x, z);
  g.set(x, top - 1, z, "smooth_quartz");
  const edge = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => topAt(x + dx, z + dz) < top);
  if (edge && !penthouse(x, z)) g.set(x, top, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 4. Entrance at x 7-8 on 46th Street: double iron doors set back one block in a vestibule, under a black canopy
// across the bay on a solid row (the spandrel at y 3 below, the wall behind).
g.set(7, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(7, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(8, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(8, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [7, 8]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = 6; x <= 9; x++) g.set(x, 4, 0, "black_concrete");

// 5. Roof equipment: four lanterns on the penthouse corners, and a two-high plant box on the NE shoulder roof.
for (const [x, z] of [[5, 8], [10, 8], [5, 12], [10, 12]]) g.set(x, 26, z, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x, z] of [[3, 2], [4, 2]]) { g.set(x, 14, z, "light_gray_concrete"); g.set(x, 15, z, "light_gray_concrete"); }

// Stats: the highest top, and how far the tiers sit from the lidar roof on the cells that have one.
let dev = 0, n = 0;
for (const [x, z, , roof] of cells) if (roof > 0) { dev += Math.abs(roofAt(x, z) - roof); n++; }
const stats = g.save(`${DIR}/NYC1088772.nbt`);
console.log(JSON.stringify({ cells: cols.length, topMax: Math.max(...cols.map(([x, z]) => topAt(x, z))), meanRoofDevFromLidar: +(dev / n).toFixed(2), ...stats }));
