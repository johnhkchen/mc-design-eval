import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343853.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343853.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 26, H = 23, D = 7;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

const isDoorCell = (x, z) => z === 0 && x === 2;
const isPier = (x) => x % 4 === 0 || x === W - 1;

// Pass 1: foundation, floors, roof, shell walls and facades
for (const [x, z, gr] of cells) {
  const shell = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;
  const back = z === D - 1;

  // foundation up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slabs at ground, storey 2 and roof (full footprint)
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 11, z, "smooth_stone");

  if (!shell) continue;

  // walls, both storeys
  for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");
  for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");

  // base course and storey line
  put(x, gr + 1, z, front ? "stone_bricks" : "light_gray_concrete");
  put(x, gr + 5, z, "light_gray_concrete");

  // parapet and cornice
  put(x, gr + 10, z, "light_gray_concrete");
  put(x, gr + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // facades: windows on front and back
  if ((front || back) && !isPier(x)) {
    if (front && isDoorCell(x, z)) {
      // entrance door, lower and upper halves
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      put(x, gr + 4, z, "red_terracotta");
    } else {
      // ground floor shopfront glass and fascia
      put(x, gr + 2, z, front ? "light_blue_stained_glass" : "light_blue_stained_glass_pane");
      put(x, gr + 3, z, front ? "light_blue_stained_glass" : "light_blue_stained_glass_pane");
      put(x, gr + 4, z, front ? "red_terracotta" : "light_gray_concrete");
      // upper storey windows with sill and head
      put(x, gr + 6, z, "light_gray_concrete");
      put(x, gr + 7, z, "light_blue_stained_glass_pane");
      put(x, gr + 8, z, "light_blue_stained_glass_pane");
      put(x, gr + 9, z, "light_gray_concrete");
    }
  }
}

// Pass 2: warm lights behind glass in the interior (z = 1 row, behind front windows)
const lightsGround = [5, 13, 21];
const lightsUpper = [6, 18];
for (const x of lightsGround) {
  const gr = ground.get(`${x},1`);
  if (gr !== undefined) put(x, gr + 2, 1, "glowstone");
}
for (const x of lightsUpper) {
  const gr = ground.get(`${x},1`);
  if (gr !== undefined) put(x, gr + 7, 1, "shroomlight");
}

// Pass 3: roof equipment (AC plant boxes on the roof)
for (const [x, z, gr] of cells) {
  const onPlantA = (x === 19 || x === 20) && (z === 2 || z === 3);
  const onPlantB = (x === 6 || x === 7) && (z === 3 || z === 4);
  if (onPlantA || onPlantB) {
    put(x, gr + 12, z, "light_gray_concrete");
    put(x, gr + 13, z, "iron_block");
  }
}

g.save(OUT);
