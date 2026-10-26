import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86608.cells.json`, "utf8"));

// Narrow early-20th-century brick commercial block: limestone plinth and cornice,
// opaque shopfront base with a glazed bay, storeys every 3 blocks, one flat roof.
const W = 3, H = 23, D = 11;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

// Smooth the lidar roof into one flat tier for the whole block, and use the
// median ground so the massing reads as a single building.
const roofMed = Math.round(median(cells.map(c => c[3])));
const groundMed = Math.round(median(cells.map(c => c[2])));
const ROOF = Math.min(Math.max(roofMed, groundMed + 6), H - 3);

for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.round(c[2]);
  const R = Math.max(ROOF, gr + 6);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const perim = x === 0 || x === 2 || z === 0 || z === D - 1;
  const front = z === 0;
  const back = z === D - 1;

  for (let y = gr; y < R; y++) {
    const rel = y - gr;

    if (rel === 0) {
      // Limestone plinth / ground floor slab.
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (y === R - 1) {
      // Cornice on the perimeter, roof deck inside.
      put(x, y, z, perim ? "stone_bricks" : "stone_bricks");
      continue;
    }

    if (rel % 3 === 0) {
      // Storey string course on the facade, floor slab inside.
      put(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }

    if (!perim) continue; // interior air behind the glass

    const ground = rel <= 2;

    if (ground) {
      // Opaque shopfront base (rel 1) and glazed shopfront band (rel 2).
      if (rel === 1) {
        if (front && x === 1) {
          // Entrance door, lower half, facing north (out of the building).
          put(x, y, z, "oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else {
          put(x, y, z, "polished_andesite");
        }
      } else { // rel === 2
        if (front && x === 1) {
          // Entrance door, upper half, with a transom glazed above it.
          put(x, y, z, "oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else if (front) {
          // Shopfront glazing with a dark frame above the base course.
          put(x, y, z, "glass_pane");
        } else if (back) {
          put(x, y, z, x === 1 ? "glass_pane" : "bricks");
        } else {
          // Side shopfronts: glazing at odd z, pier brick between.
          put(x, y, z, z % 2 === 1 ? "glass_pane" : "bricks");
        }
      }
      continue;
    }

    // Upper storey window bands (rel % 3 === 1 or 2 above the ground storey).
    if (front) {
      put(x, y, z, x === 1 ? "glass_pane" : "bricks");
    } else if (back) {
      put(x, y, z, x === 1 ? "glass_pane" : "bricks");
    } else {
      put(x, y, z, z % 2 === 1 ? "glass_pane" : "bricks");
    }
  }
}

// Warm lights behind the glass on interior floor slabs (x = 1 is the interior column).
const gr1 = Math.round(median(cells.map(c => c[2])));
put(1, gr1 + 1, 3, "lantern", { hanging: "false" });
if (gr1 + 4 < ROOF - 1) put(1, gr1 + 4, 5, "shroomlight");
if (gr1 + 7 < ROOF - 1) put(1, gr1 + 7, 7, "glowstone");

// Roof equipment: a small penthouse block standing on the roof deck at the centre.
if (ROOF + 1 < H) {
  put(1, ROOF, 4, "chiseled_stone_bricks");
  put(1, ROOF, 5, "chiseled_stone_bricks");
  put(1, ROOF, 6, "chiseled_stone_bricks");
}

g.save(`${DIR}/DC86608.nbt`);
