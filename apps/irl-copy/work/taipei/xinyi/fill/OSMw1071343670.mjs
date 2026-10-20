import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343670";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 40, H = 23, D = 27;
const g = new Voxels([W, H, D]);

// Bounds-checked setter; props optional.
function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// Character: 2-storey (about 5 blocks per storey) mid-century commercial block
// with a white-concrete pillar grid, ground-floor shopfronts, an upper window
// band, a quartz parapet and a few lit windows.

// Pass 1: foundations, ground slab and base course for every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "polished_andesite");
}

// Pass 2: walls, floors, roof for each footprint cell.
for (const [x, z, gr] of cells) {
  const b = gr;
  const missXm = !has(x - 1, z);
  const missXp = !has(x + 1, z);
  const missZm = !has(x, z - 1);
  const missZp = !has(x, z + 1);
  const missCount = [missXm, missXp, missZm, missZp].filter(Boolean).length;

  if (missCount === 0) {
    // Interior: floor slab at storey line and roof slab; air between.
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "stone");

    // Small roof plant boxes on a few interior cells.
    if (x % 9 === 4 && z % 7 === 3) {
      put(x, b + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade cell. Index along the face decides pillar rhythm.
  const idx = (missXm || missXp) ? z : x;
  const pillar = missCount >= 2 || idx % 4 === 0;

  // Base course.
  put(x, b, z, "polished_granite");

  // Ground floor (shopfront).
  if (pillar) {
    for (let y = b + 1; y <= b + 4; y++) put(x, y, z, "white_concrete");
  } else {
    for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "glass_pane");
    put(x, b + 4, z, "smooth_stone");
  }

  // Storey line.
  put(x, b + 5, z, "smooth_stone");

  // Upper floor (windows).
  if (pillar) {
    for (let y = b + 6; y <= b + 9; y++) put(x, y, z, "white_concrete");
  } else {
    const lit = idx % 5 === 2;
    for (let y = b + 6; y <= b + 8; y++) {
      if (lit && y === b + 7) put(x, y, z, "glowstone");
      else put(x, y, z, "glass_pane");
    }
    put(x, b + 9, z, "smooth_stone");
  }

  // Parapet and cornice cap.
  put(x, b + 10, z, "white_concrete");
  put(x, b + 11, z, "smooth_quartz_slab", { type: "bottom" });
}

// Pass 3: entrance on the lowest-z face, middle of that run.
{
  const cands = cells
    .filter(([x, z]) => !has(x, z - 1))
    .sort((a, b) => a[0] - b[0]);
  if (cands.length > 0) {
    const [ex, ez, eg] = cands[Math.floor(cands.length / 2)];
    const b = eg;
    put(ex, b + 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(ex, b + 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(ex, b + 3, ez, "glass_pane");
    put(ex, b + 4, ez, "stone_brick_slab", { type: "bottom" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
