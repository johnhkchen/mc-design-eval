// 25 West 45th Street, 1913 commercial and office building: a 27 x 25 block footprint from the lidar roof (flat at 57 blocks,
// a 60-block central pavilion over x 8-20, z 4-17, the lidar's two tiers). Front = low z (the 45th Street face at z 0), the
// party walls at x 0 and x 26 are blank brick. A polished-granite base and a shopfront ground floor; above it twenty storey
// lines of limestone (calcite) with red-brick piers between glass bays, so each storey reads as a window band. A limestone
// cap and parapet at the roof edges; a wooden water tank on the rear roof and a stair bulkhead on the pavilion. The entrance
// is the lidar gap in the street wall (x 18): a calcite surround, a dark-oak door and a dark canopy. Air behind the glass,
// one floor slab per storey, warm glowstone behind some panes and lanterns in some shopfronts. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034245.cells.json`, "utf8"));
const X = 27, Y = 64, Z = 25;

const has = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && foot.has(`${x},${z}`);
const foot = new Set(cells.map(([x, z]) => `${x},${z}`));

// Roof tiers (block heights above y 0): a 57-block flat roof on the wings and rear, a 60-block central pavilion over
// x 8-20, z 4-17 (the lidar's 58-60 core). 0 = not built.
const top = (x, z) => {
  if (!has(x, z)) return 0;
  return x >= 8 && x <= 20 && z >= 4 && z <= 17 ? 60 : 57;
};

const NB = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const openAt = (x, z, y) => !has(x, z) || top(x, z) <= y;      // outside the footprint, or the roof is at or below y
const GLASS_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 7 === 0;                                              // sparse, deterministic

const g = new Voxels([X, Y, Z]);

// 1. Walls, floors and roofs, cell by cell, from y 0 up to each cell's roof.
for (const [x, z] of cells) {
  const T = top(x, z);
  for (let y = 0; y < T; y++) {
    const open = Object.keys(NB).filter((d) => openAt(x + NB[d][0], z + NB[d][1], y));
    const shell = open.length > 0;
    if (y === 0) { g.set(x, y, z, shell ? "polished_granite" : "smooth_stone"); continue; }   // base course, floor
    if (!shell) { if (y % 3 === 0 || y === T - 1) g.set(x, y, z, "smooth_stone"); continue; }  // slabs, roof; else air
    if (y === T - 1 || y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                     // cap and storey lines
    // Outer wall in a window row: street face N, then S, then the sides.
    const face = open.includes("N") ? "N" : open.includes("S") ? "S" : open[0];
    const [dx, dz] = NB[face];
    const u = face === "N" || face === "S" ? x : z;
    const party = (face === "W" && x === 0) || (face === "E" && x === X - 1);
    if (party || u % 4 === 0) { g.set(x, y, z, "bricks"); continue; }                              // blank party wall, piers
    if (face === "N" && y < 3) { g.set(x, y, z, "glass"); continue; }                              // shopfront
    const s = face === "N" || face === "S" ? GLASS_NS : GLASS_EW;
    g.set(x, y, z, "glass_pane", s);
    if (y >= 4 && lit(x, y, z)) g.set(x - dx, y, z - dz, "glowstone");                            // warm light behind the pane
    if (y === 1 && face === "N" && u % 8 === 2) g.set(x, y, z - dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Parapet: the roof edge (a neighbour at or below the roof, or nothing) gets a limestone parapet two blocks high.
  const edge = Object.values(NB).some(([dx, dz]) => openAt(x + dx, z + dz, T));
  if (edge) for (let y = T; y < T + 2; y++) g.set(x, y, z, "calcite");
}

// 2. Entrance: the street-wall gap at x 18. Calcite surround, a dark-oak door, a dark canopy over it on the lintel.
for (const x of [17, 19]) for (const y of [1, 2]) g.set(x, y, 0, "calcite");
g.set(18, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(18, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 16; x <= 20; x++) for (let z = 0; z <= 1; z++) g.set(x, 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// 3. Roof equipment: a wooden water tank on the rear wing (a hollow 3 x 3 ring of planks with a cap) and a stair bulkhead
// on the pavilion. Both stand on the roof slab below them.
for (let x = 2; x <= 4; x++) for (let z = 20; z <= 22; z++) {
  for (let y = 57; y <= 59; y++) if (x !== 3 || z !== 21) g.set(x, y, z, "spruce_planks");
  g.set(x, 60, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}
for (let x = 11; x <= 13; x++) for (let z = 8; z <= 10; z++) {
  for (let y = 60; y <= 62; y++) if (x !== 12 || z !== 9) g.set(x, y, z, "bricks");
  g.set(x, 63, z, "calcite");
}

const stats = g.save(`${DIR}/NYC1034245.nbt`);
console.log(JSON.stringify(stats));
