import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499372.cells.json`, "utf8"));

const SX = 29, SY = 23, SZ = 62;
const CX = 14;
const ROOF_TILE = "deepslate_tiles";
const WALL = "calcite";
const PLINTH = "stone_bricks";
const FOUND = "stone";
const TRIM = "dark_oak_planks";

const g = new Voxels([SX, SY, SZ]);
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { g: gr, r: rf });
const has = (x, z) => map.has(key(x, z));
const clampY = (y) => Math.max(0, Math.min(SY - 1, y));

// Ridge profile: average roof height along z per column (wide window), so the
// roof reads as one clean pitch instead of per-cell lidar noise.
function ridgeAt(x, z) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -6; dz <= 6; dz++) {
    const c = map.get(key(x + dx, z + dz));
    if (c) { s += c.r; n++; }
  }
  return n ? s / n : 0;
}

const glowList = [];

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, gr0);
  const R = clampY(Math.max(Math.round(ridgeAt(x, z)), gr + 6));
  const W = Math.min(Math.max(gr + 4, R - 6), SY - 3);

  let face = null;
  if (!has(x - 1, z)) face = "W";
  else if (!has(x + 1, z)) face = "E";
  else if (!has(x, z - 1)) face = "N";
  else if (!has(x, z + 1)) face = "S";

  for (let y = 0; y < gr; y++) g.set(x, clampY(y), z, FOUND);

  const along = (face === "W" || face === "E") ? z : x;
  const rowsAvail = W - 1 - gr >= 4;
  for (let y = gr; y < W; y++) {
    if (y === gr) { g.set(x, y, z, PLINTH); continue; }
    if (y === W - 1) { g.set(x, y, z, PLINTH); continue; }
    let mat = WALL;
    if (face) {
      const rel = y - gr;
      const m = along % 5;
      // West long face: entrance door, centred on the footprint
      const doorW = face === "W" && along >= 28 && along <= 33 && rel <= 4;
      // North gable: cart door, ground level, centred
      const cartN = face === "N" && Math.abs(x - CX) <= 2 && rel <= 4;
      if (doorW || cartN) {
        mat = TRIM;
        if (rel === 4) mat = "stone_bricks"; // lintel course
      } else if (rowsAvail && rel >= 2 && rel <= 3) {
        if (m === 2) {
          mat = "glass_pane";
          if (rel === 2 && Math.floor(along / 5) % 2 === 0) {
            const ix = face === "W" ? x + 1 : face === "E" ? x - 1 : x;
            const iz = face === "N" ? z + 1 : face === "S" ? z - 1 : z;
            glowList.push([ix, y, iz]);
          }
        } else if (m === 1 || m === 3) {
          mat = TRIM; // shutters / window surrounds
        }
      } else if (rowsAvail && rel === 1 && m === 2) {
        mat = "stone_bricks"; // sill
      }
    }
    g.set(x, y, z, mat);
  }

  // Clean pitched roof: eave at W, ridge at R, one-step stairs on each side
  const d = Math.abs(x - CX);
  const h = clampY(W + Math.round((R - W) * Math.max(0, 1 - d / 14)));
  if (h > W) {
    for (let y = W; y < h - 1; y++) g.set(x, y, z, ROOF_TILE);
    const capY = h - 1;
    if (x === CX) {
      g.set(x, capY, z, ROOF_TILE);
    } else {
      const facing = x < CX ? "west" : "east";
      g.set(x, capY, z, "deepslate_tile_stairs", {
        facing, half: "bottom", shape: "straight", waterlogged: "false",
      });
    }
    // Small gable window above the cart door on the north end
    if (face === "N" && Math.abs(x - CX) <= 1 && y0Gable(W, h)) {
      for (let y = W + 1; y <= W + 2 && y < h - 1; y++) g.set(x, y, z, "glass_pane");
    }
  }
}

function y0Gable(W, h) { return h - W >= 4; }

for (const [x, y, z] of glowList) g.set(x, clampY(y), z, "glowstone");

g.save(`${DIR}/FR301499372.nbt`);
