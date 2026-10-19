// 693 Fifth Avenue, 1991 commercial and office building: a 27-storey (81-block) office tower in blue-green tinted glass
// and light-grey spandrels on a 4-storey grey granite and limestone base. Footprint 26 x 10 (x along the frontage, low z = north
// = the street face); the south-east wing runs out one row to the south. The west end is a 33-block (11-storey) wing with
// a planted terrace. Setbacks: the south rows step down to 78, a 72 light court notches the south face at x 4-5, and a
// 5-block mechanical penthouse sits on the roof's north-central block. Lidar tiers are read as flat steps, not followed
// cell by cell: 76-82 -> 81 (or 78 on the south rows), 70-75 -> 72, 30-37 -> 33; a lidar 0 inside the footprint is an open
// light court (paved). Glass sits one block out from a solid core, with air behind it and a solid slab at each storey (no
// interiors). Warm glowstone sits behind some panes. The lobby is on the north face at x 12-13: iron doors under a black
// canopy on a limestone lintel, with two hanging lanterns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035742.cells.json`, "utf8"));
const X = 26, Y = 94, Z = 10;
const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Clean tiers from the lidar roof. Lidar noise is +-1 block; the steps are 33, 72, 78 and 81.
const tierOf = (x, z) => {
  const r = lidar(x, z);
  if (r <= 0) return 0;                  // not built (outside the footprint, or the open court)
  if (z === 7 && r >= 76) return 81;     // the speckled 78s on the row behind the tower read as its roof
  if (r >= 76) return r >= 80 ? 81 : 78;
  if (r >= 70) return 72;
  return 33;
};
const penthouse = (x, z) => x >= 10 && x <= 15 && z >= 2 && z <= 5;
const roofAt = (x, z) => {
  const t = tierOf(x, z);
  return t === 81 && penthouse(x, z) ? 86 : t;
};
const cols = [...cell.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => roofAt(x, z) > 0);
const courts = [...cell.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => lidar(x, z) === 0);

// Outward faces: N = low z (the street face), S = rear, W/E = the ends. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const DIR_ID = { N: 1, S: 2, W: 3, E: 4 };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

// A cell is open at height y when it is outside the footprint, unbuilt, or its roof is at or below y.
const open = (x, y, z) => roofAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
// A roof edge: a neighbour whose roof is lower than this cell's top, or none at all.
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => roofAt(x + dx, z + dz) < top);

const g = new Voxels([X, Y, Z]);

// 1. Solid mass: the podium core (granite) to y 12, the tower core (light grey concrete) above, a grey roof on each top,
// and paving on the open court so it reads as ground. Every column stands on the one below, so nothing floats.
for (const [x, z] of cols) {
  const t = roofAt(x, z);
  for (let y = 0; y < t; y++) g.set(x, y, z, y < 12 ? "polished_andesite" : "light_gray_concrete");
  g.set(x, t - 1, z, "gray_concrete");
}
for (const [x, z] of courts) g.set(x, 0, z, "smooth_stone");

// 2. Faces. Podium (y 0-11): grey granite base course, clear shopfronts at y 1-2, limestone bands at y 3, 6, 9 and a limestone
// band at y 12 closing the base, with grey granite piers every third column and clear glass between. Tower (y 13 up):
// light-grey spandrels on every third row, iron mullions every third column, blue-green tinted glass between. The
// penthouse walls are smooth quartz with a concrete band every third row. Cornices sit on the exposed top course.
const recesses = [];
for (const [x, z] of cols) {
  const t = roofAt(x, z);
  for (let y = 0; y < t; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const along = dx === 0 ? x : z;             // position along the face
    if (y === t - 1) { g.set(x, y, z, "calcite"); continue; }   // cornice
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    if (t === 86 && y >= 81) { g.set(x, y, z, y % 3 === 0 ? "light_gray_concrete" : "smooth_quartz"); continue; }
    if (y < 12) {
      if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }
      if (along % 3 === 0) { g.set(x, y, z, "polished_andesite"); continue; }
      g.set(x, y, z, "glass_pane", dx === 0 ? NS : EW);
    } else {
      if (y === 12) { g.set(x, y, z, "calcite"); continue; }
      if (y % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
      if (along % 3 === 0) { g.set(x, y, z, "iron_block"); continue; }
      g.set(x, y, z, "cyan_stained_glass_pane", dx === 0 ? NS : EW);
    }
    // The solid one block in behind the pane is an air gap (a recess), unless it is itself a face.
    const ix = x - dx, iz = z - dz;
    if (inFoot(ix, iz) && roofAt(ix, iz) > y && !faceOf(ix, y, iz)) recesses.push([ix, y, iz, lit(along, y, DIR_ID[d])]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Lobby (x 12-13, north face): double iron doors, a vestibule behind them, a black canopy over the entrance on the
// limestone lintel, and two hanging lanterns under the canopy's ends.
g.set(12, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(12, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(13, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(13, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [12, 13]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = 11; x <= 14; x++) for (const z of [0, 1]) g.set(x, 4, z, "black_concrete");
for (const x of [11, 14]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a grey granite half slab on the edge of each roof, standing on the cornice below it.
for (const [x, z] of cols) {
  const t = roofAt(x, z);
  if (edgeAt(x, z, t)) g.set(x, t, z, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof: two plant boxes on the tower roof, a planted terrace on the west wing (oak trees in boxes), and a lantern
// on each penthouse corner.
for (const [x, z] of [[18, 5], [19, 5]]) { g.set(x, 81, z, "light_gray_concrete"); g.set(x, 82, z, "light_gray_concrete"); }
for (const [x, z] of [[1, 3], [2, 6]]) g.set(x, 33, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
g.set(10, 86, 2, "lantern", { hanging: "false", waterlogged: "false" });
g.set(15, 86, 5, "lantern", { hanging: "false", waterlogged: "false" });

// Lidar check (not used for the massing): how far the tiers sit from the measured roof, on the cells that have one.
let dev = 0, n = 0;
for (const [x, z, , roof] of cells) if (roof > 0) { dev += Math.abs(roofAt(x, z) - roof); n++; }

const stats = g.save(`${DIR}/NYC1035742.nbt`);
console.log(JSON.stringify({ cells: cols.length, roofMaxBlock: Math.max(...cols.map(([x, z]) => roofAt(x, z))), meanRoofDevFromLidar: +(dev / n).toFixed(2), ...stats }));
