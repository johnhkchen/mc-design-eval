import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499493.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499493.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 16, H = 24, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const S = new Set(cells.map(c => key(c[0], c[1])));
const minZ = Math.min(...cells.map(c => c[1]));
const midX = 8;

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isExterior = (x, z) => dirs.some(([dx, dz]) => !S.has(key(x + dx, z + dz)));

for (const [x, z, groundRaw, roofRaw] of cells) {
  const base = Math.max(0, Math.round(groundRaw));
  // Parapet height: lidar roof, but at least two commercial storeys (10 blocks) above ground.
  const top = Math.min(H - 2, Math.max(base + 10, Math.round(roofRaw)));
  const ext = isExterior(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  if (!ext) {
    // Interior: floor slabs per storey, air gap, roof deck. No furniture.
    g.set(x, base, z, "smooth_stone");
    if (base + 5 < top) g.set(x, base + 5, z, "smooth_stone");
    g.set(x, top, z, "deepslate_tiles");
    if (x % 5 === 2 && z % 6 === 3) {
      g.set(x, top + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
    continue;
  }

  // Exterior wall column, stacked from the base to the parapet.
  for (let y = base; y <= top; y++) {
    const rel = y - base;

    if (rel === 0) {
      // Base course / plinth.
      g.set(x, y, z, "stone_bricks");
    } else if (y === top) {
      // Parapet cap.
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    } else if (y === top - 1 && rel > 4) {
      // Cornice band under the parapet.
      g.set(x, y, z, "chiseled_stone_bricks");
    } else if (rel <= 3) {
      // Ground storey: commercial shopfront.
      if (x === midX && z === minZ && (rel === 1 || rel === 2)) {
        // Entrance door (two blocks tall).
        const half = rel === 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else if ((x + z) % 4 === 0) {
        // Dark oak mullions between shop windows.
        g.set(x, y, z, "dark_oak_log", { axis: "y" });
      } else if (rel === 3) {
        // Transom glazing above the shop window.
        g.set(x, y, z, "glass");
      } else {
        g.set(x, y, z, "glass");
      }
    } else if (rel === 4) {
      // Storey line between ground floor and upper floors.
      g.set(x, y, z, "stone_bricks");
    } else {
      // Upper storeys: windows in bands, granite piers between.
      const band = rel % 5;
      if ((band === 1 || band === 2 || band === 3) && (x + z) % 3 !== 0) {
        if (rel === 6 && (x + z) % 5 === 2) {
          // Lit window (warm glow behind the glass line).
          g.set(x, y, z, "glowstone");
        } else {
          g.set(x, y, z, "glass");
        }
      } else {
        g.set(x, y, z, "granite");
      }
    }
  }
}

g.save(OUT);
