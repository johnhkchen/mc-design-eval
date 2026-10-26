// A Federal-style brick office block on the Mall (c. 1890-1910): a stone base course, two storeys of brick with
// glass-pane window grids on brick and calcite piers, calcite quoins and a storey string and cornice, a dark-oak
// entrance on the centre pier of the street front and a one-block pediment over the centre bay. The lidar roof sits
// 5-6 above the lowest ground; it is smoothed into one flat tier at 6, with the centre raised for the pediment and
// two HVAC boxes on the deck. Every column is solid from y 0 up (the base course, or the foundation on the uphill
// cells), storeys stand on what is below them, the floor slabs are carried by the walls, and nothing projects past
// the footprint. Glass panes connect to their neighbours and sit on an air gap; four glowstones sit behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73901.cells.json`, "utf8"));

const W = 13, D = 7, H = 7;                                  // x 0..12, z 0..6, y 0..6 (y 6 pediment and plant)
const g = new Voxels([W, H, D]);

const onFootprint = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const perimeter = (x, z) => x === 0 || z === 0 || x === W - 1 || z === D - 1;

// ---- materials ----
const BASE = "stone_bricks", BRICK = "bricks", TRIM = "calcite", SLAB = "smooth_stone", GLASS = "glass_pane";

// The street (z = 0) and back (z = D-1) elevations share one bay grid along x; the sides have their own along z.
const frontBay = (u, y) => {
  if (y === 0) return BASE;                                  // base course
  if (y === 5) return TRIM;                                  // cornice course
  if (u === 0 || u === W - 1) return TRIM;                   // corner quoins
  if (u === 3 || u === 6 || u === 9) return y === 3 ? TRIM : BRICK;   // piers (centre pier at 6), storey string on them
  return GLASS;                                              // window bays: ground y 1-2, upper y 3-4
};
const sideBay = (u, y) => {                                  // u = z
  if (y === 0) return BASE;
  if (y === 5) return TRIM;
  if (u === 0 || u === D - 1) return TRIM;                   // corner quoins
  if (u === 2 || u === 4) return GLASS;                      // one window per side bay
  return y === 3 ? TRIM : BRICK;
};
const elevation = (x, z, y) => (z === 0 || z === D - 1 ? frontBay(x, y) : sideBay(z, y));
const isGlass = (x, y, z) => perimeter(x, z) && y >= 1 && y <= 4 && elevation(x, z, y) === GLASS;

// ---- the shell: perimeter walls on every footprint cell, floor slabs and the roof deck inside ----
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (perimeter(x, z)) {
    for (let y = 0; y <= 5; y++) {
      if (isGlass(x, y, z)) continue;                        // placed below, with its connections
      g.set(x, y, z, elevation(x, z, y));
    }
  } else {
    g.set(x, 0, z, SLAB);                                    // ground-floor slab
    if (z >= 2 && z <= D - 3) g.set(x, 3, z, SLAB);          // upper-floor slab; the glass rows keep air at z 1 and 5
    g.set(x, 5, z, SLAB);                                    // roof deck
  }
}

// ---- glass: each pane connects to a neighbour on its own wall (a pane or a solid block), not into the air gap ----
const solidOrGlass = (x, y, z) => onFootprint(x, z) && perimeter(x, z) && (isGlass(x, y, z) || y <= 5);
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!perimeter(x, z)) continue;
  for (let y = 1; y <= 4; y++) {
    if (!isGlass(x, y, z)) continue;
    const alongX = z === 0 || z === D - 1;                 // the street and back walls run along x
    const a = alongX ? solidOrGlass(x - 1, y, z) : solidOrGlass(x, y, z - 1);
    const b = alongX ? solidOrGlass(x + 1, y, z) : solidOrGlass(x, y, z + 1);
    const st = alongX
      ? { north: "false", south: "false", east: String(b), west: String(a), waterlogged: "false" }
      : { north: String(a), south: String(b), east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, GLASS, st);
  }
}

// ---- the entrance: a dark-oak door on the centre pier of the street front (x 6, z 0), facing out (north) ----
g.set(6, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// ---- the centre pediment: the centre bay rises a block above the cornice (the lidar's 6s at x 5..7) ----
for (let x = 5; x <= 7; x++) for (let z = 0; z <= 1; z++) {
  if (x === 6) g.set(x, 6, z, TRIM);
  else g.set(x, 6, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- roof plant: HVAC boxes on the deck ----
for (const [x, z] of [[2, 3], [3, 3], [9, 3]]) g.set(x, 6, z, "iron_block");

// ---- warm light: glowstone in the air gap directly behind a few panes ----
g.set(2, 1, 1, "glowstone");
g.set(8, 1, 1, "glowstone");
g.set(10, 3, 1, "glowstone");
g.set(4, 3, 5, "glowstone");

g.save(`${DIR}/DC73901.nbt`);
console.log(`DC73901.nbt written, ${g.count()} blocks`);
