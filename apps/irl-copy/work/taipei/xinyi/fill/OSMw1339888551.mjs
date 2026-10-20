import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339888551";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 19, D = 6;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground (rounded)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Roof record: roof about 7 blocks above lowest ground.
// Layout (relative to minG): floor slab 0, body walls 1..3 (3 blocks + windows),
// roof slab at +5, parapet/cornice cap at +6.
const ROOF = minG + 5;
const TOP = minG + 6;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Count missing neighbours (edges of the footprint)
function edgeCount(x, z) {
  let n = 0;
  if (!has(x + 1, z)) n++;
  if (!has(x - 1, z)) n++;
  if (!has(x, z + 1)) n++;
  if (!has(x, z - 1)) n++;
  return n;
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const isNorthEdge = !has(x, z - 1);   // street-facing side (north, facing -z)
  const isEdge = edgeCount(x, z) > 0;
  const isCorner = edgeCount(x, z) >= 2;

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab (floor level of this cell)
  put(x, gr, z, "polished_andesite");

  // Roof slab across the whole footprint, if the cell is below it
  if (ROOF > gr) put(x, ROOF, z, "gray_concrete");

  if (!isEdge) {
    // Interior: air gap, with warm light behind the front glazing
    if (z === 1 && (x === 1 || x === 3) && ROOF > gr + 2) {
      put(x, gr + 2, z, "glowstone");
    }
    // Roof equipment on one interior roof cell
    if (x === 2 && z === 3 && TOP > ROOF) {
      put(x, ROOF + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter walls from just above the floor slab up to the roof slab
  for (let y = gr + 1; y < ROOF; y++) {
    const rel = y - gr;
    let id = "white_concrete";
    let props = null;

    if (isCorner) {
      id = "light_gray_concrete"; // corner pilasters
    } else if (isNorthEdge && x === 2 && (rel === 1 || rel === 2)) {
      // Entrance door, centred on the street face
      id = "oak_door";
      props = {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (isNorthEdge && rel === 1) {
      // Shopfront glazing at street level
      id = "glass_pane";
    } else if (rel === 2) {
      // Window band
      id = "glass_pane";
    } else if (rel === 3) {
      // Storey line / lintel band
      id = "light_gray_concrete";
    }

    // Red canopy over the entrance and shopfront on the street face
    if (isNorthEdge && !isCorner && rel === 3 && x >= 1 && x <= 3) {
      id = "red_concrete";
    }

    put(x, y, z, id, props);
  }

  // Parapet cornice cap at the top of the roof
  if (TOP > ROOF) {
    if (isCorner) {
      put(x, TOP, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else {
      put(x, TOP, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// Base course: a plinth band on the street face just above the foundation
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1) && x !== 2) {
    // Keep the entrance column clear of the plinth
    put(x, gr, z, "polished_andesite");
  }
}

g.save(`${DIR}/${ID}.nbt`);
