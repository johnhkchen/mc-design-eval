// DC70850: a 3 x 9 block of Federal-era red brick (c. 1900-1920 commercial row) on the Mall's north-east edge.
// Two storeys over a stone plinth; a shopfront with a centred entrance on the east street face, sash windows
// with calcite sills and lintels, a calcite cornice, and a flat roof that steps down to the south as the lidar does.
// Windows are glass panes cut into the brick with a one-cell air gap behind them; some gaps hold glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70850.cells.json", "utf8"));   // [x, z, ground, roof]

// footprint: each cell's ground and top block (roof height above y0, less one: the top block index)
const cm = new Map();
for (const [x, z, g, r] of cells) cm.set(`${x},${z}`, { g, T: r - 1 });
const has = (x, z) => cm.has(`${x},${z}`);
const topOf = (x, z) => cm.get(`${x},${z}`)?.T ?? -1;
const exposedFace = (x, z, y) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1) || topOf(x - 1, z) < y || topOf(x + 1, z) < y || topOf(x, z - 1) < y || topOf(x, z + 1) < y;

// The facade of each cell in storey rows: y1-2 ground storey, y4-5 upper storey (y3 is the string course, y0 the plinth)
function facadeKind(x, z, y) {
  if (y === 0 || y === 3 || y >= topOf(x, z)) return null;
  if (!has(x, z - 1)) {                       // north front: centred entrance, one window per upper storey
    if (y <= 2) return x === 1 ? "door" : "brick";
    return x === 1 ? "glass" : "brick";
  }
  if (!has(x + 1, z)) {                       // east street face: shopfront under a brick upper storey
    if (y === 1) return "bulk";
    if (y === 2) return z >= 1 && z <= 7 ? "glass" : "brick";
    return z % 2 === 1 ? "glass" : "brick";
  }
  if (!has(x - 1, z)) {                       // west face (and the open corner at x1 z7): sashes on odd bays
    if (y === 1) return "brick";
    return z % 2 === 1 ? "glass" : "brick";
  }
  if (!has(x, z + 1)) {                       // south end: a single shop window over the bulkhead
    if (y === 1) return "bulk";
    if (y === 2) return x === 1 ? "glass" : "brick";
    return "brick";
  }
  return null;
}

// the interior cell behind a glass or door opening is an air gap, not a room
const opens = (x, z, y) => { const k = facadeKind(x, z, y); return k === "glass" || k === "door"; };
const isPocket = (x, z, y) => {
  if (!has(x, z) || facadeKind(x, z, y) || exposedFace(x, z, y) || y === 0 || y === 3 || y >= topOf(x, z)) return false;
  return [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([nx, nz]) => has(nx, nz) && topOf(nx, nz) > y && opens(nx, nz, y));
};

// warm lights behind some panes
const GLOW = new Set(["1,3,2", "1,5,4", "1,1,5"]);

const grid = new Map();
const put = (x, y, z, block, state) => grid.set(`${x},${y},${z}`, { block, state });
const SOLID = new Set(["minecraft:bricks", "minecraft:stone_bricks", "minecraft:calcite", "minecraft:stone", "minecraft:glowstone", "minecraft:iron_block"]);
const MAT = { bulk: "stone_bricks", brick: "bricks" };

for (const [key, { T }] of cm) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y <= T; y++) {
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (y === T) { put(x, y, z, exposedFace(x, z, y) ? "calcite" : "stone"); continue; }   // cornice ring, dark roof deck inside
    if (y === 3) { put(x, y, z, "calcite"); continue; }                                              // string course / floor slab
    const k = facadeKind(x, z, y);
    if (k === "door") {
      const half = y === 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
    } else if (k === "glass") {
      put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });   // connections set below
    } else if (k) {
      put(x, y, z, MAT[k]);
    } else if (isPocket(x, z, y)) {
      if (GLOW.has(`${x},${z},${y}`)) put(x, y, z, "glowstone");   // air gap, lit
    } else {
      put(x, y, z, "bricks");
    }
  }
}

// roof plant on the north tier: one iron box on the deck
put(1, 7, 2, "iron_block");

// glass panes connect to their in-plane neighbours (pane, brick or stone), as vanilla would draw them
const connects = (x, y, z) => { const b = grid.get(`${x},${y},${z}`); return !!b && (b.block === "glass_pane" || SOLID.has(`minecraft:${b.block}`) || SOLID.has(b.block)); };
for (const [k, b] of grid) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  if (x === 1 && (z === 0 || z === 8)) {       // a window in a north or south front: plane runs east-west
    b.state = { north: "false", south: "false", east: String(connects(x + 1, y, z)), west: String(connects(x - 1, y, z)), waterlogged: "false" };
  } else {                                     // east and west faces: plane runs north-south
    b.state = { north: String(connects(x, y, z - 1)), south: String(connects(x, y, z + 1)), east: "false", west: "false", waterlogged: "false" };
  }
}

const g = new Voxels([3, 19, 9]);
for (const [k, { block, state }] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70850.nbt");
