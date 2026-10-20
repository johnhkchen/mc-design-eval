import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw980871927.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw980871927.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// Footprint 40 x 40, height about 112 blocks to roof (about 22 storeys of 5 blocks).
// Era read as late-1990s/2000s Xinyi office tower: glass curtain wall in cyan tint,
// white quartz and concrete mullions, stepped setbacks, podium with shopfront,
// mechanical penthouse and a slim mast.
const W = 40, D = 40, H = 124;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x * 100 + z, gr);

const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground.has(x * 100 + z);
const gnd = (x, z) => ground.get(x * 100 + z);

// Tier insets: podium 0, shaft 4, upper shaft 9, crown 14.
const insetOf = (y) => (y < 20 ? 0 : y < 55 ? 4 : y < 85 ? 9 : 14);
const inMask = (x, z, d) =>
  inFp(x, z) && x >= d && x <= W - 1 - d && z >= d && z <= D - 1 - d;
const isPerim = (x, z, d) =>
  inMask(x, z, d) &&
  (!inMask(x + 1, z, d) || !inMask(x - 1, z, d) || !inMask(x, z + 1, d) || !inMask(x, z - 1, d));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const gr = gnd(x, z);

    // Foundation: solid from y 0 up to this cell's ground.
    for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

    for (let y = gr; y <= 120; y++) {
      const rel = y - gr;
      const r = y % 5;
      const k = Math.floor(y / 5);

      // ---- Body: podium, shaft, upper shaft, crown (y 0..110) ----
      if (y <= 110) {
        const d = insetOf(y);
        if (!inMask(x, z, d)) continue;
        const edge = isPerim(x, z, d);
        const podium = y < 20;

        if (!edge) {
          // Interior: storey slabs only, air elsewhere (no interiors).
          if (r === 0) g.set(x, y, z, "gray_concrete");
          continue;
        }

        // Entrance notch on the south face (z = 0) of the podium.
        if (podium && z === 0 && x >= 18 && x <= 21 && rel >= 0 && rel <= 3) {
          if ((x === 19 || x === 20) && rel <= 1) {
            const half = rel === 0 ? "lower" : "upper";
            g.set(x, y, z, "iron_door", {
              facing: "north",
              half,
              hinge: x === 19 ? "left" : "right",
              open: "false",
              powered: "false",
            });
          }
          continue; // opening stays air
        }

        // Base course at the podium foot.
        if (podium && rel === 0) {
          g.set(x, y, z, "stone_bricks");
          continue;
        }

        let b;
        if (r === 0) {
          b = "smooth_quartz"; // storey line
        } else if (r === 4) {
          b = "light_gray_concrete"; // spandrel
        } else if (podium) {
          // Shopfront: continuous glass with a frame every 4 cells.
          b = (x + z) % 4 === 0 ? "white_concrete" : "cyan_stained_glass";
        } else {
          b = (x + z) % 3 === 0 ? "white_concrete" : "cyan_stained_glass";
        }
        g.set(x, y, z, b);

        // Warm light behind some glass: glowstone one cell inside.
        if (b === "cyan_stained_glass" && (r === 1 || r === 2 || r === 3)) {
          if (((x * 7 + z * 3 + k) % 4) === 0) {
            for (const [dx, dz] of DIRS) {
              if (inMask(x + dx, z + dz, d)) {
                g.set(x + dx, y, z + dz, "glowstone");
                break;
              }
            }
          }
        }
        continue;
      }

      // ---- Crown roof, mechanical plant and mast (y 111..120) ----
      if (!inMask(x, z, 14)) continue;
      const edge = isPerim(x, z, 14);

      if (y === 111) {
        if (edge) {
          g.set(x, y, z, "smooth_quartz"); // parapet
          continue;
        }
        // Mechanical plant blocks on the roof.
        const plant =
          (x >= 16 && x <= 17 && z >= 16 && z <= 17) ||
          (x >= 22 && x <= 23 && z >= 22 && z <= 23);
        if (plant) {
          g.set(x, y, z, "light_gray_concrete");
          continue;
        }
      }
      if (y >= 112 && y <= 113) {
        const plant =
          (x >= 16 && x <= 17 && z >= 16 && z <= 17) ||
          (x >= 22 && x <= 23 && z >= 22 && z <= 23);
        if (plant) g.set(x, y, z, "light_gray_concrete");
      }

      // Mast: 2 x 2 iron core, glowstone aviation beacon on top.
      const core = (x === 19 || x === 20) && (z === 19 || z === 20);
      if (core && y >= 111 && y <= 119) g.set(x, y, z, "iron_block");
      if (x === 19 && z === 19 && y === 120) g.set(x, y, z, "glowstone");
    }
  }
}

g.save(OUT);
