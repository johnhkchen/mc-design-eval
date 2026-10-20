import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1216424933.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1216424933.nbt";

// Just Inn Xin Yi (City Hall): a two-storey, ~11-block commercial hostel block.
// Ground storey: shopfront with glass and a centre door on the street face.
// Upper storey: white concrete spandrels, light-grey pilasters, glass-pane windows.
// Flat quartz roof with a stone-slab parapet and a small plant box.

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 29, H = 23, D = 7;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  fp.set(key(x, z), Math.round(gr));
}
const has = (x, z) => fp.has(key(x, z));
const grOf = (x, z) => fp.get(key(x, z));
const minG = Math.min(...fp.values());

const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const pilaster = (x) => x % 4 === 0 || x === 0 || x === W - 1;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DOOR_X = 14;
const topRel = 11; // parapet course sits at minG + 11 (roof ~11 above lowest ground)

// Foundations and building levels, cell by cell.
for (const [key1, gr] of fp) {
  const [x, z] = key1.split(",").map(Number);
  const isPerim = perim(x, z);
  const front = z === 0;

  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let rel = 0; rel <= topRel + 1; rel++) {
    const y = minG + rel;
    if (y < gr) continue;

    // Ground floor floor slab (top of foundation), storey line at rel 5, roof at rel 10.
    if (rel === 0) {
      put(x, y, z, isPerim ? "polished_andesite" : "smooth_stone");
      continue;
    }

    if (rel >= 1 && rel <= 4) {
      if (!isPerim) continue; // interior air behind the walls
      if (rel === 4) {
        put(x, y, z, pilaster(x) ? "light_gray_concrete" : "white_concrete");
        continue;
      }
      if (pilaster(x)) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }
      if (front) {
        if (x === DOOR_X && rel === 1) {
          put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (x === DOOR_X && rel === 2) {
          put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, "glass");
        }
      } else {
        put(x, y, z, "glass_pane");
      }
      continue;
    }

    if (rel === 5) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (rel >= 6 && rel <= 9) {
      if (!isPerim) continue;
      if (pilaster(x)) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }
      if (rel === 6 || rel === 9) {
        put(x, y, z, "white_concrete");
        continue;
      }
      put(x, y, z, "glass_pane");
      continue;
    }

    if (rel === 10) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (rel === 11) {
      if (isPerim) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      } else if (x >= 10 && x <= 18 && z >= 2 && z <= 4) {
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    if (rel === 12) {
      if (x >= 12 && x <= 16 && z >= 2 && z <= 4) put(x, y, z, "white_concrete");
      continue;
    }
  }
}

// Warm light behind upper-storey glass, on the first interior row (z = 1).
const lightY = minG + 7;
for (const x of [6, 10, 18, 22]) {
  if (has(x, 1) && lightY >= grOf(x, 1)) put(x, lightY, 1, "glowstone");
}
// Warm light behind the shopfront, on the ground storey.
for (const x of [7, 21]) {
  if (has(x, 1) && minG + 2 >= grOf(x, 1)) put(x, minG + 2, 1, "glowstone");
}

g.save(OUT);
