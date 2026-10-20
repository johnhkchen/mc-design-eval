import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542014189.cells.json", "utf8"));

const W = 11, H = 23, D = 5;
const ROOF = 11;   // roof slab level (about 11 blocks above lowest ground)
const MID = 5;     // storey line between ground and upper floor
const TOP = 10;    // lintel band under the roof
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const pane = (ns) => ns
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Wall block for a perimeter cell at height y. Returns [id, props?] or null.
function wallBlock(x, y, gr) {
  const rel = y - gr;
  if (y === TOP) return ["smooth_quartz"];
  if (y === MID && MID > gr) return ["smooth_quartz"];

  const front = z0 => z0; // helper placeholder
  return null;
}

// Facade logic split out so z is explicit.
function facadeBlock(x, y, z, gr) {
  const rel = y - gr;
  if (y === TOP) return ["smooth_quartz"];
  if (y === MID && MID > gr) return ["smooth_quartz"];

  if (z === 0 || z === D - 1) {
    // street (z=0) and rear (z=4) faces
    if (y < MID) {
      if (rel === 1) return ["stone_bricks"];
      if (x === 0 || x === W - 1) return ["stone_bricks"];
      if (z === 0 && x === 5) {
        if (rel === 2) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
        if (rel === 3) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      }
      if (rel === 4) {
        if (z === 0 && x >= 4 && x <= 6) return ["dark_oak_slab", { type: "bottom", waterlogged: "false" }];
        return ["light_gray_concrete"];
      }
      return ["cyan_stained_glass"];
    }
    // upper storey
    if (x === 0 || x === W - 1 || x % 2 === 0) return ["white_concrete"];
    if (y === 6) return ["light_gray_concrete"];
    return ["light_blue_stained_glass_pane", pane(false)];
  }

  // side faces (x = 0 or W-1, z = 1..3)
  if (y < MID) {
    if (rel === 1) return ["stone_bricks"];
    if (z === 2 && rel >= 2 && rel <= 4) return ["light_blue_stained_glass_pane", pane(true)];
    return ["stone_bricks"];
  }
  if (z === 2) {
    if (y === 6) return ["light_gray_concrete"];
    return ["light_blue_stained_glass_pane", pane(true)];
  }
  return ["white_concrete"];
}

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // ground floor slab at the cell's ground level
  put(x, gr, z, "smooth_stone");

  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  // interior floor slab for the middle storey
  if (!perim && MID > gr) put(x, MID, z, "smooth_stone");

  // facade walls
  if (perim) {
    for (let y = gr + 1; y <= TOP; y++) {
      if (y >= ROOF) break;
      const b = facadeBlock(x, y, z, gr);
      if (b) put(x, y, z, b[0], b[1]);
    }
  }

  // roof slab, cornice and parapet
  if (ROOF > gr) {
    put(x, ROOF, z, perim ? "smooth_quartz" : "gray_concrete");
    if (perim) put(x, ROOF + 1, z, "white_concrete");
  }
}

// Warm lights in the upper storey, standing on the middle floor slab behind the front windows
if (MID > 0) {
  for (const lx of [3, 7]) {
    if (inFp(lx, 1) && 6 > (ground.get(`${lx},1`))) {
      put(lx, 6, 1, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Roof equipment: AC plant and a water tank
if (ROOF > 0) {
  for (const x of [2, 3]) {
    if (inFp(x, 2) && ROOF > ground.get(`${x},2`)) put(x, ROOF + 1, 2, "light_gray_concrete");
  }
  for (const x of [7, 8]) {
    for (const z of [2, 3]) {
      if (inFp(x, z) && ROOF > ground.get(`${x},${z}`)) {
        put(x, ROOF + 1, z, "iron_block");
        put(x, ROOF + 2, z, "iron_block");
      }
    }
  }
  for (const x of [7, 8]) {
    for (const z of [2, 3]) {
      if (inFp(x, z) && ROOF > ground.get(`${x},${z}`)) {
        put(x, ROOF + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542014189.nbt");
