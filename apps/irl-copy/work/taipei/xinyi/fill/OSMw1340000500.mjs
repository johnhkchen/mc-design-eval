import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1340000500";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 8, H = 19, D = 4;
const ROOF = 7;                      // roof top, absolute, above lowest ground
const g = new Voxels([W, H, D]);

const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.min(6, gr0));   // this cell's ground level

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;

  for (let y = gr; y <= ROOF; y++) {
    const k = y - gr;                  // storey-relative row
    const isDoorCol = x === 3;

    if (y === ROOF) {                  // roof: parapet ring + roof deck
      g.set(x, y, z, perimeter ? "smooth_stone" : "gray_concrete");
      continue;
    }

    if (!perimeter) {                  // interior: floors and light, no air-filled walls
      if (k === 0) g.set(x, y, z, "stone_bricks");        // ground floor slab
      else if (k === 3) g.set(x, y, z, "smooth_stone");   // upper floor slab
      if (x === 2 && z === 1 && k === 1) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      if (x === 5 && z === 1 && k === 4) g.set(x, y, z, "shroomlight");
      continue;
    }

    if (front) {                       // street facade, z = 0
      if (k === 0) {
        if (isDoorCol) g.set(x, y, z, "oak_door", door("lower"));
        else g.set(x, y, z, "stone_bricks");
      } else if (k === 1) {
        if (isDoorCol) g.set(x, y, z, "oak_door", door("upper"));
        else if (x === 0 || x === W - 1) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, "glass_pane");
      } else if (k === 2) {
        if (isDoorCol) g.set(x, y, z, "glass_pane");       // transom over door
        else g.set(x, y, z, "red_concrete");               // fascia sign band
      } else if (k === 3) {
        g.set(x, y, z, "smooth_stone");                    // storey belt
      } else if (k === 4 || k === 5) {
        if (x === 0 || x === W - 1 || x === 3 || x === 6) g.set(x, y, z, "white_concrete");
        else g.set(x, y, z, "glass_pane");
      } else if (k === 6) {
        g.set(x, y, z, "smooth_stone");                    // cornice
      }
      continue;
    }

    // side and back walls
    if (k === 0) g.set(x, y, z, "stone_bricks");
    else if (k === 3 || k === 6) g.set(x, y, z, "smooth_stone");
    else if ((k === 4 || k === 5) && x !== 0 && x !== W - 1 && z === D - 1 && (x === 2 || x === 5))
      g.set(x, y, z, "glass_pane");                        // back windows
    else if ((k === 4 || k === 5) && (x === 0 || x === W - 1) && z === 1)
      g.set(x, y, z, "glass_pane");                        // side windows
    else g.set(x, y, z, "light_gray_concrete");
  }
}

// rooftop plant and a small mast above the parapet
g.set(2, ROOF + 1, 2, "iron_block");
g.set(5, ROOF + 1, 1, "lightning_rod");

g.save(`${dir}/${id}.nbt`);
