// FR241937488: an 1830 residential block on the Ile de la Cite, six storeys on a 12 x 37 footprint. Cream limestone walls
// (calcite) on a stone plinth, sandstone string courses per storey, slate roof with a parapet, and the lidar's roof tiers
// (27 main body, 23/19/15/11/7 setbacks and wings) snapped to clean levels. Each storey is 4 blocks, so six storeys and
// the cornice fit the lidar's 27-block roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937488.cells.json", "utf8"));

const BODY = "calcite";            // Paris limestone, cream
const BAND = "smooth_sandstone";   // string courses, cornice, lintel
const SILL = "smooth_sandstone_slab"; // window sills
const PLINTH = "stone_bricks";     // foundation and base course
const FLOOR = "smooth_stone";      // storey slabs inside
const ROOF = "deepslate_tiles";    // slate roof cap
const PARAPET = "stone_bricks";    // a full-block parapet on the edge (wall blocks render as approximated entities in the sheet)
const GLASS = "glass";
const IRON = "iron_bars";          // window mullions and the storey-two balcony rail
const BRICK = "bricks";            // chimney stacks

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => byXZ.has(`${x},${z}`);
const ring = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Lidar tops -> clean tiers. Storey lines sit at y = 1, 5, 9, ... and every tier's cornice lands on one of them.
const TIERS = [7, 11, 15, 19, 23, 27];
function snap(r) {
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - r) <= Math.abs(best - r)) best = t;   // ties go up
  return best;
}
const isBand = (y) => y % 4 === 1;

const g = new Voxels([12, 43, 37]);

// the street front is the north face (z = 0); the entrance is at x = 4 on the ground floor
const doorAt = (x, z) => x === 4 && z === 0;

for (const [x, z, gr, r] of cells) {
  const T = snap(r);
  const F = Math.max(gr, 1);          // the wall starts on the ground; a level-0 cell gets the plinth course at y 0
  const edge = ring(x, z);
  const north = !inFp(x, z - 1), south = !inFp(x, z + 1), west = !inFp(x - 1, z), east = !inFp(x + 1, z);
  const along = north || south ? x : z;     // position along the face this wall looks out of
  const pier = along % 4 === 0;             // a 1-block stone pier between window bays
  const door = doorAt(x, z);
  // the cell just inside this wall (for lamps behind the glass)
  const [ix, iz] = north ? [x, z + 1] : south ? [x, z - 1] : west ? [x + 1, z] : [x - 1, z];

  // foundation: solid from y 0 up to the ground, so nothing floats on a slope
  for (let y = 0; y < F; y++) g.set(x, y, z, PLINTH);

  for (let y = F; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, edge ? PARAPET : ROOF); continue; }          // slate cap, parapet on the edge
    if (y === T - 2) { g.set(x, y, z, edge ? BAND : FLOOR); continue; }            // cornice on the wall, ceiling slab inside
    if (!edge) { if (isBand(y)) g.set(x, y, z, FLOOR); continue; }                 // interior: storey slabs, air between
    if (isBand(y)) { g.set(x, y, z, BAND); continue; }                              // string course
    if (door && y === F) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (door && y === F + 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (door && y === F + 2) { g.set(x, y, z, BAND); continue; }                    // lintel over the door

    const row = y % 4;                                                              // 2 = sill, 3 and 0 = glass, 1 = band
    if (row === 2) {
      if (pier) g.set(x, y, z, BODY);
      else if (north && y === 6) g.set(x, y, z, IRON);                              // storey-two balcony rail on the street front
      else g.set(x, y, z, SILL, { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (pier) { g.set(x, y, z, BODY); continue; }
    if (along % 4 === 2) { g.set(x, y, z, IRON); continue; }                       // mullion
    g.set(x, y, z, GLASS);
    // a warm lamp on the floor inside, behind about one window in seven
    if (row === 3 && inFp(ix, iz) && !ring(ix, iz) && (x * 5 + z * 3 + y) % 7 === 0) g.set(ix, y - 1, iz, "glowstone");
  }
}

// chimney stacks on the main roof, standing on the slate cap
for (const [x, z, , r] of cells) {
  if (snap(r) === 27 && !ring(x, z) && x % 4 === 2 && z % 7 === 4) {
    g.set(x, 27, z, BRICK);
    g.set(x, 28, z, BRICK);
  }
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937488.nbt");
console.log(out);
