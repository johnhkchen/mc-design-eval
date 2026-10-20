import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw644315139.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw644315139.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 105, H = 23, D = 46;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.min(Math.max(gr, 0), 12));
const has = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Centre column of the footprint for the main entrance
let minX = Infinity, maxX = -Infinity;
for (const [x] of cells) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
const cx = Math.floor((minX + maxX) / 2);

const DIRS = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Pass 1: foundation, floors, roof deck, perimeter walls
for (const [x, z, gr] of cells) {
  const gl = Math.min(Math.max(gr, 0), 12);   // cell ground
  const rt = Math.max(10, gl + 7);             // roof deck level (~11 above lowest ground)

  // Foundation under the cell
  for (let y = 0; y < gl; y++) put(x, y, z, "stone");

  // Interior slabs: ground floor, upper floor, roof deck
  put(x, gl, z, "light_gray_concrete");
  put(x, gl + 5, z, "light_gray_concrete");
  put(x, rt, z, "light_gray_concrete");

  // Faces that are exposed to the outside
  const faces = Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
  if (faces.length === 0) continue;

  const face = faces[0];
  const t = (face === "north" || face === "south") ? x : z;
  const win = (t % 4 === 1 || t % 4 === 2);

  for (let y = gl; y <= rt; y++) {
    let b = "quartz_block";
    if (y === gl) b = "gray_concrete";                         // plinth
    else if (y >= gl + 1 && y <= gl + 3) b = win ? "light_blue_stained_glass" : "quartz_block";
    else if (y === gl + 4 || y === gl + 5) b = "smooth_quartz"; // storey lines
    else if (y >= gl + 6 && y <= rt - 2) b = win ? "light_blue_stained_glass" : "quartz_block";
    else if (y === rt) b = "smooth_quartz";                     // cornice
    put(x, y, z, b);
  }
  // Parapet on the roof edge
  put(x, rt + 1, z, "quartz_block");

  // Warm lights behind some windows (in the interior air gap)
  const inward = OPP[face];
  const [dx, dz] = DIRS[inward];
  if (win && t % 8 === 1 && has(x + dx, z + dz)) {
    put(x + dx, gl + 2, z + dz, "glowstone");
    put(x + dx, gl + 6, z + dz, "glowstone");
  }
}

// Pass 2: entrance on the south face, canopy band, and roof plant
for (const [x, z, gr] of cells) {
  const gl = Math.min(Math.max(gr, 0), 12);
  const rt = Math.max(10, gl + 7);
  const southEdge = !has(x, z + 1);

  if (southEdge && Math.abs(x - cx) <= 2) {
    if (x === cx - 1 || x === cx) {
      // Door: lower and upper halves, facing south
      put(x, gl + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gl + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gl + 3, z, "light_blue_stained_glass");
    }
    // Canopy band over the entrance bay
    put(x, gl + 4, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }

  // Roof plant: a few small units standing on the roof deck, interior cells only
  const perimeter = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  if (!perimeter && (x * 7 + z * 3) % 31 === 0 && rt + 3 < H) {
    put(x, rt + 1, z, "light_gray_concrete");
    put(x, rt + 2, z, "light_gray_concrete");
    put(x, rt + 3, z, "smooth_stone");
  }
}

g.save(OUT);
