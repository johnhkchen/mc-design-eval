import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682855";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Lowest ground under the building: roof sits ~11 blocks above it
const L = Math.min(...cells.map(c => c[2]));
const F2 = L + 5;          // second-storey floor line
const ROOF = L + 11;       // roof deck (about 11 above lowest ground)

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPerim = (x, z) =>
  inFp(x, z) && (!inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1));

// Pilasters: corners and every 4th bay along the long faces, z=0/4/8 on the short faces
const isPil = (x, z) => {
  if (z === 0 || z === 8) return x % 4 === 0 || x === 13;
  return x === 0 || x === 13 ? (z % 4 === 0 || z === 8) : false;
};

const PANE_FB = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_SIDE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function facade(x, y, z, g0) {
  const pil = isPil(x, z);
  const sideFace = (x === 0 || x === 13) && z !== 0 && z !== 8;
  const pane = sideFace ? PANE_SIDE : PANE_FB;
  const front = z === 0;
  const doorCell = front && x === 6;

  // Ground storey: g0+1 .. F2-1
  if (y <= F2 - 1) {
    if (pil) return put(x, y, z, "white_concrete");
    if (y === F2 - 1) return put(x, y, z, "stone_bricks");        // lintel
    if (doorCell && y <= g0 + 2) {
      const half = y === g0 + 1 ? "lower" : "upper";
      return put(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
    }
    return put(x, y, z, "glass_pane", pane);
  }

  // Upper storey: F2+1 .. ROOF-1
  if (pil) return put(x, y, z, "white_concrete");
  if (y === F2 + 5) return put(x, y, z, "stone_bricks");            // cornice
  if (y === F2 + 4) return put(x, y, z, "light_gray_concrete");     // spandrel
  return put(x, y, z, "glass_pane", pane);
}

for (const [x, z, g0] of cells) {
  const perim = isPerim(x, z);

  // Foundation below the cell
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  // Floor / plinth at the cell's ground
  put(x, g0, z, perim ? "stone_bricks" : "smooth_stone");

  // Body
  for (let y = g0 + 1; y < ROOF; y++) {
    if (perim) {
      if (y === F2 && !(y <= g0)) put(x, y, z, "light_gray_concrete"); // storey band
      else facade(x, y, z, g0);
    } else if (y === F2 && F2 > g0) {
      put(x, y, z, "smooth_stone");                                    // storey slab
    }
    // interior otherwise left as air behind the glass
  }

  // Roof deck
  put(x, ROOF, z, "smooth_stone");

  // Parapet and cap
  if (perim) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof plant box
for (let x = 3; x <= 5; x++) for (let z = 2; z <= 3; z++) {
  if (!inFp(x, z) || isPerim(x, z)) continue;
  put(x, ROOF + 1, z, "light_gray_concrete");
  put(x, ROOF + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Warm lights: lantern at the entrance hanging from the ground-storey ceiling,
// glowstone behind upper-storey glass
if (inFp(6, 1)) put(6, F2 - 1, 1, "lantern", { hanging: "true", waterlogged: "false" });
for (const [x, z] of [[2, 1], [9, 1]]) {
  if (inFp(x, z)) put(x, F2 + 1, z, "glowstone");
}
if (inFp(11, 4)) put(11, F2 + 2, 4, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
