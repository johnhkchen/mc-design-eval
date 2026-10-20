import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw831858854.cells.json`, "utf8"));

const W = 20, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const perim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const front = (x, z) => !has(x, z - 1);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: foundations, floors, walls, storey lines, parapet, roof plant.
for (const [x, z, gr] of cells) {
  const edge = perim(x, z);

  // Foundation: solid from y 0 up to ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course on the ground.
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  for (let rel = 1; rel <= 11; rel++) {
    const y = gr + rel;

    if (rel === 5) {
      // Storey line between the two floors.
      put(x, y, z, edge ? "white_concrete" : "smooth_stone");
      continue;
    }
    if (rel === 10) {
      // Roof slab / parapet base.
      put(x, y, z, edge ? "white_concrete" : "smooth_stone");
      continue;
    }
    if (rel === 11) {
      // Parapet coping (perimeter only) and roof plant.
      if (edge) {
        put(x, y, z, "white_concrete");
      } else if (x >= 4 && x <= 7 && z >= 4 && z <= 7) {
        put(x, y, z, "iron_block");
      }
      continue;
    }

    if (!edge) {
      // Interior air gap; warm lights standing on the floor slabs.
      if (rel === 1 && (x + 2 * z) % 7 === 0) put(x, y, z, "glowstone");
      if (rel === 6 && (3 * x + z) % 7 === 0) put(x, y, z, "glowstone");
      continue;
    }

    // Perimeter walls.
    if (rel === 4) {
      // Shopfront lintel.
      put(x, y, z, "stone_bricks");
    } else if (rel >= 1 && rel <= 3) {
      // Ground floor shopfront: glass bays with white mullions.
      const mullion = (x + z) % 3 === 0;
      put(x, y, z, mullion ? "white_concrete" : "glass");
    } else {
      // Upper floor window grid.
      const mullion = (x + z) % 3 === 0;
      put(x, y, z, mullion ? "white_concrete" : "glass");
    }
  }
}

// Pass 2: entrance doors on the front (north) face, centred.
for (const [x, z, gr] of cells) {
  if (!perim(x, z) || !front(x, z)) continue;
  if (x !== 9 && x !== 10) continue;
  const hinge = x === 9 ? "right" : "left";
  const base = { facing: "north", hinge, open: "false", powered: "false" };
  put(x, gr + 1, z, "dark_oak_door", { ...base, half: "lower" });
  put(x, gr + 2, z, "dark_oak_door", { ...base, half: "upper" });
  // Shopfront glass above the door is replaced by a solid lintel course.
  put(x, gr + 3, z, "white_concrete");
}

g.save(`${DIR}/OSMw831858854.nbt`);
