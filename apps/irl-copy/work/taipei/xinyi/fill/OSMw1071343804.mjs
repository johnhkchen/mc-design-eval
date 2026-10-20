import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 62 x 40 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey (5 blocks each) early-2000s Xinyi commercial block:
// polished granite plinth, shopfront glazing, quartz fascia, light-grey
// concrete storey bands, pale concrete mullions with blue-glass panes,
// quartz cornice on a flat roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343804";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 62, H = 23, D = 40;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, ground] of cells) gmap.set(`${x},${z}`, ground);
const has = (x, z) => gmap.has(`${x},${z}`);

let minZ = Infinity, maxZ = -Infinity, minX = Infinity, maxX = -Infinity;
for (const [x, z] of cells) {
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
}
const cx = Math.round((minX + maxX) / 2);

const perimeter = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
// true when the wall runs along the X axis (faces north/south), so panes connect east-west
const alongX = (x, z) => !has(x, z + 1) || !has(x, z - 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pane = (x, y, z) => {
  const p = alongX(x, z)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  put(x, y, z, "light_blue_stained_glass_pane", p);
};

for (const [x, z, gr] of cells) {
  // Foundation up to the cell's own ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (perimeter(x, z)) {
    // Plinth / base course
    put(x, gr, z, "polished_granite");

    const isEntrance = z === minZ && x === cx;

    // Ground floor: shopfront glazing with white mullions, entrance door
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (isEntrance && y <= gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        const p = { facing: "south", half, hinge: "left", open: "false", powered: "false" };
        put(x, y, z, "oak_door", p);
      } else if (isEntrance && y === gr + 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if ((x + z) % 4 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        pane(x, y, z);
      }
    }

    // Fascia over shopfronts
    put(x, gr + 4, z, "smooth_quartz");

    // Storey line between floors
    put(x, gr + 5, z, "light_gray_concrete");

    // Upper floor: mullions and glazing, some lit from behind
    for (let y = gr + 6; y <= gr + 8; y++) {
      if ((x + z) % 4 === 0) {
        put(x, y, z, "white_concrete");
      } else if (y === gr + 7 && (x + z) % 12 === 2) {
        put(x, y, z, "glowstone");
      } else {
        pane(x, y, z);
      }
    }

    // Lintel band and cornice cap
    put(x, gr + 9, z, "light_gray_concrete");
    put(x, gr + 10, z, "quartz_block");
  } else {
    // Interior: sealed floor slab per storey, air above, roof deck at top
    if (gr >= 0) put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, (x + z) % 2 === 0 ? "light_gray_concrete" : "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
