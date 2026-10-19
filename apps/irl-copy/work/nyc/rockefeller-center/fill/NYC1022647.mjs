// 136 West 46th Street, 1920 commercial and office building: a narrow midblock loft-office in red brick over a stone
// base, with a two-storey street front, a four-storey body (parapet to 14), and a five-storey middle block (16) set
// back from the body. Footprint 4 x 27 (x = across the lot, z = depth, low z = north = the 46th Street front).
// Solid masonry mass with floor slabs per storey and an air gap behind each glass pane; glowstone behind a few.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022647.cells.json`, "utf8"));
const X = 4, Z = 27, H = 28;

// Roof tiers, flattened from the lidar: a 16-high middle block (z 9-12), a 13-high body with a parapet to 14 (the
// lidar's 14s), and a two-storey wing (7) where the lidar reads 5-8. Storeys are 3 blocks: floors at y = 0, 3, 6...
const roofRaw = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const footprint = new Set(roofRaw.keys());
if (footprint.size !== X * Z) throw new Error(`footprint has ${footprint.size} cells, want ${X * Z}`);
const top = (x, z) => (roofRaw.get(`${x},${z}`) < 12 ? 7 : z >= 9 && z <= 12 ? 16 : 13);
const parapet = (x, z) => top(x, z) === 13;
const inFoot = (x, z) => footprint.has(`${x},${z}`);

// A cell is facade when a neighbour is outside the footprint or sits lower than this layer; otherwise it is interior.
const shell = (x, y, z) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => !inFoot(a, b) || top(a, b) <= y);
const floorLayer = (x, y, z) => y % 3 === 0 || y === top(x, z) - 1;

const g = new Voxels([X, H, Z]);
const put = (x, y, z, block, state) => {
  if (y >= top(x, z) && !(parapet(x, z) && y === 13)) throw new Error(`block above roof at ${x},${y},${z}`);
  g.set(x, y, z, block, state);
};

// Glass states: a pane in a wall running along x (the side walls) connects north and south; one in a wall along z
// (front and rear) connects east and west.
const sideGlass = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const endGlass = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// 1. Masonry mass: each column solid from the foundation up to its roof, floor and roof layers as slabs, the rest air.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  for (let y = 0; y < top(x, z); y++) {
    if (!floorLayer(x, y, z)) continue;
    const outside = shell(x, y, z);
    put(x, y, z, y === 0 && outside ? "stone_bricks" : outside ? "calcite" : "smooth_stone");
  }
  if (parapet(x, z)) put(x, 13, z, shell(x, 13, z) ? "calcite" : "smooth_stone");
}

// 2. Facades: piers of brick between glass bays (every third block along the sides, the corners and the ends), a
// polished granite bulkhead under the shopfront, and glass panes in the rest. Air behind each pane is the interior.
const facadeAir = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  for (let y = 1; y < top(x, z); y++) {
    if (floorLayer(x, y, z) || !shell(x, y, z)) continue;
    facadeAir.push([x, y, z]);
    const ground = y < 3;
    if (z === 0 && x === 1) { put(x, y, z, "dark_oak_door", door(y === 1 ? "lower" : "upper")); continue; }
    if (x === 0 || x === 3) {
      const pier = z % 3 === 0 || z === Z - 1;
      if (pier) put(x, y, z, "bricks");
      else if (ground && y === 1) put(x, y, z, "polished_granite");
      else put(x, y, z, "glass_pane", sideGlass);
    } else {
      if (ground && y === 1) put(x, y, z, "polished_granite");
      else put(x, y, z, "glass_pane", endGlass);
    }
  }
}

// 3. Warm light: glowstone on the interior side of some panes (upper storeys only, a scattered third of them).
for (const [x, y, z] of facadeAir) {
  if (y < 4 || y % 3 !== 1 || g.get(x, y, z)?.block !== "minecraft:glass_pane") continue;   // the lower pane row, which stands on a floor
  if ((z * 2 + Math.floor(y / 3)) % 3 !== 0) continue;
  const inward = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].find(([a, b]) => inFoot(a, b) && !shell(a, y, b) && top(a, b) > y && !floorLayer(a, y, b));
  if (inward) g.set(inward[0], y, inward[1], "glowstone");
}

// 4. Rooftop: a brick penthouse on the middle block and a plant box on the body's roof, both standing on what is below.
// (set directly: these stand above the tier they sit on, which `put` guards against.)
for (const x of [1, 2]) for (const z of [10, 11]) {
  g.set(x, 16, z, "bricks");
  g.set(x, 17, z, "calcite");
}
for (const x of [1, 2]) for (const z of [14, 15]) g.set(x, 14, z, "bricks");

// 5. Check: every block above the ground stands on a block beneath it, or spans from one (a floor slab over the
// interior air of a storey rests on the walls around it), so nothing hangs in the air.
let floating = 0;
const solid = (x, y, z) => Boolean(g.get(x, y, z));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 1; y < H; y++) {
  if (!solid(x, y, z) || solid(x, y - 1, z)) continue;
  const spans = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => solid(a, y, b));
  if (!spans) floating++;
}
if (floating) throw new Error(`${floating} floating blocks`);

console.log(g.save(`${DIR}/NYC1022647.nbt`));
