import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612477";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record-less building read as a 2-storey Xinyi commercial block (roof ~11 blocks above lowest ground):
// stone base, red-fascia shopfront, white-concrete upper walls with a glass window grid,
// stone cornice, flat roof with parapet and rooftop plant.
const W = 22, H = 23, D = 31;
const ROOF = 11;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true" };

for (const [x, z, gr] of cells) {
  const base = gr;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Storey lines: ground floor slab, upper floor slab, roof slab (all footprint cells).
  const L1 = Math.min(base + 5, 8);
  put(x, base, z, "smooth_stone");
  put(x, L1, z, "smooth_stone");
  put(x, ROOF, z, "light_gray_concrete");

  const ext = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const perim = ext.N || ext.S || ext.W || ext.E;
  if (!perim) {
    // Interior: air behind the glass; plant units on the roof only.
    if (x >= 7 && x <= 14 && z >= 10 && z <= 20 && (x + z) % 5 === 0) {
      put(x, ROOF + 1, z, "iron_block");
    }
    continue;
  }

  // Position along the facade (x on north/south faces, z on east/west faces).
  const along = (ext.N || ext.S) ? x : z;

  // Ground course.
  put(x, base, z, "polished_granite");

  for (let y = base + 1; y <= ROOF - 1; y++) {
    let id, props;
    if (y < L1 - 1) {
      // Shopfront glazing with white pillars every 4 blocks.
      if (along % 4 === 0) id = "white_concrete";
      else { id = "glass_pane"; props = PANE; }
    } else if (y === L1 - 1) {
      // Red fascia with gold accent.
      id = (along % 6 === 3) ? "gold_block" : "red_concrete";
    } else if (y === L1) {
      id = "stone_bricks"; // storey line
    } else if (y === ROOF - 1) {
      id = "stone_bricks"; // cornice
    } else {
      // Upper floor window grid.
      if (along % 3 === 0) id = "white_concrete";
      else if ((along + y) % 11 === 5) id = "glowstone";
      else { id = "glass_pane"; props = PANE; }
    }
    put(x, y, z, id, props);
  }

  // Parapet ring.
  put(x, ROOF + 1, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
