import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low two-storey Xinyi-era commercial block: pale tiled/concrete facade, stone base
// and belt course, tinted glass bays, shopfront with entrance on the street (z = 0) face,
// flat roof with parapet and a small plant box. Roof sits 7 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337625";
const W = 9, H = 19, D = 26;
const ROOF = 7; // roof top height above each column's own ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(`${x},${z}`, Math.round(gr));
}

const g = new Voxels([W, H, D]);
const inF = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);
const perim = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";
const WALL = "smooth_quartz";

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const b = gr;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const isP = perim(x, z);

  // Floor slab at the base of the ground storey
  put(x, b, z, isP ? "polished_andesite" : "smooth_stone");

  if (!isP) {
    // Interior: storey floor slab at r=3, roof deck at r=6, air between
    put(x, b + 3, z, "smooth_stone");
    put(x, b + 6, z, "gray_concrete");
    // Small roof plant box above the deck
    if (x >= 2 && x <= 3 && z >= 9 && z <= 12) put(x, b + 7, z, "light_gray_concrete");
    continue;
  }

  // Facade: determine which face and bay index
  let face = null, i = 0;
  if (z === 0) { face = "front"; i = x; }
  else if (z === D - 1) { face = "back"; i = x; }
  else if (x === 0) { face = "west"; i = z; }
  else if (x === W - 1) { face = "east"; i = z; }

  // Default wall for all four storey-course rows
  for (const r of [1, 2, 4, 5]) put(x, b + r, z, WALL);
  // Belt course, parapet
  put(x, b + 3, z, "stone_bricks");
  put(x, b + 6, z, "stone_bricks");

  const pane = (face === "front" || face === "back") ? PANE_EW : PANE_NS;

  if (face === "front") {
    // Shopfront, ground storey (r=1,2)
    if (x === 4) {
      // Entrance door, facing the street (south when viewed from the north side)
      const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
      put(x, b + 1, z, "oak_door", { ...dp, half: "lower" });
      put(x, b + 2, z, "oak_door", { ...dp, half: "upper" });
    } else if (x % 3 === 0) {
      // Piers between shop bays
      put(x, b + 1, z, WALL);
      put(x, b + 2, z, WALL);
    } else {
      put(x, b + 1, z, GLASS, pane);
      put(x, b + 2, z, GLASS, pane);
    }
  } else if (face) {
    // Other faces: windows on the same bay rhythm
    if (i % 3 === 1) {
      put(x, b + 1, z, GLASS, pane);
      put(x, b + 2, z, GLASS, pane);
    }
  }

  // Upper storey windows, with some warm lit bays
  if (face && i % 3 === 1) {
    const lit = ((i + x + z) % 5 === 0);
    if (lit) put(x, b + 4, z, "glowstone");
    else put(x, b + 4, z, GLASS, pane);
    put(x, b + 5, z, GLASS, pane);
  }

  // Parapet top sits on the roof deck (no gaps)
  put(x, b + 6, z, "stone_bricks");
  void ROOF;
}

g.save(`${DIR}/${ID}.nbt`);
