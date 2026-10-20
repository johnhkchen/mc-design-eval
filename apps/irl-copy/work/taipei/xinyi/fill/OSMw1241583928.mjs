import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241583928";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 15, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells and their ground heights
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const isBoundary = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

// Corner = boundary cell with missing neighbours on two perpendicular sides
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Front entrance: the north-most row (min z), door column nearest the middle
const minZ = Math.min(...cells.map(([, z]) => z));
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const doorX = frontXs.reduce((best, x) =>
  Math.abs(x - W / 2) < Math.abs(best - W / 2) ? x : best, frontXs[0]);

const paneProps = (x, z) => ({
  north: isBoundary(x, z - 1) ? "true" : "false",
  south: isBoundary(x, z + 1) ? "true" : "false",
  east: isBoundary(x + 1, z) ? "true" : "false",
  west: isBoundary(x - 1, z) ? "true" : "false",
  waterlogged: "false",
});

for (const [x, z, b] of cells) {
  // Foundation from the lowest ground up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const edge = isBoundary(x, z);
  const corner = edge && isCorner(x, z);
  const pillar = edge && (corner || (x + z) % 3 === 0);
  const isDoorCol = edge && z === minZ && x === doorX;

  if (!edge) {
    // Interior: air gap, with floor slabs at each floor level and the roof deck
    put(x, b, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "smooth_stone");
    // Warm light behind some windows
    if ((x + z) % 4 === 0) {
      put(x, b + 2, z, "glowstone");
      put(x, b + 7, z, "glowstone");
    }
    // Roof equipment on the deck
    if (x === Math.floor(W / 2) && z === Math.floor(D / 2)) {
      put(x, b + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Boundary (facade) cells
  put(x, b, z, "stone_bricks");                       // base course

  for (const y of [b + 1, b + 2, b + 3]) {            // storey 1 windows
    if (isDoorCol && y <= b + 2) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === b + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (pillar) {
      put(x, y, z, "light_gray_concrete");
    } else {
      put(x, y, z, "glass_pane", paneProps(x, z));
    }
  }

  put(x, b + 4, z, "light_gray_concrete");            // storey line

  put(x, b + 5, z, "light_gray_concrete");            // floor line on facade

  for (const y of [b + 6, b + 7, b + 8]) {            // storey 2 windows
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane", paneProps(x, z));
  }

  put(x, b + 9, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // cornice
  put(x, b + 10, z, "white_concrete");                // parapet
}

g.save(`${DIR}/${ID}.nbt`);
