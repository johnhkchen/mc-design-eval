// 26 West 46 Street: a 1920 mid-block Midtown loft building, five storeys on the street with a six-storey middle,
// stepping down to a one-storey rear. Brick walls with calcite string courses, a granite shopfront, a parapet.
// The lidar rows (z 0..25, mean roof height in blocks) are smoothed into five flat tiers (see TIERS): each tier is
// a storey count of 3-block floors with the roof cap in its top layer, so every tier stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1034260.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 5, D = 26, Y = 30;

// z range -> roof height (blocks above y 0): 16-18 at the street and middle, 9 and 6 stepping down, 4 at the rear.
const TIERS = [[0, 5, 15], [6, 14, 18], [15, 16, 9], [17, 21, 6], [22, 25, 4]];
const inFp = new Set(cells.map(([x, z]) => `${x},${z}`));
const H = (x, z) => (inFp.has(`${x},${z}`) ? TIERS.find(([a, b]) => z >= a && z <= b)[2] : 0);   // 0 = outside
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const lowest = Math.min(...cells.map(([, , g]) => g));

const g = new Voxels([W, Y, D]);
const glass = { north: "false", south: "false", east: "true", west: "true" };   // a pane runs along the x-wall
const DIRS = [["n", 0, -1], ["s", 0, 1], ["w", -1, 0], ["e", 1, 0]];

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const hc = H(x, z);
  // Foundation: solid from the lowest ground up to this cell's own ground (zero here: the lot is flat).
  for (let y = lowest; y < (ground.get(`${x},${z}`) ?? 0); y++) g.set(x, y, z, "stone_bricks");
  for (let y = 0; y < hc; y++) {
    const exposed = DIRS.filter(([, dx, dz]) => H(x + dx, z + dz) <= y).map(([d]) => d);   // outside or a lower step
    const ledge = DIRS.some(([, dx, dz]) => H(x + dx, z + dz) === y + 1 && y + 1 < hc);     // a lower roof continues under here
    const roof = y === hc - 1, floor = y > 0 && y % 3 === 0, base = y === 0;
    const facade = exposed.length > 0 && !roof;
    if (roof) { g.set(x, y, z, "smooth_stone"); continue; }                  // roof cap, one layer over the whole tier
    if (!facade && !floor && !base && !ledge) continue;                       // interior air: no interiors
    if (!facade) { g.set(x, y, z, "smooth_stone"); continue; }                 // interior floor slab, ledge
    const street = z === 0 && exposed.includes("n");
    if (base) g.set(x, y, z, street ? "polished_granite" : "stone_bricks");
    else if (floor) g.set(x, y, z, "calcite");                                 // string course at each floor line
    else if ((exposed.includes("n") || exposed.includes("s")) && x >= 1 && x <= 3) g.set(x, y, z, "glass_pane", glass);
    else g.set(x, y, z, "bricks");                                             // side party walls and corner piers
  }
  // Parapet on the roof edge: a brick course with a stone cap, where the roof meets outside or a lower step.
  if (DIRS.some(([, dx, dz]) => H(x + dx, z + dz) < hc)) {
    g.set(x, hc, z, "bricks");
    g.set(x, hc + 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// Penthouse bulkhead on the middle tier's roof (x 1..3, z 8..10), glass to the street-facing face.
for (let x = 1; x <= 3; x++) for (let z = 8; z <= 10; z++) {
  for (let y = 18; y <= 19; y++) {
    const edge = x === 1 || x === 3 || z === 8 || z === 10;
    if (!edge) continue;
    if (y === 19 && z === 8 && x === 2) g.set(x, y, z, "glass_pane", glass);
    else g.set(x, y, z, "bricks");
  }
  g.set(x, 20, z, "stone_bricks");
}

// Shopfront: a door at x 2 with a glass window either side, lit from behind.
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(2, 1, 0, "oak_door", { ...door, half: "lower" });
g.set(2, 2, 0, "oak_door", { ...door, half: "upper" });

// Warm lights behind some glass: shopfront, a middle-floor window, the middle tier's front, a rear window.
g.set(1, 1, 1, "glowstone");
g.set(3, 1, 1, "glowstone");
g.set(2, 4, 1, "shroomlight");
g.set(2, 10, 1, "glowstone");
g.set(2, 16, 7, "glowstone");
g.set(2, 1, 24, "glowstone");

const stats = g.save(`${dir}/NYC1034260.nbt`);
console.log(JSON.stringify(stats));
