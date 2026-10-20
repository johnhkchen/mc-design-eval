import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3326020.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3326020.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 10, H = 17, D = 5;
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Index footprint
const map = new Map();
let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
for (const c of cells) {
  const [x, z, ground, roof] = c;
  map.set(`${x},${z}`, { ground, roof });
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => map.has(`${x},${z}`);
const width = maxX - minX + 1;
const depth = maxZ - minZ + 1;
const doorU = Math.floor((width - 1) / 2);

const WINDOW_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const WINDOW_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [key, info] of map) {
  const [x, z] = key.split(",").map(Number);
  const { ground, roof } = info;
  const h = Math.max(roof - ground, 3);

  const fN = !has(x, z - 1); // street side (-z)
  const fS = !has(x, z + 1); // rear (+z)
  const fW = !has(x - 1, z);
  const fE = !has(x + 1, z);
  const perim = fN || fS || fW || fE;
  const corner = (fN || fS) && (fW || fE);

  const u = x - minX;
  const v = z - minZ;

  // Foundation
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  for (let r = 0; r <= h; r++) {
    const y = ground + r;

    // Parapet: low bottom slabs on perimeter, bulkhead on roof interior
    if (r === h) {
      if (perim) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else if (u >= 3 && u <= 6 && v >= 1 && v <= 3) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Cornice / roof slab
    if (r === h - 1) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Floor slabs / string courses at even rows
    if (r % 2 === 0) {
      if (!perim) put(x, y, z, "smooth_stone");
      else if (r === 0) put(x, y, z, "stone_bricks");
      else put(x, y, z, "smooth_stone");
      continue;
    }

    // Window rows (odd r): interior stays air except lamps behind glass
    if (!perim) continue;

    let block = corner ? "stone_bricks" : "bricks";
    let props = null;
    let opening = null; // [dx, dz, glassProps]

    if (!corner) {
      if (fN && u % 2 === 1 && u > 0 && u < width - 1) opening = [0, 1, WINDOW_NS];
      else if (fS && u % 2 === 1 && u > 0 && u < width - 1) opening = [0, -1, WINDOW_NS];
      else if (fW && v % 2 === 1 && v > 0 && v < depth - 1) opening = [1, 0, WINDOW_EW];
      else if (fE && v % 2 === 1 && v > 0 && v < depth - 1) opening = [-1, 0, WINDOW_EW];
    }

    if (opening) {
      block = "glass_pane";
      props = opening[2];
    }

    put(x, y, z, block, props);

    // Warm light in the room behind some windows
    if (opening && (u + v + r) % 4 === 0) {
      const bx = x + opening[0], bz = z + opening[1];
      if (has(bx, bz)) put(bx, y, bz, "glowstone");
    }
  }

  // Street door, centred on the -z face at ground level
  if (fN && u === doorU && !corner) {
    put(x, ground, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, ground + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(OUT);
