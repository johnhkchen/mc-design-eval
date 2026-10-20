import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: one storey of glazed shopfront and
// office/retail windows on a stone base, a pale concrete skin, a quartz fascia,
// a parapet and a small rooftop plant box. Street face is z = 0.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339253357";
const W = 17, H = 19, D = 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity, maxG = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
  maxG = Math.max(maxG, gr);
}

// Storey datum is the lowest ground. Roof deck sits 5 blocks above it (one storey),
// parapet to about 7 blocks above it. Guard keeps the deck above every cell's ground.
const R = Math.max(minG + 5, maxG + 1);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function has(x, z) {
  return ground.has(`${x},${z}`);
}

for (const [x, z, gr] of cells) {
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;
  const back = z === D - 1;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor at this cell's ground.
  put(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // Roof deck across every cell.
  if (gr < R) put(x, R, z, "smooth_quartz");

  if (!perim || gr >= R - 1) continue;

  // Perimeter walls from just above ground to just below the deck.
  for (let y = gr + 1; y <= R - 1; y++) {
    const rel = y - minG;
    let id = "white_concrete";
    let props;

    if (rel === 1) {
      id = "polished_andesite";
    } else if (rel === 4) {
      id = "smooth_quartz"; // fascia / storey line
    } else if (rel === 2 || rel === 3) {
      if (front && x === 8 && rel <= 2) {
        // Entrance door, centred on the street face.
        const half = rel === gr + 1 - minG || y === gr + 1 ? "lower" : "upper";
        id = "iron_door";
        props = { facing: "north", half, hinge: "left", open: "false", powered: "false" };
      } else if (front) {
        id = x % 4 === 0 ? "black_concrete" : "light_blue_stained_glass";
      } else {
        const idx = x === 0 || x === W - 1 ? z : x;
        id = idx % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
      }
    }

    if (id === "iron_door") {
      put(x, y, z, id, props);
    } else {
      put(x, y, z, id);
    }
  }

  // Parapet on top of the roof deck.
  put(x, R + 1, z, "white_concrete");
}

// Entrance lanterns hanging from the fascia either side of the door.
for (const lx of [6, 10]) {
  if (has(lx, 0)) {
    const gr = ground.get(`${lx},0`);
    const y = minG + 4;
    if (y > gr && y < R) put(lx, y, 0, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Warm light behind some shopfront glass.
for (const lx of [2, 6, 10, 14]) {
  if (has(lx, 1)) {
    const gr = ground.get(`${lx},1`);
    const y = minG + 2;
    if (y > gr && y < R) put(lx, y, 1, "shroomlight");
  }
}

// Rooftop plant box, set back from the parapet.
for (let x = 4; x <= 6; x++) {
  for (let z = 2; z <= 3; z++) {
    if (!has(x, z)) continue;
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
