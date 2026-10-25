import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499666";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 22, H = 32, D = 27;
const g = new Voxels([W, H, D]);

// Materials
const WALL = "white_concrete";     // render
const PILASTER = "polished_andesite";
const BAND = "stone_bricks";       // storey lines and cornice
const BASE = "stone";              // foundation rock
const FLOOR = "smooth_stone";      // interior floor slabs
const CAP = "stone_bricks";        // roof deck
const GLASS = "glass_pane";
const WARM = "glowstone";

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c;
  map.set(key(x, z), { gr, roof, tier: 0 });
}
const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// --- Smooth lidar roof into clean 5-block storey tiers ---
// 1) quantise each cell's roof to the nearest storey line (multiple of 5)
for (const v of map.values()) v.tier = Math.max(5, Math.round(v.roof / 5) * 5);
// 2) median over 3x3 neighbourhood to remove lidar noise
const tiers = new Map();
for (const [k, v] of map) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = map.get(key(x + dx, z + dz));
    if (n) vals.push(n.tier);
  }
  vals.sort((a, b) => a - b);
  tiers.set(k, vals[Math.floor(vals.length / 2)]);
}
for (const [k, t] of tiers) map.get(k).tier = t;
// keep roofs at least one storey above the cell's ground
for (const v of map.values()) if (v.tier <= v.gr + 5) v.tier = v.gr + 5;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function inwardCell(x, z) {
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) return [nx, nz];
  }
  return null;
}

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Street-facing edge: min z
let minZ = Infinity;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z) && z < minZ) minZ = z;
}
let doorX = null;
{
  const xs = [];
  for (const k of map.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z === minZ && isEdge(x, z)) xs.push(x);
  }
  xs.sort((a, b) => a - b);
  if (xs.length) doorX = xs[Math.floor(xs.length / 2)];
}

for (const [k, v] of map) {
  const [x, z] = k.split(",").map(Number);
  const { gr, tier: roof } = v;
  const edge = isEdge(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Walls, floors and interior air between ground and roof tier
  for (let y = gr; y < roof; y++) {
    const off = y - gr;
    const band = off % 5 === 0;
    if (edge) {
      const pilaster = (x + z) % 3 === 0;
      if (band) {
        put(x, y, z, BAND);
      } else if (pilaster) {
        put(x, y, z, PILASTER);
      } else if (off % 5 <= 3) {
        put(x, y, z, GLASS);
      } else {
        put(x, y, z, WALL);
      }
    } else if (band) {
      put(x, y, z, FLOOR);
    }
  }

  // Warm lights behind some glass
  if (edge && (x * 7 + z * 3) % 11 === 0) {
    const inner = inwardCell(x, z);
    if (inner) {
      for (let off = 2; off < roof - gr - 1; off += 5) {
        put(inner[0], gr + off, inner[1], WARM);
      }
    }
  }

  // Roof deck and parapet
  put(x, roof, z, CAP);
  if (edge) {
    put(x, roof + 1, z, "stone_brick_wall");
  } else if ((x * 3 + z * 5) % 37 === 0) {
    put(x, roof + 1, z, "smooth_stone_slab", { type: "bottom" });
  }
}

// Entrance on the street face
if (doorX !== null) {
  const gr = map.get(key(doorX, minZ)).gr;
  const dprops = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(doorX, gr, minZ, "oak_door", dprops("lower"));
  put(doorX, gr + 1, minZ, "oak_door", dprops("upper"));
  // Canopy lintel over the door, lamps either side
  for (let dx = -1; dx <= 1; dx++) {
    const cx = doorX + dx;
    if (has(cx, minZ)) put(cx, gr + 3, minZ, "dark_oak_planks");
  }
  if (has(doorX - 2, minZ)) put(doorX - 2, gr + 2, minZ, WARM);
  if (has(doorX + 2, minZ)) put(doorX + 2, gr + 2, minZ, WARM);
  // Threshold step in front
  const tz = minZ - 1;
  if (tz >= 0) put(doorX, gr, tz, "stone_brick_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
