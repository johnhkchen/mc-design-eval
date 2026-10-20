import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/TPE103-0061-1F.cells.json`, "utf8"));

const W = 20, H = 19, D = 10;
const vox = new Voxels([W, H, D]);

// ground lookup, normalised so the lowest ground under the footprint is y 0
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) vox.set(x, y, z, id, p);
  else vox.set(x, y, z, id);
};

// Single-storey 2014 Xinyi commercial block: white concrete walls with window
// bays, a red sign band over a glass shopfront with stone piers, a cornice,
// flat roof deck, parapet and a rooftop plant box.
for (const [x, z, raw] of cells) {
  const G = raw - minG;                              // this cell's ground level
  const T = Math.min(Math.max(7, G + 6), 16);        // roof deck level

  // foundation
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const boundary = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const frontBack = front || back;

  // base course / floor slab
  put(x, G, z, boundary ? "smooth_stone" : "light_gray_concrete");

  // flat roof deck over the whole footprint
  put(x, T, z, "light_gray_concrete");

  if (!boundary) {
    // warm light behind the shopfront glass, sparse
    if (z === 1 && x % 6 === 3) put(x, G + 2, z, "glowstone");
    continue;
  }

  // walls
  for (let y = G + 1; y <= T - 2; y++) {
    let id;
    if (y <= G + 3 && front) {
      // shopfront: stone piers every 4 cells, glass between
      id = x % 4 === 0 ? "polished_andesite" : "glass_pane";
    } else if (y === G + 4 && front) {
      id = "red_concrete";                            // sign band
    } else {
      // upper and side bays: glass bays with concrete piers
      const bay = frontBack ? x % 3 !== 0 : z % 3 !== 0;
      id = bay ? "glass_pane" : "white_concrete";
    }
    put(x, y, z, id);
  }

  // entrance: double-height door on the front face, with lintel above
  if (front && x === 9) {
    put(x, G + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, G + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, G + 3, z, "light_gray_concrete");
  }

  // cornice and parapet
  put(x, T - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(x, T + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// rooftop plant box in the middle of the deck
for (let x = 7; x <= 12; x++) {
  for (let z = 3; z <= 6; z++) {
    if (!has(x, z)) continue;
    const G = ground.get(`${x},${z}`) - minG;
    const T = Math.min(Math.max(7, G + 6), 16);
    put(x, T + 1, z, "gray_concrete");
    put(x, T + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

vox.save(`${dir}/TPE103-0061-1F.nbt`);
