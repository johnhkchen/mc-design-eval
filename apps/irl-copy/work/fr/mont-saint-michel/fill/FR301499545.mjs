import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499545";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, D = 18, H = 26;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(`${x},${z}`, { gr: Math.round(gr), rf: Number(rf) });
const has = (x, z) => cellMap.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// One common eave line for the whole building (two storeys above the highest ground),
// so the cornice and roof do not step with the slope.
const gMax = Math.max(...[...cellMap.values()].map(c => c.gr));
const E = gMax + 10;
const rfs = cells.map(c => Number(c[3])).sort((a, b) => a - b);
const roofY = rfs[Math.floor(rfs.length / 2)];
const Hc = Math.max(3, Math.min(8, Math.round(roofY - E)));

function S(x, y, z, b, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
}

const GLASS_LONG = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const GLASS_GABLE = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const SILL = { type: "top", waterlogged: "false" };
const ROOF_STAIR = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });
const DOOR_X = 14;

for (const [key, { gr }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const d = Math.min(z, D - 1 - z);
  const L = E + Math.round(Math.min(d, 8) * Hc / 8);

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "cobblestone");

  if (edge) {
    let face = null;
    if (z === 0) face = "N";
    else if (z === D - 1) face = "S";
    else if (x === 0) face = "W";
    else if (x === W - 1) face = "E";

    // wall shell from this cell's ground up to the common eave
    for (let y = gr; y < E; y++) {
      let b = "stone_bricks";
      if (y === gr) b = "granite";                 // base course
      if (y === E - 5) b = "chiseled_stone_bricks"; // storey line
      S(x, y, z, b);
    }

    let isWin = false;
    let glassP = null;
    if (face === "N" || face === "S") {
      isWin = x > 0 && x < W - 1 && (x % 4 === 1 || x % 4 === 2);
      glassP = GLASS_LONG;
    } else if (face === "W" || face === "E") {
      isWin = z > 0 && z < D - 1 && (z % 4 === 1 || z % 4 === 2);
      glassP = GLASS_GABLE;
    }
    if (face === "N" && x === DOOR_X) isWin = false;

    if (isWin) {
      for (const y of [gr + 2, gr + 3, E - 4, E - 3]) S(x, y, z, "glass_pane", glassP);
      S(x, gr + 1, z, "stone_brick_slab", SILL);
    }

    if (face === "N" && x === DOOR_X) {
      const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
      S(x, gr + 1, z, "oak_door", { ...dp, half: "lower" });
      S(x, gr + 2, z, "oak_door", { ...dp, half: "upper" });
      // entrance surround: framed lintel and flanking stone
      S(x, gr + 3, z, "chiseled_stone_bricks");
      S(x - 1, gr + 3, z, "chiseled_stone_bricks");
      S(x + 1, gr + 3, z, "chiseled_stone_bricks");
      S(x - 1, gr + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      S(x + 1, gr + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  } else {
    // interior: floor, air, upper floor, air, ceiling
    S(x, gr, z, "stone_bricks");
    S(x, E - 5, z, "spruce_planks");
    S(x, E - 1, z, "stone_bricks");
  }

  // roof: solid mass under a slate stair course
  for (let y = E; y < L; y++) S(x, y, z, "stone_bricks");
  S(x, L, z, "deepslate_tile_stairs", ROOF_STAIR(z <= 8 ? "north" : "south"));
}

// warm lights behind north-face windows (lower and upper storey)
for (let x = 1; x < W - 1; x++) {
  if (!has(x, 1) || x % 8 !== 1 || x === DOOR_X) continue;
  const { gr } = cellMap.get(`${x},1`);
  S(x, gr + 2, 1, "glowstone");
  S(x, E - 4, 1, "glowstone");
}

// chimney on the ridge
if (has(22, 8)) {
  const L = E + Hc;
  for (let y = L + 1; y <= L + 3; y++) S(22, y, 8, "stone_bricks");
  S(22, L + 4, 8, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
