import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343762";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 37, H = 23, D = 27;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Bounds-guarded setter
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front face = edge cells on the minimum-z side; entrance at the median x of that run
let minZ = Infinity;
for (const [x, z] of cells) if (isEdge(x, z) && z < minZ) minZ = z;
const frontXs = cells.filter(([x, z]) => z === minZ && isEdge(x, z)).map(([x]) => x).sort((a, b) => a - b);
const entranceX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -999;

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Ground floor slab and storey-two floor slab (interior and edge)
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");

  // Roof deck at gr+10
  if (edge) put(x, gr + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else put(x, gr + 10, z, "light_gray_concrete");

  if (!edge) {
    // Roof equipment on a sparse grid of interior cells
    if ((x * 7 + z * 3) % 11 === 0) {
      put(x, gr + 11, z, "stone_bricks");
      if ((x + z) % 4 === 0) put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // ---- Edge (facade) cells ----
  // Parapet
  put(x, gr + 11, z, "white_concrete");

  // Inward direction for glowstone placement
  let inward = null;
  for (const [dx, dz] of DIRS) {
    if (has(x + dx, z + dz) && !isEdge(x + dx, z + dz)) { inward = [dx, dz]; break; }
  }

  const k = x + z; // position along the wall
  const isFront = z === minZ;
  const isEntrance = isFront && Math.abs(x - entranceX) === 0;

  // Base course
  put(x, gr + 1, z, "polished_andesite");

  // Ground floor shopfronts
  if (isEntrance) {
    // open doorway: air at gr+1..gr+3
    put(x, gr + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    for (const y of [gr + 2, gr + 3]) {
      if (k % 4 === 0 || k % 4 === 3) put(x, y, z, "dark_oak_planks");
      else {
        const lit = k % 8 === 5;
        put(x, y, z, lit ? "yellow_stained_glass" : "light_blue_stained_glass");
      }
    }
    if (k % 4 === 1 || k % 4 === 2) {
      if (k % 8 === 5 && inward) {
        put(x + inward[0], gr + 2, z + inward[1], "glowstone");
      }
    }
  }
  put(x, gr + 1, z, isEntrance ? "air" : "polished_andesite");
  if (isEntrance) {
    for (const y of [gr + 1, gr + 2, gr + 3]) put(x, y, z, "air");
  }

  // Ground-floor lintel band
  put(x, gr + 4, z, isEntrance ? "stone_brick_slab" : "white_concrete",
    isEntrance ? { type: "bottom", waterlogged: "false" } : undefined);

  // Storey line at gr+5 (already smooth_stone on the slab row, make edge a stone-brick slab)
  put(x, gr + 5, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  // Upper storey spandrel
  put(x, gr + 6, z, "white_concrete");

  // Upper storey windows
  for (const y of [gr + 7, gr + 8]) {
    if (k % 4 === 0 || k % 4 === 3) put(x, y, z, "light_gray_concrete");
    else {
      const lit = k % 8 === 1;
      put(x, y, z, lit ? "yellow_stained_glass" : "light_blue_stained_glass");
    }
  }
  if ((k % 4 === 1 || k % 4 === 2) && k % 8 === 1 && inward) {
    put(x + inward[0], gr + 7, z + inward[1], "shroomlight");
  }

  // Upper spandrel / cornice course
  put(x, gr + 9, z, "white_concrete");
  put(x, gr + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
