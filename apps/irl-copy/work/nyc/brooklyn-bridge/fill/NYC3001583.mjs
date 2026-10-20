import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001583.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001583.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 6, H = 24, D = 13;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => x + "," + z;

// Flat parapet: one roof height for the whole block (median of lidar), so the
// skyline is a clean tier rather than lidar noise. Ground stays per cell.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofFlat = clamp(roofs[Math.floor(roofs.length / 2)], 8, H - 1);

const map = new Map();
for (const [x, z, gr] of cells) {
  const G = clamp(Math.round(gr), 0, H - 6);
  const R = clamp(roofFlat, G + 4, H - 1);
  map.set(key(x, z), { x, z, G, R });
}
const has = (x, z) => map.has(key(x, z));

// Outward directions. Street front is the z = 0 (north) face, 6 blocks wide.
const DIRS = [[0, -1, "n"], [0, 1, "s"], [-1, 0, "w"], [1, 0, "e"]];
const exposedDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Pass 1: solid massing, stone foundation, brick walls, storey bands, cornice, roof.
for (const c of map.values()) {
  const { x, z, G, R } = c;
  const ex = exposedDirs(x, z).length > 0;
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  for (let y = G; y < R; y++) {
    let id;
    if (y === R - 1) id = ex ? "stone_bricks" : "smooth_stone";   // parapet cap / light roof surface
    else if (ex && y === R - 2) id = "chiseled_stone_bricks";       // cornice course
    else if (ex && y === G) id = "stone_bricks";                    // base course
    else if (ex && (y - G) % 3 === 0) id = "stone_bricks";          // storey band
    else id = "bricks";
    g.set(x, y, z, id);
  }
}

// Pass 2: windows, door, lights on exposed faces.
for (const c of map.values()) {
  const { x, z, G, R } = c;
  const ex = exposedDirs(x, z);
  if (!ex.length) continue;
  const [dx, dz, name] = ex[0];
  const idx = dz !== 0 ? x : z;
  const ix = x - dx, iz = z - dz;
  const inside = has(ix, iz);

  for (let y = G + 1; y <= R - 3; y++) {
    const h = y - G;
    if (h % 3 === 0) continue;

    // Street door on the front face, centred at x=2, first storey.
    if (name === "n" && x === 2 && (h === 1 || h === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: h === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      if (inside) g.set(ix, y, iz, "air");
      continue;
    }

    // Door surround: stone jambs flanking the door on the front face.
    if (name === "n" && (x === 1 || x === 3) && (h === 1 || h === 2)) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (idx % 2 === 0) {
      g.set(x, y, z, "glass");
      if (inside) {
        const lit = h % 3 === 2 && idx % 4 === 0;
        g.set(ix, y, iz, lit ? "glowstone" : "air");
      }
    }
  }
}

g.save(OUT);
