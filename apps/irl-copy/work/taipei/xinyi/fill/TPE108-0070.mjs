import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${SRC}/TPE108-0070.cells.json`, "utf8"));

const W = 72, H = 19, D = 117;
const g = new Voxels([W, H, D]);

// ---- footprint and ground -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const grs = [...ground.values()];
const L = Math.min(...grs);          // lowest ground under the footprint
const maxG = Math.max(...grs);

// Lidar record: roof about 7 blocks above lowest ground (top layer L+6).
// Clamped so rooftop plant still fits inside the 19-block volume.
const roofY = Math.min(H - 3, Math.max(L + 6, maxG + 1));
// Single storey line (5-block storey) at L+5, cornice/parapet on roofY.
const storeyY = L + 5;

// ---- directions -----------------------------------------------------------
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

function outwardOf(x, z) {
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) return d;
  }
  return null;
}

// ---- classify edge cells and pick entrances --------------------------------
const edgeInfo = new Map(); // key -> { dir }
const groups = { north: [], south: [], west: [], east: [] };
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const dir = outwardOf(x, z);
  if (!dir) continue;
  edgeInfo.set(key(x, z), { dir });
  const tangential = dir === "north" || dir === "south" ? x : z;
  groups[dir].push({ x, z, t: tangential });
}
for (const d of Object.keys(groups)) groups[d].sort((a, b) => a.t - b.t);

// Entrance: median cell of each facade, only if the door fits under the storey line.
const doorCells = new Set();
const idxInGroup = new Map();
for (const d of Object.keys(groups)) {
  const list = groups[d];
  list.forEach((c, i) => idxInGroup.set(key(c.x, c.z), i));
  if (list.length === 0) continue;
  const mid = list[Math.floor(list.length / 2)];
  const gr = ground.get(key(mid.x, mid.z));
  if (gr + 2 < storeyY) doorCells.add(key(mid.x, mid.z));
}

// ---- foundation: solid from 0 up to each cell's ground ---------------------
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// ---- floor slabs (one per storey line) and roof on every footprint cell ----
for (const [x, z, gr] of cells) {
  if (gr < storeyY) g.set(x, storeyY, z, "smooth_quartz");
  const edge = edgeInfo.has(key(x, z));
  g.set(x, roofY, z, edge ? "smooth_quartz" : "light_gray_concrete");
}

// ---- facades on edge cells -------------------------------------------------
for (const [x, z, gr] of cells) {
  const info = edgeInfo.get(key(x, z));
  if (!info) continue;
  const { dir } = info;
  const idx = idxInGroup.get(key(x, z)) ?? 0;
  const isDoor = doorCells.has(key(x, z));
  const [ox, oz] = DIRS[dir];
  const inX = x - ox, inZ = z - oz; // inward neighbour

  for (let y = gr; y < roofY; y++) {
    if (y === gr) {
      // base course
      g.set(x, y, z, "smooth_stone");
    } else if (y < storeyY) {
      // storefront: glass with white mullions, door at the entrance
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: dir,
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (idx % 4 === 0) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    } else if (y === storeyY) {
      // storey line band
      g.set(x, y, z, "smooth_quartz");
    }
  }

  // warm light behind some shopfront glass (interior side, air gap behind glass)
  if (idx % 8 === 2 && has(inX, inZ) && gr + 2 < storeyY) {
    g.set(inX, gr + 2, inZ, "glowstone");
  }
  // one lantern-lit storey window per facade bay in the lower row
  if (idx % 8 === 6 && has(inX, inZ) && gr + 3 < storeyY) {
    g.set(inX, gr + 3, inZ, "shroomlight");
  }
}

// ---- rooftop plant: small screened boxes on a 16-block grid ----------------
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!edgeInfo.has(key(x, z)) && (x % 16 === 7 || x % 16 === 8) && (z % 16 === 7 || z % 16 === 8)) {
    g.set(x, roofY + 1, z, "white_concrete");
    g.set(x, roofY + 2, z, "light_gray_concrete");
  }
}

g.save(`${SRC}/TPE108-0070.nbt`);
