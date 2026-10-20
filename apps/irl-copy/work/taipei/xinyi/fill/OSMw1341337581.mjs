import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341337581.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341337581.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 12, H = 19, D = 5;
const ROOF_Y = 6;   // roof deck layer; roof top surface sits at y 7
const BAND_Y = 3;   // storey line / floor slab between ground floor and upper storey
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);

function put(x, y, z, id, props) {
  if (!has(x, z) || y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const doorLower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const doorUpper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const per = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;
  const back = z === D - 1;
  const sideX = x === 0 || x === W - 1;

  // Foundation up to the cell's own ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF_Y; y++) {
    // Roof deck with parapet ring on the perimeter
    if (y === ROOF_Y) {
      put(x, y, z, per ? "smooth_stone" : "gray_concrete");
      continue;
    }
    // Storey line / floor slab; light band on the facade
    if (y === BAND_Y) {
      put(x, y, z, per ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    // Interior is air apart from slabs
    if (!per) continue;

    if (y < BAND_Y) {
      // Ground floor: shopfront on front, plain white walls elsewhere
      if (front) {
        if (x === 0 || x === W - 1) {
          put(x, y, z, "stone_bricks");
        } else if (x === 5 && y === gr && gr <= 1) {
          put(x, y, z, "oak_door", doorLower);
        } else if (x === 5 && y === gr + 1 && y < BAND_Y) {
          put(x, y, z, "oak_door", doorUpper);
        } else if (y === 2) {
          put(x, y, z, "dark_oak_planks");
        } else {
          put(x, y, z, "glass");
        }
      } else if (back) {
        put(x, y, z, sideX ? "stone_bricks" : "white_concrete");
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    // Upper storey (y 4..5): window grid on front and back, plain on sides
    if (front || back) {
      if (sideX || x % 3 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneEW);
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Warm lights behind glass (interior air cells at z = 1)
const lights = [
  [2, 4, 1, "glowstone"],
  [8, 4, 1, "glowstone"],
  [3, 1, 1, "shroomlight"],
  [9, 1, 1, "shroomlight"],
];
for (const [x, y, z, id] of lights) put(x, y, z, id);

// Roof equipment on the back half
put(2, ROOF_Y + 1, 2, "iron_block");
put(3, ROOF_Y + 1, 2, "iron_block");

g.save(OUT);
