import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw591075538: 6 x 20 footprint, roof about 13 blocks above lowest ground.
// Reading: a 1980s-90s Xinyi-area mid-rise, three storeys of light grey concrete
// with white piers, blue-tinted window bands, a shopfront with a dark canopy on the
// street front, and a stone-brick plant box on the roof with a lantern.
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075538.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075538.nbt";

const W = 6, H = 25, D = 20;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);

const has = (x, z) => G.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const SHOP_PANE = (p) => ({ ...p });

// Pass 1: foundations, floor slabs, walls, facades
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at each storey line (ground, 4, 8, roof at 12)
  for (let k = 0; k <= 3; k++) put(x, gr + 4 * k, z, "light_gray_concrete");

  if (!isEdge(x, z)) continue;

  // Parapet on the roof edge
  put(x, gr + 13, z, "white_concrete");

  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const corner = (missN || missS) && (missW || missE);
  const onNS = missN || missS; // face runs along x
  const along = onNS ? x : z;
  const pane = onNS ? PANE_NS : PANE_EW;
  const front = missN && z === minZ;

  for (let s = 0; s <= 2; s++) {
    const b = gr + 4 * s;
    const pier = corner || along % 2 === 0;

    if (s === 0) {
      // Shopfront: glass panes between piers, white fascia at the top
      put(x, b + 1, z, pier ? "white_concrete" : "glass_pane", pier ? undefined : SHOP_PANE(pane));
      put(x, b + 2, z, pier ? "white_concrete" : "glass_pane", pier ? undefined : SHOP_PANE(pane));
      put(x, b + 3, z, "white_concrete");
    } else {
      // Upper storeys: blue-tinted window band with a spandrel at the top
      put(x, b + 1, z, pier ? "white_concrete" : "light_blue_stained_glass_pane", pier ? undefined : pane);
      put(x, b + 2, z, pier ? "white_concrete" : "light_blue_stained_glass_pane", pier ? undefined : pane);
      put(x, b + 3, z, "light_gray_concrete");
    }
  }
}

// Pass 2: street-front entrance, canopy, and warm light behind the shopfront
for (const [x, z, gr] of cells) {
  if (z !== minZ) continue;
  if (x >= 1 && x <= 4) {
    // Dark canopy over the shopfront, two cells deep where the footprint allows
    put(x, gr + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    if (has(x, z + 1)) put(x, gr + 3, z + 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance door at the street front, x = 2 (if that cell exists)
if (has(2, minZ)) {
  const gr = G.get(`2,${minZ}`);
  put(2, gr + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(2, gr + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light behind the shopfront glass (interior cells only, so no clash with walls)
for (const [x, z, gr] of cells) {
  if (z === minZ + 1 && (x === 1 || x === 4) && !isEdge(x, z) && has(x, minZ)) {
    put(x, gr + 2, z, "glowstone");
  }
}

// Warm light behind some upper-storey windows on the west side
for (const [x, z, gr] of cells) {
  if (x === 0 && isEdge(x, z) && z % 4 === 1 && has(1, z) && !isEdge(1, z)) {
    put(1, gr + 6, z, "glowstone");
  }
}

// Pass 3: roof plant box and lantern on interior roof cells
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if ((x === 2 || x === 3) && (z === 15 || z === 16)) {
    put(x, gr + 13, z, "stone_bricks");
  }
  if (x === 2 && z === 15) {
    put(x, gr + 14, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(OUT);
