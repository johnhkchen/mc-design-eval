// 675 Fifth Avenue, 1921 commercial and office building: a seven-storey limestone front (25 blocks, about 8 storeys with
// the cornice) on the north face (low z), a plainer rear body behind it, a 24-block west bay and a small penthouse on the
// rear roof. Footprint 25 x 7 (x along the street, low z = north = the front). Every cell's ground is 0, so there is no
// foundation to fill. The lidar roof (20-25 per cell) is read as three flat tiers: the front strip at 25, the west bay at
// 24 and the rear body at 21, with the penthouse (lidar 24 at the middle) at 24. Storeys are 3 blocks: a plinth at y 0,
// a shopfront at y 1-2 with the entrance at x 12, then windows in pairs of rows (y 1-2, 4-5, ...) between limestone
// piers every third block, stringcourses at the storey lines, a corbel course, frieze and cap under the parapet. Windows
// sit one block out, with air behind the glass and a floor slab in each storey (no interiors). Warm glowstone sits
// behind some panes; a hanging lantern lights the entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035723.cells.json`, "utf8"));
const X = 25, Y = 37, Z = 7;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Roof tiers in blocks above y 0 (the lidar smoothed into flat tiers, see the header).
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if (z === 0) return 25;                                                     // the street front
  if (x <= 3) return 24;                                                      // the west bay
  if (x >= 9 && x <= 13 && z >= 2 && z <= 4) return 24;                       // penthouse on the rear roof
  return 21;                                                                  // the rear body
};
// A cell is open at height y when it is outside the footprint or its roof is at or below y.
const open = (x, y, z) => !inFoot(x, z) || roofAt(x, z) <= y;

const DIRS = { N: [0, -1], W: [-1, 0], E: [1, 0], S: [0, 1] };    // outward; N = the street front
const ORDER = ["N", "W", "E", "S"];
const faceOf = (x, y, z) => ORDER.find((d) => open(x + DIRS[d][0], y, z + DIRS[d][1])) ?? null;
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 13 === 0;  // sparse, deterministic warm windows

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// 1. Solid mass: foundation from y 0 to each cell's ground (none here), then the core to the roof. The roof top is a
// smooth stone cap; the core is limestone.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), top = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground; y < top; y++) g.set(x, y, z, y === top - 1 ? "smooth_stone" : "calcite");
}

// 2. Faces. Plinth at y 0; stringcourses every third block; corbel, frieze and cap under the cornice; window rows
// at y 1-2 mod 3 with piers every third column; the entrance door at x 12 on the front.
const windows = [];   // [x, y, z, face] of each glazed bay, so lit panes and cavities are set after the faces
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  for (let y = 0; y < top - 1; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;                                                        // interior
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                                              // position along the face
    const ix = x - dx, iz = z - dz;                                          // one block in, behind the face
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }          // plinth
    if (y === top - 3) { g.set(x, y, z, "calcite"); continue; }              // corbel course
    if (y === top - 2) { g.set(x, y, z, "smooth_sandstone"); continue; }     // frieze
    if (y % 3 === 0) { g.set(x, y, z, "smooth_sandstone"); continue; }       // storey line (floor slab behind)
    if (d === "N" && x === 12 && y <= 2) {                                   // entrance door, lower and upper halves
      const half = y === 1 ? "lower" : "upper";
      g.set(x, y, z, "iron_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (u % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                // limestone pier
    g.set(x, y, z, "light_blue_stained_glass_pane", dx === 0 ? NS : EW);      // glazed bay
    windows.push([x, y, z, d, ix, iz, u]);
  }
}

// 3. Cavities behind the glass: air one block in, with the lit panes showing glowstone behind them. The entrance hall
// gets a hanging lantern under the storey line above it.
for (const [x, y, z, d, ix, iz, u] of windows) {
  const k = d === "N" ? 0 : d === "S" ? 1 : d === "W" ? 2 : 3;
  if (lit(u, y, k)) g.set(ix, y, iz, "glowstone");
  else g.set(ix, y, iz, "air");
}
for (let y = 1; y <= 2; y++) g.set(12, y, 1, "air");
g.set(12, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

const out = g.save(`${DIR}/NYC1035723.nbt`);
console.log(`saved NYC1035723.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
