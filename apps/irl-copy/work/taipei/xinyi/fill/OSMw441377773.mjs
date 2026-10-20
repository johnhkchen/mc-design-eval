import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw441377773.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw441377773.nbt";

const W = 65, H = 23, D = 69;
const ROOF_K = 10;   // top course of the 11-block building (k = 0..10)

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// ground lookup
const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// outward facing direction of an edge cell
function outward(x, z) {
  if (!inFp(x, z - 1)) return "north";
  if (!inFp(x, z + 1)) return "south";
  if (!inFp(x + 1, z)) return "east";
  return "west";
}
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// entrance: edge cell facing north (street side of the lowest z), nearest the middle
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of ground.keys().map ? [] : []) {} // placeholder for lint-safety
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2;
let doorCell = null;
{
  let best = null;
  for (const [x, z] of cells) {
    if (!isEdge(x, z) || outward(x, z) !== "north") continue;
    const d = Math.abs(x - cx);
    if (!best || d < best.d) best = { x, z, d };
  }
  if (!best) {
    for (const [x, z] of cells) {
      if (!isEdge(x, z)) continue;
      const d = Math.abs(x - cx) + Math.abs(z - minZ);
      if (!best || d < best.d) best = { x, z, d };
    }
  }
  if (best) doorCell = key(best.x, best.z);
}

// facade kind per edge cell and level k (0 = cell's ground)
function kindAt(x, z, k) {
  const bay = (x + z) % 3;
  const isDoor = key(x, z) === doorCell;
  if (k === 0) return "base";
  if (k === 4 || k === 5 || k === ROOF_K) return "band";
  if (k === 3) return isDoor ? "band" : (bay === 0 ? "pillar" : "glass");
  if (k === 1 || k === 2) {
    if (isDoor) return "door";
    return bay === 0 ? "pillar" : "glass";
  }
  if (k === 6 || k === 9) return "wall";
  return bay === 0 ? "pillar" : "glass"; // k 7, 8
}

const BLOCK = {
  base: ["polished_andesite"],
  band: ["smooth_quartz"],
  pillar: ["light_gray_concrete"],
  wall: ["white_concrete"],
  glass: ["light_blue_stained_glass_pane"],
};

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function isGlassAt(x, z, k) {
  if (!inFp(x, z) || !isEdge(x, z)) return false;
  const gr = ground.get(key(x, z));
  return gr !== undefined && kindAt(x, z, k) === "glass";
}

// 1. foundations and interior slabs
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone"); // ground floor slab (interior too)
}

// 2. facade and floors
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  for (let k = 0; k <= ROOF_K; k++) {
    const y = gr + k;
    if (!edge) {
      // interior: only floor slabs and roof, air elsewhere
      if (k === 5 || k === ROOF_K) put(x, y, z, "light_gray_concrete");
      continue;
    }
    const kind = kindAt(x, z, k);
    if (kind === "door") {
      if (k === 1) put(x, y, z, "oak_door", { facing: outward(x, z), half: "lower", hinge: "left", open: "false", powered: "false" });
      if (k === 2) put(x, y, z, "oak_door", { facing: outward(x, z), half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (kind === "glass") {
      const props = {
        north: isGlassAt(x, z - 1, k) ? "true" : "false",
        south: isGlassAt(x, z + 1, k) ? "true" : "false",
        east: isGlassAt(x + 1, z, k) ? "true" : "false",
        west: isGlassAt(x - 1, z, k) ? "true" : "false",
        waterlogged: "false",
      };
      put(x, y, z, BLOCK.glass[0], props);
      continue;
    }
    put(x, y, z, BLOCK[kind][0]);
  }
}

// 3. warm light behind some upper-floor windows, and a lantern inside the entrance
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  if (kindAt(x, z, 7) !== "glass") continue;
  if ((x * 31 + z * 17) % 7 !== 0) continue;
  for (const d of Object.values(DIRS)) {
    const nx = x + d[0], nz = z + d[1];
    if (inFp(nx, nz) && !isEdge(nx, nz)) {
      put(nx, ground.get(key(nx, nz)) + 7, nz, "glowstone");
      break;
    }
  }
}
if (doorCell) {
  const [dx, dz] = doorCell.split(",").map(Number);
  const out = outward(dx, dz);
  const [ix, iz] = [dx - DIRS[out][0], dz - DIRS[out][1]];
  if (inFp(ix, iz)) {
    put(ix, ground.get(key(ix, iz)) + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 4. rooftop plant: a few low AC boxes on the roof slab
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if ((x * 5 + z * 3) % 37 !== 0) continue;
  if (gr + ROOF_K + 2 >= H) continue;
  put(x, gr + ROOF_K + 1, z, "light_gray_concrete");
  put(x, gr + ROOF_K + 2, z, "light_gray_concrete");
}

g.save(OUT);
