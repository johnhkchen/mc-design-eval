import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888739";

// Footprint 23 x 10. Read as a small 2-storey Taipei commercial block (c.1980s):
// stone-clad base, red fascia over shopfronts, white render upper floors with
// glazed bays, a light cornice and a parapet roof with rooftop plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 23, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Ground heights per footprint cell, normalised so the lowest ground is y 0.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const minG = Math.min(...ground.values());
const inFp = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Front = footprint cells on the lowest z row; entrance at the middle of that row.
const frontXs = [];
let minZ = Infinity;
for (const k of ground.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === minZ) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const b = gr - minG;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Storey layout relative to b (k = offset above the cell's ground):
  // k0 base course, k1-k3 shopfront, k4 lintel slab, k5 storey line,
  // k6-k8 upper storey, k9 cornice, k10 parapet / roof surface.
  if (!isEdge(x, z)) {
    // Interior: air gap, with a floor slab per storey and the roof slab.
    put(x, b + 0, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "smooth_stone");
    if (x % 7 === 3 && z === 5) put(x, b + 11, z, "iron_block"); // rooftop plant
    if (x % 5 === 2 && z === 7) put(x, b + 2, z, "glowstone");   // warm light behind shopfront
    if (x % 4 === 1 && z === 2) put(x, b + 7, z, "shroomlight"); // warm light upstairs
    continue;
  }

  // Facade cell.
  const corner = (!inFp(x - 1, z) || !inFp(x + 1, z)) && (!inFp(x, z - 1) || !inFp(x, z + 1));
  const pillar = corner || (x + z) % 3 === 0;

  put(x, b + 0, z, "stone_bricks");

  if (z === minZ && x === doorX) {
    // Entrance door with a lantern-lit lobby behind it.
    put(x, b + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, "red_concrete");
    put(x, b + 4, z, "smooth_stone");
    put(x, b + 5, z, "light_gray_concrete");
    put(x, b + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 6, z, "white_concrete");
    put(x, b + 7, z, "white_concrete");
    put(x, b + 8, z, "white_concrete");
    put(x, b + 9, z, "light_gray_concrete");
    put(x, b + 10, z, "white_concrete");
    continue;
  }

  // Shopfront: polished pillars alternating with glazed bays.
  put(x, b + 1, z, pillar ? "polished_andesite" : "glass");
  put(x, b + 2, z, pillar ? "polished_andesite" : "glass");
  put(x, b + 3, z, "red_concrete");          // fascia band
  put(x, b + 4, z, "smooth_stone");          // floor slab / lintel
  put(x, b + 5, z, "light_gray_concrete");   // storey line

  // Upper storey: white render walls with glazed windows between pillars.
  put(x, b + 6, z, pillar ? "white_concrete" : "glass");
  put(x, b + 7, z, pillar ? "white_concrete" : "glass");
  put(x, b + 8, z, pillar ? "white_concrete" : "glass");

  put(x, b + 9, z, "light_gray_concrete");   // cornice
  put(x, b + 10, z, "white_concrete");       // parapet
}

// Warm lantern just inside the entrance.
if (ground.has(`${doorX},${minZ + 1}`)) {
  const b = ground.get(`${doorX},${minZ + 1}`) - minG;
  put(doorX, b + 1, minZ + 1, "lantern", { hanging: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
