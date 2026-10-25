import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499551.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499551.nbt";

// Indifférencié: a two-storey Norman-Breton town house in granite, slate roof,
// shopfront with a framed central door on the street (north) face, gable ridge
// running north-south. Massing is smoothed to one wall top and one ridge height
// so the roof reads as clean tiers; only the foundations follow the slope.
const W = 20, H = 24, D = 35;
const g = new Voxels([W, H, D]);

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, b, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};
const STAIR = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });

// Smoothed massing for the whole building
const grounds = cells.map(([, , gr]) => Math.max(0, Math.round(gr)));
const roofs = cells.map(([, , , rr]) => Math.round(rr)).sort((a, b) => a - b);
const gMax = Math.max(...grounds);
const rMed = roofs[Math.floor(roofs.length / 2)];
const T = Math.max(rMed - 4, gMax + 9);   // wall top / top ceiling, one tier
const R = Math.max(rMed, T + 1);          // ridge, one tier

const roofH = (x) => {
  const d = Math.abs(x - 9.5);
  return T + Math.round((1 - d / 10) * (R - T));
};

// Pass 1: foundations, walls, floors, roofs
const glowTargets = [];
for (const [x, z, gr] of cells) {
  const gnd = Math.max(0, Math.round(gr));
  const h = roofH(x);
  const d = Math.abs(x - 9.5);

  // foundation below ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone");

  const face =
    !has.has(`${x - 1},${z}`) ? "W" :
    !has.has(`${x + 1},${z}`) ? "E" :
    !has.has(`${x},${z - 1}`) ? "N" :
    !has.has(`${x},${z + 1}`) ? "S" : null;

  if (face) {
    const idx = (face === "W" || face === "E") ? z : x;
    for (let y = gnd; y <= T; y++) {
      let b = "granite";
      if (y === gnd) b = "stone_bricks";
      else if (y === gnd + 5 || y === T) b = "polished_granite";
      else if (face === "N" && y >= gnd + 1 && y <= gnd + 4) {
        // street face: framed doorway in the centre, shopfront glazing either side
        if (idx === 9) {
          if (y === gnd + 1 || y === gnd + 2) {
            put(x, y, z, "oak_door", { facing: "north", half: y === gnd + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
            continue;
          }
          if (y === gnd + 3) { put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" }); continue; }
          b = "granite";
        } else if (idx === 8 || idx === 10) {
          b = "polished_granite"; // door surround
        } else if ((idx >= 2 && idx <= 7) || (idx >= 12 && idx <= 17)) {
          b = "glass";
        }
      } else if (y >= gnd + 2 && y <= gnd + 4 && (idx % 4 === 1 || idx % 4 === 2)) {
        b = "glass";
      } else if (y >= gnd + 6 && y <= T - 2 && (idx % 4 === 1 || idx % 4 === 2)) {
        b = "glass";
      }
      put(x, y, z, b);
    }
    if (idx % 8 === 2 && (idx % 4 === 1 || idx % 4 === 2) && gnd + 7 <= T - 2) {
      const ix = face === "W" ? x + 1 : face === "E" ? x - 1 : x;
      const iz = face === "N" ? z + 1 : face === "S" ? z - 1 : z;
      glowTargets.push([ix, gnd + 7, iz]);
    }
  } else {
    put(x, gnd, z, "smooth_stone");
    put(x, gnd + 5, z, "smooth_stone");
    put(x, T, z, "smooth_stone");
  }

  // roof: solid slate to the surface, stair courses on the two slopes
  for (let y = T + 1; y < h; y++) put(x, y, z, "deepslate_tiles");
  if (h > T) {
    if (d < 1) put(x, h, z, "deepslate_tiles");
    else if (x < 9) put(x, h, z, "deepslate_tile_stairs", STAIR("west"));
    else put(x, h, z, "deepslate_tile_stairs", STAIR("east"));
  }
}

// Pass 2: warm light behind glass
for (const [x, y, z] of glowTargets) {
  if (has.has(`${x},${z}`)) put(x, y, z, "glowstone");
}

// Pass 3: two chimneys on the roof, standing on the roof surface
for (const [cx, cz] of [[4, 8], [15, 26]]) {
  if (!has.has(`${cx},${cz}`)) continue;
  const h = roofH(cx);
  for (let y = h + 1; y <= h + 3; y++) put(cx, y, cz, "stone_bricks");
  put(cx, h + 4, cz, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(OUT);
