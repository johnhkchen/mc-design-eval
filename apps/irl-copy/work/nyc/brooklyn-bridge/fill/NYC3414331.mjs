import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3414331";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 14, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };

// Raw data
const raw = new Map();
for (const [x, z, gr, roof] of cells) {
  raw.set(key(x, z), { x, z, g0: Math.max(0, Math.min(H - 5, Math.round(gr))), roof: Math.round(roof) });
}

// Smooth roof: 3x3 neighbourhood mean over footprint, snapped to even (2-block storey) tiers
const map = new Map();
for (const [k, c] of raw) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nb = raw.get(key(c.x + dx, c.z + dz));
    if (nb) { sum += nb.roof; n++; }
  }
  const mean = sum / n;
  let t = 2 * Math.round(mean / 2);
  t = Math.max(t, c.g0 + 4);
  t = Math.min(t, H - 1);
  map.set(k, { g0: c.g0, t });
}

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: single-face perimeter cell on the -z face nearest the middle of the width
let doorKey = null;
{
  let best = Infinity;
  for (const [k, c] of raw) {
    const exp = DIRS.filter(([dx, dz]) => !map.has(key(c.x + dx, c.z + dz)));
    if (exp.length !== 1 || exp[0][0] !== 0 || exp[0][1] !== -1) continue;
    const d = Math.abs(c.x - (W - 1) / 2);
    if (d < best) { best = d; doorKey = k; }
  }
}

for (const [k, c] of raw) {
  const { x, z } = c;
  const { g0, t } = map.get(k);
  const exp = DIRS.filter(([dx, dz]) => !map.has(key(x + dx, z + dz)));
  const perim = exp.length > 0;
  const corner = exp.length >= 2;

  // Foundation
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  for (let y = g0; y < t; y++) {
    const h = y - g0;

    if (!perim) {
      if (y === t - 1) put(x, y, z, "stone");
      else if (h % 2 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Cornice / parapet
    if (y === t - 1) { put(x, y, z, "smooth_sandstone"); continue; }
    // Base course
    if (h === 0) { put(x, y, z, "stone_bricks"); continue; }
    // String courses at storey lines
    if (h % 2 === 0) { put(x, y, z, "smooth_sandstone"); continue; }

    // Window row
    if (corner) { put(x, y, z, "bricks"); continue; }

    const [dx, dz] = exp[0];
    const idx = dz !== 0 ? x : z;
    const isDoorCell = k === doorKey;

    // Entrance: door at h=1..2, stone lintel above at h=3
    if (isDoorCell && h === 1) {
      put(x, y, z, "dark_oak_door", { facing: FACING[`${dx},${dz}`], half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoorCell && h === 2) {
      put(x, y, z, "dark_oak_door", { facing: FACING[`${dx},${dz}`], half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoorCell && h === 3) { put(x, y, z, "stone_brick_stairs", { facing: FACING[`${-dx},${-dz}`] === undefined ? "south" : "south", half: "top", shape: "straight", waterlogged: "false" }); continue; }

    if (idx % 3 === 0) { put(x, y, z, "bricks"); continue; }

    // Glass pane in frame
    const ew = dz !== 0;
    put(x, y, z, "glass_pane", {
      north: ew ? "false" : "true",
      south: ew ? "false" : "true",
      east: ew ? "true" : "false",
      west: ew ? "true" : "false",
    });

    // Warm light behind some glass
    if (idx % 6 === 1 && h >= 3) {
      const ix = x - dx, iz = z - dz;
      if (map.has(key(ix, iz))) {
        const inner = DIRS.filter(([ddx, ddz]) => !map.has(key(ix + ddx, iz + ddz)));
        if (inner.length === 0) put(ix, y, iz, "glowstone");
      }
    }
  }

  // Rooftop mechanical bulkhead on central interior cells
  if (!perim && x >= 4 && x <= 6 && z >= 4 && z <= 7) {
    put(x, t, z, "light_gray_concrete");
    put(x, t + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
