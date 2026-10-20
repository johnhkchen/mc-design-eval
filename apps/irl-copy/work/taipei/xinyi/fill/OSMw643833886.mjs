import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Taipei mid-rise commercial block, c. 1985-1995: reinforced-concrete frame,
// white wall tiles and concrete piers, aluminium-framed glazing, a shopfront
// on the ground floor, a stone base, a cornice, a flat roof with a steel tank.
// Four storeys of 5 blocks each. Roof deck at y=21 above the lowest ground.

const W = 20, H = 33, D = 9;
const R = 21;            // roof deck level, absolute y (y0 = lowest ground)
const STOREY = 5;

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw643833886.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const mN = (x, z) => !has(x, z - 1);
const mS = (x, z) => !has(x, z + 1);
const mW = (x, z) => !has(x - 1, z);
const mE = (x, z) => !has(x + 1, z);
const isEdge = (x, z) => mN(x, z) || mS(x, z) || mW(x, z) || mE(x, z);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const gy = Math.max(0, Math.min(gr, R - 3));
  const edge = isEdge(x, z);
  const corner = (mN(x, z) || mS(x, z)) && (mW(x, z) || mE(x, z));
  const alongX = mN(x, z) || mS(x, z);   // facade runs east-west
  const along = alongX ? x : z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Storeys, cornice, floor slabs and facade from ground to the roof deck.
  for (let y = gy; y < R - 1; y++) {
    const rel = y - gy;
    const s = Math.floor(rel / STOREY);
    const r = rel % STOREY;

    if (!edge) {
      // Interior: floor slab per storey, air gap otherwise.
      if (r === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    if (r === 0) {
      put(x, y, z, s === 0 ? "stone_bricks" : "quartz_block");       // base course / storey belt
    } else if (r === 4) {
      put(x, y, z, s === 0 ? "smooth_stone" : "light_gray_concrete"); // lintel / spandrel
    } else if (corner || along % 3 === 0) {
      put(x, y, z, s === 0 ? "stone_bricks" : "white_concrete");      // piers
    } else if (s === 0) {
      put(x, y, z, "glass");                                          // shopfront glazing
    } else {
      const props = alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "glass_pane", props);                              // window grid
    }

    // Warm light behind some upper-window glass, in the air gap just inside.
    if (edge && r === 2 && !corner && !(along % 3 === 0) && (s + along) % 2 === 0) {
      let dx = 0, dz = 0;
      if (mN(x, z)) dz = 1;
      else if (mS(x, z)) dz = -1;
      else if (mW(x, z)) dx = 1;
      else if (mE(x, z)) dx = -1;
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // Cornice over the top storey, roof deck, parapet on the perimeter.
  put(x, R - 1, z, "smooth_stone");
  put(x, R, z, "light_gray_concrete");
  if (edge) {
    put(x, R + 1, z, "white_concrete");
    put(x, R + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance on the street (north, z = 0) face, centred on the frontage.
const doorX = Math.floor(W / 2);
if (has(doorX, 0) && mN(doorX, 0)) {
  let gy = Math.max(0, Math.min(ground.get(`${doorX},0`), R - 3));
  put(doorX, gy + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, gy + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy over the door, on the front row.
  for (let x = doorX - 1; x <= doorX + 1; x++) {
    if (has(x, 0) && mN(x, 0)) {
      put(x, gy + 3, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// Rooftop water tank in the interior, steel with a cap.
for (let x = 5; x <= 8; x++) {
  for (let z = 2; z <= 5; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    for (let y = R + 1; y <= R + 3; y++) put(x, y, z, "iron_block");
    put(x, R + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw643833886.nbt");
