// 24 West 45th Street, 1902: a nine-storey red-brick commercial-and-residential building on a 25-foot lot, the Renaissance
// Revival loft-and-flat type that filled Midtown before the 1916 setbacks. Footprint 7 x 28: x 1-6 is the building, z 0-24
// (low z = north = the 45th Street front). The lidar has no roof on x 0 (a light court on the west lot line) or on the rear
// yard (z 25-27), so those are paved at their ground. The lidar roof is 28-30 across the body: no setbacks, so one flat
// parapet line at 30 blocks. The base is polished granite, the body red brick with stone string courses every storey
// (3 blocks), the 2-storey shopfront on the street with a residential door, and a stone cornice under a brick parapet.
// Windows are glass panes in brick piers with air behind them, a few with glowstone behind the glass. The roof has a
// timber water tower on iron legs and a stair bulkhead. The solid core needs no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034233.cells.json`, "utf8"));
const X = 7, Y = 42, Z = 28;
const TOP = 30;                                             // parapet line: the body's lidar roof, flattened
const BAND = new Set([3, 4, 7, 10, 13, 16, 19, 22, 25]);    // lintel over the shopfront, then a string course per storey
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => ground.has(`${x},${z}`);
const B = (x, z) => inFoot(x, z) && x >= 1 && z <= 24;     // the building; x 0 and z 25-27 are open ground

// A block is solid where the building stands below its parapet, or where open ground is paved (up to its ground).
const solid = (x, y, z) => (B(x, z) ? y < TOP : inFoot(x, z) && y <= ground.get(`${x},${z}`));
// The first outward face (N, S, W, E) with open air beyond it, or null for a core block.
const exposed = (x, y, z) => Object.keys(DIRS).find((d) => { const [dx, dz] = DIRS[d]; return !solid(x + dx, y, z + dz); }) ?? null;

const g = new Voxels([X, Y, Z]);

// 1. Open ground: a foundation under the paving, which is a lighter stone than the streets so the court and yard read.
for (const [x, z, gr] of cells) {
  if (B(x, z)) continue;
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");
}

// 2. The building: a granite foundation and base course, a brick core to the parapet, and the faces. The window cells
// are recorded and carved in pass 3, after the core, so their air is not filled back in.
const recesses = [];
for (const [x, z, gr] of cells) {
  if (!B(x, z)) continue;
  for (let y = 0; y < TOP; y++) {
    if (y < gr || y === 0) { g.set(x, y, z, "polished_granite"); continue; }   // foundation and base course
    const d = exposed(x, y, z);
    if (!d) { g.set(x, y, z, y === TOP - 1 ? "smooth_stone" : "bricks"); continue; }   // core; the roof covering under the parapet
    if (y === TOP - 1) { g.set(x, y, z, "bricks"); continue; }                         // parapet
    if (y === TOP - 2) { g.set(x, y, z, "smooth_stone"); continue; }                   // cornice
    if (BAND.has(y)) { g.set(x, y, z, "smooth_stone"); continue; }                     // storey line
    if (d === "N" && y < 3) {                                                          // shopfront, pier at x 4
      if (x === 4) g.set(x, y, z, "polished_granite");
      else { g.set(x, y, z, "glass"); recesses.push([x, y, z, d, false]); }
      continue;
    }
    const frontOrBack = d === "N" || d === "S";
    const pier = frontOrBack ? x % 2 === 1 : z % 3 !== 2;                              // windows on even x / every third z
    if (pier) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", frontOrBack ? NS : EW);
    recesses.push([x, y, z, d, true]);
  }
}

// 3. Air behind each window (one block in), with a warm glowstone behind some of them.
for (const [x, y, z, d] of recesses) {
  const [dx, dz] = DIRS[d];
  const lit = (x * 5 + y * 7 + z * 3) % 11 === 0;
  g.set(x - dx, y, z - dz, lit ? "glowstone" : "air");
}

// 4. Residential entrance on 45th Street (x 1): a dark-oak door in a vestibule, a hanging lantern under the lintel band.
g.set(1, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(1, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(1, 1, 1, "air");
g.set(1, 2, 1, "air");
g.set(1, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 5. Roof: a timber water tower on a brick plinth (the classic New York tank), a stair bulkhead with a slab cap.
for (const x of [2, 3]) for (const z of [10, 11]) for (const y of [30, 31, 32]) g.set(x, y, z, "bricks");
for (const x of [2, 3]) for (const z of [10, 11]) for (const y of [33, 34, 35]) g.set(x, y, z, "spruce_planks");
for (const x of [2, 3]) for (const z of [10, 11]) g.set(x, 36, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
for (const x of [5, 6]) for (const z of [7, 8]) {
  g.set(x, 30, z, "bricks");
  g.set(x, 31, z, "bricks");
  g.set(x, 32, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(`${DIR}/NYC1034233.nbt`);
console.log(JSON.stringify({ cells: cells.length, windows: recesses.filter((r) => r[4]).length, ...stats }));
