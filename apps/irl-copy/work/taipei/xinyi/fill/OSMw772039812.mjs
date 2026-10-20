import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey 1990s Taipei commercial block: cream tiled facade, stone base,
// tinted glass bays with white-concrete mullions, red terracotta cornice,
// shopfront and recessed entrance on the north (front) face, flat roof with plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039812";
const W = 26, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Lowest ground under the footprint: the roof sits 11 blocks above it (levels L..L+10).
let L = Infinity;
for (const v of ground.values()) L = Math.min(L, v);
const RY = L + 10;

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const isExposed = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Front = north (z-1 side) when exposed, then south, west, east.
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
};

function facade(face, x, z, y, rel) {
  const k = Math.floor(rel / 5);     // storey index: 0 = ground, 1 = upper
  const s = rel % 5;                 // 1..4 within a storey band
  const ground_ = k === 0;
  const tt = face === "N" || face === "S" ? x : z;   // position along the face
  const pillar = tt % 3 === 0;

  // Recessed entrance on the north face, one bay wide.
  if (ground_ && face === "N" && tt === 12) {
    if (rel === 1) return put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    if (rel === 2) return put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (rel === 3) return put(x, y, z, "lantern", { hanging: "true" });
    if (rel === 4) return put(x, y, z, "smooth_quartz");
  }

  if (s === 1) return put(x, y, z, ground_ ? "stone_bricks" : "white_concrete");
  if (s === 4) return put(x, y, z, "smooth_quartz");

  // s = 2 or 3: glazing band
  if (pillar) return put(x, y, z, ground_ ? "stone_bricks" : "white_concrete");
  if (!ground_ && s === 2 && tt % 4 === 1) return put(x, y, z, "glowstone"); // warm lit window
  return put(x, y, z, "gray_stained_glass");
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const g0 = Math.min(gr, RY);
  const exposed = isExposed(x, z);
  const face = faceOf(x, z);

  // Foundation under the base course.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone");

  for (let y = g0; y <= RY; y++) {
    const rel = y - g0;
    if (y === RY) {
      put(x, y, z, exposed ? "red_terracotta" : "gray_concrete");   // cornice / roof deck
    } else if (rel % 5 === 0) {
      // Floor slab / storey line
      put(x, y, z, exposed ? (rel === 0 ? "stone_bricks" : "white_concrete") : "smooth_stone");
    } else if (exposed) {
      facade(face, x, z, y, rel);
    }
    // interior cells above floors stay air: the air gap behind the glass
  }
}

// Roof plant on the interior roof deck, a few boxes near the middle.
for (const [x, z] of [[4, 4], [5, 4], [4, 5], [5, 5], [8, 5]]) {
  if (has(x, z) && !isExposed(x, z)) {
    put(x, RY + 1, z, "light_gray_concrete");
  }
}
if (has(8, 5) && !isExposed(8, 5)) put(8, RY + 1, 5, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
