import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1156915710.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1156915710.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 11, H = 23, D = 10;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground (integer)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.floor(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const L = Math.min(...ground.values());   // lowest ground under the footprint

// Storey logic (relative to L): shopfront k0-3, lintel k4, floor slab k5,
// upper storey windows k6-8, cornice k9, roof cap k10, parapet k11.
const S = L + 5;   // storey-line slab
const C = L + 10;  // roof cap level

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior side for a cell: first side whose neighbour is not in the footprint.
// Order: north (z-1), south (z+1), west (x-1), east (x+1).
function exteriorSide(x, z) {
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  return null;
}

// Facade block for an exterior wall cell at storey-relative height k.
function facadeBlock(x, y, z, k, side) {
  const u = side === "n" || side === "s" ? x : z;   // position along the face
  const entrance = side === "n" && x === 5;          // centred entrance on the street (north) face

  if (k === 0) return ["stone_bricks"];              // base course
  if (k <= 3) {                                      // shopfront band
    if (entrance) {
      if (k === 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
      return ["glass"];
    }
    if (u % 3 === 0) return ["smooth_stone"];        // shopfront pillars
    return ["glass_pane"];
  }
  if (k === 4) return ["white_concrete"];            // lintel band
  if (k >= 6 && k <= 8) {                            // upper storey window grid
    if (u % 3 === 0) return ["white_concrete"];      // mullions / piers
    const warm = (u * 3 + y * 5 + z * 7) % 11 === 0;
    if (warm) return ["glowstone"];                  // some lit windows
    return ["cyan_stained_glass_pane"];
  }
  if (k === 9) return ["smooth_stone"];              // cornice band
  return ["white_concrete"];
}

for (const [x, z, gr0] of cells) {
  const gr = Math.floor(gr0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const side = exteriorSide(x, z);
  const cap = Math.max(C, gr);

  // Body from this cell's ground up to the roof cap.
  for (let y = gr; y < cap; y++) {
    const k = y - L;
    if (y === gr && !side) {
      put(x, y, z, "smooth_stone");                  // interior ground floor slab
      continue;
    }
    if (y === S && S >= gr) {
      put(x, y, z, "light_gray_concrete");           // storey-line floor slab
      continue;
    }
    if (side) {
      const [id, props] = facadeBlock(x, y, z, k, side);
      put(x, y, z, id, props);
    }
  }

  // Roof cap: a slab over every footprint cell, standing on the body below.
  put(x, cap, z, "light_gray_concrete");

  if (side) {
    // Parapet stands on the cap along the perimeter.
    put(x, cap + 1, z, "white_concrete");
  } else if ((x * 3 + z * 5) % 7 === 0 && cap + 1 < H) {
    // Roof plant boxes on some interior cells.
    put(x, cap + 1, z, "iron_block");
  }
}

g.save(OUT);
