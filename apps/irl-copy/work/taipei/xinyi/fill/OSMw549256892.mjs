import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549256892";
const W = 4, H = 23, D = 28;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const b = gy;                                   // this column's ground floor level
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = x === 0;                          // street-facing shopfront side
  const facade = (x === 0 || x === W - 1) && z >= 1 && z <= D - 2; // windowed long walls
  const frame = z % 4 === 0;                      // pilasters / mullions

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Storey floor slabs at ground, 2nd floor, roof (interior and edge)
  put(x, b, z, edge ? "polished_andesite" : "smooth_stone");
  put(x, b + 5, z, edge ? "light_gray_concrete" : "smooth_stone");
  put(x, b + 10, z, edge ? "stone_bricks" : "smooth_stone"); // cornice / roof deck

  if (edge) {
    // Ground storey walls y b+1..b+4
    for (let k = 1; k <= 4; k++) {
      const y = b + k;
      if (!front) {
        // Rear and end walls
        if (facade && k <= 3 && z % 4 !== 0 && (z % 4 === 1 || z % 4 === 2)) {
          put(x, y, z, "glass_pane", PANE_NS);
        } else if (k === 4) {
          put(x, y, z, "light_gray_concrete");
        } else {
          put(x, y, z, "white_terracotta");
        }
      } else {
        // Shopfront on the street side
        if (z === 0 || z === D - 1) {
          put(x, y, z, "white_terracotta");
        } else if (k === 4) {
          put(x, y, z, "red_concrete");           // signband fascia
        } else if (frame) {
          put(x, y, z, "stone_bricks");           // pilasters
        } else if (z === 13 && k <= 2) {
          // Entrance door, two halves
          const half = k === 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: "west", half, hinge: "left", open: "false", powered: "false"
          });
        } else if (z === 13 && k === 3) {
          put(x, y, z, "white_terracotta");       // transom above door
        } else {
          put(x, y, z, "glass_pane", PANE_NS);
        }
      }
    }

    // Second storey y b+6..b+9
    for (let k = 6; k <= 9; k++) {
      const y = b + k;
      const win = facade && (z % 4 === 1 || z % 4 === 2) && k <= 8;
      if (win) put(x, y, z, "glass_pane", PANE_NS);
      else if (k === 9 && facade) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "white_terracotta");
    }

    // Parapet capping the roof
    put(x, b + 11, z, "white_terracotta");
  } else {
    // Interior: air gap, only floor slabs. Warm light behind some front windows.
    if (x === 1 && z % 8 === 2) put(x, b + 7, z, "glowstone");
    if (x === 2 && z % 8 === 6) put(x, b + 7, z, "glowstone");
  }
}

// Roof plant: small HVAC block set on the roof deck, mid-building
for (let x = 1; x <= 2; x++) {
  for (let z = 4; z <= 7; z++) {
    const col = cells.find(([cx, cz]) => cx === x && cz === z);
    if (!col) continue;
    put(x, col[2] + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
