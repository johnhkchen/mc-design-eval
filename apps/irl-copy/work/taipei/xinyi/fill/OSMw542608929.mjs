import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608929";
const W = 13, H = 23, D = 20;

// Two-storey 1980s Taipei commercial block: cream tiled wall, granite-look bands,
// shopfront at street level, flat roof with a light parapet and rooftop plant.
const TOP = 10;            // parapet course; roof surface sits at y = 11
const FLOOR_LINE = 5;      // slab between storeys
const CORNICE = 9;         // top band of storey 2 (also interior roof deck level)

const WALL = "smooth_quartz";
const BASE = "polished_andesite";
const BAND = "polished_andesite";
const FRAME = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const PARAPET = "smooth_quartz";
const DECK = "gray_concrete";
const FLOOR = "smooth_stone";
const FOUND = "stone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
let minG = Infinity;
for (const [x, z, h] of cells) {
  raw.set(key(x, z), h);
  if (h < minG) minG = h;
}
const inFp = (x, z) => raw.has(key(x, z));
const groundOf = (x, z) => Math.max(0, Math.round(raw.get(key(x, z)) - minG));
const isEdge = (x, z) =>
  !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

const put = (x, y, z, b) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (Array.isArray(b)) g.set(x, y, z, b[0], b[1]);
  else g.set(x, y, z, b);
};

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// Side and back bays: glass where z sits in a pair of every four.
const sideBay = (z) => z >= 2 && z <= D - 3 && (z % 4 === 2 || z % 4 === 3);

function facade(x, y, z, gl) {
  const front = z === 0;
  const back = z === D - 1;
  const left = x === 0;
  const right = x === W - 1;

  if (y === gl) return BASE;
  if (y === TOP) return PARAPET;
  if (y === CORNICE || y === FLOOR_LINE || y === 4) return BAND;

  // Storey 2 windows (y 6..8)
  if (y >= 6 && y <= 8) {
    if (front || back) {
      if ([2, 4, 8, 10].includes(x)) return GLASS;
      if (x === 3 || x === 9) return FRAME;
      return WALL;
    }
    if (left || right) return sideBay(z) ? GLASS : WALL;
    return WALL;
  }

  // Ground floor (y 1..3)
  if (front) {
    if (x < 2 || x > 10) return WALL;
    if (x === 6) {
      if (y === 1) return ["dark_oak_door", doorProps("lower")];
      if (y === 2) return ["dark_oak_door", doorProps("upper")];
      return FRAME; // transom above entrance
    }
    if (y === 1) return FRAME; // kickplate
    return GLASS;
  }
  if (back) {
    if (y === 1) return WALL;
    return [2, 4, 8, 10].includes(x) ? GLASS : WALL;
  }
  if (left || right) {
    if (y === 1) return WALL;
    return sideBay(z) ? GLASS : WALL;
  }
  return WALL;
}

for (const [x, z] of [...raw.keys()].map((k) => k.split(",").map(Number))) {
  const gl = groundOf(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gl; y++) put(x, y, z, FOUND);

  const edge = isEdge(x, z);
  for (let y = gl; y <= TOP; y++) {
    if (edge) {
      const b = facade(x, y, z, gl);
      if (b) put(x, y, z, b);
    } else {
      // Interior: floor slabs and roof deck only, air between (no interiors)
      if (y === gl && gl < FLOOR_LINE) put(x, y, z, FLOOR);
      else if (y === FLOOR_LINE) put(x, y, z, FLOOR);
      else if (y === CORNICE) put(x, y, z, DECK);
    }
  }
}

// Warm lights behind glass (sit on interior floor slabs)
for (const [x, z] of [[2, 1], [8, 1]]) {
  if (inFp(x, z)) put(x, 6, z, "glowstone");
}
for (const z of [6, 10, 14]) {
  if (inFp(1, z) && !isEdge(1, z)) put(1, 6, z, "shroomlight");
}
if (inFp(11, 6) && !isEdge(11, 6)) put(11, 6, 6, "shroomlight");

// Entrance lantern inside the shop, standing on the floor
if (inFp(6, 2) && groundOf(6, 2) === 0) put(6, 1, 2, ["lantern", { hanging: "false" }]);

// Rooftop plant: water tank and two AC condenser units on the roof deck
for (const [x, z] of [[3, 12], [4, 12], [3, 13], [4, 13]]) {
  if (inFp(x, z) && groundOf(x, z) <= CORNICE) {
    put(x, 10, z, "iron_block");
    put(x, 11, z, "iron_block");
  }
}
for (const [x, z] of [[8, 12], [9, 12]]) {
  if (inFp(x, z) && groundOf(x, z) <= CORNICE) put(x, 10, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
