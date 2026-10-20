import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540888791";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 6, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const grounds = new Map();
for (const [x, z, gr] of cells) grounds.set(key(x, z), gr);
const has = (x, z) => grounds.has(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Glass pane oriented to run along the facade it sits in
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, floor slabs, roof slab for every footprint cell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "light_gray_concrete");        // ground-floor slab
  put(x, gr + 5, z, "light_gray_concrete");    // second-floor slab
  put(x, gr + 10, z, "light_gray_concrete");   // roof slab
}

// Pass 2: shell walls, articulation, windows, shopfront
for (const [x, z, gr] of cells) {
  const n = !has(x, z - 1); // street face (z = 0 side)
  const s = !has(x, z + 1);
  const w = !has(x - 1, z);
  const e = !has(x + 1, z);
  const wall = n || s || w || e;
  const corner = (n || s) && (w || e);
  const alongX = n || s;
  const idx = alongX ? x : z;
  const pane = alongX ? paneNS : paneEW;
  const bay = !corner && idx % 3 !== 0; // pilasters every third bay

  if (wall) {
    // Vertical run of white concrete from first storey to parapet
    for (let y = gr + 1; y <= gr + 11; y++) put(x, y, z, "white_concrete");

    put(x, gr + 1, z, "stone_bricks");        // base course
    put(x, gr + 5, z, "light_gray_concrete"); // storey line
    put(x, gr + 10, z, "smooth_stone");       // cornice
    put(x, gr + 11, z, "white_concrete");     // parapet

    // Window bands: storey 1 at gr+2..3, storey 2 at gr+7..8
    if (bay) {
      for (const y of [gr + 2, gr + 3, gr + 7, gr + 8]) put(x, y, z, "glass_pane", pane);
    }

    // Street frontage: ground-floor shopfront glass and entrance
    if (n) {
      if (idx === 2) {
        put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
      // Shopfront canopy course above the entrance
      if (idx !== 2 || true) put(x, gr + 4, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  } else {
    // Interior cell: roof-top water tank on the central cells
    if ((x === 2 || x === 3) && (z === 4 || z === 5)) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Warm light behind the street glass and in a rear upper-floor room
if (grounds.has(key(4, 1))) put(4, grounds.get(key(4, 1)) + 1, 1, "shroomlight");
if (grounds.has(key(3, 10))) put(3, grounds.get(key(3, 10)) + 6, 10, "shroomlight");

g.save(`${dir}/${id}.nbt`);
