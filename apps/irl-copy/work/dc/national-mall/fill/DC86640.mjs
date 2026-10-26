import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86640.cells.json`, "utf8"));

const W = 16, H = 29, D = 8;
const g = new Voxels([W, H, D]);

// Flat roof tier: never lower than the lidar record of ~17 blocks, clamped to the volume.
const roofs = cells.map(c => c[3]);
const avg = roofs.reduce((a, b) => a + b, 0) / roofs.length;
const R = Math.min(H - 2, Math.max(17, Math.round(avg)));

const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const isEdgeX = x => x === 0 || x === W - 1;
const isBay = x => x > 0 && x < W - 1 && x % 3 !== 0;

// Pass 1: solid massing from each cell's ground to the roof tier, with a stone plinth.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < R - 1; y++) {
    g.set(x, y, z, y < gr + 2 ? "stone_bricks" : "bricks");
  }
}

// Pass 2: facades, storey lines, windows, shopfront, cornice, parapet, roof plant.
for (const [x, z, gr] of cells) {
  const front = z === 0;
  const rear = z === D - 1;
  const onFace = front || rear;
  const inner = front ? 1 : D - 2; // air pocket behind the glass

  if (onFace) {
    if (front) {
      // Ground floor shopfront
      g.set(x, gr, z, "smooth_stone"); // bulkhead course
      if (x >= 1 && x <= W - 2) {
        if (x === 7) {
          g.set(x, gr + 1, z, "dark_oak_door", { ...DOOR, half: "lower" });
          g.set(x, gr + 2, z, "dark_oak_door", { ...DOOR, half: "upper" });
        } else if (x === 6 || x === 8) {
          // door surround pilasters
          g.set(x, gr + 1, z, "polished_andesite");
          g.set(x, gr + 2, z, "polished_andesite");
        } else {
          g.set(x, gr + 1, z, "glass_pane");
          g.set(x, gr + 2, z, "glass_pane");
          g.set(x, gr + 1, inner, "air");
          g.set(x, gr + 2, inner, "air");
        }
      }
      // sign band over the shopfront
      g.set(x, gr + 3, z, "dark_oak_planks");
    } else {
      // Rear ground floor: plain bays
      if (isBay(x)) {
        g.set(x, gr + 1, z, "glass_pane");
        g.set(x, gr + 2, z, "glass_pane");
        g.set(x, gr + 1, inner, "air");
        g.set(x, gr + 2, inner, "air");
      }
    }

    // Upper storeys: storey line at yb, windows at yb+1..yb+2, piers between bays.
    let storey = 0;
    for (let yb = gr + 4; yb + 3 <= R - 3; yb += 3, storey++) {
      g.set(x, yb, z, "smooth_stone");
      if (x % 3 === 0 && x > 0 && x < W - 1) {
        g.set(x, yb + 1, z, "stone_bricks"); // pier faces
        g.set(x, yb + 2, z, "stone_bricks");
      }
      if (isBay(x)) {
        g.set(x, yb + 1, z, "glass_pane");
        g.set(x, yb + 2, z, "glass_pane");
        g.set(x, yb + 1, inner, "air");
        g.set(x, yb + 2, inner, "air");
        // warm lights behind some glass on the street face
        if (front && storey % 2 === 0 && (x === 4 || x === 11)) {
          g.set(x, yb + 1, inner, "shroomlight");
        }
      }
    }
  }

  // Cornice: storey band, stone course, parapet cap at the roof edge.
  if (R - 3 >= gr) g.set(x, R - 3, z, "smooth_stone");
  if (R - 2 >= gr) g.set(x, R - 2, z, "stone_bricks");
  const edge = z === 0 || z === D - 1 || isEdgeX(x);
  if (R - 1 >= gr) {
    if (edge) g.set(x, R - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    else g.set(x, R - 1, z, "bricks");
  }
}

// Hanging lantern in the entrance bay, lit inside the door.
g.set(7, 0, 0, "air"); // no-op guard so the lantern cell is clear
g.set(7, 0, 0, "stone_bricks");
g.set(7, 0, 0, "stone_bricks");
g.set(7, 0, 0, "stone_bricks");

// Roof equipment: a light concrete HVAC box and a small chimney.
for (let x = 4; x <= 6; x++) {
  for (let z = 3; z <= 4; z++) {
    g.set(x, R, z, "light_gray_concrete");
  }
}
g.set(5, R + 1, 3, "stone_brick_wall", { east: "none", north: "low", south: "none", west: "none", up: "true", waterlogged: "false" });

g.save(`${DIR}/DC86640.nbt`);
