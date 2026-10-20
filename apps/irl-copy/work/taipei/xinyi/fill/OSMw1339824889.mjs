import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339824889";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 19, D = 6;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => foot.has(key(x, z));

// Facade logic: a cell is on the outer shell if any side neighbour is outside the footprint
const frontFace = (x, z) => !has(x, z - 1); // z = 0 side
const backFace = (x, z) => !has(x, z + 1);  // z = 5 side
const endFace = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const isWall = (x, z) => frontFace(x, z) || backFace(x, z) || endFace(x, z);

for (const [x, z, gr] of cells) {
  const b = gr; // storey base sits on this cell's ground

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab
  put(x, b, z, "smooth_stone");

  const wall = isWall(x, z);
  const shopfront = frontFace(x, z) || backFace(x, z);

  if (wall) {
    // Storey walls
    for (let y = b + 1; y <= b + 3; y++) {
      put(x, y, z, "white_concrete");
    }

    // Shopfront on long facades: pillars, glazing, door
    if (shopfront) {
      const isColumn = x % 5 === 0 || x === W - 1;
      for (let y = b + 1; y <= b + 3; y++) {
        if (isColumn) {
          put(x, y, z, "quartz_pillar", { axis: "y" });
        } else {
          put(x, y, z, "glass");
        }
      }
      // Sill and transom frames
      if (!isColumn) {
        put(x, b + 1, z, "smooth_stone");
        put(x, b + 3, z, "light_gray_concrete");
      }
      // Entrance door on the street face
      if (x === 15 && frontFace(x, z)) {
        put(x, b + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, b + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, b + 3, z, "glass");
      }
    }

    // Lintel band, cornice, parapet
    put(x, b + 4, z, "light_gray_concrete");
    put(x, b + 5, z, "stone_brick_slab", { type: "top" });
    put(x, b + 6, z, "stone_bricks");
  } else {
    // Interior: air gap behind the glass, floor slab at storey line, roof slab on top
    put(x, b + 4, z, "smooth_stone");
    put(x, b + 6, z, "light_gray_concrete");

    // Warm light behind the shopfront glass
    if (z === 1 && x % 6 === 3) put(x, b + 2, z, "glowstone");

    // Roof plant
    if (z === 2 && x % 9 === 4) put(x, b + 7, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
