// 133 West 44th Street, 1998 commercial and office building: a 66-block (about 73 m) glass-curtain-wall office tower on a
// two-storey granite-and-limestone podium. Footprint 16 x 11 (x across the front, low z = north = the 44th Street frontage).
// Podium: a 6-block base with a shopfront, an entrance under a canopy (x 6-9), and a notched NE corner that is open
// ground (the lidar has no roof there). Tower: 60 blocks of blue glass in light-grey spandrels and iron mullions, set
// on the podium roof, with a crown stepping up to 66 at the rear and a mechanical penthouse. Glass sits one block out
// from a solid core, with air behind it and a floor slab in each storey (no interiors). Lidar roof is read as clean
// tiers, not followed cell by cell. Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022628.cells.json`, "utf8"));
const X = 16, Y = 78, Z = 11;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Roof tiers (block heights above y 0), flattened from the lidar: a 6-block podium along the street, a 13-block corner
// pavilion at the NW, a 3-block shed, the 60-block office tower, a 66-block crown at the rear (lidar 63-66) and a
// 69-block mechanical penthouse on it. The NE notch (lidar 0) stays open ground, except (6, 0), a single lidar gap in
// the street wall that is part of the podium. 0 = nothing built.
const built = (x, z) => inFoot(x, z) && (lidar(x, z) > 0 || (x === 6 && z === 0));
const roofAt = (x, z) => {
  if (!built(x, z)) return 0;
  if (x <= 2 && z <= 1) return 13;
  if (lidar(x, z) < 12) return lidar(x, z) <= 3 ? 3 : 6;
  if (z >= 9 && x >= 5 && x <= 10) return 69;
  if (z >= 9 && x >= 3 && x <= 12) return 66;
  return 60;
};
const kindOf = (top) => (top <= 13 ? "podium" : top >= 69 ? "mech" : "tower");
const core = { podium: "smooth_stone", tower: "light_gray_concrete", mech: "smooth_quartz" };

// Outward faces: N = low z (the 44th Street frontage), S = rear, W/E = the side walls. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
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

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// 1. Solid mass: foundation from y 0 up to each cell's ground (the crown sits a block up at its south-east corner),
// the core to the roof, a roof covering on each top, and paving on the open ground so the lot reads as a court.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), top = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  if (!top) { g.set(x, ground, z, "smooth_stone"); continue; }
  const k = kindOf(top);
  for (let y = ground; y < top; y++) g.set(x, y, z, y === top - 1 ? (k === "tower" ? "gray_concrete" : "smooth_stone") : core[k]);
}

// 2. Faces. The base course at y 0, a limestone storey band at y 3 and 6 (the podium), light-grey spandrels at every
// third block on the tower, glass in the bays between, iron mullions every third column, clear glass shopfronts at
// y 1-2. Edges of each roof get a calcite cornice. Lit panes are set after the faces, so no fill overwrites them.
const recesses = [];
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (!top) continue;
  for (let y = 0; y < top; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const k = top === 69 && y < 66 ? "tower" : kindOf(top);   // the penthouse's lower walls are the crown's glass
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const ix = x - dx, iz = z - dz;                   // one block in, behind the face
    if (y === top - 1) { g.set(x, y, z, k === "mech" ? "smooth_quartz" : "calcite"); continue; }
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (k === "mech") { g.set(x, y, z, "smooth_quartz"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, k === "podium" ? "calcite" : "light_gray_concrete"); continue; }
    if (u % 3 === 0) { g.set(x, y, z, k === "podium" ? "calcite" : "iron_block"); continue; }
    if (k === "podium") g.set(x, y, z, "glass_pane", dx === 0 ? NS : EW);
    else g.set(x, y, z, "light_blue_stained_glass_pane", dx === 0 ? NS : EW);
    // Solid behind the pane, one block in and not itself a face: an air gap (a recess), not a hole through the wall.
    const deep = inFoot(ix, iz) && roofAt(ix, iz) > y && !faceOf(ix, y, iz);
    if (deep) recesses.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : 3)]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Street entrance (x 7-8, low z): a double iron door under a black canopy, with a vestibule behind it and two hanging
// lanterns. The canopy stands on a solid wall behind it, so it does not float.
g.set(7, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(7, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(8, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(8, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [7, 8]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = 6; x <= 9; x++) { g.set(x, 4, 0, "black_concrete"); g.set(x, 4, 1, "smooth_stone"); }
for (const x of [7, 8]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a half slab on the edge of each podium and tower roof, standing on the cornice below it.
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (top && kindOf(top) !== "mech" && edgeAt(x, z, top)) g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof equipment: two plant boxes on the tower roof (a 2-high block each), and lanterns on the penthouse corners.
for (const [x, z] of [[13, 7], [14, 7]]) { g.set(x, 60, z, "light_gray_concrete"); g.set(x, 61, z, "light_gray_concrete"); }
g.set(5, 69, 9, "lantern", { hanging: "false", waterlogged: "false" });
g.set(10, 69, 10, "lantern", { hanging: "false", waterlogged: "false" });

// Lidar check (not used for the massing): how far the tiers sit from the measured roof, on the cells that have one.
let dev = 0, n = 0;
for (const [x, z, , roof] of cells) if (roof > 0) { dev += Math.abs(roofAt(x, z) - roof); n++; }

const stats = g.save(`${DIR}/NYC1022628.nbt`);
console.log(JSON.stringify({ cells: cols.length, roofMaxBlock: Math.max(...cols.map(([x, z]) => roofAt(x, z))), meanRoofDevFromLidar: +(dev / n).toFixed(2), ...stats }));
