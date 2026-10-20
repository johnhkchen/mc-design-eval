import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial/office block, c. 1980s-90s: five storeys of
// 5 blocks, white concrete piers and tinted glazing, granite shopfront base,
// quartz cornice, parapet and a rooftop plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643640294";
const W = 21, H = 38, D = 17;
const STOREYS = 5, STOREY_H = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const isBoundary = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const key = (x, y, z) => `${x},${y},${z}`;

const solid = new Set();     // blocks that count as wall/shell for pane connections
const panes = [];            // window cells, props applied at the end

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return false;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
  return true;
}
function wall(x, y, z, id, props) {
  if (put(x, y, z, id, props)) solid.add(key(x, y, z));
}
function pane(x, y, z) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  panes.push([x, y, z]);
  solid.add(key(x, y, z));
}

// Geometry helpers
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
const minZ = Math.min(...cells.map((c) => c[1]));

// Entrance: front (lowest z) boundary row, near its centre
const frontRow = cells.filter(([x, z]) => z === minZ && isBoundary(x, z)).map((c) => c[0]);
let doorX;
if (frontRow.length) {
  const mid = frontRow.reduce((a, b) => a + b, 0) / frontRow.length;
  doorX = frontRow.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best));
}

// 1. Foundations, floor slabs and roof slab over the whole footprint
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (let k = 0; k <= STOREYS; k++) put(x, gr + k * STOREY_H, z, "light_gray_concrete");
}

// 2. Facade on the shell (boundary cells only)
for (const [x, z, gr] of cells) {
  if (!isBoundary(x, z)) continue;
  const isDoorCell = x === doorX && z === minZ;

  for (let k = 0; k < STOREYS; k++) {
    const b = gr + k * STOREY_H;
    // storey line / base course
    wall(x, b, z, k === 0 ? "polished_granite" : "light_gray_concrete");

    for (let dy = 1; dy <= 3; dy++) {
      const y = b + dy;
      const pier = (x + z) % 3 === 0;

      if (k === 0 && isDoorCell && dy <= 2) {
        const half = dy === 1 ? "lower" : "upper";
        wall(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (k === 0 && dy === 3) {
        wall(x, y, z, pier ? "polished_granite" : "light_gray_concrete");
        continue;
      }
      if (pier) wall(x, y, z, k === 0 ? "polished_granite" : "smooth_quartz");
      else pane(x, y, z);
    }

    // spandrel above windows; cornice at the top storey
    wall(x, b + 4, z, k < STOREYS - 1 ? "light_gray_concrete" : "smooth_quartz");
  }

  // roof cornice and parapet
  wall(x, gr + 25, z, "smooth_quartz");
  wall(x, gr + 26, z, "white_concrete");

  // entrance canopy over the door and its neighbours
  if (doorX !== undefined && z === minZ && Math.abs(x - doorX) <= 1) {
    wall(x, gr + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 3. Warm light behind some interior windows, and rooftop plant box
for (const [x, z, gr] of cells) {
  if (isBoundary(x, z)) continue;

  const nearShell = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => isBoundary(x + dx, z + dz) && inFp(x + dx, z + dz));
  if (nearShell) {
    for (let k = 1; k <= 3; k++) {
      if ((x * 5 + z * 3 + k) % 7 === 0) put(x, gr + k * STOREY_H + 2, z, "glowstone");
    }
  }

  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
    put(x, gr + 26, z, "light_gray_concrete");
    put(x, gr + 27, z, "smooth_stone");
  }
}

// 4. Window panes, connected to neighbouring wall/glass blocks
for (const [x, y, z] of panes) {
  const c = (dx, dz) => (solid.has(key(x + dx, y, z + dz)) ? "true" : "false");
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: c(0, -1),
    south: c(0, 1),
    east: c(1, 0),
    west: c(-1, 0),
    waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
