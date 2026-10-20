import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833544";
const W = 18, H = 23, D = 8;

// Footprint: [x, z, ground] per cell.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of cells) {
  const [x, z, gy] = c;
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(Number.isFinite(gy) ? gy : 0));
}

const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const exterior = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Era: 1990s Xinyi low-rise commercial block, two storeys, white concrete frame,
// blue-tinted glazing, tiled plinth, flat roof with parapet and rooftop plant.
const base = Math.min(...ground.values());   // lowest ground under the footprint
const FL = base + 5;                         // second-floor slab / band
const TOP = base + 10;                       // cornice / roof slab (roof surface at base+11)
const ROOF = base + 11;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: on the north face (z = 0), nearest to x = 9 that is in the footprint.
let doorX = 9;
if (!inFp(doorX, 0)) {
  let best = null;
  for (let x = 0; x < W; x++) {
    if (inFp(x, 0) && (best === null || Math.abs(x - 9) < Math.abs(best - 9))) best = x;
  }
  if (best !== null) doorX = best;
}

// Wall block for an exterior cell at height y.
function wallBlock(x, z, y, gc) {
  const onFront = z === 0 || z === D - 1;
  if (y === TOP) return { id: "white_concrete" };
  if (y === FL) return { id: "light_gray_concrete" };
  const pier = onFront ? x % 3 === 0 : z % 3 === 0;

  if (y < FL) {
    // Ground floor: plinth, shopfront glazing, header.
    if (y === base) return { id: "stone_bricks" };
    if (y === base + 4) return { id: "white_concrete" };
    if (onFront && x === doorX && z === 0) {
      if (y === gc) return { id: "oak_door", props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (y === gc + 1) return { id: "oak_door", props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
    }
    if (pier) return { id: "white_concrete" };
    return { id: "glass" };
  }

  // Upper floor: sill, window band, piers.
  if (y === base + 6) return { id: "smooth_quartz" };
  if (pier) return { id: "white_concrete" };
  return { id: "light_blue_stained_glass" };
}

for (let z = 0; z < D; z++) {
  for (let x = 0; x < W; x++) {
    if (!inFp(x, z)) continue;
    const gc = gAt(x, z);

    // Foundation: solid from y 0 up to this cell's ground.
    for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

    if (!exterior(x, z)) {
      // Interior: floor slabs only, air gap otherwise.
      if (FL >= gc) put(x, FL, z, "smooth_stone");
      if (TOP >= gc) put(x, TOP, z, "light_gray_concrete");
      continue;
    }

    // Exterior envelope from this cell's ground up to the cornice.
    for (let y = gc; y <= TOP; y++) {
      const w = wallBlock(x, z, y, gc);
      put(x, y, z, w.id, w.props);
    }
  }
}

// Warm light behind the glazing (one interior cell behind selected windows).
for (let x = 0; x < W; x++) {
  // North facade lights, upper storey (glowstone) and shopfront (shroomlight).
  if (inFp(x, 0) && x % 3 === 1 && !exterior(x, 1) && inFp(x, 1)) {
    if (x % 6 === 1) put(x, base + 8, 1, "glowstone");
    else if (base + 2 >= gAt(x, 1)) put(x, base + 2, 1, "shroomlight");
  }
  // South facade lights.
  if (inFp(x, D - 1) && x % 3 === 1 && inFp(x, D - 2) && !exterior(x, D - 2)) {
    if (x % 6 === 4) put(x, base + 8, D - 2, "glowstone");
  }
}

// Entrance lantern hanging inside the doorway.
if (inFp(doorX, 1)) {
  put(doorX, base + 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant: condenser units set back from the parapet.
const plant = [[3, 2, 4, 3], [12, 4, 13, 5]];
for (const [x0, z0, x1, z1] of plant) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (inFp(x, z) && ROOF < H) put(x, ROOF, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
