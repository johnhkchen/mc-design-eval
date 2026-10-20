import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752128";
const W = 32, H = 23, D = 20;

// Two storeys of ~5 blocks each, flat parapet roof at ground + 11.
// Era: late-20th-century Taipei commercial block, white-tile spandrels, quartz piers,
// glass shopfront at street level, stone base and cornice.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.min(gr, 10));

const has = (x, z) => ground.has(key(x, z));
const gy = (x, z) => ground.get(key(x, z));

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward face of a perimeter cell, or null if interior.
function face(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const NORMAL = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Main entrance: south-facing perimeter cell nearest the footprint's middle.
let minX = Infinity, maxX = -Infinity;
for (const [x] of cells) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
const midX = (minX + maxX) / 2;
let doorKey = null, bestDist = Infinity;
for (const [x, z] of cells) {
  if (face(x, z) === "S" && Math.abs(x - midX) < bestDist) {
    bestDist = Math.abs(x - midX);
    doorKey = key(x, z);
  }
}

const glassProps = (f) =>
  f === "N" || f === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const f = face(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, storey 2, roof deck (overridden by cornice on the edge).
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  if (!f) {
    // Interior roof: occasional AC units / plant boxes on the roof deck.
    if ((x * 5 + z * 3) % 11 === 0 && gr + 12 <= H - 1) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "smooth_stone");
    }
    continue;
  }

  const along = f === "N" || f === "S" ? x : z;
  const pier = along % 4 === 0;
  const isDoor = key(x, z) === doorKey;
  const [nx, nz] = NORMAL[f];
  const ix = -nx, iz = -nz; // inward direction

  for (let y = gr + 1; y <= gr + 11; y++) {
    if (y === gr + 10) { put(x, y, z, "polished_andesite"); continue; } // cornice
    if (y === gr + 11) { put(x, y, z, "white_concrete"); continue; }    // parapet
    if (y === gr + 5) { put(x, y, z, "light_gray_concrete"); continue; } // storey line
    if (pier) { put(x, y, z, "smooth_quartz"); continue; }

    if (isDoor) {
      if (y === gr + 1) {
        put(x, y, z, "dark_oak_door", { facing: f === "S" ? "south" : "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 2) {
        put(x, y, z, "dark_oak_door", { facing: f === "S" ? "south" : "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      put(x, y, z, "white_concrete");
      continue;
    }

    if (y === gr + 1) { put(x, y, z, "polished_andesite"); continue; } // base course

    const shopRow = y === gr + 2 || y === gr + 3;
    const upperRow = y >= gr + 6 && y <= gr + 8;
    if (shopRow || upperRow) {
      put(x, y, z, "glass_pane", glassProps(f));
      // Warm light just inside some windows, on the centre row.
      const centre = y === gr + 2 || y === gr + 7;
      if (centre && ((x * 31 + z * 17 + y) % 4 === 0)) {
        const ix2 = x + ix, iz2 = z + iz;
        if (has(ix2, iz2) && face(ix2, iz2) === null && gy(ix2, iz2) === gr) {
          put(ix2, y, iz2, "glowstone");
        }
      }
      continue;
    }

    put(x, y, z, "white_concrete"); // spandrels and lintels
  }
}

g.save(`${DIR}/${ID}.nbt`);
