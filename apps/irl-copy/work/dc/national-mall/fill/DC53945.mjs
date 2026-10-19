// 300 12th St SW: a brick-and-concrete residential apartment block (1960s SW urban-renewal type), a tower on a
// low base. Massing follows the lidar roof: 3x3 median smooths the noise, then roofs snap to flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC53945.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFp = (x, z) => cell.has(key(x, z));
const G = (x, z) => cell.get(key(x, z)).g;
const T = new Map();                                    // top of each column (exclusive): blocks at y < T
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // north, south, west, east

// Flat roof tiers: tower 13 (penthouse) / 12, mid-rise 7, wing 4, low wing 2.
const tier = (m) => (m >= 13 ? 13 : m >= 11 ? 12 : m >= 5 ? 7 : m >= 3 ? 4 : 2);
const median = (v) => v.sort((a, b) => a - b)[v.length >> 1];
for (const [x, z, g] of cells) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFp(x + dx, z + dz)) near.push(cell.get(key(x + dx, z + dz)).r);
  T.set(key(x, z), Math.max(tier(median(near)), g + 1));
}
const top = (x, z) => T.get(key(x, z));
const solid = (x, y, z) => inFp(x, z) && y >= 0 && y < top(x, z);
const maxTop = Math.max(...T.values());

const B = new Voxels([25, 25, 40]);
const shellOf = (x, y, z) => NB.find(([dx, dz]) => !solid(x + dx, y, z + dz));
const isShell = (x, y, z) => solid(x, y, z) && !!shellOf(x, y, z);

for (let y = 0; y < maxTop; y++) {
  for (const [x, z, g] of cells) {
    if (!solid(x, y, z)) continue;
    const t = top(x, z);
    if (y < g) { B.set(x, y, z, "stone_bricks"); continue; }     // foundation up to the cell's ground
    const out = shellOf(x, y, z);
    if (!out) {                                                   // interior: floor slabs and a roof deck, air between
      if (y === t - 1) B.set(x, y, z, "stone");
      else if (y % 2 === 0) B.set(x, y, z, "smooth_stone");
      continue;
    }
    // Facade: bands at each storey line, brick piers, tinted glass in the window bays of each storey.
    const [dx] = out;
    const along = dx !== 0 ? z : x;
    let m;
    if (y === t - 1) m = "stone_bricks";                          // parapet
    else if (y === t - 2) m = "light_gray_concrete";              // cornice
    else if (y === 1) m = "stone_bricks";                         // base course
    else if (y % 2 === 0) m = "light_gray_concrete";              // storey line
    else if (y <= t - 3 && along % 3 === 1) m = "light_blue_stained_glass";
    else m = "bricks";
    B.set(x, y, z, m);
    // Warm light behind some panes: glowstone in the air gap just inside the glass.
    if (m === "light_blue_stained_glass" && (x * 7 + y * 13 + z * 5) % 9 === 0) {
      const xi = x - dx, zi = z - out[1];
      if (solid(xi, y, zi) && !isShell(xi, y, zi)) B.set(xi, y, zi, "glowstone");
    }
  }
}

// Street entrance on the north face: door and lobby glass, a canopy band, two lanterns on it.
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
B.set(12, 1, 0, "dark_oak_door", { ...DOOR, half: "lower" });
B.set(12, 2, 0, "dark_oak_door", { ...DOOR, half: "upper" });
B.set(13, 1, 0, "light_blue_stained_glass");
B.set(13, 2, 0, "light_blue_stained_glass");
for (let x = 10; x <= 15; x++) for (let z = 0; z <= 1; z++) B.set(x, 3, z, "stone_bricks");
for (const x of [11, 14]) B.set(x, 4, 0, "lantern", { hanging: "false" });

// Roof plant: a few air-handling blocks on the roofs of the tall tiers.
for (const [x, z] of cells) {
  const t = top(x, z);
  if (t >= 7 && x % 6 === 3 && z % 6 === 3) B.set(x, t, z, "iron_block");
}

const stats = B.save(`${HERE}/DC53945.nbt`);
console.log(`DC53945.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries`);
