// FR241937482: a Haussmann-era residential block (1850, 7 storeys, cream limestone, slate roof) on the Ile de la Cite.
// The footprint's lidar roof heights are snapped to clean tiers (27/23/19/15/11 and the 32 main body); the building is a
// one-cell ring of stone walls round an open interior with a floor slab per storey, so each window has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937482.cells.json", "utf8"));

const BODY = "calcite";            // Paris limestone, cream
const BAND = "smooth_sandstone";   // string courses and quoins
const PLINTH = "stone_bricks";     // base course
const FLOOR = "smooth_stone";      // storey slabs
const ROOF = "deepslate_tiles";    // slate roof cap
const GLASS = "glass";
const IRON = "iron_bars";          // second-floor balcony railings
const BRICK = "bricks";            // chimney stacks

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => byXZ.has(`${x},${z}`);
const ring = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Lidar tops -> clean tiers: anything at 30+ is the main body (32); lower wings snap to a tier whose cornice lands on a band line
const TIERS = [11, 15, 19, 23, 27];
function snap(r) {
  if (r >= 30) return 32;
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - r) <= Math.abs(best - r)) best = t;   // ties go up
  return best;
}
// storey bands sit at y = 1, 5, 9, ... (ground base course, then one per storey); windows fill the three rows above each
const isBand = (y) => y % 4 === 1;

const g = new Voxels([19, 48, 24]);

for (const [x, z, gr, r] of cells) {
  const T = snap(r);
  const edge = ring(x, z);
  // exterior faces: which way this wall cell looks out, and its position along that face
  const north = !inFp(x, z - 1), south = !inFp(x, z + 1), west = !inFp(x - 1, z), east = !inFp(x + 1, z);
  const along = north || south ? x : z;
  const windowCol = along % 3 === 1;
  // door: the ground floor of the north face at x = 4
  const door = north && x === 4 && z === 1;

  // foundation: solid from y 0 up to the ground (y 0 is the lowest ground; a level-0 cell gets the plinth course too)
  g.set(x, 0, z, PLINTH);

  for (let y = 1; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, ROOF); continue; }                 // slate cap on every tier
    if (y === T - 2) { g.set(x, y, z, edge ? BAND : FLOOR); continue; }   // cornice on the wall, ceiling slab inside
    if (!edge) { if (isBand(y)) g.set(x, y, z, FLOOR); continue; }        // interior: just the storey slabs, air between
    if (door && y <= 2) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (door && y === 3) { g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; } // canopy over the door
    if (isBand(y)) { g.set(x, y, z, BAND); continue; }
    if (windowCol && (north || south || east || west)) {
      if (y === 6 && (north || south) && along % 6 === 1) { g.set(x, y, z, IRON); continue; }  // second-floor balcony
      g.set(x, y, z, GLASS); continue;
    }
    g.set(x, y, z, BODY);
  }
}

// warm lights: a glowstone on the floor just behind every other ground-floor and fourth-floor window, inside the ring
for (const [x, z] of cells) {
  if (!ring(x, z)) continue;
  const north = !inFp(x, z - 1), south = !inFp(x, z + 1), west = !inFp(x - 1, z), east = !inFp(x + 1, z);
  if (!(north || south || east || west)) continue;
  const along = north || south ? x : z;
  if (along % 3 !== 1 || along % 6 !== 4) continue;
  const [ix, iz] = north ? [x, z + 1] : south ? [x, z - 1] : east ? [x - 1, z] : [x + 1, z];
  if (!inFp(ix, iz) || ring(ix, iz)) continue;
  for (const y of [2, 14]) g.set(ix, y, iz, "glowstone");
}

// chimney stacks on the main roof, inside the ring
for (const [x, z, , r] of cells) {
  if (snap(r) !== 32 || ring(x, z)) continue;
  if (x % 5 !== 2 || z % 7 !== 3) continue;
  for (let y = 32; y <= 34; y++) g.set(x, y, z, BRICK);
  g.set(x, 35, z, "brick_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937482.nbt");
console.log("saved", stats);
