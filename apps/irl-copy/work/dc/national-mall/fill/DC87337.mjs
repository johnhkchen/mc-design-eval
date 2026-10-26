import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87337";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 28, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxX = Math.max(...cells.map((c) => c[0]));
const L = maxX - minX; // 16

// Per-cell ground and roof, roof smoothed to even storey tiers (2 blocks each)
const pts = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.round(gr);
  let R = 2 * Math.round(rf / 2);
  R = Math.max(ground + 2, Math.min(26, R));
  pts.set(key(x, z), { gr: ground, R });
}
const has = (x, z) => pts.has(key(x, z));

function missingFaces(x, z) {
  const m = [];
  if (!has(x, z - 1)) m.push("N");
  if (!has(x, z + 1)) m.push("S");
  if (!has(x - 1, z)) m.push("W");
  if (!has(x + 1, z)) m.push("E");
  return m;
}

// Piers at both corners, every third column between: two window bays per pier pair
const isPier = (i) => i === 0 || i === L || i % 3 === 0;

// Entrance bay on the south face (centre column), flanked by pilasters
const isEntranceCol = (face, i) => face === "S" && i === 8;
const isEntranceBay = (face, i) => face === "S" && i >= 6 && i <= 10;

// Warm light positions inside the air gap behind selected windows
const lights = new Set();
for (const k of pts.keys()) {
  const [x, z] = k.split(",").map(Number);
  const { gr, R } = pts.get(k);
  const m = missingFaces(x, z);
  if (m.length !== 1) continue;
  const face = m[0];
  const lx = x - minX, lz = z - minZ;
  const i = face === "N" || face === "S" ? lx : lz;
  let ix = lx, iz = lz;
  if (face === "N") iz = lz + 1;
  if (face === "S") iz = lz - 1;
  if (face === "W") ix = lx + 1;
  if (face === "E") ix = lx - 1;
  for (let y = gr + 1; y < R - 1; y += 2) {
    const r = y - gr;
    if (!isPier(i) && (i + r) % 3 === 0 && r > 2 && !isEntranceBay(face, i)) {
      lights.add(`${ix},${iz},${y}`);
    }
  }
}

for (const [k, { gr, R }] of pts) {
  const [x, z] = k.split(",").map(Number);
  const lx = x - minX, lz = z - minZ;
  const m = missingFaces(x, z);
  const edge = m.length > 0;
  const corner = m.length >= 2;
  const face = edge ? m[0] : null;
  const i = edge ? (face === "N" || face === "S" ? lx : lz) : 0;

  for (let y = 0; y < R; y++) {
    // Foundation solid down to the cell's ground
    if (y < gr) {
      g.set(lx, y, lz, "stone_bricks");
      continue;
    }

    if (!edge) {
      // Interior: roof membrane, floor slabs per storey, air gaps, occasional glow
      if (y === R - 1) {
        g.set(lx, y, lz, "gray_concrete");
      } else if ((y - gr) % 2 === 0) {
        g.set(lx, y, lz, "smooth_stone");
      } else if (lights.has(`${lx},${lz},${y}`)) {
        g.set(lx, y, lz, "glowstone");
      }
      continue;
    }

    // Edge (facade) cells
    if (corner) {
      // Light sandstone quoins at the corners
      g.set(lx, y, lz, y === R - 1 ? "smooth_stone" : "smooth_sandstone");
      continue;
    }

    if (y === R - 1) {
      g.set(lx, y, lz, "smooth_stone"); // parapet cap
      continue;
    }

    const r = y - gr;

    // Entrance: door, glazed flanks, and a dark canopy band over the bay
    if (isEntranceBay(face, i)) {
      if (r === 0 || r === 1) {
        if (isEntranceCol(face, i)) {
          g.set(lx, y, lz, "dark_oak_door", {
            facing: "south",
            half: r === 0 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (i === 6 || i === 10) {
          g.set(lx, y, lz, "smooth_sandstone");
        } else {
          g.set(lx, y, lz, "glass");
        }
        continue;
      }
      if (r === 2) {
        g.set(lx, y, lz, "black_concrete"); // canopy band
        continue;
      }
    }

    if (r === 0) {
      if (isPier(i)) {
        g.set(lx, y, lz, "smooth_sandstone");
      } else {
        g.set(lx, y, lz, "glass");
      }
    } else if (r % 2 === 1) {
      // window row with glass panes in framed bays
      if (isPier(i)) {
        g.set(lx, y, lz, "bricks");
      } else {
        g.set(lx, y, lz, "glass_pane", {
          north: "true", south: "true", east: "true", west: "true", waterlogged: "false",
        });
      }
    } else {
      // spandrel / storey line
      g.set(lx, y, lz, r % 4 === 0 ? "smooth_stone" : "bricks");
    }
  }

  // Sparse rooftop mechanical units on a regular grid, not random scatter
  if (!edge && lx % 4 === 2 && lz % 4 === 2 && R + 2 <= H) {
    g.set(lx, R, lz, "stone_bricks");
    g.set(lx, R + 1, lz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
