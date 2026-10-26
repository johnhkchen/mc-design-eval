import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86645.cells.json`, "utf8"));

const W = 14, H = 26, D = 9;
const g = new Voxels([W, H, D]);

const foot = new Map();
for (const [x, z, gr, rf] of cells) foot.set(`${x},${z}`, { g: gr, r: rf });
const inFoot = (x, z) => foot.has(`${x},${z}`);
const isEdge = (x, z) =>
  inFoot(x, z) && (!inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1));

// Flat roof tier from the median lidar roof, clamped so every cell keeps several storeys.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const maxGround = Math.max(...cells.map(c => c[2]));
const median = roofs[Math.floor(roofs.length / 2)];
const TOP = Math.min(Math.max(Math.round(median), maxGround + 8), H - 3);

const STOREY = 3;
const FRONT_Z = 0; // street face with the entrance

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFoot(x, z)) continue;
    const gr = foot.get(`${x},${z}`).g;
    const hTot = TOP - gr;

    // Foundation up to this cell's ground.
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

    if (isEdge(x, z)) {
      const northSouth = z === 0 || z === D - 1;
      const eastWest = x === 0 || x === W - 1;
      const corner = northSouth && eastWest;
      // Pilaster bays: every other column on each face is a stone pier, so the walls read as bays.
      const pier = corner || (northSouth ? x % 2 === 0 : z % 2 === 0);
      const doorway = z === FRONT_Z && x >= 5 && x <= 8;

      for (let y = gr; y < TOP; y++) {
        const h = y - gr;
        // Crowning: cornice band, then a parapet course.
        if (h === hTot - 3) { g.set(x, y, z, "smooth_quartz"); continue; }
        if (h === hTot - 2) { g.set(x, y, z, "calcite"); continue; }
        if (h === hTot - 1) { g.set(x, y, z, "smooth_quartz"); continue; }
        // Rusticated base course.
        if (h === 0) { g.set(x, y, z, "polished_andesite"); continue; }

        // Ground floor entrance on the street face.
        if (doorway && h <= 2) {
          if (h === 2) g.set(x, y, z, "smooth_quartz");                      // lintel
          else if (x === 6 || x === 7) g.set(x, y, z, "glass");             // glazed doors
          else continue;                                                     // open bay
          continue;
        }
        if (doorway && h === 3) { g.set(x, y, z, "smooth_quartz"); continue; } // canopy line
        if (z === FRONT_Z && (x === 4 || x === 9) && h <= 3) {
          g.set(x, y, z, "polished_granite");                                // entrance piers
          continue;
        }

        const sub = h % STOREY;
        // Spandrel / storey string course.
        if (sub === 0) { g.set(x, y, z, "smooth_quartz"); continue; }

        if (pier) { g.set(x, y, z, "calcite"); continue; }

        // Window openings: sills in the lower row, glass above.
        if (sub === 1) { g.set(x, y, z, "smooth_quartz"); continue; }
        g.set(x, y, z, "glass");
      }
    } else {
      // Interior: floor slabs and roof slab only, air between.
      g.set(x, gr, z, "smooth_stone");
      for (let k = 1; k * STOREY < hTot - 1; k++) {
        g.set(x, gr + k * STOREY, z, "smooth_stone");
      }
      g.set(x, TOP - 1, z, "smooth_stone");

      // Sparse warm lights set back behind some windows.
      for (let k = 0; k * STOREY < hTot - 3; k++) {
        const ly = gr + k * STOREY + 1;
        if (ly < TOP - 2 && (x + 2 * z + k) % 7 === 3) g.set(x, ly, z, "glowstone");
      }

      // Roof plant: a tidy row of units on the terrace.
      if (z === 4 && (x === 3 || x === 6 || x === 9) && TOP < H - 1) {
        g.set(x, TOP, z, "iron_block");
      }
    }
  }
}

g.save(`${DIR}/DC86645.nbt`);
