// NYC1034269: 46 West 46th Street, built 1920, mixed residential and commercial. Six by 28 blocks, five storeys of
// red brick on a stone base: shopfronts with a red awning on the street faces, a calcite string course per storey,
// a stepped roof (a lower core in the middle of the back, a one-storey rear wing) and a wooden water tank.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 6, L = 28, H = 29;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034269.cells.json`, "utf8"));   // [x, z, ground, roof]

// Lidar roof per cell, median-filtered over the 3x3 neighbourhood (drops the stray 0s), then snapped to three tiers:
// a one-storey rear wing (5), the main block (17) and a lower core (15). The ground is absorbed by the foundation:
// every column is solid from y 0, so each cell stands on its own ground and the downhill side shows its full height.
const roofRaw = Array.from({ length: L }, () => new Array(W).fill(0));
for (const [x, z, , r] of cells) roofRaw[z][x] = r;
const median = (v) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)];
const roofMed = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz;
    if (xx >= 0 && xx < W && zz >= 0 && zz < L) v.push(roofRaw[zz][xx]);
  }
  return median(v);
};
const tier = (r) => (r <= 6 ? 5 : r >= 16 ? 17 : 15);
const isPerim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === L - 1;
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === L - 1);
const commercial = (x, z) => x === 0 || x === W - 1 || z === 0;

// Interior tiers first; a facade cell is never lower than an interior neighbour, so no roof edge is left open.
const tiers = Array.from({ length: L }, (_, z) => Array.from({ length: W }, (_, x) => tier(roofMed(x, z))));
const top = Array.from({ length: L }, (_, z) => Array.from({ length: W }, (_, x) => {
  let h = tiers[z][x];
  if (isPerim(x, z)) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const xx = x + dx, zz = z + dz;
    if (xx >= 0 && xx < W && zz >= 0 && zz < L && !isPerim(xx, zz)) h = Math.max(h, tiers[zz][xx]);
  }
  return h;
}));

// Glass panes join their neighbours along the wall they sit in.
const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // west/east wall
const GLASS_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // north/south wall
const glass = (x, z) => ["glass_pane", z === 0 || z === L - 1 ? GLASS_Z : GLASS_X];
const DOOR = (x, half) => ({ facing: "north", half, hinge: x === 2 ? "left" : "right", open: "false", powered: "false" });

// Windows: a single pane on alternate bays of the long faces, four across the north face, a bay per two blocks at the rear.
const windowAt = (x, z) => !corner(x, z) && (z === 0 ? x >= 1 && x <= 4 : z === L - 1 ? x % 2 === 1 : (x === 0 || x === W - 1) && z % 2 === 1);

function storefront(x, z, y) {
  if (z === 0 && (x === 2 || x === 3)) {                       // the double door under a glass transom
    if (y === 1) return ["dark_oak_door", DOOR(x, "lower")];
    if (y === 2) return ["dark_oak_door", DOOR(x, "upper")];
    return glass(x, z);
  }
  if (corner(x, z) || ((x === 0 || x === W - 1) && z % 4 === 0)) return ["stripped_dark_oak_log"];   // piers
  if (y === 1) return ["black_concrete"];                      // glazed bulkhead
  return glass(x, z);
}

function facade(x, z, y, R) {
  if (y >= R) return null;
  if (y === R - 1) return ["stone_bricks"];                     // cornice
  if (y === 0) return ["polished_andesite"];                    // base course
  if (y <= 3 && commercial(x, z)) return storefront(x, z, y);
  if (y <= 3) return y === 2 && windowAt(x, z) ? glass(x, z) : [y === 3 ? "calcite" : "bricks"];   // rear wing
  if (corner(x, z)) return ["calcite"];                         // quoins
  if (y === 4 && commercial(x, z) && R >= 9) {                  // shopfront awning, striped on the long faces
    return [x === 0 || x === W - 1 ? (z % 2 === 0 ? "red_wool" : "white_wool") : "red_wool"];
  }
  const rel = (y - 4) % 3;                                      // each storey: sill, window, string course
  if (rel === 2) return ["stone_bricks"];                       // string course: grey stone between red brick
  if (rel === 0) return windowAt(x, z) ? ["calcite"] : ["bricks"];
  return windowAt(x, z) ? glass(x, z) : ["bricks"];
}

// Interior: an air gap behind the glass, a floor slab per storey, a solid roof deck. Nothing is hollow beyond that.
function interior(y, R) {
  if (y === 0) return "stone_bricks";
  if (y === R - 1) return "gravel";                             // roof deck
  const floors = R >= 9 ? [4, 7, 10, 13] : [1];
  if (y === R - 2 || floors.includes(y)) return "smooth_stone";
  return null;
}

const g = new Voxels([W, H, L]);
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const R = top[z][x];
  for (let y = 0; y < R; y++) {
    if (isPerim(x, z)) {
      const b = facade(x, z, y, R);
      if (b) g.set(x, y, z, b[0], b[1]);
    } else {
      const b = interior(y, R);
      if (b) g.set(x, y, z, b);
    }
  }
}

// Warm light behind some panes: only into air, only below the roof deck.
const lit = (x, y, z, block, state) => { if (g.get(x, y, z) === null && y < top[z][x] - 2) g.set(x, y, z, block, state); };
for (const z of [3, 9, 15, 21]) for (const y of [8, 11]) lit(1, y, z, "glowstone");
for (const z of [5, 11, 17, 23]) for (const y of [5, 14]) lit(4, y, z, "glowstone");
lit(2, 11, 1, "glowstone");
lit(3, 5, 1, "glowstone");
for (const z of [1, 9, 17, 25]) lit(1, 3, z, "lantern", { hanging: "true" });   // shop lanterns under the floor slab

// Roof equipment on the main block: a water tank on four iron legs over a 2 x 3 footprint (all cells at 17).
for (let z = 9; z <= 11; z++) for (const x of [2, 3]) if (top[z][x] !== 17) throw new Error(`water tank cell ${x},${z} is not on the main roof`);
for (const y of [17, 18]) for (const [x, z] of [[2, 9], [3, 9], [2, 11], [3, 11]]) g.set(x, y, z, "iron_bars");
for (const y of [19, 20, 21]) for (let z = 9; z <= 11; z++) for (const x of [2, 3]) g.set(x, y, z, "spruce_planks");
for (let z = 9; z <= 11; z++) for (const x of [2, 3]) g.set(x, 22, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

const info = g.save(`${DIR}/NYC1034269.nbt`);
console.log(JSON.stringify({ ...info, cells: g.count() }));
