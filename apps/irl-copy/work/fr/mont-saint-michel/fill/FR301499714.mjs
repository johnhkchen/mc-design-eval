import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499714.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499714.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 8, H = 27, D = 13;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(rf) });
}
const has = (x, z) => map.has(`${x},${z}`);

// One common podium level (highest ground under the footprint) and one roof tier
// (median lidar height), so storey lines and the cornice are continuous.
const B = Math.max(...[...map.values()].map(v => v.g));
const rs = [...map.values()].map(v => v.r).sort((a, b) => a - b);
const medR = rs[Math.floor(rs.length / 2)];
const T = Math.min(H - 1, Math.max(medR, B + 11)); // first air level above the roof cap
const topY = T - 1;                                 // roof cap / cornice course

// Street face: the z-minimum edge; entrance nearest its middle.
const zmin = Math.min(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === zmin).map(c => c[0]);
const doorX = frontXs.reduce((best, x) => (Math.abs(x - 4) < Math.abs(best - 4) ? x : best), frontXs[0]);
const doorZ = zmin;
const hasDoor = (x, z) => x === doorX && z === doorZ;

for (const [x, z] of cells) {
  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const perim = edgeX || edgeZ;
  const corner = edgeX && edgeZ;
  const window = perim && !corner && (edgeZ ? x % 2 === 1 : z % 2 === 1);

  // Foundation / podium up to the common base, then the floor of the ground storey.
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone");
  g.set(x, B, z, "stone_bricks");

  for (let y = B + 1; y <= topY; y++) {
    const dy = y - B;

    if (y === topY) {
      g.set(x, y, z, perim ? "stone_bricks" : "deepslate_tiles");
      continue;
    }

    if (!perim) {
      // Interior: storey floors only (air otherwise).
      if (dy === 5 || dy === 10) g.set(x, y, z, "spruce_planks");
      continue;
    }

    if (dy === 5 || dy === 10) {
      g.set(x, y, z, "stone_bricks");              // string courses
    } else if (dy >= 1 && dy <= 4) {
      if (corner) g.set(x, y, z, "stone_bricks");
      else if (hasDoor(x, z)) {
        if (dy === 1 || dy === 2) {
          g.set(x, y, z, "oak_door", {
            facing: "north",
            half: dy === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (dy === 3) g.set(x, y, z, "glass_pane");
        else g.set(x, y, z, "dark_oak_planks");
      } else if (dy === 4) g.set(x, y, z, "dark_oak_planks");
      else g.set(x, y, z, "glass_pane");
    } else if (dy >= 6 && dy <= 9) {
      if (corner) g.set(x, y, z, "stone_bricks");
      else if (dy <= 8 && window) g.set(x, y, z, "glass_pane");
      else g.set(x, y, z, "smooth_quartz");
    } else if (dy >= 11) {
      if (window && dy >= 12 && dy <= 13) g.set(x, y, z, "glass_pane");
      else g.set(x, y, z, corner ? "stone_bricks" : "smooth_quartz");
    } else {
      g.set(x, y, z, corner ? "stone_bricks" : "smooth_quartz");
    }
  }

  // Lanterns on the upper floor, behind some upper windows.
  if (window && !hasDoor(x, z)) {
    const ix = edgeX ? (x === 0 ? x + 1 : x - 1) : x;
    const iz = edgeZ ? (z === 0 ? z + 1 : z - 1) : z;
    if ((x + z) % 4 === 0 && has(ix, iz) && ix !== x && iz !== z) {
      g.set(ix, B + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(OUT);
