import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義御園 (2005): mid-rise residential block, 7 storeys of ~5 blocks.
// White tiled facade, quartz fins on a regular bay rhythm, polished storey
// bands, glazed lobby on the south face, grey roof slab, white parapet and
// a rooftop plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0037-7F";
const W = 28, H = 47, D = 16;
const TOP = 34;      // last body row; roof slab sits at y=34, body is 0..34 (35 blocks)
const PARAPET = 35;  // parapet row on exterior edge
const PLANT = 35;    // rooftop plant box base

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground level (clamped to the body height)
const cell = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cell.set(`${x},${z}`, Math.min(TOP - 1, Math.max(0, Math.round(gr))));
}
const has = (x, z) => cell.has(`${x},${z}`);

const sideCount = (x, z) =>
  (!has(x - 1, z) ? 1 : 0) + (!has(x + 1, z) ? 1 : 0) +
  (!has(x, z - 1) ? 1 : 0) + (!has(x, z + 1) ? 1 : 0);

for (const [key, gr] of cell) {
  const [x, z] = key.split(",").map(Number);

  // 1. Foundation: solid stone from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ext = sideCount(x, z) > 0;
  const corner = sideCount(x, z) >= 2;
  const south = !has(x, z + 1);
  const entranceX = x >= 12 && x <= 15;

  // 2. Body: storeys from the cell's ground up to TOP-1
  for (let y = gr; y < TOP; y++) {
    const s = Math.floor(y / 5);
    const w = y % 5;

    // Storey band (dark polished line) for interior and exterior cells
    if (w === 0) {
      g.set(x, y, z, ext ? "polished_andesite" : "smooth_quartz");
      continue;
    }

    if (!ext) continue; // interior stays air behind the glass

    // Plinth course on the ground storey
    if (y === gr && s === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Lobby on the south face: glazed entrance under a dark canopy band
    if (south && entranceX && y < gr + 3) {
      g.set(x, y, z, (x === 13 || x === 14) && y === gr ? "dark_oak_planks" : "glass");
      continue;
    }
    if (south && x >= 11 && x <= 16 && y === gr + 3) {
      g.set(x, y, z, "polished_andesite"); // entrance canopy
      continue;
    }

    if (corner) {
      g.set(x, y, z, "quartz_pillar"); // corner fin
      continue;
    }

    if (w >= 1 && w <= 3) {
      // Regular bay rhythm: a quartz fin every third cell, glazed bays between.
      // Bays are uniform in width so the facade reads as repeated units.
      if ((x + z) % 3 === 0) {
        g.set(x, y, z, "quartz_pillar");
      } else if (w === 2 && (x * 3 + z * 5 + s * 7) % 13 === 0) {
        g.set(x, y, z, "glowstone"); // a lit window at dusk
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane");
      }
      continue;
    }

    // w === 4: spandrel under the next storey band, white tile
    g.set(x, y, z, "white_concrete");
  }

  // 3. Cornice and roof slab
  g.set(x, TOP, z, ext ? "smooth_quartz" : "gray_concrete");

  // 4. Parapet on the exterior edge
  if (ext) g.set(x, PARAPET, z, "white_concrete");

  // 5. Rooftop plant box, centred on the roof
  if (x >= 4 && x <= 7 && z >= 4 && z <= 7) {
    g.set(x, PLANT, z, "light_gray_concrete");
    g.set(x, PLANT + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
