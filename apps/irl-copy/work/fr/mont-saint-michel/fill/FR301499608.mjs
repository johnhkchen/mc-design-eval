import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499608";
const W = 29, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const WALL = "smooth_stone";
const BELT = "stone_bricks";
const PIER = "stone_bricks";
const FOUND = "granite";
const ROOF = "deepslate_tiles";
const FLOOR = "spruce_planks";
const GLASS = "glass_pane";

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) map.set(key(c[0], c[1]), c);
const has = (x, z) => map.has(key(x, z));
const ext = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

// Smoothed lidar roof per cell (cell plus its 4-neighbours).
const smRoof = (x, z) => {
  let s = 0, n = 0;
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const c = map.get(key(x + dx, z + dz));
    if (c) { s += c[3]; n++; }
  }
  return s / n;
};
const eaveOf = (x, z) => Math.min(9, Math.max(6, Math.round(smRoof(x, z)) - 3));
const groundOf = (x, z, E) => Math.max(0, Math.min(map.get(key(x, z))[2], E - 5));

// Door: exterior cell on the southernmost exterior row, nearest the middle.
let maxZ = -1;
for (const c of cells) if (ext(c[0], c[1])) maxZ = Math.max(maxZ, c[1]);
const xs = cells.map(c => c[0]);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
let doorKey = null, bestD = Infinity;
for (const c of cells) {
  if (ext(c[0], c[1]) && c[1] === maxZ) {
    const dd = Math.abs(c[0] - midX);
    if (dd < bestD) { bestD = dd; doorKey = key(c[0], c[1]); }
  }
}

const g = new Voxels([W, H, D]);

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const E = eaveOf(x, z);
  const gr = groundOf(x, z, E);
  const k = key(x, z);
  const isExt = ext(x, z);

  // Foundation up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (!isExt) {
    // Interior: floor slabs at ground and storey line, air above (no interiors).
    for (const y of new Set([gr, 4])) {
      if (y >= gr && y < E) g.set(x, y, z, FLOOR);
    }
    const yL = Math.max(4, gr) + 1;
    if (yL < E - 1 && (x + 2 * z) % 7 === 0) {
      g.set(x, yL, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  } else {
    const nN = !has(x, z - 1), nS = !has(x, z + 1), nW = !has(x - 1, z), nE = !has(x + 1, z);
    const faceNS = nN || nS;
    const faceEW = nW || nE;
    const corner = faceNS && faceEW;
    const bayPos = faceNS && !faceEW ? ((x % 4) + 4) % 4
                 : faceEW && !faceNS ? ((z % 4) + 4) % 4 : -1;

    for (let y = gr; y < E; y++) {
      if (y === E - 1) { g.set(x, y, z, BELT); continue; }   // parapet cap
      if (y === 4) { g.set(x, y, z, BELT); continue; }       // storey belt course

      // Entrance on the south face, with a lintel above the door.
      if (k === doorKey) {
        if (y === gr + 1 || y === gr + 2) {
          g.set(x, y, z, "oak_door", {
            facing: "south",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (y === gr + 3) { g.set(x, y, z, BELT); continue; }
      }

      const winRow = (y === 2 || y === 3 || y === 5 || y === 6) && y > gr;

      if (corner) { g.set(x, y, z, PIER); continue; }
      if (bayPos === 0) { g.set(x, y, z, PIER); continue; }
      if ((bayPos === 1 || bayPos === 2) && winRow) { g.set(x, y, z, GLASS); continue; }
      // Sills below the windows.
      if (bayPos >= 1 && bayPos <= 2 && y === (y > gr && y < 4 ? 2 : 5) - 1 && y > gr) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      g.set(x, y, z, WALL);
    }
  }

  // Slate roof: three stepped tiers inset from the bounding box edge, each standing on the one below.
  const d = Math.min(x, (W - 1) - x, z, (D - 1) - z);
  for (let r = 0; r < 3; r++) {
    if (d >= r) g.set(x, E + r, z, ROOF);
  }
  // Two chimney stacks standing on the top tier.
  if (d >= 2 && (x === 6 || x === 22) && z === 4) {
    g.set(x, E + 3, z, "bricks");
    g.set(x, E + 4, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
