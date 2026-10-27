// Way 813759350, Eden Terrace / Mt Eden edge of the CBD: a 1920s-30s brick shop-house. Red brick walls with a stone
// base course and string courses, a shopfront on the ground floor, glass grids above, a stone cornice on a flat roof. The lidar's stepped roof reads as three tiers: a 14-block tower core on the west, a 12-block shoulder,
// and 10-block wings to the east. Lidar noise is smoothed first (11 -> 10, 13 -> 14).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_813759350.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_813759350.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const TIER = { 11: 10, 13: 14 };                                  // lidar noise snapped to flat tiers
const FOOT = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { g: ground, r: TIER[roof] ?? roof }]));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cell = (x, z) => FOOT.get(`${x},${z}`);

// the horizontal faces of (x, y, z) that look onto air: off the footprint, or onto a neighbour roofed below y
const outs = (x, y, z) => DIRS.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || y >= n.r; });

const STRINGS = new Set([4, 8, 12]);                             // storey lines
const FLOORS = [0, 4, 8, 12];                                    // interior floor slabs, one per storey
const windowRows = (r) => [5, 6, ...(r >= 12 ? [9, 10] : [])];  // upper glazing; the 10-block wings have a cap there

const g = new Voxels([9, 27, 11]);
const glass = [];                                                // [x, y, z, outward dir] for the pane pass

// the block for an exposed wall voxel: quoins at corners, shopfront on the ground floor, glass grids above
function shell(x, y, z, ext, r) {
  if (x === 5 && z === 10 && y >= 1 && y <= 3) {                 // the shop door, its canopy lintel
    if (y === 3) return ["dark_oak_slab", { type: "top" }];
    return ["oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y === 0) return ["stone_bricks"];                          // base course
  if (y === 3) return ["dark_oak_planks"];                       // shopfront fascia
  if (STRINGS.has(y)) return ["smooth_stone"];
  const [dx] = ext[0];
  const u = dx !== 0 ? z : x;                                    // position along the face
  if (y <= 2) return u % 3 ? ["glass_pane"] : ["bricks"];        // shopfront: a pier every third bay
  if (windowRows(r).includes(y)) return u % 2 ? ["glass_pane"] : ["bricks"];
  return ["bricks"];
}

for (const [key, { g: ground, r }] of FOOT) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < r; y++) {
    const ext = outs(x, y, z);
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === r - 1) { g.set(x, y, z, ext.length ? "smooth_stone" : "stone"); continue; }   // cornice, roof deck
    if (!ext.length) {                                           // interior: a floor slab, air between
      if (FLOORS.includes(y)) g.set(x, y, z, y === 0 ? "smooth_stone" : "oak_planks");
      continue;
    }
    const [block, state] = shell(x, y, z, ext, r);
    g.set(x, y, z, block, state);
    if (block === "glass_pane") glass.push([x, y, z, ext[0]]);
  }
}

// warm light in some windows: a lantern on the ground floor, a glowstone on the first upper floor, set just inside the glass
for (const [x, y, z, [dx, dz]] of glass) {
  if (y !== 1 && y !== 5) continue;
  if ((x * 7 + z * 3 + y) % 3) continue;
  const ix = x - dx, iz = z - dz;
  const n = cell(ix, iz);
  if (!n || y >= n.r - 1 || outs(ix, y, iz).length) continue;   // must be interior air
  if (y === 1) g.set(ix, y, iz, "lantern", { hanging: "false" });
  else g.set(ix, y, iz, "glowstone");
}

// panes connect along their wall, to panes or solid blocks in the plane (not to the air gap behind or the street)
const occupied = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z, [dx]] of glass) {
  const link = dx !== 0
    ? { north: occupied(x, y, z - 1), south: occupied(x, y, z + 1), east: false, west: false }
    : { north: false, south: false, east: occupied(x + 1, y, z), west: occupied(x - 1, y, z) };
  g.set(x, y, z, "glass_pane", Object.fromEntries(Object.entries(link).map(([k, v]) => [k, String(v)])));
}

// roof plant: two air-conditioning units standing on the roof decks
g.set(1, 14, 7, "iron_block");
g.set(4, 10, 4, "iron_block");

const stats = g.save(OUT);
console.log(JSON.stringify(stats));
