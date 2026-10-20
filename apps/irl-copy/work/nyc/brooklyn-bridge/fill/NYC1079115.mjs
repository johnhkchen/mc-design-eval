import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1079115";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 24, D = 5;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells: "x,z" -> { ground, roof }
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(`${x},${z}`, { gr, roof });

// One storey grid for the whole building, keyed to the lowest ground.
const base = Math.min(...cells.map((c) => c[2]));

// Smooth the lidar roof into one flat parapet level (median, clamped to a
// sensible storey count above the base).
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const roofLevel = Math.min(H - 3, Math.max(Math.round(roofs[Math.floor(roofs.length / 2)]), base + 10));
const TOP = roofLevel; // flat roof surface (top of the cornice course)

const GLASS_PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const cell = map.get(`${x},${z}`);
    if (!cell) continue;

    const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const facade = (z === 0 || z === D - 1) && x > 0 && x < W - 1;
    const gr = Math.min(H - 6, Math.max(0, Math.round(cell.gr)));
    const top = TOP;

    // Foundation: solid from y 0 up to this cell's ground.
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

    // Wall body up to the cornice course.
    for (let y = gr; y <= top - 2; y++) {
      const L = y - base;

      // Base course on the plinth row.
      if (L === 0) {
        g.set(x, y, z, perim ? "stone_bricks" : "smooth_stone");
        continue;
      }

      // Interior: only floor slabs, otherwise air behind the glass.
      if (!perim) {
        if (L >= 3 && (L - 3) % 2 === 0) g.set(x, y, z, "smooth_stone");
        continue;
      }

      // Perimeter floor lines / string courses.
      if (L >= 3 && (L - 3) % 2 === 0) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }

      // Party walls and corners: solid brick.
      if (!facade) {
        g.set(x, y, z, "bricks");
        continue;
      }

      if (L < 3) {
        // Ground-floor commercial frontage.
        if (x % 3 === 0) {
          g.set(x, y, z, "dark_oak_planks");
        } else if (z === 0 && x === 5) {
          // Entrance door, lower half at L1, upper half at L2.
          const half = L === 1 ? "lower" : "upper";
          g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, "glass", {});
        }
        continue;
      }

      // Upper storeys: one-block window band under each floor line.
      const isWindowRow = (L - 3) % 2 === 1;
      if (isWindowRow) {
        if (x % 3 === 0) {
          g.set(x, y, z, "bricks");
        } else if ((x + L) % 5 === 0) {
          g.set(x, y, z, "glowstone"); // warm lit window
        } else {
          g.set(x, y, z, "glass_pane", GLASS_PANE_NS);
        }
      } else {
        g.set(x, y, z, "bricks");
      }
    }

    // Solid cornice course at the flat roof line (no crenellated parapet).
    const cy = top - 1;
    g.set(x, cy, z, perim ? "stone_bricks" : "smooth_stone");
  }
}

// Entrance canopy over the door on the street face: a dark oak slab course
// sitting on the floor line above the door.
for (let x = 4; x <= 6; x++) {
  if (!map.has(`${x},0`)) continue;
  const y = base + 4;
  g.set(x, y, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Brick chimney on the flat roof, on an interior cell.
if (map.has("9,2")) {
  g.set(9, TOP, 2, "bricks");
  g.set(9, TOP + 1, 2, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
