import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650486";
const W = 89, H = 23, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr))));
  }
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// One roof level for the whole building, set by the highest ground.
let maxG = 0;
for (const v of ground.values()) maxG = Math.max(maxG, v);
const R = maxG + 10;               // roof slab level (same everywhere)

function outward(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push(["north", 0, -1]);
  if (!has(x, z + 1)) out.push(["south", 0, 1]);
  if (!has(x - 1, z)) out.push(["west", -1, 0]);
  if (!has(x + 1, z)) out.push(["east", 1, 0]);
  return out;
}
const isEx = (x, z) => has(x, z) && outward(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation, floor slabs, roof slab (every footprint cell)
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ex = isEx(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, ex ? "stone_bricks" : "smooth_stone");        // ground floor slab
  put(x, gr + 5, z, "smooth_stone");                          // storey line
  // lower cells: solid upper storey so the roof is never over air
  if (!ex) {
    for (let y = gr + 6; y <= R - 1; y++) put(x, y, z, "light_gray_concrete");
  }
  put(x, R, z, ex ? "white_concrete" : "light_gray_concrete"); // roof slab
}

// 2. Exterior walls, shopfronts, window grids, parapet
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const outs = outward(x, z);
  if (outs.length === 0) continue;

  const long = outs.find((o) => o[0] === "north" || o[0] === "south");
  const [fname, dx, dz] = long ?? outs[0];
  const runX = fname === "north" || fname === "south";
  const t = runX ? x : z;
  const pane = runX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const inX = x - dx, inZ = z - dz;
  const inwardOK = has(inX, inZ) && !isEx(inX, inZ);

  const pillar = t % 4 === 0;
  const doorHere = runX && t % 30 === 15;
  // every 4th column is a deeper pilaster (paired quartz), others plain
  const pilaster = t % 4 === 0 ? "quartz_pillar" : "white_concrete";

  // storey band above ground floor
  put(x, gr + 4, z, "light_gray_concrete");

  // ground storey shopfront
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (pillar) put(x, y, z, pilaster, { axis: "y" });
    else put(x, y, z, "glass");
  }
  if (doorHere) {
    const facing = fname;
    put(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    // entrance canopy: slab projecting over the door at storey line level, one row out
    const ox = x + dx, oz = z + dz;
    if (!has(ox, oz)) put(ox, gr + 3, oz, "dark_oak_slab", { type: "top", waterlogged: "false" });
  } else if (t % 8 === 6 && inwardOK) {
    put(inX, gr + 2, inZ, "glowstone");
  }

  // upper storeys up to the common roof: glass grid with pilasters
  for (let y = gr + 6; y <= R - 1; y++) {
    if (pillar) put(x, y, z, pilaster, { axis: "y" });
    else put(x, y, z, "glass_pane", pane);
  }
  if (!pillar && t % 12 === 6 && inwardOK) {
    put(inX, gr + 7, inZ, "shroomlight");
  }

  // cornice and parapet at the common roof line, rhythmic pilaster tops
  put(x, R, z, "white_concrete");
  put(x, R + 1, z, pillar ? "white_concrete" : "light_gray_concrete");
}

// 3. Roof equipment and terrace on interior cells
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEx(x, z)) continue;
  if (x % 18 >= 6 && x % 18 <= 8 && z >= 8 && z <= 15) {
    put(x, R + 1, z, "light_gray_concrete");
    if (x % 18 === 7) put(x, R + 2, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
