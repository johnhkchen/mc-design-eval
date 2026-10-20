import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1340000498";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 8, H = 19, D = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Front (street) faces the -z side (north). Shopfront sits on z = 0.
const isFront = (x, z) => z === 0 && has(x, z);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const front = isFront(x, z);
  const top = gr + 6; // roof: 7 blocks above this cell's ground (parapet top)

  // Foundation from y 0 up to the ground, so nothing floats on a slope.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab for the ground storey.
  put(x, gr, z, "smooth_stone");

  // Ground storey (y gr+1 .. gr+4) and upper parts.
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (!edge) continue; // interior stays air (gap behind glass)

    if (front) {
      if (y === gr + 1) {
        // Base course / plinth on the shopfront, door at x=3.
        if (x === 3) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, "polished_andesite");
        }
      } else if (y === gr + 2 || y === gr + 3) {
        if (x === 3) {
          // Door upper half on the entrance bay.
          if (y === gr + 2) {
            put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          }
        } else if (x === 0 || x === 7) {
          put(x, y, z, "polished_andesite"); // corner pilasters
        } else {
          put(x, y, z, "glass_pane"); // shopfront glazing with frames at pilasters
        }
      } else if (y === gr + 4) {
        // Red signband across the front.
        put(x, y, z, "red_concrete");
      }
    } else {
      // Side and back walls: window grid with frames, sign band not used.
      if (y === gr + 2 || y === gr + 3) {
        if ((x + z) % 2 === 0) put(x, y, z, "glass_pane");
        else put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }

  // Storey line / cornice at gr+5 on the perimeter; roof deck inside.
  if (edge) {
    put(x, gr + 5, z, "light_gray_concrete");
    // Parapet course.
    put(x, gr + 6, z, "white_concrete");
  } else {
    put(x, gr + 5, z, "gray_concrete"); // roof deck
  }
}

// Roof equipment: one air-conditioning plant on a non-edge cell.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) && x === 5 && z === 2) {
    put(x, gr + 6, z, "iron_block");
  }
}

// Warm lights behind the glass on the front row (interior gap cells).
for (const [x, z, gr] of cells) {
  if (z === 1 && (x === 1 || x === 6) && !isEdge(x, z)) {
    put(x, gr + 2, z, "glowstone");
  }
}

g.save(`${dir}/${id}.nbt`);
