// 1426 9th St NW: a 3-storey brick commercial block (ground-floor shopfronts, two upper floors, stone cornice)
// with a one-bay-deep attic setback over the middle of the plan. Lidar roof: 4-6 blocks over the footprint, smoothed
// to two flat tiers: 5 (the cornice line) and 6 (the attic), the attic covering the lidar's 6-high cells.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63944.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..11, z 0..4
const g = new Voxels([12, 18, 5]);

const CORNICE_Y = 5, ATTIC_TOP = 6;           // the flat tiers: cornice line (solid below y5) and attic (solid below y6)
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // pane in a front or back wall
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane in a side wall
const isShopBay = (x) => (x >= 2 && x <= 5) || (x >= 7 && x <= 10);
const isAttic = (x, z) => x >= 3 && x <= 10 && z >= 1;

for (const [x, z, ground] of cells) {
  const front = z === 0, back = z === 4, side = x === 0 || x === 11;
  const edge = front || back || side;
  const attic = isAttic(x, z);
  // foundation below the lowest ground under it: nothing floats on the slope
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  // plinth course
  g.set(x, ground, z, "stone_bricks");
  // body: solid masonry up to the cornice line; the attic adds one more course over its cells
  for (let y = ground + 1; y < CORNICE_Y; y++) g.set(x, y, z, "bricks");
  // cornice course, the top of the walls, and the roof membrane behind it
  if (edge) g.set(x, CORNICE_Y - 1, z, "stone_bricks");
  else if (!attic) g.set(x, CORNICE_Y - 1, z, "smooth_stone");
  // attic tier: walls round its edge, a flat roof membrane over the middle
  if (attic) {
    const boundary = z === 1 || z === 4 || x === 3 || x === 10;
    g.set(x, CORNICE_Y, z, boundary ? "bricks" : "smooth_stone");
  }
}

// --- street front (z = 0): stone pilasters, shopfront bays, door, upper windows
for (let x = 0; x < 12; x++) {
  if (x === 0 || x === 11) for (let y = 1; y <= 3; y++) g.set(x, y, 0, "stone_bricks");
  else if (x === 1) {
    g.set(1, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(1, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(1, 3, 0, "stone_bricks");
    g.set(1, 1, 1, "air"); g.set(1, 2, 1, "air");                     // the doorway's air behind the leaf
  } else if (isShopBay(x)) {
    g.set(x, 1, 0, "glass");                                          // shop display window
    g.set(x, 2, 0, "dark_oak_planks");                                // fascia
    g.set(x, 3, 0, "glass_pane", PANE_EW);                            // upper window
    g.set(x, 1, 1, "air"); g.set(x, 3, 1, "air");                     // air gap behind the glass
  }
}
// warm lights behind the shop glass and the upper windows
g.set(3, 1, 1, "glowstone"); g.set(9, 1, 1, "glowstone");
g.set(4, 3, 1, "shroomlight"); g.set(8, 3, 1, "shroomlight");

// --- rear (z = 4): service door, a row of upper windows
for (let x = 0; x < 12; x++) {
  if (x === 0 || x === 11) for (let y = 1; y <= 3; y++) g.set(x, y, 4, "stone_bricks");
  else if (x === 10) {
    g.set(10, 1, 4, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(10, 2, 4, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(10, 3, 4, "stone_bricks");
    g.set(10, 1, 3, "air"); g.set(10, 2, 3, "air");
  } else if (x === 3 || x === 5 || x === 7 || x === 9) {
    g.set(x, 3, 4, "glass_pane", PANE_EW);
    g.set(x, 3, 3, "air");
  }
}
g.set(5, 3, 3, "shroomlight");

// --- side walls (x = 0 and x = 11): one upper window on each, mid-depth
for (const [x, air] of [[0, 1], [11, 10]]) {
  g.set(x, 3, 2, "glass_pane", PANE_NS);
  g.set(air, 3, 2, "air");
}

// --- attic: windows in the street face of the setback, a roof vent and a lightning rod on top
for (const x of [4, 6, 8]) g.set(x, CORNICE_Y, 1, "glass_pane", PANE_EW);
g.set(8, ATTIC_TOP, 3, "stone_bricks");
g.set(6, ATTIC_TOP, 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
// the lower roof: one vent box on the membrane
g.set(1, CORNICE_Y, 3, "stone_bricks");

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63944.nbt");
console.log(JSON.stringify(info));
