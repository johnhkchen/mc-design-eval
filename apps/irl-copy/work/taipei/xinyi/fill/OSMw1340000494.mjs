import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1340000494";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 9 x 4. One commercial storey of 5 blocks on a common floor level,
// cornice, red-terracotta parapet, flat roof with plant. 1990s Xinyi-style
// cream tile and dark glass shophouse block.
const W = 9, H = 19, D = 4;
const g = new Voxels([W, H, D]);

let maxG = -Infinity;
for (const [, , gr] of cells) maxG = Math.max(maxG, gr);

// Common floor level: the highest ground under the footprint, so every storey
// sits on solid fill and nothing floats on the slope.
const F = maxG;
const ROOF = F + 7;
if (ROOF > H - 1) throw new Error(`roof at ${ROOF} exceeds build height ${H - 1}`);

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H) throw new Error(`y ${y} out of range`);
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const isPerim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Front face: shopfront on storey 1, door at x=4, mullions at x=2 and x=6.
// Back face: upper windows, stone base course.
function faceBlock(x, z, r) {
  const front = z === 0;
  if (r === 5) {
    if (front && x === 4) return ["sea_lantern"];
    return ["red_terracotta"];
  }
  if (!front && r === 1) return ["stone_bricks"];
  if (x === 4) {
    if (front && r <= 2) {
      return ["oak_door", {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      }];
    }
    return ["smooth_quartz"];
  }
  if (x === 2 || x === 6) return ["quartz_pillar", { axis: "y" }];
  if (front) return ["glass"];
  return ["gray_stained_glass"];
}

// Side walls: stone base, window pair over the two inner bays.
function sideBlock(r) {
  if (r === 1) return ["stone_bricks"];
  if (r >= 2 && r <= 4) return ["gray_stained_glass"];
  return ["smooth_quartz"];
}

// 1. Plinth from y 0 up to the floor level, solid under every footprint cell.
for (const [x, z] of cells) {
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");
}

// 2. Ground-storey floor slab at F on every cell.
for (const [x, z] of cells) {
  put(x, F, z, "smooth_stone");
}

// 3. Walls, cornice, parapet, ceiling and roof plant.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) {
    // Interior: air for the storey, ceiling slab at F+6, roof deck above.
    put(x, F + 6, z, "smooth_stone");
    continue;
  }

  // Cornice and parapet on the perimeter.
  put(x, F + 6, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(x, F + 7, z, "red_terracotta");

  for (let r = 1; r <= 5; r++) {
    const y = F + r;
    if (isCorner(x, z)) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (z === 0 || z === D - 1) {
      const [b, p] = faceBlock(x, z, r);
      put(x, y, z, b, p);
    } else {
      // x === 0 or x === W-1, z in 1..2
      const [b] = sideBlock(r);
      put(x, y, z, b);
    }
  }
}

// 4. Warm light behind the glass (interior air cells) for dusk.
put(1, F + 2, 1, "glowstone");
put(7, F + 3, 2, "glowstone");

// 5. Roof plant on the flat roof.
put(2, F + 7, 1, "light_gray_concrete");
put(6, F + 7, 2, "light_gray_concrete");

g.save(`${dir}/${id}.nbt`);
