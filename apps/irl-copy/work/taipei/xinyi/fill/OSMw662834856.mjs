import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Footprint 95 x 26, roof ~11 blocks above lowest ground.
// Read as a 1970s-80s Taipei low-rise commercial block: two storeys of ~5 blocks,
// white tiled concrete facade, glazed shopfronts, a red cornice, a flat roof with
// a parapet and plant boxes. Roof sits at y 11 (parapet to 12).

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834856.cells.json", "utf8"));

const W = 95, H = 23, D = 26;
const ROOF = 11;     // roof slab top level
const PARAPET = 12;  // parapet top level
const FLOOR2 = 6;    // second floor slab

const G = new Map();
const key = (x, z) => x + "," + z;
for (const c of cells) {
  const [x, z, gr] = c;
  G.set(key(x, z), Math.min(Math.max(Math.round(gr), 0), 10));
}
const inside = (x, z) => G.has(key(x, z));
const groundOf = (x, z) => G.get(key(x, z));
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const g = new Voxels([W, H, D]);

// place only on footprint cells, and only above that cell's ground (foundation handled separately)
function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inside(x, z)) return;
  if (y <= groundOf(x, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= gr && y < H; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Facade, floor slabs, roof, parapet
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const edge = isEdge(x, z);

  // interior floor slab at storey line
  if (!edge) put(x, FLOOR2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // roof slab
  put(x, ROOF, z, edge ? "red_concrete" : "smooth_stone");

  if (!edge) continue;

  // which facade and along-facade coordinate
  const longFace = z === 0 || z === D - 1;
  const u = longFace ? x : z;
  const p = u % 6;

  for (let y = gr + 1; y <= PARAPET; y++) {
    let b = "white_concrete";
    if (y === 1) b = "stone_bricks";                   // base course
    else if (y >= 2 && y <= 4) {                       // ground floor shopfront
      if (p === 0) b = "white_concrete";
      else if (p === 1 || p === 5) b = "gray_concrete";
      else b = "glass";
    } else if (y === 5) b = "smooth_stone";            // transom
    else if (y === FLOOR2) b = "smooth_stone";         // storey line
    else if (y >= 8 && y <= 9) {                       // upper storey windows
      if (p === 0) b = "white_concrete";
      else if (p === 1 || p === 5) b = "gray_concrete";
      else b = "light_blue_stained_glass";
    } else if (y === ROOF) b = "red_concrete";         // cornice
    else if (y === PARAPET) b = "white_concrete";      // parapet cap
    g.set(x, y, z, b);
  }
}

// 3. Front entrance on z=0: centre door at u=47, with stone surround
for (let x = 44; x <= 50; x++) {
  if (inside(x, 0) && groundOf(x, 0) < 1) {
    // door surround base
    if (x === 46 || x === 48) g.set(x, 2, 0, "stone_bricks");
  }
}
if (inside(47, 0) && groundOf(47, 0) < 2) {
  g.set(47, 2, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(47, 3, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // lantern just inside the entrance
  if (inside(47, 1)) g.set(47, 4, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. Warm lights behind the glass: shroomlights on interior cells one step in from the front
for (let x = 0; x < W; x++) {
  for (const zz of [1]) {
    if (!inside(x, zz) || isEdge(x, zz)) continue;
    if (x % 6 === 3) {
      if (groundOf(x, zz) < 3) g.set(x, 3, zz, "shroomlight");
      if (groundOf(x, zz) < 8) g.set(x, 8, zz, "shroomlight");
    }
  }
}
// same on the back face row
for (let x = 0; x < W; x++) {
  const zz = D - 2;
  if (!inside(x, zz) || isEdge(x, zz)) continue;
  if (x % 6 === 3 && groundOf(x, zz) < 8) g.set(x, 8, zz, "glowstone");
}

// 5. Roof equipment: plant boxes and a stair core on the flat roof
function plantBox(x0, x1, z0, z1, h) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inside(x, z) || isEdge(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + h; y++) {
      if (y > groundOf(x, z)) g.set(x, y, z, "light_gray_concrete");
    }
  }
}
plantBox(12, 18, 8, 13, 2);
plantBox(60, 68, 8, 13, 2);
plantBox(30, 34, 15, 19, 1);

// railing around the roof edge on the long faces
for (let x = 0; x < W; x++) for (const zz of [1, D - 2]) {
  if (inside(x, zz) && x % 2 === 0 && groundOf(x, zz) < PARAPET) {
    if (!isEdge(x, zz)) g.set(x, PARAPET, zz, "iron_bars");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834856.nbt");
