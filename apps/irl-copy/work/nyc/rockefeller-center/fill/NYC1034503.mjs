// 73 West 47th Street (NYC1034503): a 1920 mixed-use walk-up, brick on a granite base, limestone trim, a shopfront
// on the street (south, z = 20) and a blank rear wall to the north. Five storeys (15 blocks) plus a cornice, with an 18-block
// stair tower and rear wall. Lidar roof heights are smoothed into flat tiers; a rear court is open to sky.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034503.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 5, D = 21, H = 30;
const g = new Voxels([W, H, D]);

const BODY = "bricks", TRIM = "calcite", BASE = "polished_granite", ROOF = "gray_concrete";
const FLOOR = "smooth_stone", PAVE = "stone_bricks", SHOP_BULK = "dark_oak_planks";
const GLASS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const BANDS = [3, 6, 9, 12];                                  // string courses: sill of one storey, lintel of the one below
const WINDOW_ROWS = [[1, 2], [4, 5], [7, 8], [10, 11], [13, 14]];   // ground shopfront, then four residential storeys
const FRONT = D - 1, BACK = 0;

// Lidar roof (above y 0) -> a clean tier. Blocks fill y < top, so every column stands on the ground.
const tier = (roof, x, z) => {
  if (roof === 0) return 0;                                    // open to sky: the rear light court
  if (roof <= 5) return 3;                                     // one-storey rear wing
  if (roof <= 10) return 6;
  if (roof <= 13) return 12;                                   // setback
  if (z === BACK || (x === 1 && z === 1)) return 18;           // north party wall and the stair tower
  return 15;                                                   // five storeys; lidar 14-17 noise smoothed
};

const top = new Map();
for (const [x, z, , roof] of cells) top.set(`${x},${z}`, tier(roof, x, z));
const T = (x, z) => top.get(`${x},${z}`) ?? 0;
const perimeter = (x, z) => x === 0 || x === W - 1 || z === BACK || z === FRONT;

// 1. Massing: solid brick columns from the ground; a granite foundation only where the ground is higher (none here).
for (const [x, z, ground] of cells) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);
  for (let y = ground; y < T(x, z); y++) g.set(x, y, z, BODY);
  if (T(x, z) === 0) g.set(x, 0, z, PAVE);                      // rear court paving at ground level
}

// 2. Base course, string courses on the outer walls, roof membrane inside, parapets on the edge.
for (const [x, z] of [...top.keys()].map((k) => k.split(",").map(Number))) {
  const t = T(x, z);
  if (t === 0) continue;
  if (perimeter(x, z)) {
    g.set(x, 0, z, BASE);
    for (const b of BANDS) if (b < t) g.set(x, b, z, TRIM);
    if (t === 15 && z !== FRONT) g.set(x, 15, z, BODY);        // side and rear parapet
  } else {
    g.set(x, t - 1, z, ROOF);                                   // flat tar roof, terraces on the setbacks
  }
}

// 3. The stair tower: a shaft with limestone bands, a cap and a lantern on top.
for (const b of [...BANDS, 15]) g.set(1, b, 1, TRIM);
g.set(1, 17, 1, TRIM);
g.set(1, 18, 1, "lantern", { hanging: "false", waterlogged: "false" });

// 4. Cornices: front cornice with a brick parapet above, rear cornice and cap.
for (let x = 0; x < W; x++) {
  g.set(x, 15, FRONT, TRIM); g.set(x, 16, FRONT, BODY);
  g.set(x, 15, BACK, TRIM); g.set(x, 17, BACK, TRIM);
}

// 5. The street front: shopfront, residential door and canopy, limestone quoins, window grid.
for (const rows of WINDOW_ROWS) for (const y of rows) for (let x = 1; x <= 3; x++) g.set(x, y, FRONT, "glass_pane", GLASS);
for (let x = 1; x <= 3; x++) g.set(x, 0, FRONT, SHOP_BULK);       // shopfront bulkhead
for (const b of BANDS) for (let x = 0; x < W; x++) g.set(x, b, FRONT, TRIM);
for (let y = 3; y <= 14; y++) g.set(0, y, FRONT, TRIM);            // quoins
for (let y = 1; y <= 14; y++) g.set(W - 1, y, FRONT, TRIM);
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(0, 0, FRONT, "dark_oak_door", doorState("lower"));
g.set(0, 1, FRONT, "dark_oak_door", doorState("upper"));
g.set(0, 2, FRONT, "dark_oak_slab", { type: "bottom", waterlogged: "false" });   // canopy over the door

// 6. The rear wall: the same window grid facing the court.
for (const rows of WINDOW_ROWS.slice(1)) for (const y of rows) for (let x = 1; x <= 3; x++) g.set(x, y, BACK, "glass_pane", GLASS);

// 7. Behind the glass: an air pocket per window, floor slabs per storey, and warm light in a few windows.
for (let x = 1; x <= 3; x++) {
  for (const y of [0, 3, 6, 9, 12, 14]) g.set(x, y, FRONT - 1, FLOOR);   // storey floors, and the top ceiling
  for (const [a, b] of WINDOW_ROWS) for (let y = a; y <= b; y++) if (!(y === 14)) g.set(x, y, FRONT - 1, "air");
}
g.set(0, 0, FRONT - 1, FLOOR);                                     // residential hall: floor, air, lantern
g.set(0, 1, FRONT - 1, "air");
g.set(0, 2, FRONT - 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(2, 1, FRONT - 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(2, 4, FRONT - 1, "glowstone");
g.set(1, 7, FRONT - 1, "glowstone");
g.set(3, 10, FRONT - 1, "glowstone");
g.set(2, 13, FRONT - 1, "glowstone");

const stats = g.save(`${DIR}/NYC1034503.nbt`);
console.log(`NYC1034503.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries`);
