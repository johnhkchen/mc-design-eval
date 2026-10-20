import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833522.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833522.nbt";

// Two-storey mid-rise commercial block, c. 1990s: granite-based shopfront,
// white tiled upper storey with blue-tinted glazing, quartz cornice, rooftop plant.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const inBox = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

function put(x, y, z, id, props) {
  if (!inBox(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: street-facing (north, missing z-1 neighbour) cell nearest the middle.
let ex = null;
{
  const mid = (W - 1) / 2;
  let best = Infinity;
  for (const [x, z] of ground.keys().map ? [] : []) {}
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (has(x, z - 1)) continue;
    const d = Math.abs(x - mid);
    if (d < best) { best = d; ex = x; }
  }
}

// Foundations and storeys
for (const [x, z, gr] of cells) {
  const gy = Math.round(gr);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const perimeter = exN || exS || exW || exE;

  if (!perimeter) {
    // Interior: floor slabs only, air between (no interiors)
    put(x, gy, z, "polished_andesite");
    put(x, gy + 5, z, "light_gray_concrete");
    put(x, gy + 10, z, "light_gray_concrete");

    // Rooftop plant boxes
    if (x % 5 === 2 && z % 4 === 1) {
      put(x, gy + 11, z, "iron_block");
    }

    // Warm light behind the north upper windows
    if (z === 1 && x % 3 === 1 && x % 2 === 1) {
      put(x, gy + 7, z, "glowstone");
    }
    // Shroomlight behind south upper windows
    if (z === D - 2 && x % 3 === 1 && x % 2 === 0) {
      put(x, gy + 7, z, "shroomlight");
    }

    // Hanging lantern inside the entrance bay, hung from the second-floor slab
    if (ex !== null && z === 1 && x === ex) {
      put(x, gy + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    continue;
  }

  // Perimeter shell: walls, shopfront, storey lines, cornice
  // u = coordinate running along the facade the cell belongs to
  const u = (exN || exS) ? x : z;
  const onNorth = exN;
  const awning = onNorth && ex !== null && Math.abs(x - ex) <= 1;

  for (let h = 0; h <= 10; h++) {
    const y = gy + h;
    let id;
    if (h === 0) {
      id = "polished_granite";                       // base course
    } else if (h <= 3) {
      id = (u % 3 === 0) ? "smooth_quartz" : "glass"; // shopfront bays with pillars
    } else if (h === 4) {
      id = awning ? "red_concrete" : "light_gray_concrete"; // awning / transom band
    } else if (h === 5) {
      id = "smooth_quartz";                            // storey line
    } else if (h <= 9) {
      if (h <= 8 && u % 3 === 1) id = "light_blue_stained_glass"; // upper windows
      else id = "white_concrete";
    } else {
      id = "smooth_quartz";                            // cornice / parapet course
    }
    put(x, y, z, id);
  }

  // Entrance door on the street face
  if (onNorth && ex !== null && x === ex) {
    put(x, gy, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Roof-edge lightning rod on the north-west corner
  if (exN && exW) {
    put(x, gy + 11, z, "lightning_rod");
  }
}

g.save(OUT);
