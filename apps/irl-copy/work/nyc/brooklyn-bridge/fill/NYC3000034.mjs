import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000034.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000034.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 5, H = 18, D = 11;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr, rf] of cells) fp.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });

const inFP = (x, z) => fp.has(key(x, z));
const isPerim = (x, z) => !inFP(x - 1, z) || !inFP(x + 1, z) || !inFP(x, z - 1) || !inFP(x, z + 1);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Massing: base = lowest ground; roof = lidar median smoothed to a flat 3-storey roof
const grounds = cells.map(c => Math.round(c[2]));
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const base = Math.min(...grounds);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const ROOF = Math.min(H - 4, Math.max(base + 5, Math.min(base + 7, medRoof)));

// 1. Foundations, walls, floors, roof deck
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    // interior: floor slabs only, air gap behind the glass
    for (let y = gr; y < ROOF; y++) {
      if (y === base + 2 || y === base + 4) put(x, y, z, "smooth_stone");
    }
    put(x, ROOF, z, "smooth_stone");
    continue;
  }

  const xEdge = !inFP(x - 1, z) || !inFP(x + 1, z);
  const zEdge = !inFP(x, z - 1) || !inFP(x, z + 1);
  const corner = xEdge && zEdge;
  const along = xEdge ? z : x;

  for (let y = gr; y < ROOF; y++) {
    const rel = y - base;
    let id;
    if (y === gr) id = "stone_bricks";                        // plinth / base course
    else if (rel === 2 || rel === 4) id = "stone_bricks";     // storey string courses
    else if (rel % 2 === 1) {
      // window row: glazed bays on odd bays, brick piers between
      id = (!corner && along % 2 === 1) ? "light_gray_stained_glass_pane" : "bricks";
    } else id = "bricks";                                     // spandrels
    put(x, y, z, id);
  }

  // cornice band and a low stone cornice lip (no crenellations)
  put(x, ROOF, z, "stone_bricks");
  put(x, ROOF + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 2. Entrance on the z=0 (Water Street) face: doorway with stone surround and head
if (inFP(2, 0) && fp.get(key(2, 0)).gr === base) {
  put(1, base + 1, 0, "stone_bricks");
  put(3, base + 1, 0, "stone_bricks");
  put(2, base + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(2, base + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(2, base + 3, 0, "stone_bricks");
}

// 3. Warm light behind some upper windows (glowstone in the air gap)
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!isPerim(x, z)) continue;
  const xEdge = !inFP(x - 1, z) || !inFP(x + 1, z);
  const zEdge = !inFP(x, z - 1) || !inFP(x, z + 1);
  if (xEdge && zEdge) continue;
  const along = xEdge ? z : x;
  if (along % 2 !== 1) continue;
  if ((along + x + z) % 4 !== 1) continue;
  let nx = x, nz = z;
  if (!inFP(x - 1, z) && inFP(x + 1, z)) nx = x + 1;
  else if (!inFP(x + 1, z) && inFP(x - 1, z)) nx = x - 1;
  else if (!inFP(x, z - 1) && inFP(x, z + 1)) nz = z + 1;
  else if (!inFP(x, z + 1) && inFP(x, z - 1)) nz = z - 1;
  if (nx === x && nz === z) continue;
  if (!inFP(nx, nz) || isPerim(nx, nz)) continue;
  const row = base + 3;
  if (row < ROOF) put(nx, row, nz, "glowstone");
}

// 4. Roof equipment: timber water tank on a 2x2 footprint, plus a small HVAC unit
const tankCells = [[1, 5], [2, 5], [1, 6], [2, 6]];
if (tankCells.every(([x, z]) => inFP(x, z) && !isPerim(x, z))) {
  for (const [x, z] of tankCells) {
    put(x, ROOF + 1, z, "oak_planks");
    put(x, ROOF + 2, z, "oak_planks");
  }
  for (const [x, z] of tankCells) {
    put(x, ROOF + 3, z, "oak_slab", { type: "top", waterlogged: "false" });
  }
}
if (inFP(3, 8) && !isPerim(3, 8)) put(3, ROOF + 1, 8, "iron_block");

g.save(OUT);
