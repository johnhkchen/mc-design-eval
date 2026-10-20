import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1339999086";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 10 x 10 footprint, roof about 12 blocks above lowest ground.
// Reads as a 1980s-90s Xinyi low-rise commercial block: stone-based base,
// pale quartz walls with stone spandrels, glazed shopfront, gray roof deck, parapet cornice.
const W = 10, H = 24, D = 10;
const TOP = 12;                       // roof surface; solid blocks run up to y = 11
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    // Facade ring cell. Walls run from ground up to the roof top.
    const idx = (x === 0 || x === 9) ? z : x;   // position along the face
    const pier = idx % 3 === 0;                 // corners and piers at 0,3,6,9
    for (let y = gr; y < TOP; y++) {
      const rel = y - gr;
      let b = "smooth_quartz";
      let p;

      if (rel === 0) {
        b = "stone_bricks";                                  // base course
      } else if (rel === 4 || rel === 5 || rel === 9) {
        b = "smooth_stone";                                  // storey lines and spandrels
      } else if (rel === 10) {
        b = "smooth_stone";                                  // cornice
      } else if (rel === 11) {
        b = "stone_brick_slab";                              // parapet cap
        p = { type: "bottom", waterlogged: "false" };
      } else if (rel >= 1 && rel <= 3) {
        // Ground-floor shopfront
        if (z === 9 && x === 4 && (rel === 1 || rel === 2)) {
          // Entrance door, lower and upper halves
          b = "oak_door";
          p = { facing: "south", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        } else if (!pier) {
          b = "glass";
        } else {
          b = "smooth_quartz";
        }
      } else if (rel >= 6 && rel <= 8) {
        // Upper-storey windows
        if (!pier) {
          b = "glass_pane";
        } else {
          b = "smooth_quartz";
        }
      }

      // Canopy over the entrance on the south face
      if (z === 9 && rel === 3 && (x === 3 || x === 4 || x === 5)) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }

      put(x, y, z, b, p);
    }
  } else {
    // Interior cell: air gap behind the glass, with floor and roof plates.
    const floorY = gr;
    const upperY = gr + 5;
    const roofY = Math.min(gr + 10, TOP - 1);
    if (floorY < TOP) put(x, floorY, z, "smooth_stone");
    if (upperY < TOP - 1) put(x, upperY, z, "smooth_stone");
    if (roofY > upperY) put(x, roofY, z, "gray_concrete");
  }
}

// Dusk lighting and roof equipment, placed only where the cells exist.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const roofY = Math.min(gr + 10, TOP - 1);

  // Lanterns standing on the ground-floor interior, behind the entrance.
  if (!isEdge(x, z) && z === 8 && (x === 3 || x === 6)) {
    put(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // Warm shroomlight in the upper air gap behind a window on the west face.
  if (!isEdge(x, z) && x === 1 && z === 5 && gr + 6 < TOP) {
    put(x, gr + 6, z, "shroomlight");
  }

  // Rooftop AC units on the deck.
  if (!isEdge(x, z) && roofY === gr + 10 && ((x === 2 && z === 2) || (x === 7 && z === 7))) {
    put(x, roofY + 1, z, "iron_block");
  }
}

g.save(`${dir}/${id}.nbt`);
